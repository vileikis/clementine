# Client-First Architecture

This document defines the client-first architectural pattern used in the Clementine TanStack Start application.

## Overview

This application follows a **client-first architecture** where business logic and data interactions happen primarily on the client using Firebase client SDKs. Server-side code is used minimally and only for specific use cases.

**Key Principle**: Build for the client, use the server strategically.

## Architecture Philosophy

### Client-First (Our Approach)

- Firebase client SDKs for all data operations (Firestore, Storage, Auth)
- Real-time data synchronization with Firestore listeners
- Client-side business logic and state management
- Rich, interactive user experiences
- SSR used for entry points and SEO optimization

### ❌ NOT Server-First (Traditional Next.js pattern)

- We don't use Server Components as the primary data layer
- We don't fetch data exclusively through Server Actions
- We don't rely on server-side business logic for everything

## When to Use Client vs Server

### ✅ Client-Side (Default - 90% of code)

**Data Operations:**

```tsx
import { firestore } from '@/integrations/firebase/client'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

// ✅ Client-side Firestore operations
function useEvents() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const q = query(
      collection(firestore, 'events'),
      where('status', '==', 'active'),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })

    return unsubscribe
  }, [])

  return events
}
```

**Authentication:**

```tsx
import { auth } from '@/integrations/firebase/client'
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'

// ✅ Client-side authentication
async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}
```

**Storage:**

```tsx
import { storage } from '@/integrations/firebase/client'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// ✅ Client-side file uploads
async function uploadImage(file: File, path: string) {
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(snapshot.ref)
  return downloadURL
}
```

**Use client-side for:**

- ✅ All Firestore queries and mutations
- ✅ Firebase Authentication
- ✅ Firebase Storage uploads/downloads
- ✅ Real-time data subscriptions
- ✅ Business logic and validation
- ✅ State management
- ✅ User interactions
- ✅ API calls to external services

### ⚠️ Server-Side (Minimal - 10% of code)

**SSR for Entry Points:**

```tsx
// app/events/[eventId]/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getEventMetadata } from '@/domains/events/services/metadata.server'

export const Route = createFileRoute('/events/$eventId')({
  component: EventPage,
  loader: async ({ params }) => {
    // ✅ Load metadata for SSR (SEO, Open Graph tags)
    const metadata = await getEventMetadata(params.eventId)
    return { metadata }
  },
})
```

**Server Functions for Specific Cases:**

```tsx
import { createServerFn } from '@tanstack/react-start'
import { adminFirestore } from '@/integrations/firebase/admin'

// ✅ Server function for operations requiring admin privileges
export const deleteUserData = createServerFn({ method: 'POST' }).handler(
  async ({ data: userId }) => {
    // Admin SDK for elevated permissions
    await adminFirestore.collection('users').doc(userId).delete()
  },
)
```

**Use server-side for:**

- ✅ SEO metadata (Open Graph, Twitter Cards, title/description)
- ✅ Initial page data for SSR (optional performance optimization)
- ✅ Operations requiring Firebase Admin SDK (elevated permissions)
- ✅ Sensitive operations that shouldn't expose API keys
- ✅ Server-only integrations (webhooks, cron jobs)
- ✅ Data transformations too expensive for client

## Firebase Client SDK Usage

### Firestore Client SDK

**Direct client operations:**

```tsx
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

// Read
const docRef = doc(firestore, 'events', eventId)
const docSnap = await getDoc(docRef)

// Write
await addDoc(collection(firestore, 'events'), eventData)
await updateDoc(docRef, updates)
await deleteDoc(docRef)

// Real-time
const unsubscribe = onSnapshot(docRef, (doc) => {
  console.log('Current data:', doc.data())
})
```

**Security through Firestore Rules (not server code):**

```javascript
// firestore.rules - Security enforced at database level
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     request.auth.uid == resource.data.createdBy;
    }
  }
}
```

### Storage Client SDK

**Direct client uploads:**

```tsx
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/integrations/firebase/client'

// Upload with progress tracking
const uploadTask = uploadBytesResumable(storageRef, file)

uploadTask.on(
  'state_changed',
  (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
    setUploadProgress(progress)
  },
  (error) => {
    console.error('Upload failed:', error)
  },
  async () => {
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
    console.log('File available at:', downloadURL)
  },
)
```

### Authentication Client SDK

**Client-side auth flow:**

```tsx
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '@/integrations/firebase/client'

// Auth state listener
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setCurrentUser(user)
    } else {
      setCurrentUser(null)
    }
  })

  return unsubscribe
}, [])
```

## SSR Strategy

### When to Use SSR

**1. SEO and Social Sharing (Primary use case)**

```tsx
// Render metadata server-side for crawlers
export const Route = createFileRoute('/events/$eventId')({
  loader: async ({ params }) => {
    const event = await getEventForSSR(params.eventId)
    return {
      title: event.name,
      description: event.description,
      ogImage: event.coverImage,
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData.title },
      { property: 'og:title', content: loaderData.title },
      { property: 'og:description', content: loaderData.description },
      { property: 'og:image', content: loaderData.ogImage },
    ],
  }),
})
```

**2. Initial Page Load Performance (Optional)**

```tsx
// Load critical data server-side to avoid loading spinner
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const initialData = await getInitialDashboardData()
    return { initialData }
  },
  component: () => {
    const { initialData } = Route.useLoaderData()
    // Render immediately with initialData, then hydrate with real-time updates
  },
})
```

### When NOT to Use SSR

- ❌ Don't use SSR for all data fetching (use client-side with TanStack Query)
- ❌ Don't put business logic in server functions (keep in client)
- ❌ Don't use SSR to "protect" data (use Firestore security rules)
- ❌ Don't render entire pages server-side if they're highly interactive

## Integration with TanStack Query

**Client-side data fetching with caching:**

```tsx
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const docRef = doc(firestore, 'events', eventId)
      const docSnap = await getDoc(docRef)
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
    },
  })
}
```

**Real-time subscriptions with TanStack Query:**

```tsx
function useEventRealtime(eventId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const docRef = doc(firestore, 'events', eventId)
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      queryClient.setQueryData(['event', eventId], {
        id: snapshot.id,
        ...snapshot.data(),
      })
    })

    return unsubscribe
  }, [eventId, queryClient])

  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const docRef = doc(firestore, 'events', eventId)
      const docSnap = await getDoc(docRef)
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
    },
  })
}
```

**Mutations via dedicated hooks:**

Business entities often have complex nested structures. Create specific mutation hooks for each business operation rather than generic update hooks.

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, updateDoc, addDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { firestore, storage } from '@/integrations/firebase/client'

// Event structure example:
// {
//   id: string
//   welcomeScreen: { title, subtitle, logo }
//   theme: { primaryColor, secondaryColor, font }
//   overlays: [{ id, url, type, position }]
//   shareDefaults: { message, hashtags, platforms }
//   experiences: [{ id, name, prompt, settings }]
// }

// ✅ Update welcome screen configuration
function useUpdateWelcomeScreen(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (welcomeData: { title: string; subtitle: string; logo?: string }) => {
      const docRef = doc(firestore, 'events', eventId)
      await updateDoc(docRef, {
        'welcomeScreen.title': welcomeData.title,
        'welcomeScreen.subtitle': welcomeData.subtitle,
        ...(welcomeData.logo && { 'welcomeScreen.logo': welcomeData.logo }),
      })
      return welcomeData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

// ✅ Update theme settings
function useUpdateTheme(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (theme: { primaryColor?: string; secondaryColor?: string; font?: string }) => {
      const docRef = doc(firestore, 'events', eventId)
      const updates: Record<string, string> = {}
      if (theme.primaryColor) updates['theme.primaryColor'] = theme.primaryColor
      if (theme.secondaryColor) updates['theme.secondaryColor'] = theme.secondaryColor
      if (theme.font) updates['theme.font'] = theme.font

      await updateDoc(docRef, updates)
      return theme
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

// ✅ Upload and add overlay to event
function useUploadOverlay(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, type, position }: {
      file: File
      type: 'frame' | 'sticker' | 'filter'
      position: { x: number; y: number }
    }) => {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `events/${eventId}/overlays/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(snapshot.ref)

      // Add to Firestore overlays array
      const overlay = { id: crypto.randomUUID(), url, type, position }
      const docRef = doc(firestore, 'events', eventId)
      await updateDoc(docRef, {
        overlays: arrayUnion(overlay)
      })

      return overlay
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

// ✅ Delete overlay from event
function useDeleteOverlay(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (overlay: { id: string; url: string }) => {
      // Remove from Storage
      const storageRef = ref(storage, overlay.url)
      await deleteObject(storageRef)

      // Remove from Firestore array
      const docRef = doc(firestore, 'events', eventId)
      await updateDoc(docRef, {
        overlays: arrayRemove(overlay)
      })

      return overlay.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

// ✅ Update share options
function useUpdateShareOptions(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shareOptions: {
      message?: string
      hashtags?: string[]
      platforms?: string[]
    }) => {
      const docRef = doc(firestore, 'events', eventId)
      const updates: Record<string, unknown> = {}
      if (shareOptions.message) updates['shareDefaults.message'] = shareOptions.message
      if (shareOptions.hashtags) updates['shareDefaults.hashtags'] = shareOptions.hashtags
      if (shareOptions.platforms) updates['shareDefaults.platforms'] = shareOptions.platforms

      await updateDoc(docRef, updates)
      return shareOptions
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

// ✅ Create new experience within event
function useCreateExperience(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (experience: {
      name: string
      prompt: string
      settings: Record<string, unknown>
    }) => {
      const newExperience = {
        id: crypto.randomUUID(),
        ...experience,
        createdAt: new Date().toISOString(),
      }

      const docRef = doc(firestore, 'events', eventId)
      await updateDoc(docRef, {
        experiences: arrayUnion(newExperience)
      })

      return newExperience
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

// ✅ Update specific experience
function useUpdateExperience(eventId: string, experienceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: {
      name?: string
      prompt?: string
      settings?: Record<string, unknown>
    }) => {
      // Fetch current event to update the specific experience in the array
      const docRef = doc(firestore, 'events', eventId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) throw new Error('Event not found')

      const experiences = docSnap.data().experiences || []
      const updatedExperiences = experiences.map((exp: Experience) =>
        exp.id === experienceId ? { ...exp, ...updates } : exp
      )

      await updateDoc(docRef, { experiences: updatedExperiences })
      return updates
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

// Usage in components
function WelcomeScreenEditor({ eventId }: { eventId: string }) {
  const updateWelcome = useUpdateWelcomeScreen(eventId)

  const handleSave = (data: { title: string; subtitle: string }) => {
    updateWelcome.mutate(data, {
      onSuccess: () => {
        toast.success('Welcome screen updated!')
      },
      onError: (error) => {
        toast.error('Failed to update welcome screen')
      },
    })
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      handleSave({
        title: formData.get('title') as string,
        subtitle: formData.get('subtitle') as string,
      })
    }}>
      <input name="title" placeholder="Welcome title" />
      <input name="subtitle" placeholder="Subtitle" />
      <button type="submit" disabled={updateWelcome.isPending}>
        {updateWelcome.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}

function OverlayManager({ eventId }: { eventId: string }) {
  const uploadOverlay = useUploadOverlay(eventId)
  const deleteOverlay = useDeleteOverlay(eventId)

  const handleUpload = (file: File) => {
    uploadOverlay.mutate({
      file,
      type: 'frame',
      position: { x: 0, y: 0 },
    })
  }

  const handleDelete = (overlay: { id: string; url: string }) => {
    if (confirm('Delete this overlay?')) {
      deleteOverlay.mutate(overlay)
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={uploadOverlay.isPending}
      />
      {uploadOverlay.isPending && <p>Uploading...</p>}
      {/* Render overlays with delete buttons */}
    </div>
  )
}
```

**Key principles for mutations:**

- ✅ **Business-oriented hook names**: Use `useUpdateWelcomeScreen`, `useUploadOverlay`, not generic `useUpdateEvent`
- ✅ **One hook per business operation**: Each specific action gets its own dedicated hook
- ✅ **Work with nested structures**: Update specific nested fields using dot notation or array operations
- ✅ **Combine Storage + Firestore**: Handle file uploads and database updates together in one mutation
- ✅ **Use TanStack Query's `useMutation`**: Provides loading states, error handling, and optimistic updates
- ✅ **Handle cache invalidation**: Invalidate relevant queries in `onSuccess` callbacks
- ✅ **Use Firestore client SDK directly**: `updateDoc`, `arrayUnion`, `arrayRemove`, etc.
- ✅ **Keep mutation logic in hooks**: Components should call hooks, not contain business logic
- ❌ **Never use generic update hooks**: Avoid `useUpdateEvent` that updates the entire entity
- ❌ **Never use server functions for CRUD**: Basic create/read/update/delete operations stay client-side

## Security Model

### Client-First Security

Security is enforced at the Firebase level, not in application code:

**1. Firestore Security Rules**

```javascript
// Declarative security at database level
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Fine-grained access control
    match /companies/{companyId} {
      allow read: if request.auth != null &&
                    isCompanyMember(request.auth.uid, companyId);
      allow write: if request.auth != null &&
                     isCompanyAdmin(request.auth.uid, companyId);
    }

    match /projects/{projectId} {
      allow read: if true; // Public read
      allow write: if request.auth != null &&
                     canEditProject(request.auth.uid, projectId);
    }
  }
}
```

**2. Storage Security Rules**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /media/{companyId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
                     userOwnsCompany(request.auth.uid, companyId);
    }
  }
}
```

**3. Authentication Rules**

- Use Firebase Auth client SDK
- Enforce authentication in Firestore/Storage rules
- Never trust client-side auth checks for security

### What NOT to Do

❌ **Don't rely on server-side checks for security:**

```tsx
// ❌ BAD: Security through obscurity
const deleteEvent = createServerFn().handler(async ({ eventId, userId }) => {
  // Anyone can call this with any userId!
  if (userId === ownerId) {
    await adminFirestore.collection('events').doc(eventId).delete()
  }
})
```

✅ **DO use Firestore rules:**

```javascript
// ✅ GOOD: Security at database level
match /events/{eventId} {
  allow delete: if request.auth != null &&
                  request.auth.uid == resource.data.createdBy;
}
```

## Best Practices

### 1. Default to Client-Side

Always start with client-side implementation. Only move to server when you have a specific reason.

### 2. Use Firebase Client SDKs Directly

Don't create unnecessary abstraction layers. Firebase SDKs are well-designed - use them directly.

### 3. Security in Database Rules

Write comprehensive Firestore and Storage security rules. This is your primary security mechanism.

### 4. SSR for SEO, Not Security

Use SSR to improve initial page load and SEO. Never use it as a security boundary.

### 5. Real-Time by Default

Leverage Firestore's real-time capabilities with `onSnapshot` for collaborative features.

### 6. Server Functions are Rare

If you find yourself writing many server functions, reconsider your architecture.

### 7. Client-Side State Management

Use TanStack Query for server state, Zustand for client state. Keep state management on the client.

## Migration from Server-First Patterns

If coming from Next.js Server Components or traditional server-first architecture:

### Before (Server-First)

```tsx
// Server Component - fetches on server
async function EventsPage() {
  const events = await db.events.findMany()
  return <EventsList events={events} />
}
```

### After (Client-First)

```tsx
// Client Component - fetches on client with real-time updates
function EventsPage() {
  const { data: events } = useEventsRealtime()
  return <EventsList events={events} />
}

function useEventsRealtime() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const q = query(collection(firestore, 'events'))
    return onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
  }, [])

  return { data: events }
}
```

## Summary

**Client-First Architecture means:**

- ✅ Firebase client SDKs for data operations
- ✅ Client-side business logic
- ✅ Security through database rules
- ✅ Real-time updates by default
- ✅ SSR for entry points and SEO
- ⚠️ Minimal server functions (specific use cases only)

**Remember**: If you're writing a server function, ask yourself: "Could this be done client-side with proper Firestore rules?" The answer is usually yes.

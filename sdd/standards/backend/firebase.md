# Firebase Standards

This document defines how we use Firebase in Clementine, following a **hybrid architecture** pattern.

## Architecture Pattern: Hybrid Client + Admin SDK

We use **both** Firebase Client SDK and Admin SDK in a complementary way:

### Frontend: Client SDK (Real-time)
- **Purpose**: Real-time subscriptions, optimistic reads
- **Location**: `web/src/lib/firebase/client.ts`
- **Package**: `firebase` (v10+)

### Backend: Admin SDK (Privileged)
- **Purpose**: Mutations, business logic, privileged operations
- **Location**: `web/src/lib/firebase/admin.ts`
- **Package**: `firebase-admin`

## Client SDK Usage

### When to Use
✅ **Use Client SDK for:**
- Real-time data subscriptions (`onSnapshot`)
- Reading data with live updates
- Listening to document/collection changes
- Client-side queries with proper security rules

### Initialization

```typescript
// web/src/lib/firebase/client.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### Example: Real-time Session Updates

```typescript
// ✅ Good: Real-time subscription for instant updates
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

useEffect(() => {
  if (!sessionId) return;

  const unsubscribe = onSnapshot(
    doc(db, `events/${eventId}/sessions/${sessionId}`),
    (snapshot) => {
      const session = snapshot.data();
      // React to updates instantly
    }
  );

  return () => unsubscribe(); // Cleanup
}, [sessionId, eventId]);
```

```typescript
// ❌ Bad: Polling (slow, inefficient)
const pollSession = async () => {
  const session = await getSessionAction(sessionId);
  if (session.state !== 'ready') {
    setTimeout(pollSession, 2000); // 2s delay
  }
};
```

### Common Use Cases
- **Guest waiting for AI transform**: Subscribe to session state changes
- **Live event stats**: Subscribe to analytics counters
- **Collaborative features**: Real-time document updates
- **Notifications**: Listen to new messages/alerts

## Admin SDK Usage

### When to Use
✅ **Use Admin SDK for:**
- All write operations (create, update, delete)
- Server Actions
- Business logic validation
- File uploads to Storage
- Privileged reads (bypassing security rules)

### Initialization

```typescript
// web/src/lib/firebase/admin.ts

import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")!,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
  });
}

export const db = admin.firestore();
export const storage = admin.storage().bucket();
```

### Example: Server Action with Validation

```typescript
// ✅ Good: Server Action with business logic
"use server";

import { db } from "@/lib/firebase/admin";
import { createEventSchema } from "@/lib/schemas/events";

export async function createEventAction(input: unknown) {
  // Server-side validation
  const validated = createEventSchema.parse(input);

  // Business logic
  const eventRef = db.collection("events").doc();
  await eventRef.set({
    ...validated,
    createdAt: Date.now(),
  });

  revalidatePath("/events");
  return { eventId: eventRef.id };
}
```

```typescript
// ❌ Bad: Direct client write (bypasses validation)
import { db } from "@/lib/firebase/client";
import { setDoc, doc } from "firebase/firestore";

// This will fail due to security rules (good!)
await setDoc(doc(db, "events", eventId), data);
```

### Common Use Cases
- **Creating events/sessions/users**: Via Server Actions
- **Updating configurations**: Scene settings, branding
- **File uploads**: Images to Storage
- **AI transform triggers**: Orchestrate workflows
- **Analytics computation**: Aggregate stats

## Security Rules

### Firestore Rules

**Pattern**: Allow reads, deny writes (enforce Server Actions)

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default: reads allowed, writes via Server Actions only
    match /{document=**} {
      allow read: if true;
      allow write: if false; // Force Server Actions
    }

    // Example: More granular (future)
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null && isOrganizer();

      match /sessions/{sessionId} {
        allow read: if true;
        allow write: if false; // Server Actions only
      }
    }
  }
}
```

### Storage Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Default: reads allowed, writes via Server Actions only
    match /{allPaths=**} {
      allow read: if true;
      allow write: if false; // Force Server Actions
    }
  }
}
```

### Why This Approach?

✅ **Security**: All mutations go through Server Actions (business logic server-side)
✅ **Validation**: Input validated before writes
✅ **Real-time**: Client SDK can subscribe for instant updates
✅ **Flexibility**: Easy to tighten rules in production
✅ **Type-safety**: Server Actions with TypeScript

## Environment Variables

### Client SDK (Public)
Required for frontend usage:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Admin SDK (Private)
Server-side only (never exposed to client):

```bash
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_STORAGE_BUCKET=...
```

## Data Patterns

### Firestore Structure

**Use flat subcollections** (not deep nesting):

```typescript
// ✅ Good: Flat subcollections
events/{eventId}/
  scenes/{sceneId}
  sessions/{sessionId}
  media/{mediaId}
  stats/overview

// ❌ Bad: Deep nesting (hard to query, slow)
events/{eventId}/
  scenes/{sceneId}/
    sessions/{sessionId}/
      media/{mediaId}
```

### Repository Pattern

Group related operations in repositories (use Admin SDK):

```typescript
// web/src/lib/repositories/events.ts
import { db } from "@/lib/firebase/admin";

export async function createEvent(data: CreateEventInput) {
  const eventRef = db.collection("events").doc();
  const sceneRef = eventRef.collection("scenes").doc();

  await db.runTransaction(async (txn) => {
    txn.set(eventRef, { ...eventData });
    txn.set(sceneRef, { ...defaultSceneData });
  });

  return eventRef.id;
}
```

### Storage Paths

Follow consistent naming:

```
events/{eventId}/
  refs/{filename}               # Reference images
  sessions/{sessionId}/
    input.jpg                   # Guest photo
    result.jpg                  # AI result
  qr/
    join.png                    # Join QR code
```

## Best Practices

### 1. Always Clean Up Subscriptions

```typescript
// ✅ Good: Cleanup on unmount
useEffect(() => {
  const unsubscribe = onSnapshot(docRef, callback);
  return () => unsubscribe();
}, [deps]);
```

### 2. Handle Errors Gracefully

```typescript
// ✅ Good: Error handling
onSnapshot(
  docRef,
  (snapshot) => {
    // Success handler
  },
  (error) => {
    console.error("Subscription error:", error);
    setError("Failed to load data");
  }
);
```

### 3. Use Transactions for Multi-document Writes

```typescript
// ✅ Good: Transaction for atomicity
await db.runTransaction(async (txn) => {
  txn.set(eventRef, eventData);
  txn.set(sceneRef, sceneData);
});
```

### 4. Server Actions for All Mutations

```typescript
// ✅ Good: Mutation via Server Action
"use server";
export async function updateEventAction(id: string, data: UpdateInput) {
  await updateEvent(id, data); // Uses Admin SDK
  revalidatePath(`/events/${id}`);
}

// ❌ Bad: Direct client mutation
import { db } from "@/lib/firebase/client";
await updateDoc(doc(db, "events", id), data); // Will fail due to rules
```

### 5. Type Safety with Zod

```typescript
// ✅ Good: Validate data
const eventSchema = z.object({
  title: z.string().min(1).max(100),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i),
});

export async function createEventAction(input: unknown) {
  const validated = eventSchema.parse(input); // Runtime validation
  // ...
}
```

## Common Mistakes

### ❌ Don't: Use Client SDK for Writes

```typescript
// ❌ Will fail due to security rules
import { db } from "@/lib/firebase/client";
await setDoc(doc(db, "events", id), data);
```

### ❌ Don't: Expose Admin SDK to Client

```typescript
// ❌ NEVER import admin in client components
import { db } from "@/lib/firebase/admin"; // Server-side only!
```

### ❌ Don't: Skip Validation

```typescript
// ❌ No validation
export async function createEventAction(input: any) {
  await db.collection("events").add(input); // Dangerous!
}
```

### ❌ Don't: Poll When You Can Subscribe

```typescript
// ❌ Polling (bad UX)
const interval = setInterval(async () => {
  const session = await getSession(id);
  // ...
}, 2000);

// ✅ Subscribe (instant updates)
onSnapshot(doc(db, "sessions", id), (snapshot) => {
  // ...
});
```

## Testing

### Mock Client SDK

```typescript
// tests/mocks/firebase.ts
import { vi } from "vitest";

export const mockOnSnapshot = vi.fn();
export const mockGetDoc = vi.fn();

vi.mock("@/lib/firebase/client", () => ({
  db: {},
  storage: {},
}));
```

### Mock Admin SDK

```typescript
// Use Firebase emulators or mock the Admin SDK
vi.mock("@/lib/firebase/admin", () => ({
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn(),
        get: vi.fn(),
      })),
    })),
  },
}));
```

## Migration Path

**POC → MVP**:
1. POC: `allow read: if true` (wide open)
2. MVP: Add authentication, tighten rules per collection
3. Production: Granular rules, RLS-style access control

**Example MVP rules**:

```javascript
match /events/{eventId} {
  allow read: if true;
  allow write: if request.auth != null
              && request.auth.uid == resource.data.ownerId;
}
```

## Resources

- [Firebase Client SDK Docs](https://firebase.google.com/docs/web/setup)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Best Practices](https://firebase.google.com/docs/firestore/best-practices)

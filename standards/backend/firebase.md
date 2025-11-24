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
import { createEventSchema } from "../schemas";
import { revalidatePath } from "next/cache";

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
  return { success: true, data: { eventId: eventRef.id } };
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
// features/events/repositories/events.repository.ts
import { db } from "@/lib/firebase/admin";
import type { CreateEventInput, Event } from "../types";

export async function createEvent(data: CreateEventInput): Promise<Event> {
  const eventRef = db.collection("events").doc();

  const eventData: Event = {
    ...data,
    id: eventRef.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await eventRef.set(eventData);

  return eventData;
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const snapshot = await db.collection("events").doc(eventId).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as Event;
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

**Convention: Store Full URLs in Firestore**

When storing file references in Firestore documents, choose the appropriate format based on your access control needs:

### Approach 1: Public URLs (Recommended for Public Assets)

**Use for**: Images that are publicly shareable (event branding, guest photos, shared results)

Store the full public URL to enable instant rendering without additional API calls:

```typescript
// ✅ Good: Public URL (instant rendering)
{
  welcomeBackgroundImagePath: "https://storage.googleapis.com/bucket-name/images/welcome/abc123.jpg",
  resultPhoto: "https://storage.googleapis.com/bucket-name/events/xyz789/sessions/def456/result.jpg"
}

// ❌ Bad: Relative path (requires lookup + URL generation)
{
  welcomeBackgroundImagePath: "images/welcome/abc123.jpg",
  resultPhoto: "events/xyz789/sessions/def456/result.jpg"
}
```

**Why Public URLs?**

✅ **Instant Rendering**: Use directly in `<img>` tags, no extra calls
✅ **Never Expire**: Permanent URLs, no regeneration needed
✅ **Performance**: Zero latency for image loads
✅ **Simplicity**: Works in client and server components

**Implementation Pattern**:

```typescript
// Server Action: Upload and return public URL
"use server";

import { storage } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from "uuid";

export async function uploadImage(
  file: File,
  destination: string
): Promise<ActionResponse<{ path: string; url: string }>> {
  try {
    const filename = `${uuidv4()}.jpg`;
    const path = `images/${destination}/${filename}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Firebase Storage
    const fileRef = storage.file(path);
    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Generate public URL (never expires)
    const url = `https://storage.googleapis.com/${storage.name}/${path}`;

    return {
      success: true,
      data: { path, url },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPLOAD_FAILED",
        message: error instanceof Error ? error.message : "Upload failed",
      },
    };
  }
}

// Client Component: Use URL directly
export function ImagePreview({ imageUrl }: { imageUrl: string }) {
  return <img src={imageUrl} alt="Preview" className="w-full h-auto" />;
}
```

### Approach 2: Private Paths (For Access-Controlled Files)

**Use for**: Sensitive files requiring access control or temporary access (private user uploads, paid content)

Store internal `gs://` paths and generate signed URLs when needed:

```typescript
// ✅ Good: Private path (access control)
{
  privateDocument: "gs://bucket-name/private/user123/document.pdf"
}
```

**Implementation Pattern**:

```typescript
// Server Action: Upload and return gs:// path
"use server";

export async function uploadPrivateFile(file: File, userId: string) {
  const path = `private/${userId}/${file.name}`;
  const fileRef = storage.file(path);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fileRef.save(buffer, {
    metadata: { contentType: file.type },
  });

  // Store gs:// path (NOT public URL)
  const gsPath = `gs://${storage.name}/${path}`;

  return { success: true, data: { path: gsPath } };
}

// Server Action: Generate temporary signed URL
"use server";

export async function getSignedUrl(gsPath: string) {
  const filePath = gsPath.replace(`gs://${storage.name}/`, "");
  const file = storage.file(filePath);

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return url;
}
```

### Decision Matrix

| Use Case | Format | Why |
|----------|--------|-----|
| Event branding images | Public URL | Shared publicly, needs instant rendering |
| Guest photos | Public URL | Shared on social media, no access control needed |
| AI-generated results | Public URL | Shared publicly, high performance priority |
| QR codes | Public URL | Public assets, embedded in multiple places |
| User profile documents | Private path | Requires access control and audit trail |
| Paid content | Private path | Needs temporary access with expiration |

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

Define schemas with Firestore-safe optional fields:

```typescript
// features/events/schemas/events.schemas.ts
import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().nullable().optional().default(null), // Firestore-safe
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i).nullable().optional().default(null),
});

export const createEventInputSchema = eventSchema.omit({ id: true, createdAt: true });
```

```typescript
// features/events/actions/events.actions.ts
"use server";

import { createEventInputSchema } from "../schemas";
import { createEvent } from "../repositories";
import { z } from "zod";

export async function createEventAction(input: unknown) {
  try {
    const validated = createEventInputSchema.parse(input);
    const event = await createEvent(validated);
    return { success: true, data: event };
  } catch (error) {
    // Provide descriptive validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
          issues: error.issues, // Include full details for client-side field errors
        },
      };
    }
    // Handle other errors
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
```

**Key points:**
- Use `.nullable().optional().default(null)` for optional fields (prevents `undefined` in Firestore)
- Separate schemas for create/update operations (use `.omit()`, `.pick()`, `.partial()`)
- Import schemas from feature's `schemas/` folder using relative imports
- **Always provide descriptive validation errors** - include field paths and messages, not generic "Invalid input"

### 6. Efficient Document Updates

**Don't check existence before updates** - Firebase Admin SDK's `.update()` already throws `NOT_FOUND` if the document doesn't exist:

```typescript
// ❌ Bad: Wasteful extra read
const eventDoc = await db.collection("events").doc(eventId).get();
if (!eventDoc.exists) {
  return { success: false, error: { code: "NOT_FOUND", message: "Event not found" } };
}
await db.collection("events").doc(eventId).update(data); // Extra request!

// ✅ Good: Let Firebase handle it
try {
  await db.collection("events").doc(eventId).update(data);
  return { success: true, data: undefined };
} catch (error: any) {
  if (error.code === 5) { // Firestore NOT_FOUND error code
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Event not found" },
    };
  }
  throw error; // Re-throw unexpected errors
}
```

**Why?**
- ✅ **Performance**: 1 request instead of 2 (50% fewer reads)
- ✅ **Cost**: Firestore charges per operation - unnecessary reads cost money
- ✅ **Race conditions**: Document could be deleted between check and update
- ✅ **Simpler code**: Fewer lines, clearer intent

**When to check existence:**
- ✅ When you need to **read existing data** to compute the update (e.g., incrementing a counter)
- ✅ When you need to **validate business logic** based on current state (e.g., can't archive already-archived event)
- ❌ **Never** check just to verify existence before a blind update

### 7. Dynamic Field Mapping for Nested Updates

**Don't manually map fields** - use dynamic mapping for scalable, maintainable updates:

```typescript
// ❌ Bad: Manual field mapping (not scalable)
const updateData: Record<string, unknown> = { updatedAt: Date.now() };

if (validatedData.buttonColor !== undefined) {
  updateData["theme.buttonColor"] = validatedData.buttonColor;
}
if (validatedData.buttonTextColor !== undefined) {
  updateData["theme.buttonTextColor"] = validatedData.buttonTextColor;
}
if (validatedData.backgroundColor !== undefined) {
  updateData["theme.backgroundColor"] = validatedData.backgroundColor;
}
// 10 more fields... 😱

// ✅ Good: Dynamic field mapping
const updateData: Record<string, unknown> = { updatedAt: Date.now() };

const fieldMappings: Record<string, string> = {
  buttonColor: "theme.buttonColor",
  buttonTextColor: "theme.buttonTextColor",
  backgroundColor: "theme.backgroundColor",
  backgroundImage: "theme.backgroundImage",
};

Object.entries(validatedData).forEach(([key, value]) => {
  if (value !== undefined && fieldMappings[key]) {
    updateData[fieldMappings[key]] = value;
  }
});
```

**Benefits:**
- ✅ **Scalable**: Add new fields by updating mapping object only
- ✅ **DRY**: No repetitive if-statements
- ✅ **Type-safe**: TypeScript ensures field names match schema
- ✅ **Readable**: Mapping declaration is self-documenting

**For flat updates** (no nesting), it's even simpler:

```typescript
// When updating flat fields directly
const updateData = {
  ...validatedData,
  updatedAt: Date.now(),
};

await db.collection("events").doc(eventId).update(updateData);
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

### ❌ Don't: Check Existence Before Blind Updates

```typescript
// ❌ Wasteful: Extra read just to check existence
const eventDoc = await db.collection("events").doc(eventId).get();
if (!eventDoc.exists) {
  return { error: "Not found" };
}
await db.collection("events").doc(eventId).update(data);

// ✅ Efficient: Let Firebase handle the error
try {
  await db.collection("events").doc(eventId).update(data);
} catch (error: any) {
  if (error.code === 5) {
    return { error: "Not found" };
  }
  throw error;
}
```

### ❌ Don't: Use Manual Field Mapping

```typescript
// ❌ Not scalable: Manual if-statements for every field
if (data.buttonColor) updateData["theme.buttonColor"] = data.buttonColor;
if (data.buttonTextColor) updateData["theme.buttonTextColor"] = data.buttonTextColor;
if (data.backgroundColor) updateData["theme.backgroundColor"] = data.backgroundColor;
// ... 10 more fields

// ✅ Scalable: Dynamic mapping
const fieldMappings = {
  buttonColor: "theme.buttonColor",
  buttonTextColor: "theme.buttonTextColor",
  backgroundColor: "theme.backgroundColor",
};
Object.entries(data).forEach(([key, value]) => {
  if (value !== undefined && fieldMappings[key]) {
    updateData[fieldMappings[key]] = value;
  }
});
```

### ❌ Don't: Return Vague Validation Errors

```typescript
// ❌ Not helpful: Generic error message
if (error instanceof z.ZodError) {
  return {
    success: false,
    error: { code: "VALIDATION_ERROR", message: "Invalid input data" }, // What failed?
  };
}

// ✅ Descriptive: Include field paths and messages
if (error instanceof z.ZodError) {
  return {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
      issues: error.issues, // Full details for client
    },
  };
}
```

## Testing

### Mock Client SDK

```typescript
// tests/mocks/firebase.ts
export const mockOnSnapshot = jest.fn();
export const mockGetDoc = jest.fn();

jest.mock("@/lib/firebase/client", () => ({
  db: {},
  storage: {},
}));
```

### Mock Admin SDK

```typescript
// jest.setup.ts - Mock the Admin SDK globally
jest.mock("@/lib/firebase/admin", () => ({
  db: {
    collection: jest.fn(),
    runTransaction: jest.fn(),
  },
  storage: {
    file: jest.fn(),
  },
}));
```

```typescript
// In test files, use the mocked db
import { db } from "@/lib/firebase/admin";

describe("Repository", () => {
  const mockDb = db as unknown as {
    collection: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("performs database operation", async () => {
    mockDb.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
      }),
    });
    // Test your repository function here
  });
});
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

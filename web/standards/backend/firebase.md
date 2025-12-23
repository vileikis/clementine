# Firebase Standards

**Architecture**: Hybrid Client SDK (real-time reads) + Admin SDK (all writes, server-side logic)

## Client SDK - Real-time Subscriptions

**Location**: `web/src/lib/firebase/client.ts` | **Package**: `firebase` (v10+)

**Use for**: Real-time subscriptions (`onSnapshot`), live updates, listening to changes

```typescript
// Initialization
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

**Example**: Real-time subscription with cleanup
```typescript
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

useEffect(() => {
  if (!sessionId) return;
  const unsubscribe = onSnapshot(
    doc(db, `events/${eventId}/sessions/${sessionId}`),
    (snapshot) => { /* handle updates */ },
    (error) => { console.error("Subscription error:", error); }
  );
  return () => unsubscribe(); // Always cleanup
}, [sessionId, eventId]);
```

## Admin SDK - Mutations & Server Logic

**Location**: `web/src/lib/firebase/admin.ts` | **Package**: `firebase-admin`

**Use for**: All writes (create/update/delete), Server Actions, business logic, file uploads, privileged reads

```typescript
// Initialization
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

**Example**: Server Action with validation and error handling
```typescript
"use server";
import { db } from "@/lib/firebase/admin";
import { createEventSchema } from "../schemas";
import { z } from "zod";

export async function createEventAction(input: unknown) {
  try {
    const validated = createEventSchema.parse(input);
    const eventRef = db.collection("events").doc();
    await eventRef.set({ ...validated, createdAt: Date.now() });
    revalidatePath("/events");
    return { success: true, data: { eventId: eventRef.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
          issues: error.issues,
        },
      };
    }
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}
```

## Security Rules

**Pattern**: Allow reads, deny writes (enforce Server Actions only)

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if false; // Force Server Actions
    }
  }
}

// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if false; // Force Server Actions
    }
  }
}
```

## Data Patterns

### Firestore Structure
Use **flat subcollections** (not deep nesting):
```
✅ events/{eventId}/sessions/{sessionId}
❌ events/{eventId}/scenes/{sceneId}/sessions/{sessionId}
```

### Zod Schemas
- Use `.nullable().optional().default(null)` for optional fields (Firestore doesn't allow `undefined`)
- Separate schemas for create/update operations using `.omit()`, `.pick()`, `.partial()`
- Always provide descriptive validation errors with field paths

### Storage URLs
- **Public assets** (event branding, guest photos): Store full public URLs in Firestore for instant rendering
  ```typescript
  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/${storage.name}/${path}`;
  ```
- **Private files** (sensitive documents): Store `gs://` paths, generate signed URLs on-demand

### Repository Pattern
Group data operations in `features/*/repositories/` using Admin SDK:
```typescript
// features/events/repositories/events.repository.ts
export async function getEvent(eventId: string): Promise<Event | null> {
  const snapshot = await db.collection("events").doc(eventId).get();
  return snapshot.exists ? (snapshot.data() as Event) : null;
}
```

## Best Practices

### Efficient Updates
**Don't check existence before updates** - Firebase's `.update()` throws `NOT_FOUND` automatically:
```typescript
// ❌ Wasteful: Extra read
const doc = await ref.get();
if (!doc.exists) return { error: "Not found" };
await ref.update(data);

// ✅ Efficient: Trust Firebase
try {
  await ref.update(data);
} catch (error: any) {
  if (error.code === 5) return { error: "Not found" };
  throw error;
}
```
**Exception**: Check existence only when you need existing data for business logic.

### Dynamic Field Mapping
For nested updates, use dynamic mapping (scalable, DRY):
```typescript
// ❌ Not scalable
if (data.buttonColor) updateData["theme.buttonColor"] = data.buttonColor;
if (data.buttonTextColor) updateData["theme.buttonTextColor"] = data.buttonTextColor;
// ... repeat for 10 fields

// ✅ Scalable
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

### Error Handling
- **Subscriptions**: Always cleanup with `return () => unsubscribe()`
- **Validation errors**: Include field paths, not generic "Invalid input"
- **Transactions**: Use `db.runTransaction()` for multi-document atomic writes

## Anti-Patterns

### ❌ Client SDK Writes
```typescript
// Will fail due to security rules (good!)
import { db } from "@/lib/firebase/client";
await setDoc(doc(db, "events", id), data);
```

### ❌ Admin SDK in Client
```typescript
// NEVER import admin in client components (server-only!)
import { db } from "@/lib/firebase/admin";
```

### ❌ Polling Instead of Subscriptions
```typescript
// ❌ Polling (slow, inefficient)
const interval = setInterval(async () => { await getSession(id); }, 2000);

// ✅ Subscribe (instant updates)
onSnapshot(doc(db, "sessions", id), (snapshot) => { /* ... */ });
```

### ❌ Vague Validation Errors
```typescript
// ❌ Not helpful
error: { message: "Invalid input data" }

// ✅ Descriptive
error: {
  message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
  issues: error.issues
}
```

### ❌ Skipping Validation
```typescript
// ❌ Dangerous
export async function createEventAction(input: any) {
  await db.collection("events").add(input); // No validation!
}
```

## Environment Variables

**Client SDK (public)**: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`

**Admin SDK (private, never exposed)**: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`

## Testing

Mock Client SDK:
```typescript
jest.mock("@/lib/firebase/client", () => ({ db: {}, storage: {} }));
```

Mock Admin SDK:
```typescript
jest.mock("@/lib/firebase/admin", () => ({
  db: { collection: jest.fn(), runTransaction: jest.fn() },
  storage: { file: jest.fn() },
}));
```

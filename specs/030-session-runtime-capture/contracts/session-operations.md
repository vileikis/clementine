# Session Operations Contract

**Feature**: 030-session-runtime-capture
**Date**: 2026-01-15

## Overview

This document defines the contracts for session operations. These are implemented as React hooks using TanStack Query for mutations and Firestore for persistence.

---

## Operations

### 1. Create Session

**Hook**: `useCreateSession()`

**Purpose**: Create a new session when an experience execution begins (preview or guest).

#### Input Schema

```typescript
const createSessionInputSchema = z.object({
  projectId: z.string().min(1),
  eventId: z.string().min(1),
  experienceId: z.string().min(1),
  mode: z.enum(['preview', 'guest']),
  configSource: z.enum(['draft', 'published']),
})

type CreateSessionInput = z.infer<typeof createSessionInputSchema>
```

#### Output Schema

```typescript
interface CreateSessionResult {
  sessionId: string
  session: Session
}
```

#### Behavior

1. Validate input with Zod schema
2. Create session document at `/projects/{projectId}/sessions/{sessionId}`
3. Set initial state: `status='active'`, `currentStepIndex=0`
4. Set timestamps: `createdAt`, `updatedAt` (server timestamp)
5. Return created session

#### Error Cases

| Error | Cause | Handling |
|-------|-------|----------|
| `VALIDATION_ERROR` | Invalid input | Throw Zod error |
| `PERMISSION_DENIED` | User cannot access project | Throw Firebase error |
| `NOT_FOUND` | Project/Event/Experience doesn't exist | Throw with details |

---

### 2. Subscribe to Session

**Hook**: `useSubscribeSession(sessionId: string | null)`

**Purpose**: Subscribe to real-time session updates.

#### Input

```typescript
sessionId: string | null  // Null disables subscription
```

#### Output

```typescript
session: Session | null  // Current session state or null if not subscribed/loading
isLoading: boolean
error: Error | null
```

#### Behavior

1. If `sessionId` is null, return null (no subscription)
2. Create Firestore `onSnapshot` listener
3. Update state on each snapshot
4. Clean up listener on unmount or sessionId change

---

### 3. Update Session Progress

**Hook**: `useUpdateSessionProgress(projectId: string)`

**Purpose**: Update session state during execution (step index, inputs, outputs).

#### Input Schema

```typescript
const updateSessionProgressInputSchema = z.object({
  sessionId: z.string().min(1),
  currentStepIndex: z.number().min(0).optional(),
  inputs: z.record(z.string(), z.unknown()).optional(),
  outputs: z.record(z.string(), mediaReferenceSchema).optional(),
})

type UpdateSessionProgressInput = z.infer<typeof updateSessionProgressInputSchema>
```

#### Output

```typescript
void  // No return value
```

#### Behavior

1. Validate input with Zod schema
2. Update session document with provided fields
3. Set `updatedAt` timestamp
4. Invalidate session query cache

#### Merge Strategy

- `inputs`: Deep merge with existing inputs
- `outputs`: Deep merge with existing outputs
- `currentStepIndex`: Replace existing value

---

### 4. Complete Session

**Hook**: `useCompleteSession(projectId: string)`

**Purpose**: Mark a session as completed when the experience finishes.

#### Input Schema

```typescript
const completeSessionInputSchema = z.object({
  sessionId: z.string().min(1),
})

type CompleteSessionInput = z.infer<typeof completeSessionInputSchema>
```

#### Output

```typescript
void  // No return value
```

#### Behavior

1. Update session document:
   - Set `status='completed'`
   - Set `completedAt` timestamp
   - Set `updatedAt` timestamp
2. Invalidate session query cache

---

### 5. Abandon Session

**Hook**: `useAbandonSession(projectId: string)`

**Purpose**: Mark a session as abandoned when user exits before completion.

#### Input Schema

```typescript
const abandonSessionInputSchema = z.object({
  sessionId: z.string().min(1),
})

type AbandonSessionInput = z.infer<typeof abandonSessionInputSchema>
```

#### Output

```typescript
void  // No return value
```

#### Behavior

1. Update session document:
   - Set `status='abandoned'`
   - Set `updatedAt` timestamp
2. Invalidate session query cache

---

## Query Keys

```typescript
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (projectId: string) => [...sessionKeys.lists(), projectId] as const,
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (projectId: string, sessionId: string) =>
    [...sessionKeys.details(), projectId, sessionId] as const,
}
```

---

## Implementation Notes

### Firestore Patterns

All mutations use `runTransaction()` for atomic operations:

```typescript
await runTransaction(firestore, async (transaction) => {
  const ref = doc(firestore, `projects/${projectId}/sessions/${sessionId}`)
  transaction.update(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
})
```

### Error Tracking

All mutations include Sentry error tracking:

```typescript
onError: (error) => {
  Sentry.captureException(error, {
    tags: { domain: 'session', action: 'create' }
  })
}
```

### Cache Invalidation

After mutations, invalidate relevant queries:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: sessionKeys.detail(projectId, sessionId)
  })
}
```

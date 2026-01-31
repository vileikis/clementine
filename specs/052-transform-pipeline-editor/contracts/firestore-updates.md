# Firestore Update Contracts

**Feature**: Transform Pipeline Editor
**Date**: 2026-01-31
**Purpose**: Define the contract for Firestore updates when managing transform nodes

---

## Overview

This document specifies the contract for updating the transform configuration in Firestore. All updates use the Firebase client SDK with transactions for atomicity and optimistic locking via `draftVersion`.

---

## Collection: `experiences`

**Document ID Format**: `{workspaceId}_{experienceId}`

**Example**: `ws_abc123_exp_xyz789`

---

## Update Operations

### 1. Add Transform Node

**Operation**: Add a new AI Image node to the transform pipeline

**Request**:
```typescript
{
  'draft.transform': {
    nodes: [...existingNodes, newNode],
    outputFormat: existingOutputFormat
  },
  draftVersion: increment(1),
  updatedAt: serverTimestamp()
}
```

**Transaction**: Required (ensures atomic update of multiple fields)

**Fields**:
- `draft.transform`: Complete transform config with new node appended
- `draftVersion`: Incremented by 1 for optimistic locking
- `updatedAt`: Server-generated timestamp

**New Node Structure**:
```typescript
{
  id: string,           // Generated with nanoid()
  type: 'ai.imageGeneration',
  config: {
    model: 'gemini-2.5-pro' | 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview',
    aspectRatio: '1:1' | '3:2' | '2:3' | '9:16' | '16:9',
    prompt: string,     // Minimum 1 character
    refMedia: MediaReference[]
  }
}
```

**Response**: Transaction succeeds or fails atomically

**Error Cases**:
- Document doesn't exist → Transaction fails
- Version conflict → Transaction fails (retry required)
- Invalid schema → Validation error

**Example**:
```typescript
await runTransaction(firestore, async (transaction) => {
  const docRef = doc(firestore, 'experiences', `${workspaceId}_${experienceId}`)

  transaction.update(docRef, {
    'draft.transform': {
      nodes: [
        ...existingNodes,
        {
          id: nanoid(),
          type: 'ai.imageGeneration',
          config: {
            model: 'gemini-2.5-pro',
            aspectRatio: '3:2',
            prompt: '',
            refMedia: []
          }
        }
      ],
      outputFormat: null
    },
    draftVersion: increment(1),
    updatedAt: serverTimestamp()
  })
})
```

---

### 2. Delete Transform Node

**Operation**: Remove a specific node from the transform pipeline

**Request**:
```typescript
{
  'draft.transform': {
    nodes: nodes.filter(n => n.id !== deletedNodeId),
    outputFormat: existingOutputFormat
  },
  draftVersion: increment(1),
  updatedAt: serverTimestamp()
}
```

**Transaction**: Required (ensures atomic update)

**Fields**:
- `draft.transform`: Complete transform config with node removed
- `draftVersion`: Incremented by 1
- `updatedAt`: Server-generated timestamp

**Response**: Transaction succeeds or fails atomically

**Error Cases**:
- Document doesn't exist → Transaction fails
- Node ID not found → Silent success (idempotent operation)
- Version conflict → Transaction fails (retry required)

**Example**:
```typescript
await runTransaction(firestore, async (transaction) => {
  const docRef = doc(firestore, 'experiences', `${workspaceId}_${experienceId}`)

  transaction.update(docRef, {
    'draft.transform': {
      nodes: existingNodes.filter(node => node.id !== 'node_to_delete'),
      outputFormat: null
    },
    draftVersion: increment(1),
    updatedAt: serverTimestamp()
  })
})
```

---

### 3. Update Transform Node Config (Future Phases)

**Operation**: Update configuration for a specific node (Phase 1c-1e)

**Request**:
```typescript
{
  'draft.transform': {
    nodes: nodes.map(n =>
      n.id === nodeId
        ? { ...n, config: updatedConfig }
        : n
    ),
    outputFormat: existingOutputFormat
  },
  draftVersion: increment(1),
  updatedAt: serverTimestamp()
}
```

**Transaction**: Required (ensures atomic update)

**Fields**:
- `draft.transform`: Complete transform config with updated node
- `draftVersion`: Incremented by 1
- `updatedAt`: Server-generated timestamp

**Debouncing**: Updates should be debounced (2000ms) to avoid excessive writes

**Response**: Transaction succeeds or fails atomically

**Error Cases**:
- Document doesn't exist → Transaction fails
- Node ID not found → Transaction fails (validate before update)
- Invalid config → Validation error
- Version conflict → Transaction fails (retry required)

---

## Data Types

### TransformConfig

```typescript
interface TransformConfig {
  nodes: TransformNode[]
  outputFormat: OutputFormat | null
}
```

### TransformNode

```typescript
interface TransformNode {
  id: string
  type: string
  config: Record<string, unknown>  // Polymorphic - type-specific
}
```

### AIImageNodeConfig

```typescript
interface AIImageNodeConfig {
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'
  aspectRatio: '1:1' | '3:2' | '2:3' | '9:16' | '16:9'
  prompt: string                    // Min 1 character
  refMedia: MediaReference[]
}
```

### MediaReference

```typescript
interface MediaReference {
  mediaAssetId: string
  url: string
  filePath: string | null
  displayName: string
}
```

### OutputFormat

```typescript
interface OutputFormat {
  aspectRatio: '1:1' | '9:16' | '3:2' | '2:3' | null
  quality: number | null  // 0-100
}
```

---

## Validation

### Schema Validation (Zod)

All updates must pass Zod schema validation before being sent to Firestore:

```typescript
import {
  transformConfigSchema,
  aiImageNodeConfigSchema,
} from '@clementine/shared'

// Validate before update
const validatedTransform = transformConfigSchema.parse(transform)
```

**Schemas**:
- `transformConfigSchema` - from `packages/shared/src/schemas/experience/transform.schema.ts`
- `aiImageNodeConfigSchema` - from `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`
- `mediaReferenceSchema` - from `packages/shared/src/schemas/media/media-reference.schema.ts`

### Firestore Rules

**Security rules** must enforce:
- User has write access to experience (member of workspace)
- Experience exists and is in draft status
- Transform config structure is valid (basic type checking)

**Example rules** (to be added to `firebase/firestore.rules`):

```javascript
// Experience document rules
match /experiences/{experienceId} {
  // Allow updates if user is workspace member and document exists
  allow update: if request.auth != null
    && exists(/databases/$(database)/documents/workspaces/$(getWorkspaceId(experienceId)))
    && isMember(getWorkspaceId(experienceId), request.auth.uid)
    && resource.data.status == 'draft'
    && validateTransformUpdate(request.resource.data);

  // Helper: Extract workspace ID from experience document ID
  function getWorkspaceId(expId) {
    return expId.split('_')[0];
  }

  // Helper: Check workspace membership
  function isMember(workspaceId, userId) {
    return exists(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(userId));
  }

  // Helper: Validate transform update
  function validateTransformUpdate(data) {
    return data.draft.transform.keys().hasAll(['nodes', 'outputFormat'])
      && data.draft.transform.nodes is list
      && data.draftVersion is int
      && data.updatedAt is timestamp;
  }
}
```

---

## Optimistic Locking

### Version Conflict Detection

**Mechanism**: `draftVersion` field increments on every update

**Flow**:
1. Client reads experience with `draftVersion: 42`
2. Client makes changes
3. Client sends update with `draftVersion: increment(1)`
4. If another client updated in the meantime (version is now 43), transaction fails
5. Client refetches latest data and retries

**Retry Strategy**:
- Automatic retry via TanStack Query (optimistic updates)
- Manual retry on error with exponential backoff

**Example**:
```typescript
try {
  await runTransaction(firestore, async (transaction) => {
    const docRef = doc(firestore, 'experiences', docId)
    const snapshot = await transaction.get(docRef)

    if (!snapshot.exists()) {
      throw new Error('Experience not found')
    }

    // Transaction will fail if version changed since read
    transaction.update(docRef, {
      'draft.transform': updatedTransform,
      draftVersion: increment(1),
      updatedAt: serverTimestamp()
    })
  })
} catch (error) {
  if (error.code === 'failed-precondition') {
    // Version conflict - refetch and retry
    console.warn('Version conflict detected, retrying...')
    // TanStack Query will automatically refetch
  }
}
```

---

## Cache Invalidation

### TanStack Query Invalidation

**After successful update**, invalidate relevant queries:

```typescript
queryClient.invalidateQueries({
  queryKey: ['experience', workspaceId, experienceId]
})
```

**Queries to invalidate**:
- Experience detail query
- Experience list query (if updated timestamp affects sorting)
- Draft status query

---

## Performance Considerations

### Debouncing

**Auto-save updates** (Phase 1c-1e, not Phase 1b-2):
- Debounce time: 2000ms (2 seconds)
- Only save if changes detected (compare with original values)
- Cancel pending debounce on unmount

**Discrete operations** (add, delete):
- No debounce (immediate save)
- Show loading state during save
- Optimistic UI updates

### Write Costs

**Firestore write operations**:
- Each transaction counts as 1 write
- Each document update increments `draftVersion` and `updatedAt`
- Frequent updates can increase costs

**Optimization**:
- Debounce auto-save to reduce write frequency
- Batch multiple field updates in single transaction when possible

---

## Error Handling

### Client-Side Errors

**Validation errors** (before Firestore call):
```typescript
try {
  transformConfigSchema.parse(transform)
} catch (error) {
  // Show validation error to user
  toast.error('Invalid transform configuration')
  console.error(error)
}
```

**Transaction errors** (Firestore):
```typescript
try {
  await runTransaction(...)
} catch (error) {
  if (error.code === 'permission-denied') {
    toast.error('You do not have permission to edit this experience')
  } else if (error.code === 'failed-precondition') {
    toast.error('Configuration was updated by another user. Refreshing...')
    queryClient.invalidateQueries(['experience', workspaceId, experienceId])
  } else {
    toast.error('Failed to save changes. Please try again.')
    console.error(error)
  }
}
```

### Error Reporting

**All errors** should be reported to Sentry:
```typescript
import * as Sentry from '@sentry/tanstackstart-react'

catch (error) {
  Sentry.captureException(error, {
    tags: { domain: 'transform-pipeline' },
    extra: { workspaceId, experienceId }
  })
}
```

---

## Testing Contracts

### Unit Tests

**Test update operations**:
```typescript
it('should update transform config with new node', async () => {
  const newNode = createMockNode()

  await updateTransform.mutateAsync({
    workspaceId: 'ws-1',
    experienceId: 'exp-1',
    transform: { nodes: [newNode], outputFormat: null }
  })

  expect(firestoreMock.runTransaction).toHaveBeenCalled()
  expect(firestoreMock.update).toHaveBeenCalledWith(
    expect.any(Object),
    expect.objectContaining({
      'draft.transform': expect.objectContaining({
        nodes: expect.arrayContaining([newNode])
      }),
      draftVersion: expect.any(Object),
      updatedAt: expect.any(Object)
    })
  )
})
```

### Integration Tests

**Test with Firestore emulator**:
```typescript
it('should increment draftVersion on update', async () => {
  // Setup: Create experience with version 1
  await setupExperience({ draftVersion: 1 })

  // Execute: Update transform
  await updateTransform(...)

  // Verify: Version incremented to 2
  const doc = await getDoc(experienceRef)
  expect(doc.data().draftVersion).toBe(2)
})
```

---

## Summary

This contract defines:
- ✅ Firestore update operations (add, delete, update nodes)
- ✅ Transaction requirements (atomicity, optimistic locking)
- ✅ Data type definitions (TransformConfig, TransformNode, AIImageNodeConfig)
- ✅ Validation requirements (Zod schemas, Firestore rules)
- ✅ Optimistic locking mechanism (draftVersion)
- ✅ Cache invalidation strategy (TanStack Query)
- ✅ Performance considerations (debouncing, write costs)
- ✅ Error handling patterns (validation, transaction, reporting)
- ✅ Testing contracts (unit, integration)

**Note**: This is a client-side Firebase SDK contract. No server-side API endpoints are needed for Phase 1b-2.

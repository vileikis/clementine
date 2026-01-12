# API Contracts: Experience Data Layer

**Feature**: 021-experience-data-library
**Date**: 2026-01-12
**Purpose**: Define data operations and hook interfaces

---

## Overview

This feature uses client-first architecture with Firebase Firestore client SDK. All data operations are performed directly on Firestore; there are no REST API endpoints. This document defines the hook interfaces and their behaviors.

---

## Query Hooks

### useWorkspaceExperiences

Lists all active experiences in a workspace with optional profile filtering.

**Signature**:
```typescript
function useWorkspaceExperiences(
  workspaceId: string,
  filters?: { profile?: ExperienceProfile }
): UseQueryResult<Experience[], Error>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `workspaceId` | string | Yes | Workspace document ID |
| `filters.profile` | `'freeform' \| 'survey' \| 'story'` | No | Filter by profile type |

**Returns**:
| Property | Type | Description |
|----------|------|-------------|
| `data` | `Experience[]` | Array of experiences (empty if none) |
| `isLoading` | boolean | True during initial fetch |
| `error` | Error \| null | Error if query failed |
| `isFetching` | boolean | True during any fetch |

**Behavior**:
- Establishes real-time Firestore listener via `onSnapshot`
- Filters to `status === 'active'` (excludes deleted)
- Applies profile filter if provided
- Orders by `createdAt` descending (newest first)
- Updates TanStack Query cache on each snapshot

**Query Key**: `['experiences', workspaceId, filters]`

---

### useWorkspaceExperience

Fetches a single experience by ID.

**Signature**:
```typescript
function useWorkspaceExperience(
  workspaceId: string,
  experienceId: string
): UseQueryResult<Experience | null, Error>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `workspaceId` | string | Yes | Workspace document ID |
| `experienceId` | string | Yes | Experience document ID |

**Returns**:
| Property | Type | Description |
|----------|------|-------------|
| `data` | `Experience \| null` | Experience object or null if not found |
| `isLoading` | boolean | True during initial fetch |
| `error` | Error \| null | Error if query failed |

**Behavior**:
- Establishes real-time Firestore listener via `onSnapshot`
- Returns null if document doesn't exist (no error thrown)
- Validates document against `experienceSchema`

**Query Key**: `['experiences', workspaceId, 'detail', experienceId]`

---

## Mutation Hooks

### useCreateExperience

Creates a new experience in a workspace.

**Signature**:
```typescript
function useCreateExperience(): UseMutationResult<
  { experienceId: string; workspaceId: string },
  Error,
  CreateExperienceInput
>
```

**Input Schema**:
```typescript
interface CreateExperienceInput {
  workspaceId: string  // Required
  name: string         // Required, 1-100 chars
  profile: 'freeform' | 'survey' | 'story'  // Required
}
```

**Returns** (on success):
```typescript
{
  experienceId: string  // Created document ID
  workspaceId: string   // For cache invalidation
}
```

**Behavior**:
1. Validates input against `createExperienceInputSchema`
2. Creates document in transaction with `serverTimestamp()`
3. Initializes: `status: 'active'`, `draft: { steps: [] }`, `published: null`
4. Invalidates `['experiences', workspaceId]` on success
5. Captures error to Sentry on failure

**Error Cases**:
| Error | Cause |
|-------|-------|
| Validation error | Invalid input (name too long, missing profile) |
| Permission denied | User is not admin |
| Network error | Firestore unavailable |

---

### useUpdateExperience

Updates an existing experience (name, media).

**Signature**:
```typescript
function useUpdateExperience(): UseMutationResult<
  { experienceId: string; workspaceId: string },
  Error,
  UpdateExperienceInput
>
```

**Input Schema**:
```typescript
interface UpdateExperienceInput {
  workspaceId: string   // Required
  experienceId: string  // Required
  name?: string         // Optional, 1-100 chars if provided
  media?: { mediaAssetId: string; url: string } | null  // Optional
}
```

**Returns** (on success):
```typescript
{
  experienceId: string
  workspaceId: string
}
```

**Behavior**:
1. Validates input against `updateExperienceInputSchema`
2. Updates document in transaction with `serverTimestamp()`
3. Only updates provided fields (partial update)
4. Invalidates relevant query keys on success

**Error Cases**:
| Error | Cause |
|-------|-------|
| Document not found | Experience doesn't exist |
| Validation error | Invalid name length |
| Permission denied | User is not admin |

---

### useDeleteExperience

Soft deletes an experience.

**Signature**:
```typescript
function useDeleteExperience(): UseMutationResult<
  { experienceId: string; workspaceId: string },
  Error,
  DeleteExperienceInput
>
```

**Input Schema**:
```typescript
interface DeleteExperienceInput {
  workspaceId: string   // Required
  experienceId: string  // Required
}
```

**Returns** (on success):
```typescript
{
  experienceId: string
  workspaceId: string
}
```

**Behavior**:
1. Validates input against `deleteExperienceInputSchema`
2. Updates document: `status: 'deleted'`, `deletedAt: serverTimestamp()`
3. Does NOT delete document (soft delete only)
4. Invalidates `['experiences', workspaceId]` on success

**Error Cases**:
| Error | Cause |
|-------|-------|
| Document not found | Experience doesn't exist |
| Permission denied | User is not admin |

---

## Query Options Factories

### experienceQuery

Factory for single experience query options (reusable in loaders).

**Signature**:
```typescript
function experienceQuery(
  workspaceId: string,
  experienceId: string
): QueryOptions<Experience | null>
```

**Usage**:
```typescript
// In route loader
await queryClient.prefetchQuery(experienceQuery(workspaceId, experienceId))

// In component
const { data } = useQuery(experienceQuery(workspaceId, experienceId))
```

---

### experiencesQuery

Factory for experience list query options.

**Signature**:
```typescript
function experiencesQuery(
  workspaceId: string,
  filters?: { profile?: ExperienceProfile }
): QueryOptions<Experience[]>
```

**Usage**:
```typescript
// In route loader
await queryClient.prefetchQuery(experiencesQuery(workspaceId, { profile: 'survey' }))
```

---

## Query Key Reference

| Hook | Query Key | Invalidated By |
|------|-----------|----------------|
| `useWorkspaceExperiences` | `['experiences', workspaceId, filters]` | create, update, delete |
| `useWorkspaceExperience` | `['experiences', workspaceId, 'detail', experienceId]` | update, delete |

### Invalidation Strategy

```typescript
// After create
queryClient.invalidateQueries({ queryKey: ['experiences', workspaceId] })

// After update
queryClient.invalidateQueries({ queryKey: ['experiences', workspaceId] })
queryClient.invalidateQueries({ queryKey: ['experiences', workspaceId, 'detail', experienceId] })

// After delete
queryClient.invalidateQueries({ queryKey: ['experiences', workspaceId] })
```

---

## Firestore Paths

| Operation | Path |
|-----------|------|
| Create | `POST /workspaces/{workspaceId}/experiences` |
| Read (single) | `GET /workspaces/{workspaceId}/experiences/{experienceId}` |
| Read (list) | `GET /workspaces/{workspaceId}/experiences` |
| Update | `PATCH /workspaces/{workspaceId}/experiences/{experienceId}` |
| Delete | `PATCH /workspaces/{workspaceId}/experiences/{experienceId}` (soft) |

Note: These are logical paths. Actual operations use Firestore SDK methods (`setDoc`, `getDoc`, `getDocs`, `updateDoc`, `onSnapshot`).

---

## Error Handling

All mutations follow this error handling pattern:

```typescript
useMutation({
  mutationFn: async (input) => {
    // Validate
    const validated = schema.parse(input)
    // Execute
    return await runTransaction(...)
  },
  onError: (error) => {
    Sentry.captureException(error, {
      tags: { domain: 'experience/library', action: 'action-name' },
    })
  },
})
```

Consumer components use `toast` for user feedback:

```typescript
const mutation = useCreateExperience()

const handleCreate = async (data: CreateExperienceInput) => {
  try {
    const result = await mutation.mutateAsync(data)
    toast.success('Experience created')
    navigate(`/experiences/${result.experienceId}`)
  } catch (error) {
    toast.error('Failed to create experience')
  }
}
```

# Ghost Project Approach for Preview Sessions

## Overview

This document outlines the architecture for handling preview sessions in the experience designer using a "ghost project" pattern. This allows preview sessions to reuse the existing session infrastructure while keeping them separate from production analytics.

## Problem Statement

- Sessions are stored at `/projects/{projectId}/sessions/{sessionId}`
- Experience designer operates at workspace level (no project context)
- Preview sessions need Firestore storage for cloud function transforms
- Preview sessions should be excluded from analytics

## Solution: Ghost Project

Each workspace has one system-managed "ghost" project used exclusively for preview sessions.

```
/projects/{preview_workspaceId}/
  sessions/{sessionId}    ← Preview sessions stored here
```

### Key Benefits

1. **Reuses existing infrastructure** - No changes to session hooks or cloud functions
2. **Clean separation** - Easy to filter from analytics and project lists
3. **Single session path pattern** - Cloud functions work unchanged

---

## Schema Design

### Option A: Type Field (Recommended)

Add a `type` field to distinguish project kinds:

```typescript
// project.schema.ts
export const projectTypeSchema = z.enum(['standard', 'ghost'])

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  workspaceId: z.string().min(1),
  status: projectStatusSchema,
  type: projectTypeSchema.default('standard'),  // NEW
  activeEventId: z.string().nullable(),
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})
```

**Why "ghost" over "preview":**
- "preview" could confuse with `status: 'draft'` or preview mode
- "ghost" is unique, unambiguous, and communicates hidden/system nature
- Established pattern in software (ghost elements, ghost records)

**Filtering projects:**
```typescript
// Exclude ghost projects from workspace project list
query(
  collection(firestore, 'projects'),
  where('workspaceId', '==', workspaceId),
  where('type', '==', 'standard'),  // Excludes ghost projects
  where('status', '!=', 'deleted')
)
```

### Option B: Minimal Ghost Document

If we want ghost projects to be lightweight (not follow full schema):

```typescript
// Ghost project - minimal document
{
  id: `ghost_${workspaceId}`,
  workspaceId: string,
  type: 'ghost',
  createdAt: number,
}
```

**Trade-offs:**
- Pro: Simpler, doesn't need all project fields
- Con: Two "types" of project documents, TypeScript complexity
- Con: May complicate security rules

### Recommendation

**Use Option A** - Full project schema with `type: 'ghost'`:
- Consistent typing throughout codebase
- Single `Project` type
- Standard security rules
- Unused fields (name, activeEventId) have sensible defaults

---

## Ghost Project Identification

### ID Convention

Use deterministic ID based on workspace:
```typescript
const getGhostProjectId = (workspaceId: string) => `ghost_${workspaceId}`
```

This allows:
- Looking up without querying
- Direct document reference
- Predictable path construction

### Example

```
Workspace: ws_abc123
Ghost Project ID: ghost_ws_abc123
Preview Session Path: /projects/ghost_ws_abc123/sessions/{sessionId}
```

---

## Ghost Project Lifecycle

### Creation Strategy

**Lazy creation** - Create ghost project on first preview attempt:

```typescript
// useGetOrCreateGhostProject hook
async function getOrCreateGhostProject(workspaceId: string): Promise<string> {
  const ghostProjectId = `ghost_${workspaceId}`
  const projectRef = doc(firestore, 'projects', ghostProjectId)

  const projectSnap = await getDoc(projectRef)

  if (!projectSnap.exists()) {
    await setDoc(projectRef, {
      id: ghostProjectId,
      name: 'Ghost Project',  // System name, never displayed
      workspaceId,
      status: 'live',
      type: 'ghost',
      activeEventId: null,
      deletedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }

  return ghostProjectId
}
```

**Alternative: Eager creation** - Create when workspace is created
- Pro: Simpler preview flow
- Con: Creates projects that may never be used

### Deletion

Ghost projects should **never be deleted**:
- They're system-managed
- Deleting would orphan preview sessions
- One per workspace, minimal overhead

---

## Session Schema Updates

Make `eventId` optional for preview mode:

```typescript
// session-api.types.ts
export const createSessionInputSchema = z.object({
  projectId: z.string(),
  workspaceId: z.string(),
  eventId: z.string().nullable(),  // CHANGED: nullable for preview
  experienceId: z.string(),
  mode: sessionModeSchema,
  configSource: configSourceSchema,
})
```

Preview sessions will have:
```typescript
{
  projectId: 'preview_ws_abc123',
  workspaceId: 'ws_abc123',
  eventId: null,  // No event for preview
  experienceId: 'exp_xyz',
  mode: 'preview',
  configSource: 'draft',
  // ... rest of session fields
}
```

---

## Implementation Changes

### 1. Project Schema (`packages/shared`)

```typescript
// Add type field
export const projectTypeSchema = z.enum(['standard', 'ghost'])

export const projectSchema = z.object({
  // ... existing fields
  type: projectTypeSchema.default('standard'),
})
```

### 2. Project Domain Queries

Update all project list queries to filter by type:

```typescript
// useProjects hook - exclude ghost projects
where('type', '==', 'standard')
```

### 3. Ghost Project Hook

Create hook for getting/creating ghost project:

```typescript
// src/domains/project/shared/hooks/useGhostProject.ts
export function useGhostProject(workspaceId: string) {
  return useQuery({
    queryKey: ['ghost-project', workspaceId],
    queryFn: () => getOrCreateGhostProject(workspaceId),
  })
}
```

### 4. Experience Preview Modal

Update to use ghost project:

```typescript
// ExperiencePreviewModal.tsx
function ExperiencePreviewModal({ experience, workspaceId }) {
  const { data: ghostProjectId } = useGhostProject(workspaceId)

  // Create session with ghost project
  createSession.mutateAsync({
    projectId: ghostProjectId,
    workspaceId,
    eventId: null,  // No event for preview
    experienceId: experience.id,
    mode: 'preview',
    configSource: 'draft',
  })
}
```

### 5. Security Rules

Add rules for ghost projects:

```javascript
// firestore.rules
match /projects/{projectId} {
  // Ghost projects - workspace admins only
  allow read, write: if projectId.matches('ghost_.*')
    && isWorkspaceAdmin(resource.data.workspaceId);

  // Standard projects - existing rules
  // ...
}

match /projects/{projectId}/sessions/{sessionId} {
  // Ghost project sessions - creator only
  allow read, write: if get(/databases/$(database)/documents/projects/$(projectId)).data.type == 'ghost'
    && request.auth.uid == resource.data.createdBy;

  // Production sessions - existing rules
  // ...
}
```

---

## Analytics Filtering

All analytics queries must exclude ghost projects/sessions:

```typescript
// By project type
where('type', '==', 'standard')

// By session mode (belt and suspenders)
where('mode', '==', 'guest')

// By project ID pattern (if needed)
where('projectId', 'not-in', ghostProjectIds)
```

---

## Summary

| Component | Change |
|-----------|--------|
| Project schema | Add `type: 'standard' \| 'ghost'` field |
| Session schema | Make `eventId` nullable |
| Project queries | Filter `type == 'standard'` |
| New hook | `useGhostProject(workspaceId)` |
| Preview modal | Use ghost project for sessions |
| Security rules | Handle ghost projects specially |
| Cloud functions | No changes needed |

---

## Open Questions

1. **Preview session cleanup**: Should preview sessions auto-delete after X hours/days?
2. **Ghost project visibility**: Should admins be able to see ghost project in a debug/admin view?
3. **Multiple concurrent previews**: How to handle if same user opens multiple preview windows?

---

## Next Steps

1. [ ] Update project schema with `type` field
2. [ ] Update session schema with nullable `eventId`
3. [ ] Create `useGhostProject` hook
4. [ ] Update project list queries to filter ghost projects
5. [ ] Update ExperiencePreviewModal to use ghost project
6. [ ] Update security rules
7. [ ] Test end-to-end preview flow

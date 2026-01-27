# Research: AI Presets Foundation and List Page

**Feature**: 041-ai-presets-crud
**Date**: 2026-01-26

## Overview

This document captures research findings and decisions for implementing AI Presets CRUD functionality.

---

## 1. Schema Location Decision

### Decision
Place AI Preset schema in `packages/shared/src/schemas/ai-preset/`

### Rationale
- Matches existing pattern for Experience schema (`packages/shared/src/schemas/experience/`)
- Enables schema reuse across frontend and potential backend functions
- Keeps validation logic centralized
- Supports future transform pipeline integration (Phase 6)

### Alternatives Considered
- **Domain-local schema**: Rejected - would duplicate schema if backend needs it
- **Inline in hooks**: Rejected - violates DRY, harder to maintain

---

## 2. Firestore Collection Path

### Decision
`/workspaces/{workspaceId}/aiPresets/{presetId}`

### Rationale
- Workspace-scoped as specified in PRD
- Subcollection pattern matches existing `/workspaces/{id}/experiences/{id}`
- Enables workspace-level security rules
- Natural hierarchy for permission inheritance

### Alternatives Considered
- **Root collection with workspaceId field**: Rejected - requires composite indexes, less intuitive security rules
- **Nested under projects**: Rejected - presets are workspace-wide, not project-specific

---

## 3. Soft Delete Pattern

### Decision
Use `status: 'active' | 'deleted'` with `deletedAt` timestamp

### Rationale
- Matches existing `projectEventStatusSchema` pattern
- Enables data recovery if needed
- Simple query filtering: `where('status', '==', 'active')`
- Consistent with codebase conventions

### Alternatives Considered
- **Hard delete**: Rejected - no recovery possible, inconsistent with codebase
- **Archive collection**: Rejected - over-engineering for current needs

---

## 4. Real-time Updates Pattern

### Decision
Use `onSnapshot` with TanStack Query cache integration

### Rationale
- Matches `useProjectEvents` hook pattern exactly
- Provides real-time updates for collaborative editing
- TanStack Query handles loading/error states
- `staleTime: Infinity` prevents unnecessary refetches

### Implementation Pattern
```typescript
// From useProjectEvents.ts - same pattern for useWorkspaceAIPresets
useEffect(() => {
  const q = query(collection(firestore, path), where('status', '==', 'active'))
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => convertFirestoreDoc(doc, schema))
    queryClient.setQueryData(queryKey, data)
  })
  return () => unsubscribe()
}, [workspaceId, queryClient])
```

### Alternatives Considered
- **Polling**: Rejected - inefficient, misses real-time updates
- **Pure onSnapshot without Query**: Rejected - loses caching and devtools integration

---

## 5. Mutation Pattern (serverTimestamp)

### Decision
Always use `runTransaction` with `serverTimestamp()`

### Rationale
- Prevents Zod parse errors from real-time listeners receiving pending timestamps
- Matches `useCreateProjectEvent` pattern
- Ensures timestamp resolves before returning to client
- Required for consistent createdAt/updatedAt values

### Implementation Pattern
```typescript
return await runTransaction(firestore, (transaction) => {
  const newRef = doc(collectionRef)
  const newDoc = {
    id: newRef.id,
    // ... other fields
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  transaction.set(newRef, newDoc)
  return Promise.resolve({ id: newRef.id })
})
```

### Alternatives Considered
- **setDoc without transaction**: Rejected - causes Zod errors on real-time listeners
- **Client-side timestamps**: Rejected - inconsistent, not authoritative

---

## 6. Security Rules Pattern

### Decision
Workspace member read, workspace admin write

### Rationale
- Matches PRD requirements (FR-005, FR-006)
- Consistent with existing workspace patterns
- Presets contain prompt templates that shouldn't be publicly visible

### Implementation
```javascript
match /workspaces/{workspaceId}/aiPresets/{presetId} {
  allow read: if isWorkspaceMember(workspaceId);
  allow write: if isWorkspaceAdmin(workspaceId);
}
```

### Alternatives Considered
- **Role-based granular permissions**: Rejected - over-engineering, not in requirements

---

## 7. UI Component Pattern

### Decision
Follow ProjectEventsList/Item pattern exactly

### Rationale
- Spec explicitly references these as implementation patterns
- Proven mobile-first design with 44x44px touch targets
- Consistent UX across the application
- Includes dialog patterns for rename/delete

### Components to Create
| Component | Based On | Purpose |
|-----------|----------|---------|
| AIPresetsList | ProjectEventsList | List with loading/empty states |
| AIPresetItem | ProjectEventItem | Card with context menu |
| RenameAIPresetDialog | RenameProjectEventDialog | Rename modal |
| DeleteAIPresetDialog | DeleteProjectEventDialog | Delete confirmation |
| CreateAIPresetButton | CreateProjectEventButton | Create action |

### Alternatives Considered
- **Custom design**: Rejected - inconsistent UX, more effort
- **Table layout**: Rejected - not mobile-first

---

## 8. Navigation Integration

### Decision
Add to `workspaceNavItems` array with Sparkles or similar icon

### Rationale
- Simple array modification
- Consistent with existing navigation items
- Route pattern matches `/workspace/$workspaceSlug/ai-presets`

### Implementation
```typescript
// In workspaceNavItems.ts
{
  label: 'AI Presets',
  to: '/workspace/$workspaceSlug/ai-presets',
  icon: Wand2, // or Sparkles, Brain, etc.
}
```

### Icon Options Considered
- `Wand2` (lucide) - Suggests AI/magic transformation
- `Sparkles` - Already used for Experiences
- `Brain` - Too technical
- **Decision**: Use `Wand2` to differentiate from Experiences

---

## 9. Editor Page Placeholder

### Decision
Create minimal placeholder route that redirects or shows "Coming in Phase 3"

### Rationale
- Spec requires navigation to editor page on create/click
- Full editor is Phase 3 scope
- Placeholder prevents 404 errors
- Enables testing of list page flows

### Implementation
```typescript
// $presetId.tsx - placeholder
export function AIPresetEditorPage() {
  return (
    <div>
      <h1>AI Preset Editor</h1>
      <p>Editor coming in Phase 3</p>
    </div>
  )
}
```

---

## 10. Duplicate Preset Logic

### Decision
Copy all fields except id, timestamps, append "Copy of " to name

### Rationale
- Matches PRD requirement "Copy of [original name]"
- Matches standard duplication UX patterns
- Fresh timestamps indicate it's a new document
- Preserves all configuration for iteration

### Implementation
```typescript
const duplicate = {
  ...original,
  id: newRef.id,
  name: `Copy of ${original.name}`,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
}
```

---

## Summary

All technical decisions align with existing codebase patterns:
- Schema in `packages/shared` (like Experience)
- Firestore subcollection under workspaces
- Real-time onSnapshot + TanStack Query (like ProjectEvents)
- Transaction-based mutations with serverTimestamp
- Mobile-first UI following ProjectEventsList pattern

No novel patterns or external dependencies required.

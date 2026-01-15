# Research: Experience Designer Draft & Publish Versioning

**Feature**: 030-exp-versioning
**Date**: 2026-01-15

## Research Tasks

### 1. Firestore Atomic Increment Pattern

**Task**: Research best practices for Firestore atomic increment operations in TypeScript

**Decision**: Use `increment(1)` from `firebase/firestore` within transactions

**Rationale**:
- Firestore's `increment()` is an atomic operation that prevents race conditions
- Already proven in the Event Designer codebase (`updateEventConfigField.ts`)
- Works correctly within `runTransaction()` for combined operations
- Handles concurrent edits automatically (each increment adds to current value)

**Alternatives Considered**:
- **Read-modify-write pattern**: Rejected because it creates race conditions in concurrent editing scenarios
- **Server-side Cloud Function**: Rejected because it adds latency and complexity; client-side transactions suffice

**Reference Implementation**:
```typescript
// From apps/clementine-app/src/domains/event/shared/lib/updateEventConfigField.ts
const updateData: UpdateData<ProjectEventFull> = {
  ...firestoreUpdates,
  draftVersion: increment(1),  // Atomic increment
  updatedAt: serverTimestamp(),
}
transaction.update(eventRef, updateData)
```

---

### 2. Version Field Schema Design

**Task**: Research best practices for version fields in Firestore documents

**Decision**: Use `z.number().default(1)` for `draftVersion` and `z.number().nullable().default(null)` for `publishedVersion`

**Rationale**:
- `draftVersion` starts at 1 (not 0) to match Event Designer and provide clear semantics
- `publishedVersion` is nullable to indicate "never published" state
- Default values ensure backward compatibility with existing documents
- Zod schema validates at runtime for type safety

**Alternatives Considered**:
- **Starting at 0**: Rejected because 0 is ambiguous (could mean "no version" or "first version")
- **Using timestamps instead of versions**: Rejected because comparing timestamps is less intuitive and doesn't indicate number of changes
- **Combined version object**: Rejected to keep schema flat and match Event Designer pattern

**Reference Implementation**:
```typescript
// From apps/clementine-app/src/domains/event/shared/schemas/project-event-full.schema.ts
draftVersion: z.number().default(1),
publishedVersion: z.number().nullable().default(null),
```

---

### 3. Dot-Notation Partial Updates

**Task**: Research Firestore dot-notation pattern for partial updates

**Decision**: Use dot-notation prefixes (e.g., `draft.steps`) for partial updates to avoid overwriting unrelated fields

**Rationale**:
- Firestore dot-notation allows updating nested fields without overwriting siblings
- Matches Event Designer's `updateEventConfigField` pattern
- Enables efficient partial updates (only changed fields transmitted)
- Works correctly with `increment()` in the same transaction

**Alternatives Considered**:
- **Full document replacement**: Rejected because it overwrites concurrent changes and is inefficient
- **Merge with `setDoc(..., { merge: true })**: Rejected because `update()` with dot-notation is more precise and explicit

**Reference Implementation**:
```typescript
// From apps/clementine-app/src/domains/event/shared/lib/updateEventConfigField.ts
const firestoreUpdates: Record<string, unknown> = {}
for (const [key, value] of Object.entries(updates)) {
  firestoreUpdates[`draftConfig.${key}`] = value  // Dot-notation prefix
}
```

---

### 4. EditorChangesBadge Integration

**Task**: Research existing EditorChangesBadge component interface

**Decision**: Pass actual `draftVersion` and `publishedVersion` values to replace current hard-coded placeholders

**Rationale**:
- Component already accepts `draftVersion: number | null` and `publishedVersion: number | null`
- Internal logic handles all states: never published, has changes, synced
- No changes needed to the shared component itself

**Current Implementation** (to be replaced):
```typescript
// apps/clementine-app/src/domains/experience/designer/containers/ExperienceDesignerLayout.tsx
<EditorChangesBadge
  draftVersion={experience.draft ? 1 : null}      // Hard-coded placeholder
  publishedVersion={experience.published ? 1 : null}  // Hard-coded placeholder
/>
```

**Target Implementation**:
```typescript
<EditorChangesBadge
  draftVersion={experience.draftVersion}
  publishedVersion={experience.publishedVersion}
/>
```

---

### 5. Backward Compatibility Strategy

**Task**: Research handling of existing experiences without version fields

**Decision**: Use Zod defaults to initialize versions on first access; no migration required

**Rationale**:
- Zod's `.default()` provides fallback values when fields are missing
- Existing experiences will get `draftVersion: 1` and `publishedVersion: null` on parse
- First edit will increment to version 2, first publish will set `publishedVersion`
- Zero downtime, no data migration scripts needed

**Alternatives Considered**:
- **Database migration script**: Rejected because it's error-prone and requires downtime
- **Lazy migration on read**: This is effectively what Zod defaults provide
- **Cloud Function trigger on document write**: Rejected for unnecessary complexity

---

### 6. Query Cache Invalidation

**Task**: Research TanStack Query cache invalidation pattern for experience mutations

**Decision**: Invalidate `experienceKeys.detail(workspaceId, experienceId)` on successful mutation

**Rationale**:
- Existing pattern in experience hooks triggers re-fetch after mutations
- Ensures UI reflects latest version numbers immediately
- No changes to invalidation strategy needed

**Reference Implementation**:
```typescript
// From apps/clementine-app/src/domains/experience/designer/hooks/useUpdateExperienceDraft.ts
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: experienceKeys.detail(workspaceId, experienceId),
  })
}
```

---

## Summary of Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Atomic increment | Use `increment(1)` in transactions | Prevents race conditions, proven pattern |
| Version field types | `number` (default 1) / `number \| null` | Clear semantics, backward compatible |
| Partial updates | Dot-notation with prefixes | Efficient, doesn't overwrite siblings |
| Badge integration | Use actual version values | Component already supports the interface |
| Backward compat | Zod defaults | Zero migration, seamless upgrade |
| Cache invalidation | Existing pattern | No changes needed |

## No Unresolved Questions

All technical decisions are clear based on the existing Event Designer reference implementation and codebase patterns.

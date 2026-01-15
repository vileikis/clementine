# Data Model: Fix Event Rename Dialog Stale Name

**Feature**: 026-event-rename
**Date**: 2026-01-15

## Overview

This bug fix does not require any data model changes. The existing `ProjectEvent` entity and schemas remain unchanged.

## Existing Entities (No Changes)

### ProjectEvent

**Location**: `apps/clementine-app/src/domains/project/events/schemas/project-event.schema.ts`

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| name | string (1-100 chars) | Event name - the field being edited in rename dialog |
| projectId | string | Parent project reference |
| updatedAt | Timestamp | Last modification timestamp |
| createdAt | Timestamp | Creation timestamp |
| deletedAt | Timestamp \| null | Soft delete timestamp |

### Firestore Path

```
/projects/{projectId}/events/{eventId}
```

## State Changes (Component Level)

The fix affects **component state only**, not persisted data:

### RenameProjectEventDialog State

| State | Type | Before Fix | After Fix |
|-------|------|------------|-----------|
| `name` | string | Initialized once with `useState(initialName)` | Synchronized with `initialName` prop via `useEffect` on dialog open |

**Data Flow Change**:

```
Before: Props → useState (once) → stale state
After:  Props → useState + useEffect (on open) → synchronized state
```

## Validation Rules (Unchanged)

From `updateProjectEventInputSchema`:
- `name`: Required, 1-100 characters, trimmed

## No API Contract Changes

The `useRenameProjectEvent` mutation interface remains unchanged:

```typescript
interface RenameProjectEventInput {
  eventId: string
  name: string
}
```

No new endpoints, no schema modifications, no database structure changes.

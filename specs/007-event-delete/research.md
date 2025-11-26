# Research: Delete Event (Soft Delete)

**Feature**: 007-event-delete
**Date**: 2025-11-26

## Research Tasks

### 1. Soft Delete Pattern (Companies Reference)

**Decision**: Follow exact pattern from `web/src/features/companies/` feature.

**Rationale**: The companies feature already implements soft delete with the same requirements:
- Status field with "active" | "deleted" values
- `deletedAt` timestamp field (nullable)
- Query filtering to exclude deleted records
- Server Action with admin authentication

**Pattern Details**:
```typescript
// Schema pattern from companies
export const companyStatusSchema = z.enum(["active", "deleted"]);

// Schema includes deletedAt
deletedAt: z.number().nullable(),

// Repository delete function
export async function deleteCompany(companyId: string): Promise<void> {
  const now = Date.now();
  await db.collection("companies").doc(companyId).update({
    status: "deleted",
    deletedAt: now,
    updatedAt: now,
  });
}

// List query filters by status
.where("status", "==", "active")
```

**Alternatives Considered**:
1. Hard delete - Rejected: Loses data, can't recover
2. Separate "trash" collection - Rejected: Over-engineering, adds complexity
3. Boolean `isDeleted` flag - Rejected: Status enum is more extensible and consistent with companies

### 2. Event Status Enum Extension

**Decision**: Add "deleted" to existing `eventStatusSchema` enum.

**Current Schema**:
```typescript
export const eventStatusSchema = z.enum(["draft", "live", "archived"]);
```

**Updated Schema**:
```typescript
export const eventStatusSchema = z.enum(["draft", "live", "archived", "deleted"]);
```

**Rationale**:
- Maintains consistency with existing status workflow
- "deleted" is a distinct terminal state (like "archived" but hidden)
- No breaking changes to existing status transitions

**Alternatives Considered**:
1. Separate boolean field - Rejected: Inconsistent with companies pattern
2. New status collection - Rejected: Over-engineering

### 3. AlertDialog Component (UI)

**Decision**: Use existing shadcn/ui `AlertDialog` component.

**Rationale**:
- Already installed at `web/src/components/ui/alert-dialog.tsx`
- Follows project's component library standards
- Provides accessible confirmation dialog out of the box
- Handles mobile viewport properly

**Usage Pattern**:
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
```

### 4. Toast Notifications

**Decision**: Use existing `sonner` toast system.

**Rationale**: Already configured in the project for user feedback.

**Usage Pattern**:
```typescript
import { toast } from "sonner";

// Success
toast.success("Event deleted");

// Error
toast.error("Failed to delete event");
```

### 5. EventCard Component Architecture

**Decision**: Convert EventCard to Client Component with delete functionality.

**Current State**: EventCard is a simple presentational component (Server Component).

**Updated Architecture**:
- Create new `DeleteEventButton` client component
- Keep EventCard mostly as-is, add delete button
- Separation allows the card to remain mostly server-rendered

**Rationale**:
- Minimal change to existing component
- Delete button needs client-side interactivity (dialog, toast)
- Follows composition pattern

### 6. List Query Filtering

**Decision**: Filter deleted events at the repository level.

**Current Query** (`listEvents`):
```typescript
let query = db.collection("events");
// ... filters applied
const snapshot = await query.orderBy("createdAt", "desc").get();
```

**Updated Query**:
```typescript
// Add where clause to base query
query = query.where("status", "!=", "deleted");
```

**Rationale**:
- Consistent with companies pattern
- Deleted events never appear in any list
- Single point of filtering (repository layer)

**Note**: Firestore `!=` queries require a composite index or using `in` with all non-deleted statuses. Will use `in` approach:
```typescript
query = query.where("status", "in", ["draft", "live", "archived"]);
```

## Summary of Decisions

| Topic | Decision | Pattern Source |
|-------|----------|----------------|
| Soft Delete Pattern | Status + deletedAt fields | Companies feature |
| Status Enum | Add "deleted" to existing enum | Consistency |
| UI Dialog | shadcn/ui AlertDialog | Existing component |
| Toast Feedback | sonner toast | Existing system |
| Component Architecture | Add DeleteEventButton client component | Composition pattern |
| Query Filtering | Filter at repository level with `in` clause | Companies pattern |

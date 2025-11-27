# Quickstart: Delete Event (Soft Delete)

**Feature**: 007-event-delete
**Date**: 2025-11-26

## Overview

This guide provides implementation steps for adding soft delete functionality to events.

## Prerequisites

- Familiarity with Next.js Server Actions
- Understanding of Zod validation
- Access to `web/src/features/events/` codebase

## Implementation Steps

### Step 1: Update Event Schema

**File**: `web/src/features/events/schemas/events.schemas.ts`

1. Add "deleted" to `eventStatusSchema`:
```typescript
export const eventStatusSchema = z.enum(["draft", "live", "archived", "deleted"]);
```

2. Add `deletedAt` field to `eventSchema`:
```typescript
deletedAt: z.number().nullable().optional().default(null),
```

### Step 2: Update Event Type (if separate)

**File**: `web/src/features/events/types/event.types.ts`

Add `deletedAt` to the Event interface (if not inferred from schema).

### Step 3: Add Repository Function

**File**: `web/src/features/events/repositories/events.ts`

```typescript
/**
 * Soft delete an event (mark as deleted)
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const eventRef = db.collection("events").doc(eventId);
  const eventSnap = await eventRef.get();

  if (!eventSnap.exists) {
    throw new Error("Event not found");
  }

  const now = Date.now();
  await eventRef.update({
    status: "deleted",
    deletedAt: now,
    updatedAt: now,
  });
}
```

### Step 4: Update listEvents Query

**File**: `web/src/features/events/repositories/events.ts`

Modify `listEvents` to filter out deleted events:

```typescript
// At the start of the query building
query = query.where("status", "in", ["draft", "live", "archived"]);
```

### Step 5: Add Server Action

**File**: `web/src/features/events/actions/events.ts`

```typescript
/**
 * Soft delete an event (mark as deleted, hide from UI)
 */
export async function deleteEventAction(eventId: string) {
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: auth.error
      }
    };
  }

  try {
    await deleteEvent(eventId);
    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Event not found") {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found"
        }
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to delete event"
      }
    };
  }
}
```

### Step 6: Export from Actions Index

**File**: `web/src/features/events/actions/index.ts`

Add export:
```typescript
export { deleteEventAction } from "./events";
```

### Step 7: Create Delete Button Component

**File**: `web/src/features/events/components/studio/DeleteEventButton.tsx`

```tsx
"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { deleteEventAction } from "../../actions";
import { toast } from "sonner";

interface DeleteEventButtonProps {
  eventId: string;
  eventName: string;
}

export function DeleteEventButton({ eventId, eventName }: DeleteEventButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteEventAction(eventId);
      if (result.success) {
        toast.success("Event deleted");
      } else {
        toast.error(result.error?.message || "Failed to delete event");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          onClick={(e) => e.preventDefault()}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete event</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Event</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{eventName}&quot;?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Step 8: Update EventCard Component

**File**: `web/src/features/events/components/studio/EventCard.tsx`

Add the delete button to the card:

```tsx
import { DeleteEventButton } from "./DeleteEventButton";

// In the component JSX, add delete button next to status badge:
<div className="flex items-start justify-between mb-3">
  <div className="flex-1 min-w-0">
    <h3 className="text-lg font-semibold">{event.name}</h3>
    {/* ... */}
  </div>
  <div className="flex items-center gap-2">
    <span className={`px-2 py-1 text-xs font-medium rounded-full border flex-shrink-0 ${statusStyles[event.status]}`}>
      {statusLabels[event.status]}
    </span>
    <DeleteEventButton eventId={event.id} eventName={event.name} />
  </div>
</div>
```

### Step 9: Run Validation Loop

```bash
pnpm lint
pnpm type-check
pnpm test
```

## Testing

### Manual Testing Checklist

1. [ ] Navigate to `/events` page
2. [ ] Click delete button on an event
3. [ ] Verify confirmation dialog shows event name
4. [ ] Click Cancel - verify no changes
5. [ ] Click Delete - verify event disappears and toast shows
6. [ ] Navigate to Event Studio - verify no delete button
7. [ ] Check Firestore - verify event has `status: "deleted"` and `deletedAt`

### Unit Tests

Add tests for:
- `deleteEvent` repository function
- `deleteEventAction` server action
- Query filtering excludes deleted events

## Troubleshooting

**Issue**: TypeScript error on status enum
**Solution**: Ensure `eventStatusSchema` includes "deleted" and run `pnpm type-check`

**Issue**: Deleted events still appear in list
**Solution**: Verify `listEvents` query includes status filter

**Issue**: Delete button not visible
**Solution**: Check `DeleteEventButton` is imported and rendered in `EventCard`

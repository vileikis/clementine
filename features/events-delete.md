# Feature: Delete Event (Soft Delete)

## Overview

Allow administrators to delete events from the event list with a soft delete pattern. Events marked as deleted are hidden from the UI but preserved in Firestore for data integrity and potential recovery.

## Requirements

### Functional Requirements

1. **Delete from Event List Only**
   - Delete action is available ONLY from the event list page (`/events`)
   - Delete action is NOT available from the Event Studio (`/events/[eventId]/(studio)/*`)
   - This prevents accidental deletion while actively editing an event

2. **Confirmation Dialog**
   - Before deletion, show a confirmation dialog to prevent accidental deletions
   - Dialog should clearly state the event name being deleted
   - Include a "Cancel" and "Delete" button
   - Delete button should be visually distinct (destructive styling)

3. **Soft Delete Implementation**
   - Do NOT physically remove the event document from Firestore
   - Mark the event as deleted by updating:
     - `status: "deleted"` (add "deleted" to `eventStatusSchema`)
     - `deletedAt: timestamp` (new field)
   - Deleted events are excluded from all list queries by default

### Non-Functional Requirements

- Admin authentication required (use existing `verifyAdminSecret`)
- Revalidate relevant paths after deletion
- Show toast notification on success/failure

## Technical Design

### Schema Changes

Update `eventStatusSchema` in `web/src/features/events/schemas/events.schemas.ts`:

```typescript
// Before
export const eventStatusSchema = z.enum(["draft", "live", "archived"]);

// After
export const eventStatusSchema = z.enum(["draft", "live", "archived", "deleted"]);
```

Add `deletedAt` field to `eventSchema`:

```typescript
deletedAt: z.number().nullable().optional().default(null),
```

### Repository Changes

Add `deleteEvent` function to `web/src/features/events/repositories/events.ts`:

```typescript
/**
 * Soft delete an event (mark as deleted)
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  const eventSnap = await getDoc(eventRef);

  if (!eventSnap.exists()) {
    throw new Error("Event not found");
  }

  await updateDoc(eventRef, {
    status: "deleted",
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  });
}
```

Update `listEvents` to exclude deleted events:

```typescript
// Add where clause to exclude deleted events
where("status", "!=", "deleted")
```

### Server Action

Add `deleteEventAction` to `web/src/features/events/actions/events.ts`:

```typescript
/**
 * Soft delete an event (mark as deleted, hide from UI)
 */
export async function deleteEventAction(eventId: string) {
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    await deleteEvent(eventId);
    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete event",
    };
  }
}
```

### UI Components

#### Delete Button (Event List Item)

Add delete button to each event row/card in the event list. The button should:
- Use `Trash2` icon from lucide-react
- Be positioned in the actions area of each event item
- Trigger the confirmation dialog on click

#### Confirmation Dialog

Create or use existing `AlertDialog` from shadcn/ui:

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="icon">
      <Trash2 className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Event</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete "{eventName}"?
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDelete}
        className="bg-destructive text-destructive-foreground"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## User Flow

1. Admin navigates to Event List (`/events`)
2. Admin clicks delete icon on an event row
3. Confirmation dialog appears with event name
4. Admin clicks "Delete" to confirm (or "Cancel" to abort)
5. Event is soft-deleted (status: "deleted", deletedAt: timestamp)
6. Event disappears from the list
7. Toast notification confirms deletion

## Out of Scope

- Hard delete (permanent removal from Firestore)
- Restore deleted events
- Viewing deleted events (admin recovery UI)
- Bulk delete operations
- Delete from Event Studio (explicitly excluded)

## Acceptance Criteria

- [ ] Delete button visible on event list items
- [ ] Confirmation dialog shows event name
- [ ] Clicking "Cancel" closes dialog without changes
- [ ] Clicking "Delete" updates event status to "deleted"
- [ ] Deleted events no longer appear in event list
- [ ] Success toast shown after deletion
- [ ] Error toast shown if deletion fails
- [ ] Delete action requires admin authentication
- [ ] No delete option available in Event Studio pages

## Related

- Pattern reference: `web/src/features/companies/` (soft delete implementation)
- Data model: `features/data-model-v4.md`
- Event schema: `web/src/features/events/schemas/events.schemas.ts`

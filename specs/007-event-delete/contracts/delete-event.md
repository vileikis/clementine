# Server Action Contract: deleteEventAction

**Feature**: 007-event-delete
**Date**: 2025-11-26

## Overview

Soft delete an event by marking it as deleted in Firestore.

## Function Signature

```typescript
export async function deleteEventAction(eventId: string): Promise<ActionResult>
```

## Input

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| `eventId` | string | Yes | Non-empty string |

### Input Validation Schema

```typescript
const deleteEventInput = z.object({
  eventId: z.string().min(1, "Event ID is required"),
});
```

## Output

### Success Response

```typescript
{
  success: true
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    code: string,
    message: string
  }
}
```

### Error Codes

| Code | HTTP Equivalent | Description |
|------|-----------------|-------------|
| `PERMISSION_DENIED` | 403 | Admin authentication failed |
| `EVENT_NOT_FOUND` | 404 | Event document does not exist |
| `VALIDATION_ERROR` | 400 | Invalid eventId format |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Behavior

1. **Authentication**: Verify admin secret via `verifyAdminSecret()`
2. **Validation**: Validate eventId is non-empty string
3. **Existence Check**: Verify event exists in Firestore
4. **Soft Delete**: Update event document:
   - Set `status` to `"deleted"`
   - Set `deletedAt` to current Unix timestamp (ms)
   - Set `updatedAt` to current Unix timestamp (ms)
5. **Cache Invalidation**: Call `revalidatePath("/events")`
6. **Return**: Success or error response

## Side Effects

- Modifies event document in Firestore
- Triggers Next.js path revalidation for `/events`

## Example Usage

```typescript
// In a Client Component
import { deleteEventAction } from "@/features/events/actions";
import { toast } from "sonner";

async function handleDelete(eventId: string) {
  const result = await deleteEventAction(eventId);

  if (result.success) {
    toast.success("Event deleted");
  } else {
    toast.error(result.error.message);
  }
}
```

## Implementation Reference

Follow pattern from `deleteCompanyAction` in `web/src/features/companies/actions/companies.actions.ts`.

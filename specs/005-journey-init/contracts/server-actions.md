# Server Actions Contract: Journey Init

**Feature**: 005-journey-init
**Date**: 2024-11-25

## Overview

This document defines the Server Action contracts for the Journey feature module. All actions follow the established `ActionResponse` pattern and require admin authentication.

## Types

### ActionResponse

```typescript
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```

### ErrorCodes

```typescript
export const ErrorCodes = {
  PERMISSION_DENIED: "PERMISSION_DENIED",
  EVENT_NOT_FOUND: "EVENT_NOT_FOUND",
  JOURNEY_NOT_FOUND: "JOURNEY_NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  EVENT_ARCHIVED: "EVENT_ARCHIVED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

---

## Actions

### createJourneyAction

Creates a new journey for an event.

**Signature**:
```typescript
export async function createJourneyAction(
  input: CreateJourneyInput
): Promise<ActionResponse<{ journeyId: string }>>
```

**Input**:
```typescript
interface CreateJourneyInput {
  eventId: string;  // Required, valid event ID
  name: string;     // Required, 1-200 characters, trimmed
}
```

**Success Response**:
```typescript
{
  success: true,
  data: { journeyId: "abc123" }
}
```

**Error Responses**:

| Code | Condition |
|------|-----------|
| `PERMISSION_DENIED` | Not authenticated as admin |
| `EVENT_NOT_FOUND` | Event does not exist |
| `EVENT_ARCHIVED` | Event status is "archived" |
| `VALIDATION_ERROR` | Invalid input (empty name, too long) |
| `INTERNAL_ERROR` | Database or unexpected error |

**Side Effects**:
- Creates journey document in Firestore
- Revalidates `/events/[eventId]/journeys` path

**Notes**:
- Does NOT set journey as active automatically
- stepOrder initialized as empty array
- status set to "active" (not deleted)

---

### listJourneysAction

Lists all non-deleted journeys for an event.

**Signature**:
```typescript
export async function listJourneysAction(
  eventId: string
): Promise<ActionResponse<Journey[]>>
```

**Input**:
- `eventId`: string - The event ID to list journeys for

**Success Response**:
```typescript
{
  success: true,
  data: [
    {
      id: "journey1",
      eventId: "event123",
      name: "Evening Flow",
      stepOrder: ["step1", "step2"],
      tags: [],
      status: "active",
      deletedAt: null,
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    },
    // ... more journeys, sorted by createdAt desc
  ]
}
```

**Error Responses**:

| Code | Condition |
|------|-----------|
| `INTERNAL_ERROR` | Database or unexpected error |

**Notes**:
- Returns empty array if no journeys exist (not an error)
- Filters out deleted journeys (status === "deleted")
- Sorted by createdAt descending (newest first)
- No authentication required (read-only)

---

### getJourneyAction

Retrieves a single journey by ID.

**Signature**:
```typescript
export async function getJourneyAction(
  journeyId: string
): Promise<ActionResponse<Journey>>
```

**Input**:
- `journeyId`: string - The journey ID to retrieve

**Success Response**:
```typescript
{
  success: true,
  data: {
    id: "journey1",
    eventId: "event123",
    name: "Evening Flow",
    stepOrder: [],
    tags: [],
    status: "active",
    deletedAt: null,
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  }
}
```

**Error Responses**:

| Code | Condition |
|------|-----------|
| `JOURNEY_NOT_FOUND` | Journey does not exist or is deleted |
| `INTERNAL_ERROR` | Database or unexpected error |

**Notes**:
- Returns error if journey status is "deleted"
- No authentication required (read-only)

---

### deleteJourneyAction

Soft deletes a journey.

**Signature**:
```typescript
export async function deleteJourneyAction(
  journeyId: string
): Promise<ActionResponse<void>>
```

**Input**:
- `journeyId`: string - The journey ID to delete

**Success Response**:
```typescript
{
  success: true,
  data: undefined
}
```

**Error Responses**:

| Code | Condition |
|------|-----------|
| `PERMISSION_DENIED` | Not authenticated as admin |
| `JOURNEY_NOT_FOUND` | Journey does not exist or already deleted |
| `INTERNAL_ERROR` | Database or unexpected error |

**Side Effects**:
- Sets journey status to "deleted"
- Sets deletedAt to current timestamp
- If journey was event's activeJourneyId, sets it to null
- Revalidates `/events/[eventId]/journeys` path

**Notes**:
- Does NOT physically delete the document (soft delete)
- Automatically clears switchboard if deleting active journey

---

### setActiveJourneyAction (Existing)

**Note**: Uses existing `updateEventSwitchboardAction` from events feature.

**Signature**:
```typescript
// From features/events/actions/events.ts
export async function updateEventSwitchboardAction(
  eventId: string,
  activeJourneyId: string | null
): Promise<ActionResponse<void>>
```

**Input**:
- `eventId`: string - The event ID
- `activeJourneyId`: string | null - Journey ID to activate, or null to deactivate

**Success Response**:
```typescript
{
  success: true,
  data: undefined
}
```

**Error Responses**:

| Code | Condition |
|------|-----------|
| `PERMISSION_DENIED` | Not authenticated as admin |
| `EVENT_NOT_FOUND` | Event does not exist |
| `VALIDATION_ERROR` | Invalid input |
| `INTERNAL_ERROR` | Database or unexpected error |

**Notes**:
- Setting to journey ID activates that journey
- Setting to null deactivates (no active journey)
- Only one journey can be active per event
- Does NOT validate that journey exists or belongs to event (trusts client)

---

## Usage Examples

### Create Journey

```typescript
import { createJourneyAction } from "@/features/journeys/actions/journeys";

const result = await createJourneyAction({
  eventId: "event123",
  name: "Evening Party Flow"
});

if (result.success) {
  // Redirect to journey detail
  redirect(`/events/event123/journeys/${result.data.journeyId}`);
} else {
  // Handle error
  toast.error(result.error.message);
}
```

### Toggle Active Journey

```typescript
import { updateEventSwitchboardAction } from "@/features/events/actions/events";

// Activate
const result = await updateEventSwitchboardAction(eventId, journeyId);

// Deactivate
const result = await updateEventSwitchboardAction(eventId, null);

if (result.success) {
  toast.success(activeJourneyId ? "Journey activated" : "Journey deactivated");
}
```

### Delete Journey

```typescript
import { deleteJourneyAction } from "@/features/journeys/actions/journeys";

const result = await deleteJourneyAction(journeyId);

if (result.success) {
  toast.success("Journey deleted");
  // List will automatically update (revalidated)
}
```

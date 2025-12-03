# Events API Contract

**Feature**: 017-nested-events
**Date**: 2025-12-03

## Overview

Server Actions for Event CRUD operations. All write operations use Firebase Admin SDK and require admin authentication.

---

## Server Actions

### createEventAction

Creates a new Event under a Project.

**Location**: `web/src/features/events/actions/events.actions.ts`

```typescript
async function createEventAction(
  input: { projectId: string; name: string }
): Promise<ActionResponse<{ eventId: string }>>
```

**Input Validation** (Zod):
```typescript
const createEventInput = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
});
```

**Behavior**:
1. Verify admin authentication
2. Validate input with Zod
3. Fetch parent Project (verify exists, get companyId)
4. Create Event document with default theme
5. Revalidate paths
6. Return eventId

**Response Codes**:
| Code | Condition |
|------|-----------|
| `success: true` | Event created successfully |
| `PERMISSION_DENIED` | Not authenticated as admin |
| `VALIDATION_ERROR` | Input validation failed |
| `PROJECT_NOT_FOUND` | Parent project doesn't exist |
| `INTERNAL_ERROR` | Firestore or unexpected error |

---

### getEventAction

Retrieves a single Event by ID.

```typescript
async function getEventAction(
  projectId: string,
  eventId: string
): Promise<ActionResponse<{ event: Event }>>
```

**Response Codes**:
| Code | Condition |
|------|-----------|
| `success: true` | Event retrieved |
| `EVENT_NOT_FOUND` | Event doesn't exist or is deleted |
| `INTERNAL_ERROR` | Firestore error |

---

### listEventsAction

Lists all non-deleted Events for a Project.

```typescript
async function listEventsAction(
  projectId: string
): Promise<ActionResponse<{ events: Event[] }>>
```

**Behavior**:
- Returns events sorted by `createdAt` DESC (newest first)
- Excludes soft-deleted events (`deletedAt != null`)

**Response Codes**:
| Code | Condition |
|------|-----------|
| `success: true` | Events list returned (may be empty) |
| `INTERNAL_ERROR` | Firestore error |

---

### updateEventAction

Updates Event details (name, scheduling).

```typescript
async function updateEventAction(
  projectId: string,
  eventId: string,
  data: {
    name?: string;
    publishStartAt?: number | null;
    publishEndAt?: number | null;
  }
): Promise<ActionResponse<void>>
```

**Input Validation** (Zod):
```typescript
const updateEventInput = z.object({
  name: z.string().min(1).max(200).optional(),
  publishStartAt: z.number().nullable().optional(),
  publishEndAt: z.number().nullable().optional(),
});
```

**Response Codes**:
| Code | Condition |
|------|-----------|
| `success: true` | Event updated |
| `PERMISSION_DENIED` | Not authenticated |
| `VALIDATION_ERROR` | Input validation failed |
| `EVENT_NOT_FOUND` | Event doesn't exist |
| `INTERNAL_ERROR` | Firestore error |

---

### updateEventThemeAction

Updates Event theme configuration (partial updates supported).

```typescript
async function updateEventThemeAction(
  projectId: string,
  eventId: string,
  data: {
    logoUrl?: string | null;
    fontFamily?: string | null;
    primaryColor?: string;
    text?: {
      color?: string;
      alignment?: "left" | "center" | "right";
    };
    button?: {
      backgroundColor?: string | null;
      textColor?: string;
      radius?: "none" | "sm" | "md" | "full";
    };
    background?: {
      color?: string;
      image?: string | null;
      overlayOpacity?: number;
    };
  }
): Promise<ActionResponse<void>>
```

**Input Validation** (Zod):
```typescript
const updateEventThemeInput = z.object({
  logoUrl: z.string().url().nullable().optional(),
  fontFamily: z.string().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  text: z.object({
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    alignment: z.enum(["left", "center", "right"]).optional(),
  }).optional(),
  button: z.object({
    backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
    textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    radius: z.enum(["none", "sm", "md", "full"]).optional(),
  }).optional(),
  background: z.object({
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    image: z.string().url().nullable().optional(),
    overlayOpacity: z.number().min(0).max(1).optional(),
  }).optional(),
});
```

**Behavior**:
- Uses Firestore dot notation for partial nested updates
- Only updates provided fields
- Sets `updatedAt` timestamp

**Response Codes**:
| Code | Condition |
|------|-----------|
| `success: true` | Theme updated |
| `PERMISSION_DENIED` | Not authenticated |
| `VALIDATION_ERROR` | Invalid theme values |
| `EVENT_NOT_FOUND` | Event doesn't exist |
| `INTERNAL_ERROR` | Firestore error |

---

### deleteEventAction

Soft-deletes an Event.

```typescript
async function deleteEventAction(
  projectId: string,
  eventId: string
): Promise<ActionResponse<void>>
```

**Behavior**:
1. Verify admin authentication
2. Check if Event exists
3. If Event is active (`project.activeEventId === eventId`), clear `project.activeEventId`
4. Set `deletedAt = Date.now()` on Event
5. Revalidate paths

**Response Codes**:
| Code | Condition |
|------|-----------|
| `success: true` | Event soft-deleted |
| `PERMISSION_DENIED` | Not authenticated |
| `EVENT_NOT_FOUND` | Event doesn't exist |
| `INTERNAL_ERROR` | Firestore error |

---

### setActiveEventAction

Sets an Event as the active event for its parent Project.

```typescript
async function setActiveEventAction(
  projectId: string,
  eventId: string
): Promise<ActionResponse<void>>
```

**Behavior**:
1. Verify admin authentication
2. Verify Event exists and belongs to Project
3. Update `project.activeEventId = eventId`
4. Revalidate paths

**Response Codes**:
| Code | Condition |
|------|-----------|
| `success: true` | Event set as active |
| `PERMISSION_DENIED` | Not authenticated |
| `EVENT_NOT_FOUND` | Event doesn't exist |
| `PROJECT_NOT_FOUND` | Project doesn't exist |
| `INTERNAL_ERROR` | Firestore error |

---

## Repository Functions

Lower-level Firestore operations used by Server Actions.

**Location**: `web/src/features/events/repositories/events.repository.ts`

```typescript
// Create event document
async function createEvent(
  projectId: string,
  data: Omit<Event, "id" | "createdAt" | "updatedAt">
): Promise<string>

// Get single event
async function getEvent(
  projectId: string,
  eventId: string
): Promise<Event | null>

// List events for project (excluding deleted)
async function listEvents(
  projectId: string,
  options?: { includeDeleted?: boolean }
): Promise<Event[]>

// Update event fields
async function updateEvent(
  projectId: string,
  eventId: string,
  data: Partial<Event>
): Promise<void>

// Soft delete event
async function softDeleteEvent(
  projectId: string,
  eventId: string
): Promise<void>
```

---

## Client Hooks

Real-time subscriptions for UI components.

**Location**: `web/src/features/events/hooks/`

### useEvent

```typescript
function useEvent(projectId: string, eventId: string): {
  event: Event | null;
  isLoading: boolean;
  error: Error | null;
}
```

### useEvents

```typescript
function useEvents(projectId: string): {
  events: Event[];
  isLoading: boolean;
  error: Error | null;
}
```

**Implementation**: Uses `onSnapshot` subscription to Firestore subcollection with soft-delete filtering.

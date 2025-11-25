# Journey Init Feature - Product Requirements Document

## Overview

This PRD defines the initial implementation of the Journey feature module for Clementine. A Journey is a lightweight playlist that defines a linear sequence of steps (screens) for the guest experience. This phase focuses on basic CRUD operations and list management without the Journey editor.

## Data Model Reference

From `features/data-model-v4.md`:

```typescript
interface Journey {
  id: string;
  eventId: string;
  name: string; // e.g., "Evening Party Flow"

  // The ordered sequence of Step IDs to execute.
  // The client fetches this array, then queries the 'steps' collection.
  stepOrder: string[]; // e.g., ["step_welcome_1", "step_select_2", "step_capture_3"]

  // Metadata for analytics or filtering in the host dashboard
  tags?: string[]; // ["photobooth", "ai", "survey"]

  createdAt: number;
}
```

**Additional fields for soft deletion (not in v4 spec, but following companies pattern):**

```typescript
interface Journey {
  // ... base fields from data-model-v4
  status: "active" | "deleted";
  deletedAt: number | null;
  updatedAt: number;
}
```

**Firestore Collection:** `/journeys/{journeyId}`

## Scope

### In Scope

1. **Journey List View** - Display all journeys for an event
2. **Create Journey** - Create new journey with default empty step order
3. **Delete Journey** (soft delete) - Mark journey as deleted
4. **Set Active Journey** - Toggle which journey is active via the Event's switchboard
5. **Navigation** - Tap journey to open its detail route (WIP placeholder)

### Out of Scope

- Journey Editor (step management, ordering, etc.)
- Steps collection and Step CRUD operations
- Journey duplication/cloning
- Journey analytics/tags management
- Bulk operations

## Feature Requirements

### FR-1: Journey List View

**Route:** `/events/[eventId]/journeys`

**Empty State:**
- Display message: "No journeys yet"
- Show CTA button: "Create Journey"
- CTA triggers Create Journey flow

**List State:**
- Display journeys as cards/rows with:
  - Journey name
  - Active status indicator (switch/toggle)
  - Number of steps (from `stepOrder.length`)
  - Created date
- Sort by `createdAt` descending (newest first)
- Filter out journeys where `status === "deleted"`

**Active Journey Indicator:**
- Show which journey is currently active on the Event
- Use a switch/toggle control for clear visual feedback
- Only ONE journey can be active at a time per event
- Display "Active" badge or similar on the currently active journey

### FR-2: Create Journey

**Trigger:** "Create Journey" button in list view

**Behavior:**
1. Open a modal/dialog with a name input field
2. Name field with placeholder: "e.g., Evening Party Flow"
3. Validate name (required, max 200 chars)
4. On submit:
   - Create journey with empty `stepOrder: []`
   - Set `status: "active"` (not deleted)
   - **DO NOT** automatically set as Event's `activeJourneyId`
   - Redirect to `/events/[eventId]/journeys/[journeyId]`

**Default Values:**
```typescript
{
  name: <user input>,
  eventId: <from route params>,
  stepOrder: [],
  tags: [],
  status: "active",
  deletedAt: null,
  createdAt: Date.now(),
  updatedAt: Date.now()
}
```

### FR-3: Delete Journey

**Trigger:** Delete action (icon button or menu item) on journey card

**Behavior:**
1. Show confirmation dialog: "Are you sure you want to delete this journey?"
2. On confirm:
   - Set `status: "deleted"` and `deletedAt: Date.now()`
   - If this journey was the Event's `activeJourneyId`, set `activeJourneyId: null`
   - Refresh list (journey will be filtered out)
3. Stay on list view after deletion

**Soft Delete Pattern:**
```typescript
// Journey document update
{
  status: "deleted",
  deletedAt: Date.now(),
  updatedAt: Date.now()
}

// Event document update (if was active)
{
  activeJourneyId: null,
  updatedAt: Date.now()
}
```

### FR-4: Set Active Journey (Switchboard)

**Trigger:** Toggle switch on journey row/card

**Behavior:**
1. Toggle ON:
   - Update Event's `activeJourneyId` to this journey's ID
   - Previous active journey (if any) automatically becomes inactive
   - Show success toast: "Journey activated"
2. Toggle OFF:
   - Update Event's `activeJourneyId` to `null`
   - Show success toast: "Journey deactivated"

**Visual State:**
- Active journey: Switch ON, "Active" badge visible
- Inactive journeys: Switch OFF
- At most ONE journey can be active per event

**Implementation Note:**
Uses existing `updateEventSwitchboardAction` from `features/events/actions/events.ts`.

### FR-5: Journey Detail Route (WIP)

**Route:** `/events/[eventId]/journeys/[journeyId]`

**Behavior:**
- Display journey name in header
- Show "Work in Progress" message in body
- Back navigation to journey list

## Server Actions

### `createJourneyAction`

```typescript
async function createJourneyAction(input: {
  eventId: string;
  name: string;
}): Promise<ActionResponse<{ journeyId: string }>>
```

**Validations:**
- Event exists and is not archived
- Name is 1-200 characters
- Admin authentication required

**Returns:** `{ journeyId: string }` on success

### `listJourneysAction`

```typescript
async function listJourneysAction(
  eventId: string
): Promise<ActionResponse<Journey[]>>
```

**Behavior:**
- Returns all journeys for event where `status === "active"`
- Ordered by `createdAt` descending

### `getJourneyAction`

```typescript
async function getJourneyAction(
  journeyId: string
): Promise<ActionResponse<Journey>>
```

**Validations:**
- Journey exists
- Journey is not deleted

### `deleteJourneyAction`

```typescript
async function deleteJourneyAction(
  journeyId: string
): Promise<ActionResponse<void>>
```

**Validations:**
- Journey exists
- Admin authentication required

**Side Effects:**
- If journey was Event's `activeJourneyId`, clears it to `null`
- Revalidates event and journey list paths

### `setActiveJourneyAction`

Uses existing `updateEventSwitchboardAction` from events feature.

## Module Structure

Following existing patterns from `companies` and `events` features:

```
web/src/features/journeys/
├── actions/
│   ├── index.ts              # Type exports only (no Server Actions)
│   ├── journeys.ts           # Server Actions
│   └── types.ts              # ActionResponse types
├── components/
│   ├── index.ts              # Component barrel export
│   ├── JourneyCard.tsx       # Individual journey display
│   ├── JourneyList.tsx       # List with empty state
│   ├── CreateJourneyDialog.tsx
│   └── DeleteJourneyDialog.tsx
├── repositories/
│   ├── index.ts
│   └── journeys.repository.ts
├── schemas/
│   ├── index.ts
│   └── journeys.schemas.ts   # Zod schemas
├── types/
│   ├── index.ts
│   └── journeys.types.ts
├── constants.ts
└── index.ts                  # Main barrel export
```

## Routes

```
app/events/[eventId]/journeys/
├── page.tsx                  # Journey list view (FR-1)
└── [journeyId]/
    └── page.tsx              # Journey detail WIP (FR-5)
```

## UI Components

### JourneyCard

Props:
- `journey: Journey`
- `isActive: boolean` (from Event.activeJourneyId)
- `onToggleActive: (active: boolean) => void`
- `onDelete: () => void`
- `onClick: () => void`

Display:
- Journey name (clickable for navigation)
- Step count badge
- Active toggle switch
- Delete icon button (with confirmation)
- Created date (relative format: "2 days ago")

### JourneyList

Props:
- `journeys: Journey[]`
- `activeJourneyId: string | null` (from Event)
- `eventId: string`

Handles:
- Empty state with CTA
- Mapping journeys to JourneyCard components
- Optimistic updates for toggle actions

### CreateJourneyDialog

Props:
- `eventId: string`
- `open: boolean`
- `onOpenChange: (open: boolean) => void`

Form:
- Name input (required, max 200 chars)
- Cancel and Create buttons
- Loading state during submission
- Redirects on success

### DeleteJourneyDialog

Props:
- `journey: Journey`
- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `onConfirm: () => void`

Display:
- Warning message with journey name
- Cancel and Delete buttons
- Loading state during deletion

## Acceptance Criteria

### AC-1: Empty State
- [ ] When event has no journeys, show empty state message
- [ ] Empty state includes "Create Journey" CTA button
- [ ] CTA opens create journey dialog

### AC-2: Create Journey
- [ ] Dialog opens with name input field
- [ ] Name validation shows errors for empty/too long
- [ ] Journey created with empty stepOrder
- [ ] Journey NOT set as active automatically
- [ ] Redirects to journey detail route after creation
- [ ] List updates to show new journey

### AC-3: Journey List
- [ ] Shows all non-deleted journeys for event
- [ ] Newest journeys appear first
- [ ] Each card shows name, step count, active status
- [ ] Deleted journeys are not displayed

### AC-4: Active Journey Toggle
- [ ] Toggle ON sets Event.activeJourneyId to journey ID
- [ ] Toggle OFF sets Event.activeJourneyId to null
- [ ] Only one journey shows as active at a time
- [ ] Active state persists on page refresh
- [ ] Shows success toast on toggle

### AC-5: Delete Journey
- [ ] Confirmation dialog appears before deletion
- [ ] Soft deletes (status = "deleted")
- [ ] Journey removed from list after deletion
- [ ] If deleted journey was active, Event.activeJourneyId set to null
- [ ] Cannot delete already deleted journeys

### AC-6: Navigation
- [ ] Clicking journey card navigates to detail route
- [ ] Detail route shows journey name and WIP message
- [ ] Back navigation returns to journey list

## Error Handling

| Error Code | Message | Cause |
|------------|---------|-------|
| `EVENT_NOT_FOUND` | "Event not found" | Invalid eventId |
| `JOURNEY_NOT_FOUND` | "Journey not found" | Invalid journeyId or deleted |
| `VALIDATION_ERROR` | Field-specific message | Invalid input data |
| `PERMISSION_DENIED` | "Authentication required" | Not authenticated |
| `INTERNAL_ERROR` | "An error occurred" | Unexpected server error |

## Dependencies

- `features/events` - For `updateEventSwitchboardAction` and Event type
- `@/lib/firebase/admin` - Firestore operations
- `@/lib/auth` - `verifyAdminSecret` for authentication
- `shadcn/ui` components: Dialog, Button, Input, Switch, Card

## Future Considerations

Items explicitly deferred to future phases:

1. **Journey Editor** - Managing steps within a journey
2. **Steps Collection** - Step CRUD operations
3. **Journey Duplication** - Clone existing journey
4. **Tags Management** - Add/edit/filter by tags
5. **Journey Scheduling** - Time-based activation
6. **Journey Analytics** - Usage tracking and metrics

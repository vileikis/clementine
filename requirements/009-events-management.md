---
# PRD: Project Details – Events Management

## Goal

Enable workspace admins to manage events within a project, including creation, renaming, deletion (soft), and controlling which single event is active.
---

## Scope

This PRD covers:

- Viewing events belonging to a project
- Creating an event
- Renaming an event
- Deleting an event (soft delete)
- Managing a single active event per project

Out of scope:

- Guest access
- Event configuration beyond name
- Event analytics
- Sharing, QR codes, publishing logic

---

## Users

- **Workspace Admin** (authenticated and authorized for the project’s workspace)

---

## Route

- **Project Details:**
  `/workspace/[workspaceSlug]/projects/[projectId]`

---

## Preconditions

- Project must exist
- Project must not be deleted
  If not met → return **404 Not Found**

---

## Data Model

### Event Schema (Simple Model)

```tsx
export type EventStatus = "draft" | "deleted";

export type Event = {
  id: string;
  projectId: string;

  name: string;
  status: EventStatus; // default: "draft"

  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};
```

**Clarifications**

- `status === "deleted"` defines deletion behavior.
- Deleted events are excluded from all lists and cannot be accessed or activated.
- Event activation is **not** stored on the event itself.

---

## Functional Requirements

### 1. Events List

**Visibility**

- Display all events belonging to the current project **except events with `status === "deleted"`**.

**Layout**

- Events are displayed in a list.
- Each event item includes:
  - Event name
  - Active / inactive indicator
  - Activation switch control
  - Context menu (for rename and delete actions)

**Empty State**

- If the project has no events:
  - Show an empty state prompting the admin to create an event.

**Navigation**

- Selecting an event item navigates the admin to that event’s details page.

---

### 2. Create Event

**Trigger**

- A “Create event” action is available on the Project Details page.

**Behavior**

- On action:
  - A new event is created and associated with the current project.
  - Event has a default name (e.g. “Untitled event”).
- On successful creation:
  - Redirect the admin to the new event’s page.

**Activation**

- Newly created events are **not active by default**.

---

### 3. Rename Event

**Access**

- Rename action is available from the **event item context menu**.

**Behavior**

- Admin can update the event name.
- Changes are saved immediately.
- Updated name is reflected in the events list and event page.

---

### 4. Delete Event (Soft Delete)

**Access**

- Delete action is available from the **event item context menu**.

**Confirmation**

- Admin must confirm deletion before proceeding.

**Behavior**

- On confirmation:
  - Event is marked as deleted (`status = "deleted"`).
- Deleted events:
  - Are removed from the events list
  - Are not accessible via direct URL
  - Cannot be renamed or activated

**Active Event Rule**

- If the deleted event was the active event:
  - The project must have **no active event** afterward.

---

### 5. Active Event Management

**Single Active Event Constraint**

- A project can have **at most one active event**.
- A project may also have **no active event**.

**Activation**

- Each event item includes an **activation switch control**.
- When an inactive event is activated:
  - Any previously active event is automatically deactivated.
  - The project reflects the newly active event.

**Deactivation**

- Admin can deactivate the currently active event via the same switch.
- After deactivation:
  - The project has no active event.

**Rules**

- Deleted events cannot be activated.
- Activation and deactivation are always explicit admin actions.

---

## Non-Goals

- Multiple active events
- Event duplication
- Undo delete UI
- Guest-facing behavior

---

## Edge Cases & Explicit Rules

- Deleted events are never visible or accessible.
- Deleted events cannot be renamed or activated.
- If a project has no events, it must also have no active event.
- Activation state is owned by the project, not the event.

---

## Acceptance Criteria (High-Level)

- Admin can create, rename, and soft-delete events.
- Admin can activate exactly one event or none.
- Activation is controlled via a switch on the event item.
- Rename and delete actions are accessible via the event’s context menu.
- Deleted events disappear and are fully inaccessible.

---

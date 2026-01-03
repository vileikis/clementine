# Feature Specification: Events Management

**Feature Branch**: `009-events-management`
**Created**: 2026-01-01
**Status**: Draft
**Input**: User description: "Enable workspace admins to manage events within a project, including creation, renaming, deletion (soft), and controlling which single event is active."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create First Event (Priority: P1)

As a workspace admin, I want to create a new event for my project so that I can start setting up a photo booth experience for my event.

**Why this priority**: This is the entry point for the entire events system. Without the ability to create events, no other functionality can be used. It represents the minimum viable functionality.

**Independent Test**: Can be fully tested by navigating to a project details page and creating a new event. Delivers immediate value by allowing admins to initialize their event setup.

**Acceptance Scenarios**:

1. **Given** I am viewing a project with no events, **When** I click "Create event", **Then** a new event is created with default name "Untitled event" and I am redirected to the event's detail page
2. **Given** I am viewing a project with existing events, **When** I click "Create event", **Then** a new event is created and appears in the events list
3. **Given** I create a new event, **When** the event is created, **Then** it is not active by default and the project has no active event (or keeps its current active event)

---

### User Story 2 - Activate Single Event (Priority: P2)

As a workspace admin, I want to activate exactly one event at a time so that guests know which experience is currently live for my project.

**Why this priority**: Event activation is the core mechanism for controlling which experience is live. This builds on P1 by adding the ability to make events functional.

**Independent Test**: Can be tested by creating multiple events and toggling the activation switch. Delivers value by allowing admins to control which event is live.

**Acceptance Scenarios**:

1. **Given** I have multiple inactive events, **When** I activate one event using the switch control, **Then** that event becomes active and all others remain inactive
2. **Given** I have an active event and other inactive events, **When** I activate a different event, **Then** the previously active event is automatically deactivated and the new event becomes active
3. **Given** I have an active event, **When** I deactivate it using the switch control, **Then** the project has no active event
4. **Given** I have a deleted event, **When** I view the events list, **Then** the deleted event cannot be activated (its switch is not accessible)

---

### User Story 3 - Rename Event (Priority: P3)

As a workspace admin, I want to rename my events so that they have meaningful names that reflect the actual event (e.g., "Summer Festival 2026", "Product Launch Party").

**Why this priority**: This is a quality-of-life improvement that makes event management clearer but is not blocking for basic functionality.

**Independent Test**: Can be tested by creating an event and using the context menu to rename it. Delivers value by improving organization and clarity.

**Acceptance Scenarios**:

1. **Given** I have an event in my project, **When** I select "Rename" from the event's context menu and enter a new name, **Then** the event name is updated immediately in the events list
2. **Given** I rename an event, **When** I navigate to the event's detail page, **Then** the updated name is displayed
3. **Given** I have an event open in another tab, **When** I rename it in the project view, **Then** the name updates in the event detail page

---

### User Story 4 - Delete Event (Priority: P3)

As a workspace admin, I want to delete events I no longer need so that my events list stays clean and organized.

**Why this priority**: Cleanup functionality that becomes important as admins create multiple events but is not essential for initial use.

**Independent Test**: Can be tested by creating events and deleting them via the context menu. Delivers value by maintaining a clean workspace.

**Acceptance Scenarios**:

1. **Given** I have an event in my project, **When** I select "Delete" from the event's context menu and confirm the deletion, **Then** the event is soft-deleted and removed from the events list
2. **Given** I delete the currently active event, **When** the deletion is confirmed, **Then** the project has no active event afterward
3. **Given** I have deleted an event, **When** I try to access it via direct URL, **Then** I receive a 404 Not Found error
4. **Given** I have deleted an event, **When** I view the events list, **Then** the deleted event does not appear
5. **Given** I am about to delete an event, **When** I see the confirmation dialog, **Then** I can cancel the deletion and the event remains unchanged

---

### User Story 5 - View Events List (Priority: P1)

As a workspace admin, I want to view all my project's events in one place so that I can manage and navigate between them easily.

**Why this priority**: This is foundational - admins need to see what events exist before they can manage them. Tied with P1 as it's the primary interface.

**Independent Test**: Can be tested by creating multiple events and viewing the project details page. Delivers value by providing visibility into all events.

**Acceptance Scenarios**:

1. **Given** I am viewing a project with multiple events, **When** the page loads, **Then** I see a list of all non-deleted events
2. **Given** I have events in my project, **When** I view the events list, **Then** each event shows its name, active/inactive status, activation switch, and context menu
3. **Given** I am viewing a project with no events, **When** the page loads, **Then** I see an empty state prompting me to create an event
4. **Given** I am viewing the events list, **When** I click on an event item, **Then** I am navigated to that event's detail page
5. **Given** I have both active and inactive events, **When** I view the events list, **Then** I can clearly distinguish which event is active

---

### Edge Cases

- **What happens when a project has no events?**
  Show an empty state with a clear call-to-action to create the first event.

- **What happens when I try to access a deleted event directly via URL?**
  Return 404 Not Found, treating it as if the event never existed.

- **What happens when I delete the only event in a project?**
  The project has no events and no active event; show the empty state.

- **What happens when I activate an event while another is active?**
  The previously active event is automatically deactivated, and only the new event becomes active.

- **What happens when I try to activate a deleted event?**
  Deleted events cannot be activated (they don't appear in the list or have accessible controls).

- **What happens when I create multiple events rapidly?**
  Each event is created with a unique ID and appears in the list independently.

- **What happens when two admins try to activate different events simultaneously?**
  The last activation wins; only one event can be active at any time (handled by the backend atomically).

- **What happens when I rename an event to an empty string?**
  The system should prevent empty names or revert to a default name like "Untitled event".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all events belonging to a project except those with status "deleted"
- **FR-002**: System MUST allow workspace admins to create new events within a project
- **FR-003**: System MUST assign newly created events a default name of "Untitled event"
- **FR-004**: System MUST redirect admins to the new event's detail page immediately after creation
- **FR-005**: System MUST ensure newly created events are not active by default
- **FR-006**: System MUST allow workspace admins to rename events through a context menu action
- **FR-007**: System MUST save event name changes immediately upon submission
- **FR-008**: System MUST reflect renamed events in both the events list and event detail pages
- **FR-009**: System MUST allow workspace admins to delete events through a context menu action
- **FR-010**: System MUST require confirmation before deleting an event
- **FR-011**: System MUST soft-delete events by setting status to "deleted" (not permanent deletion)
- **FR-012**: System MUST remove deleted events from all lists and prevent access via direct URLs
- **FR-013**: System MUST ensure deleted events cannot be renamed or activated
- **FR-014**: System MUST enforce that a project can have at most one active event at any time
- **FR-015**: System MUST allow a project to have zero active events
- **FR-016**: System MUST provide an activation switch control on each event item in the list
- **FR-017**: System MUST automatically deactivate any previously active event when a new event is activated
- **FR-018**: System MUST allow admins to deactivate the currently active event via the switch control
- **FR-019**: System MUST display each event's active/inactive status clearly in the events list
- **FR-020**: System MUST show an empty state when a project has no non-deleted events
- **FR-021**: System MUST navigate admins to an event's detail page when clicking on an event item
- **FR-022**: System MUST return 404 Not Found when accessing a project that doesn't exist or is deleted
- **FR-023**: System MUST ensure activation state is owned by the project, not stored on individual events
- **FR-024**: System MUST prevent activation of deleted events

### Key Entities

- **Event**: Represents an AI-powered photo booth experience within a project. Key attributes include unique identifier, associated project, event name, status (draft or deleted), and timestamps for creation, updates, and deletion.

- **Project**: A container for events that represents a brand's or organization's photo booth campaign. Maintains a reference to which single event (if any) is currently active.

- **Workspace Admin**: An authenticated user with authorization to manage events within projects belonging to their workspace.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Workspace admins can create a new event and reach its detail page in under 10 seconds
- **SC-002**: Workspace admins can activate or deactivate events in under 5 seconds with a single click
- **SC-003**: Event name changes are reflected across all views within 2 seconds
- **SC-004**: Deleted events are removed from all lists and become inaccessible within 2 seconds
- **SC-005**: The system prevents multiple active events 100% of the time, even with concurrent activation requests
- **SC-006**: 95% of workspace admins successfully complete their first event creation without errors
- **SC-007**: The events list loads and displays all events within 3 seconds for projects with up to 100 events
- **SC-008**: Event operations (create, rename, delete, activate/deactivate) complete successfully 99.9% of the time
- **SC-009**: Empty states clearly guide admins to create their first event, resulting in 90% of admins successfully creating an event when prompted

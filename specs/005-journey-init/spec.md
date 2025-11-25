# Feature Specification: Journey Init

**Feature Branch**: `005-journey-init`
**Created**: 2024-11-25
**Status**: Draft
**Input**: User description: "Create Journey feature module with CRUD operations, list view, active journey toggle, and soft delete"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Journey List (Priority: P1)

As an event creator, I want to see all journeys associated with my event so I can understand what guest experiences are available and which one is currently active.

**Why this priority**: The list view is the foundation for all journey management. Without seeing existing journeys, users cannot create, activate, or manage them. This is the entry point to the feature.

**Independent Test**: Can be fully tested by navigating to an event's journeys page and verifying the list displays correctly (or shows empty state). Delivers immediate visibility into journey configuration.

**Acceptance Scenarios**:

1. **Given** an event with no journeys, **When** I navigate to the journeys list, **Then** I see an empty state message "No journeys yet" with a "Create Journey" button
2. **Given** an event with multiple journeys, **When** I navigate to the journeys list, **Then** I see all non-deleted journeys sorted by newest first
3. **Given** an event with one active journey, **When** I view the journeys list, **Then** the active journey shows a visible "Active" indicator
4. **Given** a journey with steps configured, **When** I view the journey in the list, **Then** I see the count of steps displayed on the card

---

### User Story 2 - Create Journey (Priority: P1)

As an event creator, I want to create a new journey so I can start building a guest experience flow for my event.

**Why this priority**: Creation is the primary action users need to start using the journeys feature. Without ability to create, the feature has no value.

**Independent Test**: Can be fully tested by clicking "Create Journey", entering a name, and verifying a new journey appears in the list and user is redirected to the detail view.

**Acceptance Scenarios**:

1. **Given** I am on the journeys list, **When** I click "Create Journey", **Then** a dialog opens with a name input field
2. **Given** the create dialog is open, **When** I enter a valid name and submit, **Then** a new journey is created and I am redirected to its detail page
3. **Given** the create dialog is open, **When** I submit with an empty name, **Then** I see a validation error "Journey name is required"
4. **Given** the create dialog is open, **When** I submit with a name over 200 characters, **Then** I see a validation error "Journey name too long"
5. **Given** I create a new journey, **When** creation succeeds, **Then** the journey is NOT automatically set as the event's active journey

---

### User Story 3 - Set Active Journey (Priority: P2)

As an event creator, I want to toggle which journey is active for my event so I can control what experience guests see when they join.

**Why this priority**: Activating a journey is the core value proposition - controlling the live guest experience. Ranked P2 because it requires journeys to exist first (P1).

**Independent Test**: Can be fully tested by toggling a journey's active switch and verifying the event's active journey changes accordingly. Guest-facing impact is immediately measurable.

**Acceptance Scenarios**:

1. **Given** a journey is inactive, **When** I toggle its active switch ON, **Then** the event's active journey is set to this journey
2. **Given** a journey is active, **When** I toggle its active switch OFF, **Then** the event's active journey is set to null (no active journey)
3. **Given** one journey is active, **When** I activate a different journey, **Then** the first journey becomes inactive and the second becomes active
4. **Given** I toggle a journey's active state, **When** the action succeeds, **Then** I see a success toast message ("Journey activated" or "Journey deactivated")
5. **Given** I activate a journey, **When** I refresh the page, **Then** the active state persists correctly

---

### User Story 4 - Delete Journey (Priority: P3)

As an event creator, I want to delete a journey I no longer need so I can keep my journey list organized and relevant.

**Why this priority**: Deletion is a maintenance operation. Users need to create and manage journeys before they need to clean up. Essential but lower priority than core CRUD and activation.

**Independent Test**: Can be fully tested by clicking delete on a journey, confirming the action, and verifying the journey is removed from the list.

**Acceptance Scenarios**:

1. **Given** I click delete on a journey, **When** the confirmation dialog appears, **Then** I see a warning message asking to confirm deletion
2. **Given** the delete confirmation is shown, **When** I confirm deletion, **Then** the journey is soft-deleted and removed from the list
3. **Given** the deleted journey was the active journey, **When** deletion completes, **Then** the event's active journey is set to null
4. **Given** the delete confirmation is shown, **When** I cancel, **Then** the journey remains unchanged

---

### User Story 5 - Navigate to Journey Detail (Priority: P3)

As an event creator, I want to click on a journey to view its details so I can see more information and eventually edit it.

**Why this priority**: Navigation to detail view enables future journey editing functionality. For now, displays a placeholder, but establishes the routing foundation.

**Independent Test**: Can be fully tested by clicking a journey card and verifying navigation to the detail route with the journey name displayed.

**Acceptance Scenarios**:

1. **Given** I am on the journeys list, **When** I click on a journey card, **Then** I navigate to the journey detail page
2. **Given** I am on a journey detail page, **When** the page loads, **Then** I see the journey name in the header and a "Work in Progress" message
3. **Given** I am on a journey detail page, **When** I use back navigation, **Then** I return to the journeys list

---

### Edge Cases

- What happens when the event is archived? Users should not be able to create new journeys for archived events.
- How does the system handle concurrent activation attempts? The switchboard pattern ensures only one journey can be active per event at any time.
- What happens when a user tries to delete an already-deleted journey? The action should fail gracefully with a "Journey not found" error.
- What happens when the parent event is deleted? Journeys remain in the database but are inaccessible (orphaned data cleanup is a separate concern).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a list of all non-deleted journeys for an event, sorted by creation date (newest first)
- **FR-002**: System MUST show an empty state with "No journeys yet" message and "Create Journey" button when no journeys exist
- **FR-003**: System MUST allow users to create a new journey with a name (1-200 characters)
- **FR-004**: System MUST create new journeys with an empty step order array and NOT automatically set them as active
- **FR-005**: System MUST redirect users to the journey detail route after successful creation
- **FR-006**: System MUST display each journey's name, step count, created date, and active status in the list
- **FR-007**: System MUST allow users to toggle a journey as active/inactive via a switch control
- **FR-008**: System MUST ensure only one journey can be active per event at any time (switchboard pattern)
- **FR-009**: System MUST display a success toast when a journey is activated or deactivated
- **FR-010**: System MUST allow users to soft-delete a journey (mark as deleted, not permanently remove)
- **FR-011**: System MUST show a confirmation dialog before deleting a journey
- **FR-012**: System MUST automatically clear the event's active journey if the deleted journey was active
- **FR-013**: System MUST validate that the parent event exists and is not archived before creating a journey
- **FR-014**: System MUST require admin authentication for all write operations (create, delete, activate)
- **FR-015**: System MUST display a journey detail page showing the journey name and "Work in Progress" message

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Journey list MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Journey cards and toggle switches MUST meet minimum touch target size (44x44px)
- **MFR-003**: Typography MUST be readable on mobile (minimum 14px for body text)
- **MFR-004**: Create journey dialog MUST be fully usable on mobile devices with proper keyboard handling
- **MFR-005**: Empty state CTA button MUST be prominently visible and easily tappable on mobile

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Journey name input MUST be validated with Zod schema (required, 1-200 characters)
- **TSR-002**: Event ID and Journey ID parameters MUST be validated before database operations
- **TSR-003**: TypeScript strict mode MUST be maintained (no `any` escapes)
- **TSR-004**: All server action responses MUST use typed ActionResponse pattern with explicit error codes

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: All write operations (create journey, delete journey, set active journey) MUST use Admin SDK via Server Actions
- **FAR-002**: Journey list reads MAY use Client SDK for real-time updates (optional optimization)
- **FAR-003**: Journey schema and validation logic MUST be located in the journeys feature module
- **FAR-004**: Soft delete MUST update `status` to "deleted" and set `deletedAt` timestamp (not remove document)
- **FAR-005**: Setting active journey MUST use the existing Event switchboard pattern (updating `event.activeJourneyId`)

### Key Entities

- **Journey**: A named sequence of steps that defines a guest experience flow. Key attributes: name, eventId, stepOrder (array of step IDs), status (active/deleted), timestamps. One journey can be active per event.
- **Event** (existing): Parent container for journeys. Has `activeJourneyId` field that points to the currently active journey (or null).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event creators can create a new journey in under 30 seconds (open dialog, enter name, submit)
- **SC-002**: Event creators can toggle a journey's active state with a single tap/click
- **SC-003**: Journey list loads and displays within 2 seconds for events with up to 50 journeys
- **SC-004**: 100% of journey operations (create, delete, activate) provide visual feedback (loading states, success/error toasts)
- **SC-005**: Active journey state accurately reflects across all UI components after any change (list badge, toggle position)
- **SC-006**: Deleted journeys never appear in the journey list (soft delete filters correctly)

## Assumptions

- Users accessing the journeys feature are already authenticated as event admins
- The event exists and is accessible before navigating to its journeys
- Journey names do not need to be unique within an event
- The existing `updateEventSwitchboardAction` from the events feature will be reused for setting active journey
- Tags and analytics features are out of scope for this initial implementation

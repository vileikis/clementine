# Feature Specification: Delete Event (Soft Delete)

**Feature Branch**: `007-event-delete`
**Created**: 2025-11-26
**Status**: Draft
**Input**: User description: "Delete event - Allow admins to delete event from the event list, ask confirmation, do not really delete event but mark it as deleted, do not allow to delete from the event studio"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Delete Event from List (Priority: P1)

As an admin, I want to delete an event from the event list page so that I can remove events that are no longer needed without permanently losing the data.

**Why this priority**: This is the core functionality of the feature. Without the ability to delete events, the entire feature has no value. It enables admins to manage their event inventory and remove unwanted events.

**Independent Test**: Can be fully tested by navigating to the event list, clicking delete on any event, confirming the action, and verifying the event disappears from the list while still existing in the database with "deleted" status.

**Acceptance Scenarios**:

1. **Given** an admin is viewing the event list with at least one event, **When** they click the delete button on an event row, **Then** a confirmation dialog appears showing the event name.
2. **Given** a confirmation dialog is open for an event, **When** the admin clicks "Delete", **Then** the event is marked as deleted, disappears from the list, and a success notification appears.
3. **Given** a confirmation dialog is open for an event, **When** the admin clicks "Cancel", **Then** the dialog closes and no changes are made to the event.

---

### User Story 2 - Feedback on Delete Action (Priority: P2)

As an admin, I want to receive clear feedback when I delete an event so that I know the action was successful or understand what went wrong.

**Why this priority**: User feedback is essential for usability but the core delete functionality can work without it. This enhances the user experience and builds confidence in the system.

**Independent Test**: Can be tested by performing delete operations (both successful and simulated failures) and verifying appropriate toast notifications appear.

**Acceptance Scenarios**:

1. **Given** an admin confirms deletion of an event, **When** the deletion succeeds, **Then** a success toast notification appears confirming the event was deleted.
2. **Given** an admin confirms deletion of an event, **When** the deletion fails (e.g., network error), **Then** an error toast notification appears explaining the failure.

---

### User Story 3 - No Delete in Event Studio (Priority: P1)

As an admin editing an event in the Event Studio, I should not see a delete option so that I cannot accidentally delete an event while actively working on it.

**Why this priority**: This is a safety requirement that prevents accidental data loss. It's marked P1 because it's a core constraint of the feature, not an enhancement.

**Independent Test**: Can be tested by navigating to any Event Studio page and verifying no delete button or option exists anywhere in the UI.

**Acceptance Scenarios**:

1. **Given** an admin is on any Event Studio page (design, theme, experiences, journeys, distribution, results), **When** they look for a delete option, **Then** no delete button, link, or menu option is visible.

---

### Edge Cases

- What happens when an admin tries to delete an event that was already deleted by another admin? System should handle gracefully with appropriate error message.
- What happens when the delete operation fails due to network issues? System should show error toast and leave event unchanged.
- What happens when the event list is empty? Delete functionality is simply not applicable (no events to delete).
- What happens when an admin deletes an event with an active journey? The event is still deleted (soft delete), but this should be allowed since it's a soft delete and data is preserved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a delete button/icon on each event row in the event list page.
- **FR-002**: System MUST show a confirmation dialog before deleting an event.
- **FR-003**: Confirmation dialog MUST display the name of the event being deleted.
- **FR-004**: System MUST implement soft delete by setting event status to "deleted" and recording a deletion timestamp.
- **FR-005**: System MUST exclude events with status "deleted" from the event list query results.
- **FR-006**: System MUST require admin authentication for delete operations.
- **FR-007**: System MUST NOT display any delete option in Event Studio pages.
- **FR-008**: System MUST show a success notification after successful deletion.
- **FR-009**: System MUST show an error notification if deletion fails.
- **FR-010**: System MUST refresh the event list after successful deletion.

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Delete button MUST be accessible and visible on mobile viewport (320px-768px).
- **MFR-002**: Delete button MUST meet minimum touch target size (44x44px).
- **MFR-003**: Confirmation dialog MUST be fully visible and usable on mobile screens without horizontal scrolling.
- **MFR-004**: Dialog buttons (Cancel/Delete) MUST be easily tappable on mobile devices.

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Event ID input for delete operation MUST be validated as a non-empty string.
- **TSR-002**: Event status schema MUST be updated to include "deleted" as a valid enum value.
- **TSR-003**: Event schema MUST include an optional nullable `deletedAt` timestamp field.
- **TSR-004**: TypeScript strict mode MUST be maintained (no `any` escapes).

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Delete operation MUST use Admin SDK via Server Action.
- **FAR-002**: Event list query MUST filter out deleted events using query constraints.
- **FAR-003**: Soft delete MUST update `status`, `deletedAt`, and `updatedAt` fields atomically.

### Key Entities

- **Event**: Extended with `deletedAt` timestamp field and "deleted" status option. When deleted, the event document remains in the database but is hidden from all list queries and UI views.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can delete an event in under 10 seconds (click delete, confirm, see success feedback).
- **SC-002**: 100% of deleted events are excluded from the event list view.
- **SC-003**: 100% of deleted events retain their data in the database (soft delete verification).
- **SC-004**: 0 delete options visible in Event Studio pages (safety constraint).
- **SC-005**: Delete operation completes with success/error feedback within 3 seconds under normal network conditions.

## Assumptions

- Admins are already authenticated when viewing the event list (existing auth flow).
- The event list page already exists and displays events in rows/cards.
- Toast notification system is already available in the application.
- AlertDialog component is available or can be easily added.
- There is no requirement to restore deleted events (out of scope).
- There is no requirement to view deleted events (out of scope).
- Bulk delete is not required (single event deletion only).

## Out of Scope

- Hard delete (permanent removal from database)
- Restore deleted events functionality
- Admin UI to view/manage deleted events
- Bulk delete operations
- Cascade delete of related data (journeys, sessions, etc.)
- Delete from Event Studio (explicitly excluded per requirements)

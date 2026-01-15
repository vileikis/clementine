# Feature Specification: Fix Event Rename Dialog Stale Name

**Feature Branch**: `026-event-rename`
**Created**: 2026-01-15
**Status**: Draft
**Input**: User description: "Fix: Event Rename Uses Stale Name - Bug: After renaming an event, the rename dialog shows the previous name instead of the latest. Expected: Rename dialog always loads the current event name from source of truth."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Event Creator Renames Event Multiple Times (Priority: P1)

An event creator managing their project events needs to rename an event multiple times in succession. Currently, after the first rename, reopening the rename dialog shows the previous name instead of the newly saved name, causing confusion and potential data entry errors.

**Why this priority**: This is the core bug being fixed. Users cannot confidently rename events without this working correctly, as they see stale data that contradicts what was just saved.

**Independent Test**: Can be fully tested by renaming an event, closing the dialog, reopening the rename dialog from the same event item, and verifying the input field shows the newly saved name.

**Acceptance Scenarios**:

1. **Given** an event named "Summer Launch", **When** the user opens the rename dialog, changes the name to "Fall Launch", saves successfully, closes the dialog, and reopens the rename dialog, **Then** the input field displays "Fall Launch" (the current name).

2. **Given** an event that was just renamed from "Event A" to "Event B", **When** the user immediately clicks "Rename" again without navigating away, **Then** the dialog input shows "Event B".

3. **Given** an event with a name, **When** the user opens the rename dialog, makes changes, but cancels without saving, **Then** reopening the dialog shows the original unchanged name from the database.

---

### User Story 2 - Dialog Reflects External Changes (Priority: P2)

When an event name is updated by another source (e.g., another user, API, or different browser tab), the rename dialog should reflect the current name when opened.

**Why this priority**: While less common than the primary scenario, this ensures data integrity when multiple sources can update event names.

**Independent Test**: Can be tested by opening the rename dialog while another process updates the event name in the database, then verifying the dialog shows the current database value.

**Acceptance Scenarios**:

1. **Given** an event named "Original Name" displayed in the list, **When** the event name is updated externally to "Updated Name" and the data cache is refreshed, **Then** opening the rename dialog shows "Updated Name".

---

### Edge Cases

- What happens when the user opens the dialog immediately after the mutation succeeds but before the cache updates? The dialog should show the newly saved name, not the previous cached value.
- How does the dialog handle rapid open/close cycles? Each open should reflect the current event name without race conditions.
- What happens if the save fails? The dialog should retain the user's input so they can retry without retyping.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the current event name in the rename dialog input field every time the dialog opens.
- **FR-002**: System MUST NOT show stale/cached names that differ from the event's current saved name.
- **FR-003**: System MUST synchronize the dialog input with the source of truth (current event data) when the dialog opens.
- **FR-004**: System MUST preserve user input if a rename operation fails, allowing retry without retyping.
- **FR-005**: System MUST clear any unsaved changes when the dialog is canceled, reverting to the current saved name on next open.

### Key Entities

- **ProjectEvent**: Represents an event within a project. Key attributes: `id`, `name`, `projectId`, `updatedAt`. The `name` field (1-100 characters) is what's being edited.
- **RenameProjectEventDialog**: The UI component responsible for displaying the rename form. Receives event data from the parent component and must always reflect the current state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of rename dialog opens display the current saved event name (verified by the input field value matching the stored value).
- **SC-002**: Users can rename an event multiple times in succession without seeing stale names.
- **SC-003**: Zero user confusion from mismatched displayed names vs. saved names after a rename operation.
- **SC-004**: All existing functionality (validation, error handling, keyboard shortcuts) continues to work correctly.

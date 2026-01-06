# Feature Specification: Event Designer - Global Changes Tracker

**Feature Branch**: `014-event-designer-global-changes-tracker`
**Created**: 2026-01-06
**Status**: Draft
**Input**: Implement a global state management system to track real-time saving status across all event configuration changes.

## User Scenarios & Testing

### User Story 1 - Real-time Save Progress Feedback (Priority: P1)

As an event creator editing event configurations, I want to see a visual indicator when my changes are being saved so that I know the system is processing my updates and I don't accidentally navigate away during a save.

**Why this priority**: Core UX requirement - users need confidence that their changes are being persisted. Without this, users may experience data loss by navigating away during saves or feel uncertain about whether their changes were saved.

**Independent Test**: Can be fully tested by making a single configuration change (e.g., toggle download option) and observing the spinner appear during save and deliver immediate visual feedback that the system is working.

**Acceptance Scenarios**:

1. **Given** I am editing an event's sharing settings, **When** I toggle a share option, **Then** I see a spinning loader icon appear in the top navigation bar indicating the save is in progress
2. **Given** a save is in progress, **When** the save completes successfully, **Then** the spinner is replaced with a green checkmark that displays for 3 seconds
3. **Given** multiple changes are made quickly, **When** multiple saves are in progress, **Then** the spinner remains visible until ALL saves complete

---

### User Story 2 - Multiple Concurrent Saves Handling (Priority: P1)

As an event creator making multiple rapid changes (e.g., uploading overlays and toggling share options), I want the save indicator to accurately reflect the status of all ongoing saves so that I know when it's safe to navigate away or publish.

**Why this priority**: Essential for maintaining data integrity - users frequently make multiple quick changes, and the system must handle concurrent saves without race conditions or misleading UI states.

**Independent Test**: Can be fully tested by making 3 rapid changes (e.g., upload 1:1 overlay, upload 9:16 overlay, toggle Instagram share) and verifying the spinner remains visible until all 3 saves complete.

**Acceptance Scenarios**:

1. **Given** I upload a 1:1 overlay (save 1 starts), **When** I immediately upload a 9:16 overlay (save 2 starts), **Then** the spinner stays visible and doesn't flicker or disappear prematurely
2. **Given** 3 concurrent saves are in progress, **When** the first save completes, **Then** the spinner remains visible (2 saves still pending)
3. **Given** 3 concurrent saves are in progress, **When** all 3 saves complete, **Then** the spinner is replaced with a checkmark
4. **Given** the checkmark is displaying, **When** I make a new change during the 3-second checkmark window, **Then** the checkmark immediately switches to a spinner

---

### User Story 3 - Unpublished Changes Awareness (Priority: P2)

As an event creator who has saved changes but not yet published, I want to see a clear indicator that my draft differs from the published version so that I remember to publish my changes when ready.

**Why this priority**: Important for preventing confusion - users need to understand the difference between saving (draft) and publishing (live for guests). This prevents situations where users think their changes are live when they're still in draft.

**Independent Test**: Can be fully tested by making any configuration change, waiting for save to complete, and verifying the "New changes" badge appears next to the Publish button.

**Acceptance Scenarios**:

1. **Given** I have never published the event, **When** I save any change, **Then** I see a "New changes" badge in the top navigation bar
2. **Given** I have published the event previously, **When** I make and save a new change, **Then** the "New changes" badge appears indicating the draft is ahead of published
3. **Given** the "New changes" badge is visible, **When** I click Publish, **Then** the badge disappears (draft version now matches published version)
4. **Given** the "New changes" badge is visible, **When** saves are in progress, **Then** the badge remains visible alongside the save status indicator

---

### User Story 4 - Save Error Handling (Priority: P2)

As an event creator experiencing a save error (network issue, permission denied, etc.), I want the save indicator to disappear and show a clear error message so that I know the save failed and can retry.

**Why this priority**: Critical for error transparency - users must know when saves fail so they can take corrective action. However, error scenarios are less frequent than successful saves, making this P2.

**Independent Test**: Can be fully tested by simulating a network error (disconnect wifi) and attempting a save, verifying the spinner disappears and a toast notification shows the error.

**Acceptance Scenarios**:

1. **Given** a save is in progress, **When** the save fails due to network error, **Then** the spinner disappears immediately (no checkmark shown)
2. **Given** a save has failed, **When** the error occurs, **Then** a toast notification displays with a clear error message
3. **Given** 3 saves are in progress and 1 fails, **When** the error occurs, **Then** the save counter decrements correctly and the spinner remains visible for the 2 pending saves
4. **Given** a save has failed, **When** I retry the action, **Then** the save indicator shows progress normally

---

### Edge Cases

- **What happens when the component unmounts during a save?** The store state is reset via cleanup effect, preventing stale state from persisting to the next event or route
- **What happens when saves complete in rapid succession?** The checkmark timer is reset each time, showing the most recent completion for 3 seconds
- **What happens if the user makes a change during the 3-second checkmark display?** The checkmark immediately switches to a spinner (new save in progress)
- **What happens if multiple saves complete at the exact same timestamp?** Reference counting ensures accuracy - counter decrements for each completion, only showing checkmark when counter reaches 0
- **What happens if a save error occurs during the checkmark display?** The counter decrements (removing spinner if no other saves pending), but no checkmark replaces it since errors don't trigger `lastCompletedAt`

## Requirements

### Functional Requirements

- **FR-001**: System MUST display a spinner icon when any save operation is in progress
- **FR-002**: System MUST display a green checkmark icon for exactly 3 seconds after all saves complete successfully
- **FR-003**: System MUST track multiple concurrent saves using reference counting (increment on start, decrement on complete/error)
- **FR-004**: System MUST show "New changes" badge when `draftVersion > publishedVersion`
- **FR-005**: System MUST position status indicators and unpublished changes badge in the top navigation bar right slot
- **FR-006**: System MUST reset save state when EventDesignerLayout unmounts (route changes, cleanup)
- **FR-007**: System MUST handle save errors by decrementing the counter and showing toast notifications (no error icon in top bar)
- **FR-008**: System MUST integrate with existing mutation hooks without breaking changes
- **FR-009**: System MUST use state transition tracking (idle → pending, pending → idle) to prevent double-counting
- **FR-010**: System MUST immediately replace checkmark with spinner when a new save starts during checkmark display

### Key Entities

- **EventDesignerStore** (Zustand store): Global state for event designer containing `pendingSaves` (number), `lastCompletedAt` (number | null), and actions (`startSave`, `completeSave`, `resetSaveState`)
- **SaveStatus**: Derived state from store - `isSaving` (pendingSaves > 0), `showSuccess` (all saves complete and within 3 seconds)
- **Mutation**: TanStack Query mutation with tracked state transitions via `useTrackedMutation` wrapper

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can observe save progress via spinner within 50ms of initiating a change
- **SC-002**: Save success confirmation (checkmark) displays for exactly 3 seconds ± 100ms after all saves complete
- **SC-003**: System correctly handles 10+ concurrent saves without race conditions or UI flickering
- **SC-004**: 100% of existing mutation hooks work without breaking changes after integration
- **SC-005**: Zero memory leaks from timer cleanup (verified via browser DevTools)
- **SC-006**: Save indicators meet WCAG AA color contrast standards and include proper ARIA labels
- **SC-007**: Users can distinguish between "saving" (spinner), "saved" (checkmark), and "unpublished changes" (badge) states at a glance

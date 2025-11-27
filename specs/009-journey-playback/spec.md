# Feature Specification: Journey Playback Mode

**Feature Branch**: `009-journey-playback`
**Created**: 2025-11-27
**Status**: Draft
**Input**: PRD #2 — Full Journey Preview Mode (Step-by-Step Playback) for Clementine Journey Editor

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play Full Journey Preview (Priority: P1)

As a journey creator, I want to preview my entire journey as a step-by-step playback so that I can experience the flow exactly as guests will see it and verify transitions, theming, and step ordering.

**Why this priority**: This is the core feature - without playback capability, the entire feature has no value. Creators need to validate their work before publishing to guests.

**Independent Test**: Can be fully tested by clicking "Play Journey" on any journey with multiple steps and navigating through using the preview controls. Delivers immediate value by showing the complete guest experience.

**Acceptance Scenarios**:

1. **Given** a journey with multiple steps exists, **When** the creator clicks "Play Journey", **Then** the playback mode opens showing the first step in full-screen view with the preview navigation bar visible
2. **Given** playback mode is active, **When** the creator clicks "Next", **Then** the next step in the journey is displayed with the same theming applied
3. **Given** playback mode is active on the last step, **When** the creator clicks "Next", **Then** the playback indicates completion (no navigation to a non-existent step)
4. **Given** playback mode is active, **When** the creator clicks "Back", **Then** the previous step is displayed
5. **Given** playback mode is active on the first step, **When** the creator clicks "Back", **Then** nothing happens (Back is disabled or non-functional)

---

### User Story 2 - Interactive Step Inputs with Session State (Priority: P1)

As a journey creator, I want to interact with input steps during playback and have my inputs persist across steps so that I can verify the full data flow from input to reward.

**Why this priority**: Equally critical to P1 as it validates the guest experience authenticity - without state persistence, the preview wouldn't accurately represent real guest behavior.

**Independent Test**: Can be tested by entering text in a Short Text step, navigating to later steps, and verifying the entered value appears where referenced (e.g., in Reward step). Delivers value by confirming data flows correctly.

**Acceptance Scenarios**:

1. **Given** a Short Text step is displayed, **When** the creator enters text and advances, **Then** the entered text is stored in the mock session state
2. **Given** a Multiple Choice step is displayed, **When** the creator selects an option and advances, **Then** the selection is stored and can be referenced by later steps
3. **Given** a Capture step is displayed in playback mode, **When** the step triggers capture, **Then** a mock image is used (no real camera) and stored for later reference
4. **Given** an Email step is displayed, **When** the creator enters an email and advances, **Then** the email is stored in mock session state
5. **Given** a Reward step references captured image from earlier, **When** the Reward step is displayed, **Then** the mock image from the earlier Capture step is shown

---

### User Story 3 - Preview Navigation Controls (Priority: P1)

As a journey creator, I want navigation controls (Back, Next, Restart, Exit) so that I can freely navigate through the playback and return to the editor when done.

**Why this priority**: Essential for usability - without controls, the creator cannot navigate or exit, making the feature unusable.

**Independent Test**: Can be tested by verifying each button performs its expected action: Back goes to previous step, Next to next step, Restart returns to first step and clears session, Exit returns to editor.

**Acceptance Scenarios**:

1. **Given** playback mode is active, **When** the preview navigation bar is visible, **Then** it displays Back, Next, Restart, and Exit buttons
2. **Given** playback is at step 3 of 5, **When** the creator clicks "Restart", **Then** the playback returns to step 1 and all mock session state is cleared
3. **Given** playback mode is active, **When** the creator clicks "Exit", **Then** playback closes and the editor is displayed in its previous state
4. **Given** playback mode is active, **When** viewing on mobile or desktop toggle is changed, **Then** the step renders appropriately for the selected viewport

---

### User Story 4 - Auto-Advance for Specific Step Types (Priority: P2)

As a journey creator, I want certain steps (Capture, Processing) to automatically advance after their mock actions complete so that the preview simulates real guest timing behavior.

**Why this priority**: Enhances realism of preview but not critical for basic functionality - creators can still manually advance if auto-advance doesn't work.

**Independent Test**: Can be tested by reaching a Processing step and observing it auto-advances after the simulated delay without manual intervention.

**Acceptance Scenarios**:

1. **Given** a Capture step completes its mock capture, **When** the capture animation finishes, **Then** the playback automatically advances to the next step
2. **Given** a Processing step is displayed, **When** the mock processing delay (1-2 seconds) completes, **Then** the playback automatically advances to the next step
3. **Given** a Reward step is displayed, **When** displayed, **Then** it does NOT auto-advance (requires manual navigation)
4. **Given** auto-advance triggers, **When** the creator wants manual control, **Then** the preview navigation bar remains usable to override or navigate differently

---

### User Story 5 - Error Handling in Playback (Priority: P3)

As a journey creator, I want playback to gracefully handle step render failures so that I can continue previewing the rest of the journey even if one step has issues.

**Why this priority**: Edge case handling - most journeys won't have render failures, but robust error handling improves creator confidence.

**Independent Test**: Can be tested by intentionally creating a step with invalid configuration and verifying fallback UI appears while allowing continued navigation.

**Acceptance Scenarios**:

1. **Given** a step fails to render, **When** the step is displayed in playback, **Then** a fallback error UI is shown with a message indicating the issue
2. **Given** a step shows fallback error UI, **When** the creator clicks "Next", **Then** playback continues to the next step normally
3. **Given** a step shows fallback error UI, **When** the creator clicks "Back", **Then** playback returns to the previous step normally

---

### Edge Cases

- What happens when a journey has zero steps? Playback should show an empty state message and only allow Exit.
- What happens when a journey has only one step? Back is disabled/hidden, Next shows completion state.
- How does the system handle rapid clicking of Next/Back? Navigation should be debounced or queued to prevent state corruption.
- What happens if the creator closes the browser during playback? No persistence needed - playback is ephemeral.
- What if mock data generation fails? Use hardcoded fallback mock values (e.g., placeholder image, "Sample Text").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Play Journey" button in the Journey Editor that launches playback mode
- **FR-002**: System MUST display steps in full-screen playback mode with the event's theme applied
- **FR-003**: System MUST render a Preview Navigation Bar with Back, Next, Restart, and Exit controls
- **FR-004**: System MUST maintain a mock session state that persists user inputs across steps during playback
- **FR-005**: System MUST support all 11 step types from the existing Preview Runtime (Info, Experience Picker, Capture, Short Text, Long Text, Multiple Choice, Yes/No, Opinion Scale, Email, Processing, Reward)
- **FR-006**: System MUST auto-advance after Capture and Processing steps complete their mock actions
- **FR-007**: System MUST NOT auto-advance on Reward steps
- **FR-008**: System MUST display fallback UI when a step fails to render
- **FR-009**: System MUST allow continuation of playback after step render failures
- **FR-010**: System MUST clear all mock session state when Restart is clicked
- **FR-011**: System MUST return to the editor in its previous state when Exit is clicked
- **FR-012**: System MUST support mobile/desktop viewport toggle during playback (same as single-step preview)
- **FR-013**: System MUST use mock data for all async operations (camera capture, AI processing) - no real backend calls
- **FR-014**: System MUST NOT write to Firestore or trigger analytics events during playback

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Playback mode MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Preview Navigation Bar controls MUST meet minimum touch target size (44x44px)
- **MFR-003**: Typography in playback mode MUST be readable on mobile (≥14px for body text)
- **MFR-004**: Navigation bar MUST be positioned for easy thumb access on mobile (bottom of screen)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Mock session state MUST be typed with TypeScript interfaces
- **TSR-002**: TypeScript strict mode MUST be maintained (no `any` escapes)
- **TSR-003**: Step type discrimination MUST use existing step type schemas
- **TSR-004**: Playback controller state transitions MUST be type-safe

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Playback mode MUST read journey and step data from Firestore using existing patterns
- **FAR-002**: Playback mode MUST NOT perform any write operations to Firestore
- **FAR-003**: All state during playback MUST be ephemeral (in-memory only)

### Key Entities

- **JourneyPlaybackController**: Manages playback state including current step index, navigation actions (start, reset, next, previous), step result application, and auto-advance detection
- **MockSession**: Stores ephemeral mock data collected during playback - captured images, text inputs, selections, email addresses, AI results - keyed by step type or step ID
- **PlaybackMode**: UI component that wraps the PreviewRuntime in playback context, providing the navigation bar and managing viewport toggle

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can preview a complete journey from first step to last step in under 30 seconds (excluding time spent on inputs)
- **SC-002**: All 11 step types render correctly and accept interactive input during playback
- **SC-003**: Mock session data persists across navigation - creators can go back to step 1 and see previously entered data preserved
- **SC-004**: 100% of playback sessions allow exit back to editor without data loss or UI errors
- **SC-005**: Auto-advancing steps (Capture, Processing) transition within 2 seconds of mock action completion
- **SC-006**: Step render failures display fallback UI within 500ms and allow continued navigation

## Assumptions

- The existing PreviewRuntime from PRD #1 (008-preview-runtime) is implemented and stable
- Step renderers already support mock mode for camera and AI operations
- The Journey Editor has an appropriate location for the "Play Journey" button
- Event theme data is already available and loaded when entering playback mode
- Mock delays for Processing steps should be 1-2 seconds (simulating real behavior without long waits)
- Mobile viewport is the default/primary view when entering playback mode

# Feature Specification: Session & Runtime Foundation

**Feature Branch**: `030-session-runtime-capture`
**Created**: 2026-01-15
**Status**: Draft
**Input**: Epic E5 - Session & Runtime Foundation for Experience Execution

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Tests Experience with Preview (Priority: P1)

An admin (experience creator) has configured steps in the experience editor and wants to verify the experience works correctly before publishing. They click a "Preview" button in the editor, which opens a preview modal where they can run through all configured steps as if they were a guest, seeing exactly how the experience will appear and function.

**Why this priority**: This is the core value proposition - admins need confidence that their configured experience works as intended before making it available to guests. Without preview capability, admins would have to publish blindly.

**Independent Test**: Can be fully tested by creating an experience with multiple steps in the editor, clicking Preview, and walking through each step. Delivers immediate value by allowing admins to validate their configuration.

**Acceptance Scenarios**:

1. **Given** an experience with draft steps configured, **When** the admin clicks "Preview" in the editor, **Then** a preview modal opens showing the first step in run mode
2. **Given** the preview modal is open on an input step, **When** the admin provides an answer and clicks Continue, **Then** the answer is recorded and the next step displays
3. **Given** the preview modal is open on any step except the first, **When** the admin clicks Back, **Then** the previous step displays with any previously entered answer preserved
4. **Given** the preview is open, **When** the admin clicks the close button, **Then** the preview modal closes and returns to the editor

---

### User Story 2 - Runtime Engine Sequences Steps (Priority: P1)

The runtime engine manages the flow of an experience, ensuring steps execute in order, enforcing completion requirements before advancing, and tracking overall progress. This enables a consistent, guided experience for anyone running through the steps.

**Why this priority**: The runtime engine is the foundation for all experience execution. Without it, neither preview nor future guest experiences can function.

**Independent Test**: Can be tested by initializing the runtime with an experience and session, then verifying navigation methods (next, back, goToStep) behave correctly according to sequencing rules.

**Acceptance Scenarios**:

1. **Given** an experience with 5 steps, **When** the runtime initializes, **Then** currentStepIndex is 0 and currentStep is the first step
2. **Given** the runtime is on step 0, **When** canGoBack is checked, **Then** it returns false
3. **Given** the runtime is on step 2, **When** canGoBack is checked, **Then** it returns true
4. **Given** an input step requires an answer, **When** the user tries to advance without answering, **Then** navigation is blocked until an answer is provided
5. **Given** the runtime is on the last step and it completes, **When** completion is triggered, **Then** isComplete becomes true and onComplete callback fires

---

### User Story 3 - Input Step Renderers in Run Mode (Priority: P2)

Input step renderers (Scale, Yes/No, Multi-Select, Short Text, Long Text) display interactive forms in run mode, allowing users to provide answers. Each renderer collects user input, validates it according to step configuration, and enables the Continue button only when input is valid.

**Why this priority**: Input steps are the primary mechanism for collecting user data during an experience. Most experiences will have at least one input step.

**Independent Test**: Can be tested by rendering each input step type in run mode and verifying interactive behavior, validation, and Continue button state.

**Acceptance Scenarios**:

1. **Given** a Scale step with range 1-10 displays in run mode, **When** the user clicks a scale button, **Then** that value is selected and Continue becomes enabled
2. **Given** a Yes/No step displays in run mode, **When** the user clicks Yes or No, **Then** the selection is recorded and the step can proceed
3. **Given** a Multi-Select step with min=1, max=3 options, **When** the user selects 2 options, **Then** Continue is enabled because selection is within valid range
4. **Given** a Short Text step with maxLength=100, **When** the user types 50 characters, **Then** input is accepted and Continue is enabled
5. **Given** a Long Text step with maxLength=500, **When** the user types 600 characters, **Then** input is truncated or validation error shown

---

### User Story 4 - Info Step Renderer in Run Mode (Priority: P2)

Info steps display non-interactive content (title, description, optional media) and provide a Continue button to proceed. They do not collect any data.

**Why this priority**: Info steps are essential for providing context, instructions, or welcome messages within an experience.

**Independent Test**: Can be tested by rendering an info step in run mode and verifying content displays and Continue button advances to the next step.

**Acceptance Scenarios**:

1. **Given** an Info step with title and description, **When** it displays in run mode, **Then** the title and description are visible and Continue button is available
2. **Given** an Info step with media configured, **When** it displays in run mode, **Then** the media (image/video) displays alongside text content
3. **Given** an Info step is displayed, **When** the user clicks Continue, **Then** the runtime advances to the next step

---

### User Story 5 - Session Creates and Persists Data (Priority: P2)

When an experience starts running (in preview or future guest mode), a session document is created and persisted. The session tracks progress (current step), collected answers from input steps, and completion status. Session data updates in real-time as the user progresses.

**Why this priority**: Session persistence enables progress tracking, analytics (for guest sessions), and potential session recovery.

**Independent Test**: Can be tested by starting a preview, progressing through steps, and verifying session document updates in the database with correct answers and progress.

**Acceptance Scenarios**:

1. **Given** an admin starts a preview, **When** the preview initializes, **Then** a new session document is created with mode='preview' and status='active'
2. **Given** a session exists and user answers an input step, **When** the answer is submitted, **Then** the session's answers array is updated with stepId, stepType, value, and timestamp
3. **Given** a session is in progress, **When** the user advances to step 3, **Then** session.currentStepIndex updates to 3
4. **Given** a session reaches the last step and completes, **When** completion triggers, **Then** session.status becomes 'completed' and completedAt is set

---

### User Story 6 - Placeholder Renderers for Capture and Transform Steps (Priority: P3)

Capture Photo and Transform Pipeline steps display placeholder UI in run mode, indicating their functionality is not yet available. Each shows a message and a Continue button that allows users to skip past the step for testing purposes.

**Why this priority**: Placeholders allow the full step flow to be tested even before camera and transform features are implemented. This unblocks preview testing.

**Independent Test**: Can be tested by including capture and transform steps in an experience and verifying placeholders display with functional Continue buttons.

**Acceptance Scenarios**:

1. **Given** a Capture Photo step in run mode, **When** it displays, **Then** a placeholder message "Camera capture" is shown along with any configured instructions
2. **Given** a Transform Pipeline step in run mode, **When** it displays, **Then** a "Processing..." placeholder message is shown
3. **Given** a placeholder step is displayed, **When** the user clicks Continue, **Then** the runtime advances to the next step (capture/transform is skipped)

---

### Edge Cases

- What happens when an experience has zero steps? The runtime should handle this gracefully, immediately marking as complete or showing an appropriate message.
- How does the system handle network errors when updating the session? Session updates should retry or queue failed updates, with appropriate error feedback to the user.
- What happens when the user provides an invalid answer type (e.g., string where number expected)? Input validation should reject invalid types and prevent progression.
- What happens if the browser closes mid-session? For preview mode, session can be abandoned. Session recovery on refresh is a nice-to-have for future iteration.
- How does the system handle steps with missing configuration? Steps with incomplete configuration should display a validation error in preview mode.

## Requirements *(mandatory)*

### Functional Requirements

#### Session Domain

- **FR-001**: System MUST create a session document when an experience execution begins
- **FR-002**: Session documents MUST be stored under the project hierarchy (path: /projects/{projectId}/sessions/{sessionId})
- **FR-003**: Sessions MUST store references to projectId, eventId, experienceId, and workspaceId
- **FR-004**: Sessions MUST track execution mode as either 'preview' or 'guest'
- **FR-005**: Sessions MUST maintain currentStepIndex to track progress through steps
- **FR-006**: Sessions MUST track status as 'active', 'completed', or 'abandoned'
- **FR-007**: Sessions MUST store an answers array containing stepId, stepType, value (string, number, boolean, or string array), and timestamp for each answered input step
- **FR-008**: Sessions MUST store a capturedMedia array for future capture step integration
- **FR-009**: Sessions MUST store a result field for the final output (null until transform/capture produces it)
- **FR-010**: Sessions MUST track createdAt, updatedAt, and completedAt timestamps

#### Runtime Engine

- **FR-011**: System MUST provide a runtime engine that manages step sequencing
- **FR-012**: Runtime MUST expose current step, step index, navigation availability (canGoBack, canGoNext), and completion status
- **FR-013**: Runtime MUST support forward navigation (next) only when current step requirements are met
- **FR-014**: Runtime MUST support backward navigation (back) to any previously visited step except before the first step
- **FR-015**: Runtime MUST support direct navigation (goToStep) within bounds of visited steps
- **FR-016**: Runtime MUST provide methods to record answers (setAnswer) and media (setMedia) for steps
- **FR-017**: Runtime MUST fire an onComplete callback when the experience finishes
- **FR-018**: Runtime MUST sync state changes to the session document

#### Step Renderers (Run Mode)

- **FR-019**: All step renderers MUST support both 'edit' and 'run' modes via a mode prop
- **FR-020**: Info step renderer in run mode MUST display title, description, and optional media with a Continue button
- **FR-021**: Input Scale renderer in run mode MUST display the question with selectable scale buttons and enable Continue after selection
- **FR-022**: Input Yes/No renderer in run mode MUST display the question with Yes and No buttons
- **FR-023**: Input Multi-Select renderer in run mode MUST display options as checkboxes/radio buttons and validate min/max selection counts
- **FR-024**: Input Short Text renderer in run mode MUST display a text input with max length validation
- **FR-025**: Input Long Text renderer in run mode MUST display a textarea with max length validation
- **FR-026**: Capture Photo renderer in run mode MUST display a placeholder message and Continue button (camera integration deferred to E5.2)
- **FR-027**: Transform Pipeline renderer in run mode MUST display a "Processing..." placeholder and Continue button (processing deferred to E9)
- **FR-028**: All input renderers MUST call onAnswer callback when user provides input
- **FR-029**: All step renderers MUST respect onNext and onBack callbacks for navigation

#### Admin Preview

- **FR-030**: System MUST provide a Preview button in the experience editor
- **FR-031**: Preview MUST create a session with mode='preview' using the draft configuration (not published)
- **FR-032**: Preview MUST open a modal or fullscreen view displaying the step renderer in run mode
- **FR-033**: Preview MUST display current step progress (e.g., "Step 2 of 5")
- **FR-034**: Preview sessions MUST be excluded from analytics
- **FR-035**: Preview MUST allow the admin to close/exit at any time

#### Security

- **FR-036**: Project admins MUST be able to read all sessions under their project
- **FR-037**: Authenticated users MUST be able to read their own sessions (sessions they created)
- **FR-038**: Authenticated users MUST be able to create sessions for projects they can access
- **FR-039**: Only the session creator MUST be able to update a session
- **FR-040**: Session deletion MUST be prohibited

### Key Entities

- **Session**: Represents a single execution of an experience by a user (admin in preview or future guest). Contains progress state, collected answers, captured media references, and final result. Linked to project, event, experience, and workspace for context and analytics.

- **Experience Runtime**: The state machine managing step-by-step execution. Tracks current position, validates progression requirements, and coordinates between UI renderers and session persistence.

- **Step Renderer**: UI component that displays a step in either edit mode (for configuration in the editor) or run mode (for actual execution). Each step type (info, input variants, capture, transform) has its own renderer implementation.

- **Answer**: User-provided response to an input step. Typed as string, number, boolean, or array of strings depending on input type. Stored with metadata (stepId, stepType, timestamp) in the session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can preview an experience from the editor and complete all steps in under 2 minutes (for a 5-step experience)
- **SC-002**: All input step types (Scale, Yes/No, Multi-Select, Short Text, Long Text) function correctly in run mode with 100% of valid inputs accepted
- **SC-003**: Session documents accurately reflect user progress, with answers persisted within 1 second of user input
- **SC-004**: Navigation (back/forward) works correctly with 100% accuracy - users can revisit any previously completed step
- **SC-005**: Preview uses draft configuration, allowing admins to test changes before publishing
- **SC-006**: 95% of preview sessions complete without errors (no crashes, hangs, or data loss)
- **SC-007**: Placeholder steps (capture, transform) do not block experience completion - users can continue past them
- **SC-008**: Step renderers display correct content and accept valid input formats as defined in step configuration

# Feature Specification: Experience Engine

**Feature Branch**: `020-experience-engine`
**Created**: 2025-12-05
**Status**: Draft
**Input**: Phase 7: Experience Engine - Build a unified runtime engine that executes interactive Clementine experiences through modular step components, working identically in both Guest mode and Admin Preview.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Completes an Experience Flow (Priority: P1)

A guest visits a photobooth event link, is guided through a series of interactive steps (info screens, photo capture, AI transformation, reward display), and receives their transformed photo to share or download.

**Why this priority**: This is the core guest experience that December pilots depend on. Without a working guest flow, the product has no value proposition.

**Independent Test**: Can be fully tested by navigating through all steps of a configured experience and verifying that the final transformed photo is displayed with sharing options.

**Acceptance Scenarios**:

1. **Given** a guest opens an event link, **When** the experience loads, **Then** the first step displays within 100ms of initialization
2. **Given** a guest is on a capture step, **When** they take a photo, **Then** the engine automatically advances to the next step without requiring a button click
3. **Given** a guest completes all steps, **When** the reward step displays, **Then** they can download or share their transformed image
4. **Given** a guest is on an AI transform step, **When** the transformation is processing, **Then** they see progress feedback with rotating messages
5. **Given** an AI transformation completes, **When** the result is ready, **Then** the UI updates within 1 second without page reload

---

### User Story 2 - Admin Previews Experience in Editor (Priority: P2)

An admin creating or editing an experience wants to preview exactly what guests will see, using the same runtime engine but without persisting data or triggering real AI processing.

**Why this priority**: WYSIWYG preview is critical for admins to verify their experience configuration before going live. This must use the same engine as guests to guarantee parity.

**Independent Test**: Can be fully tested by entering preview mode in the experience editor and stepping through all configured steps, verifying visual and behavioral parity with guest mode.

**Acceptance Scenarios**:

1. **Given** an admin opens experience preview, **When** the preview starts, **Then** they see the same step UI that guests would see
2. **Given** an admin is in preview mode, **When** they navigate between steps, **Then** session data is stored in memory only (not persisted to database)
3. **Given** an admin is in preview mode, **When** they interact with input steps, **Then** their inputs are captured and available to subsequent steps
4. **Given** an admin is previewing an AI transform step, **When** they reach that step, **Then** they see a simulated/mock transformation result (no actual AI call)
5. **Given** an admin is in preview mode, **When** they enable debug mode, **Then** they see a debug panel showing current session state

---

### User Story 3 - AI Transform Processes in Background (Priority: P2)

During an experience, when a guest reaches an AI transform step, the system triggers a background job that processes the transformation while keeping the user informed of progress through real-time updates.

**Why this priority**: AI transformation is a long-running async operation (10-60 seconds) that must not block the UI. Real-time feedback is essential for user engagement.

**Independent Test**: Can be tested by triggering an AI transform step and verifying that the UI shows progress, the job completes in the background, and the result displays automatically.

**Acceptance Scenarios**:

1. **Given** a guest reaches an AI transform step, **When** the step initializes, **Then** the system triggers a background processing job
2. **Given** an AI transform job is processing, **When** the guest views the step, **Then** they see rotating loading messages
3. **Given** an AI transform job completes successfully, **When** the result is ready, **Then** the session updates via real-time sync and the UI shows the result
4. **Given** an AI transform job fails, **When** the error is detected, **Then** the guest sees an error message with a retry option
5. **Given** the guest retries a failed transform, **When** they click retry, **Then** a new job is triggered without page reload

---

### User Story 4 - Session Persists Across Steps (Priority: P3)

Guest inputs collected in earlier steps (text, selections, photos) are available to later steps, enabling dynamic content like AI prompts that reference user-provided data.

**Why this priority**: Step-to-step data flow enables personalized experiences. Lower priority because basic flows can work with static prompts.

**Independent Test**: Can be tested by entering data in an input step, then verifying that subsequent steps can access that data via session.

**Acceptance Scenarios**:

1. **Given** a guest enters text in a short text step, **When** they proceed to an AI transform step, **Then** the transform can reference that text in its prompt
2. **Given** a guest takes a photo in a capture step, **When** they proceed to later steps, **Then** the photo is available in session data
3. **Given** a guest completes multiple input steps, **When** they reach the end, **Then** all inputs are stored indexed by step ID

---

### User Story 5 - Experience Supports Back Navigation (Priority: P3)

When enabled, guests can navigate backward to previous steps to review or change their inputs.

**Why this priority**: Nice-to-have for user experience but not essential for MVP pilots.

**Independent Test**: Can be tested by navigating forward, then back, and verifying the previous step renders with preserved input values.

**Acceptance Scenarios**:

1. **Given** back navigation is enabled and guest is on step 3, **When** they tap the back button, **Then** step 2 displays with their previously entered data
2. **Given** back navigation is disabled, **When** guest is on any step, **Then** no back button is visible
3. **Given** a guest navigates back and changes their input, **When** they proceed forward again, **Then** the new input value is stored

---

### Edge Cases

- What happens when a guest refreshes the page mid-experience? (Session should resume from stored state for persisted mode)
- How does the system handle network disconnection during AI transform? (Show offline state, retry when connection restored)
- What happens if an AI transform job times out? (Show timeout error with retry option)
- How does the engine handle an experience with zero steps? (Show graceful empty state)
- What happens if the guest's camera permission is denied on capture step? (Show permission error with instructions)
- How does the system handle a step type that doesn't have a registered component? (Render error boundary with message)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST execute a sequence of steps in the order defined by the experience configuration
- **FR-002**: System MUST support 11 step types: info, capture, ai-transform, short_text, long_text, multiple_choice, yes_no, opinion_scale, email, processing, reward
- **FR-003**: System MUST auto-advance to the next step after capture, ai-transform completion, processing timer, and yes_no selection without requiring a CTA click
- **FR-004**: System MUST emit lifecycle callbacks at key moments: onStart, onStepChange, onDataUpdate, onComplete, onError
- **FR-005**: System MUST store all step inputs indexed by step ID in the session data
- **FR-006**: System MUST support two session modes: persisted (syncs to database) and ephemeral (in-memory only)
- **FR-007**: System MUST subscribe to real-time session updates for AI transform job status
- **FR-008**: System MUST display rotating loading messages during AI transform processing
- **FR-009**: System MUST support forward navigation (next step) for all step types
- **FR-010**: System MUST support backward navigation (previous step) when configuration allows
- **FR-011**: System MUST support step skipping when configuration allows
- **FR-012**: System MUST accept a flow name identifier (e.g., "guest-flow", "admin-preview") for analytics and logging
- **FR-013**: System MUST resume an existing session when provided with a session ID
- **FR-014**: System MUST trigger a background job for AI transform steps via server action
- **FR-015**: System MUST provide retry capability for failed AI transform operations
- **FR-016**: AI transform step MUST show before/after comparison view on successful completion
- **FR-017**: System MUST support variable interpolation in AI prompts, substituting values from previous step inputs

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: All step components MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Interactive elements (buttons, inputs, selections) MUST meet minimum touch target size (44x44px)
- **MFR-003**: Typography MUST be readable on mobile (≥14px for body text)
- **MFR-004**: Step transitions MUST be smooth and performant on mobile devices
- **MFR-005**: Camera capture step MUST work with mobile device cameras (front and rear)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All engine configuration inputs MUST be validated with Zod schemas
- **TSR-002**: Step input values MUST use the discriminated union type (text, boolean, number, selection, selections, photo)
- **TSR-003**: All session data updates MUST preserve type safety through the existing SessionData interface
- **TSR-004**: TypeScript strict mode MUST be maintained (no `any` escapes)

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Session write operations (create/update) MUST use Admin SDK via Server Actions
- **FAR-002**: Real-time session subscriptions MUST use Client SDK for AI transform progress
- **FAR-003**: Zod schemas MUST be feature-local in `features/experience-engine/schemas/`
- **FAR-004**: AI transform result images MUST be stored as full public URLs
- **FAR-005**: Ephemeral session mode MUST NOT make any Firestore calls

### Key Entities

- **EngineConfiguration**: Controls engine behavior - includes experience ID, steps, step order, flow name, persistence mode, navigation options, debug mode, theme, and optional project/event context
- **EngineSession**: Runtime state combining session data, current step index, AI job status, and collected step inputs
- **StepComponent**: Renders a specific step type with consistent props: step config, session data, input value, handlers for change/CTA/complete/skip, and mode flags
- **AiTransformJob**: Background job state including job ID, status (pending/processing/complete/error), result URL, and error message

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Engine initializes and displays the first step within 100ms of component mount
- **SC-002**: Step transitions complete within 200ms (no page reload required)
- **SC-003**: Real-time session updates from AI transform jobs display within 1 second of completion
- **SC-004**: Admin preview and guest flow render identical UI for the same step configuration (1:1 visual parity)
- **SC-005**: 100% of step types have working renderers (11 of 11)
- **SC-006**: AI transform background jobs update session state without requiring user interaction
- **SC-007**: Session data persists correctly across step navigation (forward and backward)
- **SC-008**: Guest can complete full experience flow (info → capture → AI transform → reward) in pilot events

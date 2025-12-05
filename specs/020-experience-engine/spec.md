# Feature Specification: Experience Engine

**Feature Branch**: `020-experience-engine`
**Created**: 2025-12-05
**Status**: Draft
**Input**: Phase 7: Experience Engine - Build a unified runtime engine that executes interactive Clementine experiences through modular step components.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Initializes Engine with Experience Configuration (Priority: P1)

A developer (building Guest Flow or Admin Preview) initializes the Experience Engine with an experience configuration containing steps, step order, and behavioral flags. The engine renders the first step and is ready to accept navigation commands.

**Why this priority**: This is the foundational capability. Without engine initialization, no other features can work. This enables both Guest Flow and Admin Preview integrations.

**Independent Test**: Can be fully tested by mounting the ExperienceEngine component with a valid configuration and verifying the first step renders correctly.

**Acceptance Scenarios**:

1. **Given** a valid experience configuration with steps, **When** the engine initializes, **Then** it renders the first step within 100ms
2. **Given** an experience configuration with zero steps, **When** the engine initializes, **Then** it renders an empty state without crashing
3. **Given** a configuration with `persistSession: false`, **When** the engine runs, **Then** no database calls are made
4. **Given** a configuration with `persistSession: true`, **When** the engine runs, **Then** session state syncs to the database
5. **Given** a configuration with `existingSessionId`, **When** the engine initializes, **Then** it resumes from the stored session state

---

### User Story 2 - Developer Navigates Between Steps (Priority: P1)

A developer uses the engine's navigation controls to move forward and backward through steps. The engine tracks the current step index, preserves input data, and respects configuration flags for back/skip navigation.

**Why this priority**: Step navigation is core to the engine's purpose. Both Guest Flow (forward-only) and Admin Preview (with back/skip) depend on this.

**Independent Test**: Can be tested by triggering next/previous/skip actions and verifying the correct step renders with preserved data.

**Acceptance Scenarios**:

1. **Given** the engine is on step 1, **When** `next()` is called, **Then** step 2 renders within 200ms
2. **Given** the engine is on step 2 and `allowBack: true`, **When** `previous()` is called, **Then** step 1 renders with its previously entered data
3. **Given** `allowBack: false`, **When** `previous()` is called, **Then** nothing happens (action is ignored)
4. **Given** `allowSkip: true`, **When** `skip()` is called, **Then** the engine advances without storing input for the current step
5. **Given** the engine is on the last step, **When** `next()` is called, **Then** the `onComplete` callback fires

---

### User Story 3 - Engine Renders All Step Types (Priority: P1)

The engine includes renderers for all 11 step types. Each step type renders correctly with its configuration and accepts user input where applicable.

**Why this priority**: Complete step coverage is required for December pilots. Missing step types would block experience creation.

**Independent Test**: Can be tested by initializing the engine with each step type individually and verifying correct rendering and interaction.

**Acceptance Scenarios**:

1. **Given** an info step configuration, **When** the engine renders it, **Then** the title, description, media, and CTA button display correctly
2. **Given** a capture step configuration, **When** the user captures a photo, **Then** the photo URL is stored in session and auto-advance triggers
3. **Given** an ai-transform step configuration, **When** the step renders, **Then** it triggers the background job, shows a brief "starting transformation" message, and auto-advances to the next step
4. **Given** input step types (short_text, long_text, email, multiple_choice, opinion_scale), **When** the user enters data, **Then** the value is stored in session indexed by step ID
5. **Given** a yes_no step, **When** the user makes a selection, **Then** the value is stored and auto-advance triggers
6. **Given** a processing step with transformation in progress, **When** the transformation completes, **Then** auto-advance triggers
7. **Given** a processing step with transformation already complete, **When** the step renders, **Then** it auto-advances immediately
8. **Given** a reward step with transformation complete, **When** it renders, **Then** it displays the transformed result with configured sharing options
9. **Given** a reward step with transformation still in progress, **When** it renders, **Then** it displays a loading skeleton until result is ready

---

### User Story 4 - AI Transform Step Triggers Background Job (Priority: P2)

When an ai-transform step is reached, the engine triggers a background processing job and immediately advances to the next step. The ai-transform step is a "fire and forget" trigger - it does not wait for or display results.

**Why this priority**: AI transformation is a key differentiator but the trigger is simple. The complexity is in subsequent steps handling the async result.

**Independent Test**: Can be tested by initializing engine with an ai-transform step and verifying the job triggers, session state updates, and auto-advance occurs.

**Acceptance Scenarios**:

1. **Given** the engine reaches an ai-transform step, **When** the step initializes, **Then** a background job is triggered via server action
2. **Given** the ai-transform step triggers successfully, **When** the job starts, **Then** the session state updates to indicate transformation is in progress
3. **Given** the ai-transform step triggers successfully, **When** a brief confirmation displays, **Then** auto-advance triggers to move to the next step
4. **Given** the ai-transform step fails to trigger, **When** an error occurs, **Then** an error state displays with a retry button
5. **Given** the user clicks retry, **When** the action triggers, **Then** a new job attempt starts

---

### User Story 5 - Processing Step Waits for Transformation (Priority: P2)

The processing step displays loading feedback while the AI transformation runs in the background. It subscribes to session updates and auto-advances when the transformation completes.

**Why this priority**: This step provides the user feedback during the async AI operation. It bridges the gap between trigger (ai-transform) and result (reward).

**Independent Test**: Can be tested by initializing engine with a processing step while a transformation is in progress, and verifying it waits and advances on completion.

**Acceptance Scenarios**:

1. **Given** a processing step renders while transformation is in progress, **When** the step displays, **Then** rotating loading messages appear based on step configuration
2. **Given** a processing step is waiting, **When** the transformation completes (session updates via real-time sync), **Then** auto-advance triggers within 1 second
3. **Given** a processing step renders and transformation is already complete, **When** the step initializes, **Then** it auto-advances immediately
4. **Given** the transformation fails, **When** the error is detected via session update, **Then** an error state displays with appropriate messaging

---

### User Story 6 - Reward Step Displays Transformation Result (Priority: P2)

The reward step displays the AI transformation result with sharing/download options. If the result isn't ready yet (edge case), it shows a loading skeleton until the result arrives.

**Why this priority**: This is the payoff step where users see their transformed photo. Must handle both ready and not-yet-ready states gracefully.

**Independent Test**: Can be tested by initializing engine with a reward step and verifying it displays the result or loading state appropriately.

**Acceptance Scenarios**:

1. **Given** a reward step renders with transformation complete, **When** the step displays, **Then** the transformed result image displays with configured sharing options
2. **Given** a reward step renders with transformation still in progress, **When** the step displays, **Then** a loading skeleton displays in place of the result image
3. **Given** a reward step is showing loading skeleton, **When** the transformation completes, **Then** the result image replaces the skeleton within 1 second
4. **Given** a reward step with download enabled, **When** the user taps download, **Then** the transformed image downloads to their device
5. **Given** a reward step with sharing enabled, **When** the user taps a share option, **Then** the appropriate share action triggers

---

### User Story 7 - Engine Emits Lifecycle Callbacks (Priority: P2)

The engine emits callbacks at key moments (start, step change, data update, complete, error) so integrating applications can respond with analytics, logging, or custom behavior.

**Why this priority**: Callbacks enable integration flexibility but aren't required for basic engine operation.

**Independent Test**: Can be tested by providing callback functions and verifying they fire at the correct moments with expected payloads.

**Acceptance Scenarios**:

1. **Given** an `onStart` callback is provided, **When** the engine begins execution, **Then** the callback fires with the session object
2. **Given** an `onStepChange` callback is provided, **When** navigation occurs, **Then** the callback fires with step index, step config, and direction
3. **Given** an `onDataUpdate` callback is provided, **When** session data changes, **Then** the callback fires with the updated data
4. **Given** an `onComplete` callback is provided, **When** the last step completes, **Then** the callback fires with the final session
5. **Given** an `onError` callback is provided, **When** an unrecoverable error occurs, **Then** the callback fires with error details

---

### User Story 8 - Engine Supports Variable Interpolation in AI Prompts (Priority: P3)

AI transform steps can reference values from previous steps using variable syntax. The engine substitutes these variables with actual session data before triggering the transform.

**Why this priority**: Enables personalized AI results but basic static prompts work without this.

**Independent Test**: Can be tested by configuring an ai-transform step with variables referencing earlier input steps and verifying substitution occurs.

**Acceptance Scenarios**:

1. **Given** an ai-transform prompt contains `{{step_id}}` syntax, **When** the transform triggers, **Then** the variable is replaced with the value from that step's input
2. **Given** a variable references a capture step, **When** the transform triggers, **Then** the photo URL is substituted
3. **Given** a variable references a non-existent step, **When** the transform triggers, **Then** the variable is replaced with an empty string (graceful degradation)

---

### Edge Cases

- What happens when a step type has no registered renderer? (Render error boundary with message, fire onError callback)
- How does the engine handle rapid navigation clicks? (Debounce navigation actions to prevent race conditions)
- What happens if session sync fails in persisted mode? (Show recoverable error state, preserve local data, allow retry)
- What happens if the engine is unmounted during an AI job? (Clean up subscriptions, job continues server-side)
- What happens if processing step times out waiting for transformation? (Show timeout message after configured duration)
- What happens if reward step never receives a result? (Continue showing skeleton, rely on timeout handling at integration level)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Engine MUST accept a configuration object containing: experience ID, steps array, step order, flow name, persistence mode, navigation flags (allowBack, allowSkip), debug mode, and optional theme
- **FR-002**: Engine MUST render the current step using the appropriate step component based on step type
- **FR-003**: Engine MUST support 11 step types: info, capture, ai-transform, short_text, long_text, multiple_choice, yes_no, opinion_scale, email, processing, reward
- **FR-004**: Engine MUST provide navigation methods: next(), previous(), skip(), and restart()
- **FR-005**: Engine MUST auto-advance after: capture completion, ai-transform job trigger, processing completion detection, and yes_no selection
- **FR-006**: Engine MUST store step inputs in session data indexed by step ID
- **FR-007**: Engine MUST support two session modes: persisted (syncs to database) and ephemeral (in-memory only)
- **FR-008**: Engine MUST emit lifecycle callbacks: onStart, onStepChange, onDataUpdate, onComplete, onError
- **FR-009**: Engine MUST resume from existing session when provided with a session ID
- **FR-010**: AI transform step MUST trigger background job via server action and auto-advance immediately after
- **FR-011**: AI transform step MUST update session state to indicate transformation is in progress
- **FR-012**: AI transform step MUST NOT display loading UI or wait for results (that's the processing step's job)
- **FR-013**: Processing step MUST subscribe to real-time session updates for transformation status
- **FR-014**: Processing step MUST display rotating loading messages during transformation
- **FR-015**: Processing step MUST auto-advance when transformation completes
- **FR-016**: Reward step MUST display transformation result when available
- **FR-017**: Reward step MUST display loading skeleton if transformation is not yet complete
- **FR-018**: Reward step MUST update to show result when transformation completes (via real-time sync)
- **FR-019**: Engine MUST support variable interpolation in AI prompts using session data from previous steps
- **FR-020**: Engine MUST debounce navigation actions to prevent race conditions

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: All step components MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Interactive elements (buttons, inputs, selections) MUST meet minimum touch target size (44x44px)
- **MFR-003**: Typography MUST be readable on mobile (≥14px for body text)
- **MFR-004**: Step transitions MUST be smooth and performant on mobile devices

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Engine configuration MUST be validated with Zod schemas
- **TSR-002**: Step input values MUST use the existing discriminated union type (text, boolean, number, selection, selections, photo)
- **TSR-003**: Session data updates MUST preserve type safety through the existing SessionData interface
- **TSR-004**: All engine exports MUST have explicit TypeScript types

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Session write operations MUST use Admin SDK via Server Actions (persisted mode only)
- **FAR-002**: Real-time session subscriptions MUST use Client SDK for transformation status updates
- **FAR-003**: Schemas MUST be feature-local in `features/experience-engine/schemas/`
- **FAR-004**: Ephemeral session mode MUST NOT make any Firestore calls

### Key Entities

- **EngineConfiguration**: Input to initialize the engine - experience ID, steps, step order, flow name, persistence mode, navigation flags, debug mode, theme, optional project/event context, optional existing session ID
- **EngineState**: Runtime state managed by the engine - current step index, session data with collected inputs, navigation availability flags, transformation status
- **StepComponentProps**: Common interface for all step renderers - step config, session data, current input value, handlers (onChange, onCtaClick, onComplete, onSkip), interactive mode flag, loading state
- **TransformationStatus**: Tracks AI job state in session - status (idle/pending/processing/complete/error), result URL, error message

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Engine initializes and renders first step within 100ms of mount
- **SC-002**: Step transitions complete within 200ms
- **SC-003**: All 11 step types have working renderers (100% coverage)
- **SC-004**: AI transform step triggers job and auto-advances within 500ms
- **SC-005**: Processing step detects transformation completion and auto-advances within 1 second of session update
- **SC-006**: Reward step displays result within 1 second of transformation completion
- **SC-007**: Session data persists correctly across forward and backward navigation
- **SC-008**: Lifecycle callbacks fire at documented moments with correct payloads
- **SC-009**: Ephemeral mode operates without any database calls
- **SC-010**: Engine can be mounted by both Guest Flow and Admin Preview integrations with different configurations

## Out of Scope

The following are explicitly **NOT** part of this specification and will be separate work:

- **Guest Flow Integration** - The page/routing that mounts the engine for guests
- **Admin Preview Integration** - The UI that mounts the engine in the experience editor
- **Event Extras Orchestration** - Pre-entry gate and pre-reward flows (handled by Guest Flow, enables showing experiences between ai-transform and reward)
- **Branching/Graph Workflows** - Engine supports linear step sequences only
- **Video/GIF Capture or Output** - Image only for MVP
- **Analytics Dashboard** - Engine emits callbacks; analytics collection is separate
- **Multi-experience Selection** - Handled at Event level, not Engine level

## Architecture Note: AI Transformation Flow

The AI transformation spans multiple steps with clear separation of concerns:

```
[ai-transform step]     →     [processing step]     →     [reward step]
      │                              │                         │
      │ Triggers background job      │ Shows loading UI        │ Shows result
      │ Updates session: "pending"   │ Subscribes to updates   │ Or loading skeleton
      │ Auto-advances immediately    │ Auto-advances on done   │ if not ready
      │                              │                         │
      └──────────────────────────────┴─────────────────────────┘
                    Session state syncs transformation status
```

**Future consideration**: When Event Extras (pre-reward slot) is implemented, a mini-experience can be inserted between ai-transform and reward, giving the transformation more time to complete while keeping the user engaged.

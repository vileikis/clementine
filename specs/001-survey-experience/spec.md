# Feature Specification: Survey Experience

**Feature Branch**: `001-survey-experience`
**Created**: 2025-11-20
**Status**: Draft
**Input**: User description: "Add survey experience type to collect guest feedback through configurable question steps"

## Data model

- [survey-experience-data-model.md](../features/survey-experience/survey-experience.md)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create Survey Experience with Steps (Priority: P1)

An event creator wants to collect feedback from guests by creating a survey experience with multiple question types (short text, multiple choice, opinion scale, etc.) that guests will complete.

**Why this priority**: This is the core functionality that enables the entire survey feature. Without the ability to create and configure survey experiences, the feature has no value.

**Independent Test**: Can be fully tested by creating an event, adding a survey experience, configuring 2-3 different question types (e.g., short text, multiple choice, opinion scale), and verifying all configurations persist correctly in Firestore.

**Acceptance Scenarios**:

1. **Given** I'm in the event dashboard, **When** I click to add a new experience and select "Survey" type, **Then** a new survey experience is created with an empty steps list
2. **Given** I have a survey experience open, **When** I click the + button and select a step type (e.g., "Multiple Choice"), **Then** a new step of that type is added to the steps list
3. **Given** I have multiple survey steps, **When** I configure each step's title, description, and type-specific settings (e.g., options for multiple choice, scale for opinion scale), **Then** all configurations are saved and reflected in the preview
4. **Given** I have configured survey steps, **When** I reload the page, **Then** all step configurations persist correctly

---

### User Story 2 - Reorder Survey Steps (Priority: P2)

An event creator wants to change the order of survey questions to improve the flow of the survey experience.

**Why this priority**: While important for user experience optimization, the basic survey functionality can work without reordering. However, it's essential for creators to have control over question sequencing.

**Independent Test**: Can be tested by creating a survey with 3-5 steps, dragging them to different positions, and verifying the order persists and is reflected in both the UI and Firestore.

**Acceptance Scenarios**:

1. **Given** I have a survey with 3 or more steps, **When** I drag a step to a new position in the list, **Then** the step moves to that position and the numbering updates immediately
2. **Given** I've reordered survey steps, **When** I reload the page, **Then** the steps appear in the same order I set
3. **Given** I'm dragging a step, **When** I hover over different positions, **Then** I see visual feedback (e.g., insertion line) showing where the step will be dropped

---

### User Story 3 - Enable/Disable and Require Survey (Priority: P2)

An event creator wants to control whether the survey appears for guests and whether it's mandatory or optional.

**Why this priority**: This provides essential control over the survey experience but depends on having a survey created first (P1).

**Independent Test**: Can be tested by toggling the survey enabled/disabled state and required/optional state, then verifying these settings persist and affect the guest experience flow.

**Acceptance Scenarios**:

1. **Given** I have a survey experience created, **When** I toggle the "Enabled" switch to off, **Then** the survey is disabled and will not appear to guests
2. **Given** I have an enabled survey, **When** I toggle the "Required" switch to on, **Then** guests must complete the survey before seeing the ending screen
3. **Given** I have an optional survey (required = off), **When** guests complete an experience, **Then** they can skip the survey and proceed to the ending screen

---

### User Story 4 - Delete Survey Steps (Priority: P3)

An event creator wants to remove survey questions that are no longer needed.

**Why this priority**: While useful for managing survey content, this is a convenience feature that doesn't block core functionality. Users can work around it by disabling steps or creating new surveys.

**Independent Test**: Can be tested by creating multiple steps, deleting one, and verifying it's removed from the list, Firestore, and the step count updates correctly.

**Acceptance Scenarios**:

1. **Given** I have a survey step selected, **When** I click the delete button, **Then** a confirmation dialog appears
2. **Given** I confirm deletion, **When** the step is deleted, **Then** it's removed from the steps list and the next available step is automatically selected
3. **Given** I delete a step, **When** I check Firestore, **Then** the step document is removed and the stepsOrder array no longer includes its ID

---

### User Story 5 - Preview Survey Steps (Priority: P3)

An event creator wants to see how survey questions will appear to guests as they configure them.

**Why this priority**: While helpful for UX confidence, the basic survey can function without real-time preview. Creators can test the guest experience separately.

**Independent Test**: Can be tested by configuring various step types and verifying the preview pane accurately reflects all settings in real-time.

**Acceptance Scenarios**:

1. **Given** I'm editing a survey step, **When** I type in the title field, **Then** the preview updates immediately to show the new title
2. **Given** I'm configuring a multiple choice step, **When** I add/remove options, **Then** the preview shows the updated option list
3. **Given** I'm configuring an opinion scale step, **When** I change the min/max values and labels, **Then** the preview shows the updated scale

---

### Edge Cases

- What happens when a survey is enabled but has zero steps? (Allow but show warning to creator; guests skip directly to ending screen)
- How does the system handle more than 10 steps? (Warn creator when approaching/exceeding recommended 5-step limit; hard cap at 10 steps)
- What happens when dragging a step fails or is cancelled? (Step returns to original position with no changes persisted)
- How does the system handle invalid step configurations (e.g., multiple choice with no options)? (Prevent saving with clear validation errors in the editor)
- What happens when deleting the currently selected step? (Automatically select the first available step, or show empty state if no steps remain)
- How does the system handle very long titles or descriptions? (Enforce character limits: title 200 chars, description 500 chars, placeholder 100 chars)

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow event creators to create a new experience of type "survey"
- **FR-002**: System MUST support seven survey step types: short text, long text, multiple choice, yes/no, opinion scale, email, and statement
- **FR-003**: System MUST allow creators to add up to 10 survey steps per survey experience
- **FR-004**: System MUST allow creators to configure each step's title (max 200 characters), description (max 500 characters), and type-specific settings
- **FR-005**: System MUST store step type-specific configuration:
  - Multiple choice: options list (minimum 1, each max 100 chars), allowMultiple flag
  - Yes/no: custom yesLabel and noLabel (optional)
  - Opinion scale: minValue, maxValue (integers, min < max), minLabel, maxLabel (optional)
  - Short/long text: placeholder (max 100 chars), maxLength (optional)
  - Email: placeholder (max 100 chars), validationPattern (optional)
  - Statement: no additional config
- **FR-006**: System MUST allow creators to set each step as required or optional (nullable, defaults to null for experience-level behavior)
- **FR-007**: System MUST allow creators to reorder survey steps via drag-and-drop
- **FR-008**: System MUST persist step order in the SurveyExperience.config.stepsOrder array
- **FR-009**: System MUST allow creators to delete survey steps with confirmation
- **FR-010**: System MUST provide real-time preview of survey steps as creators configure them
- **FR-011**: System MUST allow creators to enable/disable the entire survey experience
- **FR-012**: System MUST allow creators to mark the survey as required or optional at the experience level
- **FR-013**: System MUST validate step configurations before saving (e.g., multiple choice must have at least 1 option, opinion scale min < max)
- **FR-014**: System MUST show warning when survey exceeds 5 steps (recommended limit)
- **FR-015**: System MUST prevent adding more than 10 steps per survey experience
- **FR-016**: System MUST allow creators to override the default CTA label per step (optional)
- **FR-017**: System MUST support helper text for steps (optional, small hint/explainer)
- **FR-018**: System MUST support media attachments (image/video) for steps (optional)

### Mobile-First Requirements _(Constitution Principle I)_

- **MFR-001**: Survey step editor MUST stack form controls and preview vertically on mobile viewports (320px-768px)
- **MFR-002**: All interactive elements (buttons, toggles, drag handles) MUST meet minimum touch target size of 44x44px
- **MFR-003**: Step list MUST be scrollable with adequate spacing for touch interaction (minimum 8px between items)
- **MFR-004**: Drag handles MUST be touch-friendly with visual feedback during drag operations
- **MFR-005**: Typography in survey editor MUST be readable on mobile (≥14px for body text, ≥16px for input fields)
- **MFR-006**: Step type selector dialog MUST be optimized for mobile with large, tappable type options

### Type-Safety & Validation Requirements _(Constitution Principle III)_

- **TSR-001**: All survey step data MUST be validated with Zod schemas defining StepBase, step type configs, and discriminated Step union
- **TSR-002**: Step type must be discriminated union with type-specific config validation (e.g., MultipleChoiceConfig, YesNoConfig, etc.)
- **TSR-003**: Character limits MUST be enforced via Zod: title ≤200, description ≤500, placeholder ≤100, option ≤100
- **TSR-004**: Opinion scale validation MUST enforce minValue < maxValue and both are integers
- **TSR-005**: Email step validation pattern MUST validate RFC-compliant email format
- **TSR-006**: TypeScript strict mode MUST be maintained with no `any` types in survey-related code

### Firebase Architecture Requirements _(Constitution Principle VI)_

- **FAR-001**: All survey step write operations (create/update/delete) MUST use Admin SDK via Server Actions
- **FAR-002**: Survey step reads and real-time subscriptions MUST use Client SDK
- **FAR-003**: Survey step documents MUST be stored in `/events/{eventId}/steps/{stepId}` subcollection
- **FAR-004**: Survey experience config MUST reference steps via `config.stepsOrder: string[]` array
- **FAR-005**: Step ordering MUST NOT be stored in step documents; only in experience config
- **FAR-006**: All survey schemas MUST be located in `web/src/lib/schemas/survey.ts` (or similar)
- **FAR-007**: Media URLs for step attachments MUST be stored as full public URLs for instant rendering
- **FAR-008**: Event document MUST include `preEndingExpId: string | null` field to reference the global pre-ending survey experience

### Key Entities

- **SurveyExperience**: An experience of type "survey" that contains configuration for survey behavior, including stepsOrder array that defines the sequence of survey steps
- **SurveyStep**: A question or informational step within a survey, stored in `/events/{eventId}/steps/{stepId}` subcollection, with type-discriminated config for step-specific behavior
- **StepType**: Enumeration of step types (multiple-choice, yes-no, opinion-scale, short-text, long-text, email, statement)
- **StepConfig**: Type-specific configuration objects (MultipleChoiceConfig, YesNoConfig, OpinionScaleConfig, TextConfig, EmailConfig, or null for statement)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Event creators can create a new survey experience and add their first survey step in under 60 seconds
- **SC-002**: Event creators can configure all fields for any step type and see changes reflected in preview within 1 second
- **SC-003**: Drag-and-drop reordering of survey steps succeeds 100% of the time on both desktop and mobile devices
- **SC-004**: All survey step configurations persist correctly with zero data loss after page reload
- **SC-005**: Survey editor loads and renders 10 survey steps in under 2 seconds on mobile devices
- **SC-006**: Step validation errors appear immediately (within 500ms) when creator attempts to save invalid configuration
- **SC-007**: 90% of event creators successfully create a multi-step survey (3+ steps) on their first attempt
- **SC-008**: Mobile touch targets for all survey editor controls meet or exceed 44x44px with 100% compliance

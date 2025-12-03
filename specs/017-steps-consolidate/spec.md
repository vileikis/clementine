# Feature Specification: Steps Consolidation (Experience-Scoped Steps)

**Feature Branch**: `017-steps-consolidate`
**Created**: 2025-12-03
**Status**: Draft
**Input**: Phase 3: Steps Consolidation - Refactor steps module to be experience-scoped, consolidate duplicated step logic, add ai-transform step type, remove experience-picker step type

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Creates AI Transform Step (Priority: P1)

As an experience creator, I want to add an "AI Transform" step to my experience flow so that guests can have their photos processed by AI models to create stunning transformations.

**Why this priority**: The ai-transform step is the core new capability being added. Without it, experiences cannot leverage AI-powered photo transformations, which is central to the platform's value proposition.

**Independent Test**: Can be fully tested by opening the experience editor, clicking "Add Step", selecting "AI Transform" from the step picker, configuring the model and prompt, and saving. The step should appear in the experience flow with correct defaults.

**Acceptance Scenarios**:

1. **Given** I am editing an experience, **When** I click "Add Step" and select "AI Transform", **Then** a new ai-transform step is added to the experience with default configuration (empty prompt, default title "AI Transform", default CTA "Generate")
2. **Given** I have added an ai-transform step, **When** I configure the model, prompt, and variables, **Then** the configuration is saved and persists on page reload
3. **Given** I am viewing the step picker, **When** I look for available step types, **Then** I see "AI Transform" as an option but do NOT see "Experience Picker"

---

### User Story 2 - Admin Manages Experience Steps via Single Interface (Priority: P1)

As an experience creator, I want all step operations (create, read, update, delete, reorder) to work consistently through a single unified interface so that I have a reliable and predictable editing experience.

**Why this priority**: Consolidating duplicated step logic eliminates bugs from divergent implementations and ensures maintainability. This is foundational for all step-related functionality.

**Independent Test**: Can be tested by performing CRUD operations on steps within an experience and verifying all operations complete successfully with immediate UI feedback.

**Acceptance Scenarios**:

1. **Given** I am in the experience editor, **When** I create a step, **Then** the step is saved to the experience's steps collection and appears in the UI
2. **Given** I have multiple steps in an experience, **When** I drag to reorder steps, **Then** the new order is persisted and reflected correctly
3. **Given** I have a step in an experience, **When** I update its configuration, **Then** changes are saved and the step reflects the updated configuration
4. **Given** I have a step in an experience, **When** I delete the step, **Then** it is removed from both the UI and the database

---

### User Story 3 - Steps are Scoped to Experiences (Not Journeys) (Priority: P1)

As a system administrator, I want steps to be stored and accessed under the experiences collection so that the data model aligns with the target architecture and removes legacy journey dependencies.

**Why this priority**: This is a structural refactoring that enables the entire scalable architecture roadmap. Without experience-scoped steps, subsequent phases cannot proceed.

**Independent Test**: Can be verified by checking the Firestore database path for steps shows `/experiences/{experienceId}/steps/{stepId}` and that no references to "journey" exist in the steps module.

**Acceptance Scenarios**:

1. **Given** I create a new step in an experience, **When** I check the database, **Then** the step is stored at `/experiences/{experienceId}/steps/{stepId}`
2. **Given** the steps module code, **When** I search for "journey" references, **Then** zero results are found
3. **Given** a step record, **When** I examine its fields, **Then** it contains `experienceId` and does NOT contain `journeyId`

---

### User Story 4 - Sessions Work with Experiences (Priority: P2)

As a guest interacting with an experience, I want my session to correctly resolve experience data so that I can complete the flow without errors.

**Why this priority**: Sessions are downstream consumers of experiences. While critical for production, the admin editing experience (P1 stories) must work first before guest-facing flows are relevant.

**Independent Test**: Can be tested by creating a session for an experience and verifying the session correctly loads the experience and its steps.

**Acceptance Scenarios**:

1. **Given** an experience with steps exists, **When** a new session is created for that experience, **Then** the session correctly references the experience (not a journey)
2. **Given** a session is active, **When** the session needs to fetch steps order, **Then** it retrieves the order from the experience's `stepsOrder` field

---

### Edge Cases

- What happens when an experience has zero steps? The experience editor should display an empty state prompting the user to add a step.
- How does the system handle existing "experience-picker" steps in production data? They should be flagged during migration review and manually removed or converted.
- What happens if a step references a deleted experience? The step should be orphaned and not appear in any UI. Database cleanup should remove orphaned steps.
- What happens when the ai-transform step has no model configured? The step should save but display a validation warning indicating configuration is incomplete.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store steps in the Firestore collection path `/experiences/{experienceId}/steps/{stepId}`
- **FR-002**: Step schema MUST include `experienceId` as a required field
- **FR-003**: Step schema MUST NOT include `journeyId` field
- **FR-004**: System MUST provide `ai-transform` as a selectable step type in the step picker
- **FR-005**: The `ai-transform` step type MUST support configuration for: model identifier, prompt template, input variables array, and output type (image/video/gif)
- **FR-006**: System MUST remove `experience-picker` from the available step types
- **FR-007**: All step CRUD operations MUST be available from a single source module (`features/steps/actions`)
- **FR-008**: The experiences module MUST import step operations from `@/features/steps/actions` (not local actions)
- **FR-009**: Step reordering MUST update the experience's `stepsOrder` field
- **FR-010**: Sessions module MUST retrieve experience data using experience repository (not journey repository)
- **FR-011**: Default values for ai-transform step MUST be: title "AI Transform", CTA "Generate", empty prompt, empty variables array
- **FR-012**: The steps module MUST have zero imports from `features/journeys/`
- **FR-013**: `features/experiences/actions/steps.ts` MUST be deleted (consolidation)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: AI Transform step editor MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Step picker modal MUST be scrollable and usable on mobile devices
- **MFR-003**: AI Transform configuration form fields MUST be readable and interactive on mobile

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: `AiTransformConfig` schema MUST be defined using Zod for runtime validation
- **TSR-002**: All step action parameters MUST be validated with Zod schemas before database operations
- **TSR-003**: `StepType` union MUST be updated to include `ai-transform` and exclude `experience-picker`
- **TSR-004**: TypeScript strict mode MUST pass with zero errors after refactoring

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: All step write operations (create/update/delete) MUST use Admin SDK via Server Actions
- **FAR-002**: Step reordering MUST atomically update both the step document and the experience's `stepsOrder` field
- **FAR-003**: Zod schemas for steps and ai-transform config MUST remain in `features/steps/schemas/`

### Key Entities *(include if feature involves data)*

- **Step**: A single screen configuration within an experience flow. Contains type, configuration, display properties, and reference to parent experience via `experienceId`.
- **AiTransformConfig**: Configuration object for ai-transform step type. Contains model identifier, prompt template with variable placeholders, array of variable mappings, and output type.
- **AiTransformVariable**: Mapping object defining how a variable in the prompt is populated. Contains key (variable name), source type (capture/input/static), and optional reference to source step.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can add, configure, and save an ai-transform step within the experience editor in under 2 minutes
- **SC-002**: All step CRUD operations complete successfully with no errors when tested through the experience editor
- **SC-003**: Code search for "journey" in the steps module returns zero results (verified via grep)
- **SC-004**: `pnpm type-check` passes with zero TypeScript errors
- **SC-005**: `pnpm lint` passes with no linting errors
- **SC-006**: `pnpm build` completes successfully
- **SC-007**: Experience editor loads and displays steps from the new collection path without errors
- **SC-008**: The step picker displays ai-transform and does NOT display experience-picker

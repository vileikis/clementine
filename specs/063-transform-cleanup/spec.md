# Feature Specification: Transform Cleanup & Guardrails

**Feature Branch**: `063-transform-cleanup`
**Created**: 2026-02-06
**Status**: Draft
**Input**: Remove deprecated transform nodes code paths and add guardrails for outcome-based architecture

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clean Experience Editor Navigation (Priority: P1)

As an experience creator, when I open the experience editor, I should only see the relevant tabs (Create) without any deprecated Generate/Transform Nodes options, so I'm not confused by outdated functionality.

**Why this priority**: This is user-facing and directly impacts the creator experience. Removing deprecated UI prevents confusion and ensures creators use the correct workflow.

**Independent Test**: Can be fully tested by navigating to any experience editor and verifying only the Create tab exists; old Generate URLs redirect properly.

**Acceptance Scenarios**:

1. **Given** an experience creator is logged in, **When** they navigate to `/experience/:id`, **Then** they should not see a "Generate" tab in the navigation
2. **Given** a user has bookmarked `/experience/:id/generate`, **When** they visit that URL, **Then** they should be redirected to `/experience/:id/create` without errors
3. **Given** a developer inspects the production bundle, **When** they search for node editor components, **Then** no such components should be present

---

### User Story 2 - Reliable Job Creation with Clear Errors (Priority: P1)

As a guest completing a session, when I submit my responses to create a job, the system should validate all requirements upfront and provide clear error messages if something is misconfigured, rather than failing silently or mid-processing.

**Why this priority**: Job creation is critical to the guest experience. Fail-fast validation with clear errors prevents wasted processing time and improves debuggability.

**Independent Test**: Can be tested by attempting to create jobs with various invalid configurations and verifying appropriate error messages are returned.

**Acceptance Scenarios**:

1. **Given** an experience has not been published, **When** a job creation is attempted, **Then** it should fail immediately with error "experience is not published"
2. **Given** a published experience has no outcome configured, **When** a job creation is attempted, **Then** it should fail immediately with error "experience has no outcome configured"
3. **Given** a session has no responses, **When** a job creation is attempted, **Then** it should fail immediately with error "session has no responses"
4. **Given** an experience uses an unimplemented outcome type, **When** a job creation is attempted, **Then** it should fail immediately with a message indicating which type is not supported

---

### User Story 3 - Reliable Job Execution with Clear Errors (Priority: P1)

As a system operator, when a job executes, it should validate its configuration before processing and provide clear, non-retryable errors for configuration issues, so failed jobs have actionable error messages.

**Why this priority**: Runtime validation prevents wasted compute resources and provides clear debugging information for failed jobs.

**Independent Test**: Can be tested by creating jobs with various invalid outcome configurations and verifying appropriate errors are thrown during execution.

**Acceptance Scenarios**:

1. **Given** an image outcome with missing image generation config, **When** the job executes, **Then** it should fail with error "Image outcome missing configuration"
2. **Given** an image outcome with AI enabled but empty prompt, **When** the job executes, **Then** it should fail with error "Image outcome has empty prompt"
3. **Given** an image outcome referencing a non-existent capture step, **When** the job executes, **Then** it should fail with error indicating which step was not found
4. **Given** an image outcome with a capture step that has no media, **When** the job executes, **Then** it should fail with error indicating no media was captured

---

### User Story 4 - Predictable System Behavior Without Silent Fallbacks (Priority: P2)

As a developer maintaining the system, when deprecated code paths exist, the system should never silently fall back to old behavior, ensuring predictable execution and easier debugging.

**Why this priority**: Silent fallbacks create unpredictable behavior and make debugging extremely difficult. Explicit failures are essential for maintainability.

**Independent Test**: Can be verified through code audit ensuring no fallback patterns exist in critical paths.

**Acceptance Scenarios**:

1. **Given** a session with legacy `answers` field but no `responses`, **When** the system reads session data, **Then** it should treat the session as having no responses (not fall back to answers)
2. **Given** an experience with legacy `transformNodes` but no `outcome`, **When** job execution is attempted, **Then** it should fail with "no outcome configured" (not fall back to transform nodes)
3. **Given** any code path that previously used deprecated fields, **When** those fields are accessed, **Then** the access should be for migration/warning purposes only, never for execution logic

---

### User Story 5 - Developer Awareness of Deprecated Usage (Priority: P3)

As a developer working locally, when I interact with data that still contains deprecated fields, I should see console warnings alerting me to the deprecation, so I can proactively clean up stale configurations.

**Why this priority**: Developer awareness helps catch issues during development before they reach production. Lower priority as it's development-only and doesn't affect production users.

**Independent Test**: Can be tested by loading experiences with deprecated fields in development mode and observing console warnings.

**Acceptance Scenarios**:

1. **Given** an experience with `transformNodes` configured, **When** it is loaded in development mode, **Then** a deprecation warning should appear in the console
2. **Given** a session with `answers` or `capturedMedia` fields, **When** it is processed in development mode, **Then** a deprecation warning should appear in the console
3. **Given** the same scenarios in production mode, **When** the data is processed, **Then** no console warnings should appear

---

### User Story 6 - Updated Documentation Reflecting New Architecture (Priority: P3)

As a developer onboarding to the project, when I read the documentation, it should accurately reflect the current outcome-based architecture without references to deprecated transform node workflows.

**Why this priority**: Documentation accuracy is important but has lower immediate impact on system functionality. It primarily affects new developer onboarding.

**Independent Test**: Can be verified by reviewing documentation files for accuracy against current architecture.

**Acceptance Scenarios**:

1. **Given** a developer reads `functions/README.md`, **When** they look for architecture information, **Then** it should describe outcome-based processing (not transform pipelines)
2. **Given** a developer inspects schema definitions, **When** they encounter deprecated fields, **Then** those fields should have `@deprecated` JSDoc annotations
3. **Given** a developer searches project documentation, **When** they search for "transform node workflow", **Then** no such references should exist

---

### Edge Cases

- What happens when a session has both `responses` and legacy `answers` fields? System should only read `responses` and ignore `answers`.
- What happens when a job is created for a draft experience that was previously published but then unpublished? Job creation should fail because `published` is null.
- What happens when multiple capture steps exist but one has empty media? Job should fail with specific error about which step is missing media.
- What happens if Cloud Functions receive a request with legacy data structure during migration? Functions should fail fast with clear error rather than attempting to process.

## Requirements *(mandatory)*

### Functional Requirements

#### UI Removal
- **FR-001**: System MUST remove the Generate tab from the experience editor navigation
- **FR-002**: System MUST remove all node editor components (type selector, configuration forms, preview)
- **FR-003**: System MUST redirect `/experience/:id/generate` URLs to `/experience/:id/create`
- **FR-004**: System MUST ensure node editor components are not included in the production bundle

#### Deprecated Code Path Removal
- **FR-005**: System MUST NOT write to `session.answers` field from frontend
- **FR-006**: System MUST NOT write to `session.capturedMedia` field from frontend
- **FR-007**: System MUST only write to `session.responses` for session data
- **FR-008**: Cloud Functions MUST only read `responses` from job snapshot (not `answers` or `capturedMedia`)
- **FR-009**: Cloud Functions MUST extract capture media from `response.context` as `MediaReference[]`

#### Transform Node Execution Removal
- **FR-010**: System MUST remove node executor registry from Cloud Functions
- **FR-011**: System MUST remove individual node executors (except reusable utilities)
- **FR-012**: System MUST NOT read `snapshot.transformNodes` for execution purposes
- **FR-013**: System MUST use `runOutcome()` as the only execution entry point

#### Job Creation Guardrails
- **FR-014**: System MUST reject job creation when `experience.published` is null
- **FR-015**: System MUST reject job creation when `published.outcome.type` is null
- **FR-016**: System MUST reject job creation when session has no `responses`
- **FR-017**: System MUST reject job creation for unimplemented outcome types
- **FR-018**: All job creation validation errors MUST be non-retryable with descriptive messages

#### Runtime Guardrails
- **FR-019**: Image outcome executor MUST fail when `imageGeneration` config is missing
- **FR-020**: Image outcome executor MUST fail when AI is enabled but prompt is empty
- **FR-021**: Image outcome executor MUST fail when referenced capture step does not exist
- **FR-022**: Image outcome executor MUST fail when capture step has no media in `data`
- **FR-023**: All runtime validation errors MUST be non-retryable with descriptive messages

#### No Silent Fallbacks
- **FR-024**: System MUST NOT use nullish coalescing (`??`) to fall back to deprecated fields
- **FR-025**: System MUST NOT use try/catch to fall back to old execution paths
- **FR-026**: System MUST NOT read deprecated fields (`answers`, `capturedMedia`, `transformNodes`) for execution logic

#### Deprecation Warnings
- **FR-027**: System MUST emit console warnings for deprecated `transformNodes` usage in development mode only
- **FR-028**: System MUST emit console warnings for deprecated `answers`/`capturedMedia` usage in development mode only

#### Documentation
- **FR-029**: Documentation MUST reflect outcome-based architecture
- **FR-030**: Deprecated schema fields MUST have `@deprecated` JSDoc annotations

### Key Entities

- **Experience**: Contains `draft` and `published` configurations; `published.outcome` is required for job creation
- **Session**: Guest session data; `responses[]` is the only valid data source (deprecated: `answers`, `capturedMedia`)
- **Job**: Processing job created from session; reads from `sessionInputs.responses`
- **Outcome**: Configuration for how to process session data (e.g., `imageOutcome` with `imageGeneration` config)
- **Response**: Individual step response containing `stepId`, `stepName`, `data`, and `context`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of Generate tab URL requests redirect to Create tab without 404 errors
- **SC-002**: Production bundle size decreases by removing unused node editor components
- **SC-003**: 0 occurrences of writes to `session.answers` or `session.capturedMedia` in codebase
- **SC-004**: 100% of job creation failures due to configuration issues include actionable error messages
- **SC-005**: 0 silent fallbacks to deprecated execution paths in production code
- **SC-006**: All deprecated schema fields have `@deprecated` annotations
- **SC-007**: Code audit confirms no runtime code reads `transformNodes`, `answers`, or `capturedMedia` for execution logic

## Assumptions

- The migration to outcome-based architecture is complete (PRD 3 is done)
- All active sessions use the new `responses[]` format
- Legacy sessions with only `answers`/`capturedMedia` can be safely abandoned
- Only `image` outcome type is currently implemented; other types will fail fast
- Development mode can be detected via `process.env.NODE_ENV`

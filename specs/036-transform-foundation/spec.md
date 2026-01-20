# Feature Specification: Transform Pipeline Foundation & Schema

**Feature Branch**: `036-transform-foundation`
**Created**: 2026-01-20
**Status**: Draft
**Input**: User description: "Phase 1: Foundation & Schema - Establish data model changes to support transform pipeline"

## Clarifications

### Session 2026-01-20

- Q: Where should shared schemas (job, session, experience, event) be defined given cloud functions need access? → A: B2 - Comprehensive shared kernel in `packages/shared/`. All pipeline-relevant schemas consolidated there as single source of truth. Both app and functions import from shared. Unify existing `entities/` and `schemas/` directories into single `schemas/` folder.
- Q: What data should the job document snapshot at creation time? → A: Full execution context - transform config (nodes, variableMappings, outputFormat) + event overlay settings + applyOverlay flag + experience/event version numbers. This enables full reproducibility and debugging without querying other documents.
- Q: How should existing steps (created before name field) be migrated? → A: Lazy migration - generate name on first load/access if missing, persist on next edit. No one-time migration script needed.
- Q: Should session sync job progress for real-time display? → A: No - session only has `jobStatus` (not `jobProgress`). Guests see simple loading state. Decision on whether to add client-side job subscription deferred to later phase.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Experience Creator Adds Steps with Names (Priority: P1)

Experience creators need to add steps to their experience and have each step automatically assigned a human-readable name for easy identification and reference in the transform pipeline.

**Why this priority**: Step naming is foundational - transform variable mappings reference steps by name, making this the most critical prerequisite for the entire pipeline feature.

**Independent Test**: Can be fully tested by creating an experience with multiple steps and verifying each step receives an auto-generated name that can be edited.

**Acceptance Scenarios**:

1. **Given** a creator is adding a new step to an experience, **When** the step is created, **Then** it automatically receives a human-readable name (e.g., "Photo Capture 1", "Scale Question 2")
2. **Given** a step has an auto-generated name, **When** the creator edits the name, **Then** the new name is saved and persists
3. **Given** a step with a name exists, **When** the step is viewed in the experience editor, **Then** the name is displayed for identification

---

### User Story 2 - Experience Schema Supports Transform Configuration (Priority: P1)

Experience creators need the experience data model to support an optional transform configuration slot, separate from the steps array, so that transform pipelines can be configured and stored.

**Why this priority**: Without schema support for transform configuration, no transform features can be built. This is the data foundation.

**Independent Test**: Can be fully tested by creating/updating an experience with transform configuration set to null (no transform) or with a valid transform config object.

**Acceptance Scenarios**:

1. **Given** an existing experience without transform, **When** the experience is loaded, **Then** `transform` field defaults to null and the experience functions normally
2. **Given** a creator configures a transform, **When** the experience is saved, **Then** the transform configuration is stored in the experience document
3. **Given** an experience with transform config, **When** the experience is published, **Then** the published version includes the transform configuration

---

### User Story 3 - Transform Jobs Can Be Tracked (Priority: P2)

The system needs to track transform pipeline executions as job documents, allowing sessions to reference their associated job and monitor processing status.

**Why this priority**: Job tracking is essential for the async processing model but depends on the schema foundations being in place first.

**Independent Test**: Can be fully tested by creating a job document with required fields and verifying it can be read and status can be updated.

**Acceptance Scenarios**:

1. **Given** a transform job is created, **When** the job document is written, **Then** it contains all required fields (sessionId, projectId, experienceId, status, timestamps)
2. **Given** a job exists, **When** its status changes (pending to running to completed/failed), **Then** the status updates are persisted correctly
3. **Given** a session has a job, **When** the job status changes, **Then** the session document reflects the job status

---

### User Story 4 - Session Tracks Transform Job Reference (Priority: P2)

Guest sessions need to track their associated transform job so the client can monitor processing progress and display results.

**Why this priority**: Session-job linkage enables the real-time status sync that powers the guest experience during transform processing.

**Independent Test**: Can be fully tested by updating a session with jobId and jobStatus fields and verifying they persist correctly.

**Acceptance Scenarios**:

1. **Given** a session without a job, **When** a transform job starts, **Then** the session.jobId is set to the new job's ID
2. **Given** a session with a jobId, **When** the job status changes, **Then** session.jobStatus reflects the current job status
3. **Given** a session with completed job, **When** the result is ready, **Then** session.resultMedia contains the transform output

---

### User Story 5 - Admins Can Read Jobs, Server Can Write (Priority: P3)

Security rules must ensure only admins can read job documents and only server-side code can write to jobs, protecting transform execution integrity.

**Why this priority**: Security rules are important but can be implemented after the core schemas are in place.

**Independent Test**: Can be fully tested by attempting admin read (should succeed), guest read (should fail), and client write (should fail) operations on job documents.

**Acceptance Scenarios**:

1. **Given** a project admin, **When** they request a job document, **Then** read access is granted
2. **Given** a guest user, **When** they request a job document directly, **Then** read access is denied
3. **Given** any client-side code, **When** it attempts to write to a job document, **Then** write access is denied

---

### Edge Cases

- What happens when a step is deleted that has a name referenced elsewhere? The name field is on the step itself - deleting the step removes the name. Transform references (handled in later phases) will need validation.
- How does the system handle experiences created before the name field existed? Lazy migration - names are auto-generated on first load/access based on step type and position, then persisted on next edit. No one-time migration script required.
- What happens if transform config validation fails on save? The save operation should reject with a clear validation error message.
- How are duplicate step names handled? Names do not need to be unique - they are for display/identification only. Step IDs remain the unique identifier.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add a `name` field to the base step schema with type string, minimum 1 character, maximum 50 characters
- **FR-002**: System MUST auto-generate step names on creation using format "{StepTypeDisplayName} {N}" where N is the count of that step type
- **FR-003**: Users MUST be able to edit step names after creation
- **FR-004**: System MUST add a `transform` field to experience config schema that accepts null or a valid TransformConfig object
- **FR-005**: System MUST default `transform` to null for new experiences and when not specified
- **FR-006**: System MUST NOT alter existing experience behavior when `transform` is null
- **FR-007**: System MUST define a job document schema including: id, sessionId, projectId, experienceId, stepId, status, progress, output, error, timestamps, and snapshots of: session inputs (answers, capturedMedia), transform config (nodes, variableMappings, outputFormat), event overlay settings, applyOverlay flag, and experience/event version numbers
- **FR-008**: System MUST support job status values: pending, running, completed, failed, cancelled
- **FR-009**: System MUST add `jobId` (nullable string) field to session schema
- **FR-010**: System MUST add `jobStatus` (nullable enum) field to session schema matching job status values
- **FR-011**: System MUST configure Firestore security rules allowing project admins to read job documents
- **FR-012**: System MUST configure Firestore security rules denying all client-side writes to job documents
- **FR-013**: System MUST validate transform config structure when saving experiences with non-null transform

### Key Entities

- **Step**: Represents a single step in an experience flow. Gains a new `name` field for human-readable identification. Existing fields (id, type, config) remain unchanged.

- **Experience Config**: Container for experience definition including steps array. Gains a new `transform` field (nullable) to hold transform pipeline configuration.

- **Transform Config**: Configuration for the transform pipeline including variable mappings, node definitions, and output format. Embedded within experience config (not a separate collection).

- **Job**: Tracks execution of a transform pipeline. Contains reference to session, experience, status tracking, and full execution context snapshot (session inputs, transform config, event overlay settings, applyOverlay flag, version numbers). Snapshots ensure immutability and audit trail - changes to experience/event after job creation do not affect job execution. Stored in `/projects/{projectId}/jobs/{jobId}`.

- **Session**: Existing entity tracking guest progress through an experience. Gains `jobId` and `jobStatus` fields to link to and track transform job execution.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All new steps created in the system receive an auto-generated name within 1 second of creation
- **SC-002**: 100% of existing experiences continue to function identically after schema update (backward compatibility)
- **SC-003**: Experience save operations complete within the current performance baseline when transform is null
- **SC-004**: Job documents can be created and status updated in under 500ms
- **SC-005**: Session documents correctly reflect job status changes within 2 seconds of the job update
- **SC-006**: Admin users can successfully read job documents while non-admin users receive permission denied errors
- **SC-007**: All schema validations produce clear, actionable error messages when validation fails

## Assumptions

- The existing step schema uses Zod for validation, and the new `name` field will follow the same pattern
- Experience documents already support a draft/published structure where the transform field will be added
- The jobs collection path `/projects/{projectId}/jobs/{jobId}` does not conflict with existing collections
- Existing Firestore security rules infrastructure supports the `isProjectAdmin()` helper function
- Step type display names are already defined or can be derived from the step type registry
- Auto-generation of step names will use simple incrementing numbers per step type (not globally unique)
- Shared schemas will be consolidated in `packages/shared/src/schemas/` as a shared kernel pattern, with existing `entities/` merged into `schemas/`

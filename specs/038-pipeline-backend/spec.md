# Feature Specification: Backend Pipeline Infrastructure

**Feature Branch**: `038-pipeline-backend`
**Created**: 2026-01-21
**Status**: Draft
**Input**: User description: "Phase 2 of Transform Pipeline - Build execution backbone without actual node processing"

**Related Documents**:
- [Transform Pipeline PRD Phases](/requirements/transform-pipeline/prd-phases.md)
- [Transform Pipeline Spec](/requirements/transform-pipeline/spec.md)
- [Transform Pipeline Decisions](/requirements/transform-pipeline/decisions.md)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Triggers Transform Pipeline (Priority: P1)

When a guest completes all experience steps that include a transform configuration, the system initiates a background processing job to transform their captured content.

**Why this priority**: This is the core user-facing flow. Without it, guests cannot receive AI-transformed results from their experience participation.

**Independent Test**: Can be tested by completing an experience with a transform configured and verifying a job is created and tracked in the session.

**Acceptance Scenarios**:

1. **Given** a guest has completed all experience steps, **When** the transform step triggers, **Then** the system creates a pending job and returns a job ID to the client.

2. **Given** a guest triggers the transform, **When** the job is created, **Then** the session document reflects the job ID and initial status.

3. **Given** a job has been queued, **When** the Cloud Task picks it up, **Then** the job status transitions from "pending" to "running" and the session reflects this change.

---

### User Story 2 - System Executes Job to Completion (Priority: P1)

The background processing system executes the queued job, updates progress, and marks it complete when done.

**Why this priority**: Essential for the end-to-end flow. This demonstrates the full lifecycle of a transform job.

**Independent Test**: Can be tested by creating a job and verifying it transitions through pending → running → completed states with the session document staying in sync.

**Acceptance Scenarios**:

1. **Given** a job is in "running" status, **When** processing completes (stub implementation), **Then** the job status transitions to "completed".

2. **Given** a job completes, **When** the status changes, **Then** the session document's jobStatus field reflects "completed".

3. **Given** a job is running, **When** processing takes place, **Then** the job document contains progress information (current node, total nodes, percentage).

---

### User Story 3 - System Handles Processing Failures (Priority: P2)

When a job fails during processing, the system records error details and provides the client with a sanitized error message.

**Why this priority**: Error handling is critical for user experience but secondary to the happy path. Users need clear feedback when things go wrong.

**Independent Test**: Can be tested by simulating a failure condition and verifying the job transitions to "failed" with sanitized client-facing message while detailed logs are available server-side.

**Acceptance Scenarios**:

1. **Given** a job is processing, **When** an error occurs, **Then** the job status transitions to "failed" with an error code and sanitized message.

2. **Given** a job has failed, **When** the client queries the session, **Then** the session reflects the failed status without exposing technical details.

3. **Given** a job failure, **When** error details are logged, **Then** full technical error information is available in server logs for debugging.

---

### User Story 4 - System Enforces Processing Timeout (Priority: P2)

Long-running jobs that exceed the timeout limit are automatically terminated to prevent resource exhaustion.

**Why this priority**: Protects system resources and provides predictable behavior. Important for reliability but not part of the core happy path.

**Independent Test**: Can be tested by configuring a timeout and verifying jobs exceeding that duration are marked as failed with a timeout error.

**Acceptance Scenarios**:

1. **Given** a job is processing, **When** processing exceeds 10 minutes, **Then** the job is terminated and marked as failed with a TIMEOUT error code.

2. **Given** a timeout occurs, **When** the session is updated, **Then** the client can see the job failed due to timeout.

---

### User Story 5 - Admin Monitors Job Status (Priority: P3)

Administrators can view job status and details for debugging and support purposes.

**Why this priority**: Operational visibility is important but not required for MVP guest experience.

**Independent Test**: Can be tested by verifying an admin can read job documents for their projects.

**Acceptance Scenarios**:

1. **Given** an admin is authenticated, **When** they query jobs for their project, **Then** they can see job status, progress, and any error details.

---

### Edge Cases

- What happens when a guest triggers transform but a job already exists for this session?
  - Return conflict error (409) - job already in progress
- What happens if the session does not exist?
  - Return not found error (404) - session not found
- What happens if the experience has no transform configuration?
  - Return not found error (404) - transform config not found
- What happens if the Cloud Task service is unavailable?
  - Return internal error (500) - the job document is still created but queuing fails
- What happens if job document creation fails?
  - Return internal error (500) - request fails atomically, no partial state

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an endpoint that accepts a session ID and step ID and initiates a transform pipeline job.
- **FR-002**: System MUST create a job document with status "pending" before queuing for processing.
- **FR-003**: System MUST update the session document with the job ID and status when a job is created.
- **FR-004**: System MUST transition job status to "running" when processing begins.
- **FR-005**: System MUST keep session document's jobStatus field synchronized with job status changes.
- **FR-006**: System MUST transition job status to "completed" when processing finishes successfully.
- **FR-007**: System MUST transition job status to "failed" when processing encounters an error.
- **FR-008**: System MUST store detailed error information in the job document while providing sanitized messages suitable for client display.
- **FR-009**: System MUST enforce a maximum processing time of 10 minutes per job.
- **FR-010**: System MUST mark jobs exceeding the timeout as failed with a TIMEOUT error code.
- **FR-011**: System MUST return a conflict error if a job is already in progress for the given session.
- **FR-012**: System MUST validate that the session exists before creating a job.
- **FR-013**: System MUST validate that the experience has a transform configuration before creating a job.
- **FR-014**: System MUST return the job ID to the client upon successful job creation.
- **FR-015**: System MUST support stub processing (no actual node execution) to complete the infrastructure.

### Key Entities

- **Job**: Represents a transform pipeline execution. Contains status (pending/running/completed/failed/cancelled), progress tracking, input snapshot, output reference, error details, and timestamps.
- **Session** (updated): Extended with jobId and jobStatus fields to track the associated transform job.
- **Experience** (reference): The experience document contains the transform configuration that defines the pipeline to execute.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A guest triggering a transform receives a job ID within 3 seconds.
- **SC-002**: Job status transitions (pending → running, running → completed/failed) are reflected in the session document within 2 seconds of occurring.
- **SC-003**: 100% of jobs exceeding 10 minutes are automatically terminated and marked as failed.
- **SC-004**: Client-facing error messages contain no internal technical details, system paths, or stack traces.
- **SC-005**: All job lifecycle events (creation, status changes, completion, failure) are logged for operational monitoring.
- **SC-006**: Administrators can view job details for any job in their project.

## Assumptions

- The job schema defined in Phase 1 (spec.md Section 2.3) is implemented and available.
- The session schema updates from Phase 1 (jobId, jobStatus fields) are in place.
- Firebase Cloud Tasks is available and configured in the project.
- The transform configuration schema is embedded in the experience document (per decision D23).
- Security rules allow server-side (Admin SDK) writes to job documents and session updates.

# Feature Specification: Transform Pipeline Trigger on Experience Completion

**Feature Branch**: `053-transform-trigger`
**Created**: 2026-01-31
**Status**: Draft
**Input**: User description: "Trigger transform pipeline on experience completion and show job status in SharePage and PreviewModal"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Completes Main Experience with Transform (Priority: P1)

A guest completes all steps of a main experience that has a configured transform pipeline. Upon completion, the system automatically triggers the transform processing and navigates the guest to the share page where they see real-time progress until their transformed media is ready.

**Why this priority**: This is the core guest journey - the primary value proposition of the platform is delivering AI-transformed media to guests. Without this working, the product delivers no value.

**Independent Test**: Can be fully tested by completing an experience with transform configuration and verifying the share page shows loading → ready transition with job status updates.

**Acceptance Scenarios**:

1. **Given** a guest has completed all steps of an experience with transform configured (transform.nodes.length > 0), **When** the experience completes, **Then** the system triggers the transform pipeline and navigates to the share page showing job status.

2. **Given** a guest is on the share page with a pending/running job, **When** the job status changes to 'completed', **Then** the share page displays the ready state with transformed media.

3. **Given** a guest is on the share page with a running job, **When** the job status changes to 'failed', **Then** the share page displays an appropriate error message.

4. **Given** an experience has no transform configuration (transform is null or nodes is empty), **When** the experience completes, **Then** the system does NOT trigger transform pipeline and navigates directly to share page with ready state (showing mock media for now).

---

### User Story 2 - Preview Mode Shows Transform Job Status (Priority: P2)

An experience creator previews an experience with transform configuration. After completing all steps, the preview modal shows the transform job progress with friendly status messages until completion.

**Why this priority**: Creators need to preview the full experience including transform processing to validate their configuration before publishing.

**Independent Test**: Can be fully tested by opening preview modal, completing experience steps, and verifying transform job status displays with appropriate loading/completion states.

**Acceptance Scenarios**:

1. **Given** a creator is previewing an experience with transform configured, **When** they complete all steps, **Then** the preview modal shows a loading state with current job status.

2. **Given** the preview modal is showing transform job in progress, **When** job status updates (pending → running → completed), **Then** the status message updates accordingly.

3. **Given** the preview modal shows job status 'completed', **When** the view renders, **Then** a completion message is displayed indicating the transform is done.

4. **Given** an experience being previewed has no transform configuration, **When** the creator completes all steps, **Then** the preview modal shows the completion toast immediately (existing behavior).

---

### User Story 3 - Pregate and Preshare Experiences Skip Transform (Priority: P3)

Pregate (before main) and preshare (after main) experiences are auxiliary experiences that never trigger transform processing, regardless of their configuration.

**Why this priority**: Pregate/preshare are used for consent forms, surveys, and promotional content - they don't produce media that needs AI transformation. This is architectural correctness rather than user-facing feature.

**Independent Test**: Can be fully tested by completing pregate/preshare experiences and verifying no transform pipeline is triggered.

**Acceptance Scenarios**:

1. **Given** a guest completes a pregate experience, **When** the experience finishes, **Then** the system does NOT trigger transform pipeline and proceeds to main experience navigation.

2. **Given** a guest completes a preshare experience, **When** the experience finishes, **Then** the system does NOT trigger transform pipeline and proceeds to share page navigation.

---

### Edge Cases

- What happens when transform job fails? → Share page shows error state with option to retry or contact support.
- What happens when session already has an active job? → System prevents duplicate trigger (409 conflict from API).
- What happens when user refreshes share page while job is running? → Session subscription resumes and shows current job status.
- What happens when job takes longer than expected? → Show encouraging message after threshold (e.g., 30 seconds).

## Requirements *(mandatory)*

### Functional Requirements

**Transform Trigger Logic:**

- **FR-001**: System MUST trigger transform pipeline ONLY when experience has transform configuration with nodes.length > 0
- **FR-002**: System MUST trigger transform pipeline ONLY for main experiences (ExperiencePage), NOT for pregate or preshare experiences
- **FR-003**: System MUST trigger transform pipeline after session is marked as completed
- **FR-004**: System MUST pass sessionId and a stepId to the transform pipeline endpoint (stepId can be the last capture step or first step)

**Share Page Job Status:**

- **FR-005**: Share page MUST subscribe to session updates to receive real-time jobStatus changes
- **FR-006**: Share page MUST show loading state when session.jobStatus is 'pending' or 'running'
- **FR-007**: Share page MUST show ready state when session.jobStatus is 'completed'
- **FR-008**: Share page MUST show error state when session.jobStatus is 'failed'
- **FR-009**: Share page MUST continue showing mock media URL when job is completed (actual media integration is deferred)

**Preview Modal Job Status:**

- **FR-010**: Preview modal MUST show loading spinner with friendly text when transform job is in progress
- **FR-011**: Preview modal MUST display current job status in human-readable form
- **FR-012**: Preview modal MUST show completion message when job status is 'completed'
- **FR-013**: Preview modal MUST show error message when job status is 'failed'

**Experience Completion Flow:**

- **FR-014**: ExperiencePage MUST trigger transform (if configured) before navigating to preshare/share
- **FR-015**: System MUST handle experiences without transform by proceeding directly to navigation

### Key Entities

- **Session**: Tracks jobId and jobStatus fields that reflect transform processing state
- **Job**: Backend entity tracking transform execution (pending → running → completed/failed)
- **Experience.transform**: Configuration that determines if transform processing should occur (transform.nodes.length > 0)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of main experiences with transform configuration trigger the transform pipeline on completion
- **SC-002**: 100% of experiences without transform configuration skip pipeline trigger and navigate immediately
- **SC-003**: Share page updates from loading to ready state within 2 seconds of job status changing to 'completed'
- **SC-004**: Preview modal displays job status updates in real-time as they occur
- **SC-005**: Zero duplicate transform triggers for the same session (prevented by API's 409 conflict response)
- **SC-006**: Pregate and preshare experiences never trigger transform pipeline

## Assumptions

1. **stepId parameter**: The transform pipeline requires a stepId. We assume passing the first step ID or last capture step ID is acceptable for job creation purposes.
2. **Session subscription exists**: The SharePage will use the existing useSubscribeSession hook pattern to receive real-time updates.
3. **Mock media continues**: The share page will continue using mock media URL until a separate feature integrates actual job output.
4. **Transform config check**: Checking `experience.published.transform?.nodes?.length > 0` is the correct way to determine if transform should be triggered.
5. **Preview sessions**: Preview mode uses the same session infrastructure and can trigger transform pipeline.

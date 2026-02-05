# Feature Specification: Job + Cloud Functions

**Feature Branch**: `062-job-cloud-functions`
**Created**: 2026-02-05
**Status**: Draft
**Input**: PRD 3 - Job + Cloud Functions: Update job snapshot schema to capture outcome and responses, implement outcome dispatcher and image outcome executor in Cloud Functions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Completes Experience and Receives AI-Generated Image (Priority: P1)

A guest completes an AI photobooth experience by providing inputs and optionally capturing media. The system processes their session using the configured outcome (AI image generation) and delivers the final result.

**Why this priority**: This is the core user-facing functionality that delivers the primary value proposition of the AI photobooth platform. Without this working, guests cannot receive their AI-generated images.

**Independent Test**: Can be fully tested by completing a published experience with AI image generation enabled and verifying the generated image is returned to the guest.

**Acceptance Scenarios**:

1. **Given** a guest has completed all steps in an experience with AI generation enabled, **When** the job is created and processed, **Then** the system generates an AI image using the resolved prompt and returns it to the session.

2. **Given** a guest has captured a photo and the experience uses image-to-image generation, **When** the job processes, **Then** the captured photo is used as the source for AI transformation.

3. **Given** an experience has reference media configured in the outcome, **When** the prompt contains `@{ref:displayName}` mentions, **Then** the reference media is included in the AI generation request.

---

### User Story 2 - Guest Receives Passthrough Image with Overlay (Priority: P2)

A guest captures a photo in an experience configured for passthrough mode (no AI). The system applies any configured overlay and returns the result without AI processing.

**Why this priority**: Passthrough mode supports use cases where brands want simple photo capture with branded overlays, without AI generation. This is a simpler flow that provides value without AI costs.

**Independent Test**: Can be tested by completing an experience with aiEnabled=false and a capture step, verifying the captured image (with overlay if configured) is returned.

**Acceptance Scenarios**:

1. **Given** a guest captures a photo in an experience with aiEnabled=false, **When** the job processes, **Then** the captured photo is returned (with overlay applied if configured).

2. **Given** passthrough mode is configured without a capture step, **When** job creation is attempted, **Then** the system rejects the job with a clear error.

---

### User Story 3 - Prompt Mentions Resolve to Session Data (Priority: P2)

Experience creators can use dynamic prompts that reference guest inputs and captured media using mention syntax. The system resolves these mentions at job execution time.

**Why this priority**: Dynamic prompts are essential for personalized AI generation, allowing guest inputs like name, preferences, or captured photos to influence the output.

**Independent Test**: Can be tested by creating an experience with prompt mentions (`@{step:stepName}`, `@{ref:displayName}`), completing the experience with various inputs, and verifying the resolved prompt contains the correct values.

**Acceptance Scenarios**:

1. **Given** a prompt contains `@{step:stepName}` for a text input step, **When** the prompt is resolved, **Then** the guest's text input replaces the mention.

2. **Given** a prompt contains `@{step:stepName}` for a multi-select step, **When** the prompt is resolved, **Then** the selected values are inserted as a comma-separated list.

3. **Given** a prompt contains `@{step:stepName}` for a capture step, **When** the prompt is resolved, **Then** the captured media is added to the generation request and the mention is replaced with a placeholder.

4. **Given** a prompt contains an unresolved mention (step not found), **When** the prompt is resolved, **Then** a warning is logged and the original mention is preserved.

---

### User Story 4 - Job Snapshot Captures Complete Context (Priority: P1)

When a job is created, the system captures a complete snapshot of session responses and outcome configuration, ensuring jobs can be processed independently of experience changes.

**Why this priority**: Snapshotting is critical for data integrity and consistent job processing. Jobs must be reproducible based on their snapshot, regardless of subsequent experience updates.

**Independent Test**: Can be tested by creating a job, modifying the experience, and verifying the job processes using its original snapshot data.

**Acceptance Scenarios**:

1. **Given** a session has completed with responses, **When** a job is created, **Then** the snapshot includes all session responses in a flattened array.

2. **Given** an experience has a published outcome, **When** a job is created, **Then** the snapshot includes the complete outcome configuration.

3. **Given** an experience has no outcome configured, **When** job creation is attempted, **Then** the system rejects the job with a non-retryable error.

---

### User Story 5 - Session Updated with Job Result (Priority: P2)

After a job successfully completes, the session is updated with the result media so guests can view and share their creation.

**Why this priority**: This completes the guest experience loop, making the generated result accessible for viewing, downloading, and sharing.

**Independent Test**: Can be tested by processing a job to completion and verifying the session document contains the result media reference.

**Acceptance Scenarios**:

1. **Given** a job completes successfully, **When** the result is processed, **Then** the session's resultMedia is updated with the generated asset.

2. **Given** a job completes, **When** the session is updated, **Then** the jobStatus reflects the completed state.

---

### Edge Cases

- What happens when a capture step is referenced but contains no media? System throws a non-retryable error.
- How does the system handle an unsupported outcome type (gif, video)? Dispatcher throws a non-retryable error with clear message.
- What happens when a referenced step name doesn't exist in responses? The mention is preserved in the prompt and a warning is logged.
- How does the system handle missing reference media by displayName? The mention is preserved and a warning is logged.
- What happens when overlay doesn't exist for the specified aspect ratio? Generation succeeds without overlay.

## Requirements *(mandatory)*

### Functional Requirements

#### Job Snapshot Schema

- **FR-001**: Job snapshot MUST include `sessionResponses` as a flattened array of session responses
- **FR-002**: Job snapshot MUST include `outcome` using the existing outcome schema from the experience
- **FR-003**: Job snapshot MUST include `transformNodes` defaulting to empty array (deprecated field for compatibility)
- **FR-004**: Job snapshot MUST include `projectContext` with overlay and experience reference
- **FR-005**: Job snapshot MUST include `experienceVersion` as a positive integer

#### Job Creation

- **FR-006**: Job creation MUST fail with non-retryable error if `outcome.type` is null
- **FR-007**: Job creation MUST fail with non-retryable error if passthrough mode (aiEnabled=false) without captureStepId
- **FR-008**: Job creation MUST snapshot the outcome from the published experience
- **FR-009**: Job creation MUST snapshot session responses from the session

#### Outcome Dispatcher

- **FR-010**: Dispatcher MUST read outcome type from job snapshot (not from external sources)
- **FR-011**: Dispatcher MUST route to the correct outcome executor based on type
- **FR-012**: Dispatcher MUST throw non-retryable error for unimplemented outcome types (gif, video)
- **FR-013**: Dispatcher MUST NOT read or use transformNodes

#### Prompt Resolution

- **FR-014**: System MUST resolve `@{step:stepName}` mentions from session responses by matching stepName
- **FR-015**: System MUST insert text input data as plain text
- **FR-016**: System MUST extract multi-select option values as comma-separated text
- **FR-017**: System MUST add capture step media to the mediaRefs collection
- **FR-018**: System MUST resolve `@{ref:displayName}` mentions from reference media by matching displayName
- **FR-019**: System MUST log warnings for unresolved mentions and preserve original text

#### Image Outcome Executor

- **FR-020**: Passthrough mode (aiEnabled=false) MUST return captured media with optional overlay
- **FR-021**: AI generation mode MUST resolve prompt mentions before calling AI service
- **FR-022**: Image-to-image mode MUST use captured media as source when captureStepId is set
- **FR-023**: System MUST include resolved reference media in AI generation request
- **FR-024**: System MUST apply overlay when one exists for the output aspect ratio
- **FR-025**: System MUST succeed without overlay when none exists for aspect ratio

#### AI Image Generation

- **FR-026**: Media MUST be loaded from storage using filePath (not URL)
- **FR-027**: System MUST handle missing filePath gracefully

#### Session Result

- **FR-028**: Session resultMedia MUST be updated on successful job completion
- **FR-029**: Session jobStatus MUST be updated to reflect job state

### Key Entities

- **JobSnapshot**: Complete point-in-time capture of all data needed for job execution, including session responses, outcome configuration, project context, and experience version.
- **SessionResponse**: Individual step response containing stepId, stepName, stepType, and data (varies by step type: string for text, MediaReference[] for capture, MultiSelectOption[] for multi-select).
- **Outcome**: Configuration defining how job output is generated, including type (image/gif/video), aiEnabled flag, captureStepId, and imageGeneration settings.
- **MediaReference**: Reference to stored media including displayName, filePath, and url.
- **OutcomeContext**: Execution context passed to outcome executors containing job, snapshot, and timing information.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Jobs with valid outcome configurations complete successfully with generated output
- **SC-002**: Passthrough mode jobs return captured media within 5 seconds (excluding upload time)
- **SC-003**: Prompt mention resolution handles all response types correctly (text, multi-select, capture)
- **SC-004**: 100% of jobs with invalid configurations (no outcome, passthrough without capture) are rejected at creation time with clear error messages
- **SC-005**: Session result media is updated within 2 seconds of job completion
- **SC-006**: Unimplemented outcome types (gif, video) are rejected with descriptive error messages

## Assumptions

- The existing `outcomeSchema` and `sessionResponseSchema` from the shared package are stable and validated
- AI image generation service (`aiGenerateImage`) and overlay application service (`applyOverlay`) exist and function correctly
- Job creation occurs after session completion in the guest flow
- Media files are stored in Firebase Storage with accessible file paths
- Published experiences always have an `experienceVersion` number

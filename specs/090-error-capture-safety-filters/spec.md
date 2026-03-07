# Feature Specification: Error Capture & Safety Filter Reporting

**Feature Branch**: `090-error-capture-safety-filters`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "Improve error visibility across the AI generation pipeline by capturing safety filter reasons, propagating meaningful error details, and surfacing actionable error messages to guests."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Safety Filter Error Visibility for Operations Team (Priority: P1)

When an AI generation (image or video) is blocked by a content safety filter, the operations team needs to understand why. Currently, safety filter blocks produce generic errors with no detail about what triggered the filter. The system should capture the specific filter reasons provided by the AI provider and store them in internal records so the team can diagnose issues, identify patterns, and adjust prompts accordingly.

**Why this priority**: Without filter reason data, the team is blind to why content is being rejected. This is the foundational data capture that all other improvements depend on.

**Independent Test**: Can be fully tested by triggering a safety-filtered generation and verifying that the internal error record contains the specific filter reasons (e.g., "violence", "adult content"). Delivers immediate diagnostic value to the operations team.

**Acceptance Scenarios**:

1. **Given** a video generation request is blocked by a safety filter, **When** the system processes the failed generation, **Then** the internal error record includes the filter reason(s) and count of filtered items provided by the AI provider.
2. **Given** an image generation request returns no usable results due to safety filtering, **When** the system processes the failed generation, **Then** the internal error record includes any available filter metadata from the AI provider response.
3. **Given** a generation fails for a non-safety reason (e.g., timeout, server error), **When** the system processes the failure, **Then** the error record does not incorrectly categorize it as a safety filter issue.

---

### User Story 2 - Meaningful Error Classification in Job Records (Priority: P1)

When any step of the AI generation pipeline fails, the system should classify the error with a specific error code rather than using a single generic failure code for all errors. This allows the team to filter and analyze failures by type (safety filter, timeout, AI provider error, general processing failure) and enables downstream systems to react differently based on error type.

**Why this priority**: Error classification is essential for both operational insight and for enabling differentiated guest-facing messages. Without it, all failures look the same in the data.

**Independent Test**: Can be fully tested by triggering different failure types (safety filter, timeout, provider error) and verifying each produces a distinct error code in the job record. Delivers immediate value for failure analysis.

**Acceptance Scenarios**:

1. **Given** a generation fails due to a safety filter, **When** the failure is recorded, **Then** the job record contains a `SAFETY_FILTERED` error code and a user-safe message.
2. **Given** a generation fails due to an AI provider error (rate limit, service unavailable, timeout from provider), **When** the failure is recorded, **Then** the job record contains an `AI_MODEL_ERROR` error code.
3. **Given** a generation fails due to a processing timeout, **When** the failure is recorded, **Then** the job record contains a `TIMEOUT` error code.
4. **Given** a generation fails for an unrecognized reason, **When** the failure is recorded, **Then** the job record falls back to a `PROCESSING_FAILED` error code.
5. **Given** any failure occurs, **When** the failure is recorded, **Then** the full technical error details continue to be available in system logs for debugging, but are not exposed in the job or session records.

---

### User Story 3 - Error Code Propagation to Session Records (Priority: P2)

When a job fails, the associated session record should include the error code so that the guest-facing application can determine what type of error occurred without needing to look up the full job record. This reduces data fetching complexity and enables faster, more targeted error display.

**Why this priority**: This is a data propagation step that bridges backend error classification to frontend display. Important but depends on error classification being in place first.

**Independent Test**: Can be fully tested by triggering a job failure and verifying the session record contains the error code. Delivers value by making error type accessible to the frontend.

**Acceptance Scenarios**:

1. **Given** a job fails with a specific error code, **When** the session status is updated to "failed", **Then** the session record includes the error code from the job.
2. **Given** a job fails and no error code is available (legacy/unexpected case), **When** the session status is updated, **Then** the session record omits the error code field rather than storing a null or empty value.

---

### User Story 4 - Differentiated Guest-Facing Error Messages (Priority: P2)

When a guest visits their share page and their generation has failed, the page should show a message that is specific enough to be helpful but does not expose any technical or internal details. Different types of failures should produce different guest-friendly messages so guests understand whether they should try again, use a different photo, or simply wait.

**Why this priority**: This is the user-facing payoff of all the backend work. It directly improves guest experience but depends on error codes being available in the session.

**Independent Test**: Can be fully tested by loading a share page for a session with different error codes and verifying the correct guest-friendly message is displayed for each.

**Acceptance Scenarios**:

1. **Given** a session has a `SAFETY_FILTERED` error code, **When** the guest views their share page, **Then** they see a message indicating their photo couldn't be processed due to content guidelines and suggesting they try a different photo.
2. **Given** a session has a `TIMEOUT` error code, **When** the guest views their share page, **Then** they see a message indicating processing took too long and suggesting they try again.
3. **Given** a session has any other error code or no error code, **When** the guest views their share page, **Then** they see a generic "Something went wrong. Please try again." message.
4. **Given** any failure scenario, **When** the guest views the error message, **Then** no technical details, error codes, filter reasons, or internal information are visible.

---

### Edge Cases

- What happens when the AI provider response contains safety filter data in an unexpected format? The system should log the raw response for debugging and fall back to a generic safety filter error without crashing.
- What happens when multiple safety filter reasons are returned? All reasons should be captured and stored, not just the first one.
- What happens when a generation partially succeeds (some outputs filtered, some not)? The system should use the successful outputs and only fail if no usable outputs remain.
- What happens when the session record is updated concurrently (e.g., guest refreshes while job is failing)? The error code write should not conflict with or overwrite other session fields.
- What happens when a job fails during a step that already has a specific error code (e.g., `STORAGE_ERROR`)? The existing specific code should be preserved rather than being overwritten with `PROCESSING_FAILED`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST capture safety filter reasons and filtered item count from AI provider responses when a video generation is blocked or filtered.
- **FR-002**: System MUST capture any available safety/filter metadata from AI provider responses when an image generation returns no usable results.
- **FR-003**: System MUST classify job failures into specific error codes: `SAFETY_FILTERED` (content blocked by safety filters), `AI_MODEL_ERROR` (provider API errors including rate limits, service unavailability, and provider timeouts), `TIMEOUT` (processing timeout), `STORAGE_ERROR` (file storage failures), and `PROCESSING_FAILED` (general/unclassified failures).
- **FR-004**: System MUST store the error code and a user-safe message in the job record when a failure occurs.
- **FR-005**: System MUST support storing optional structured metadata (e.g., filter reasons) alongside the job error for operational analysis, without exposing this metadata to guests.
- **FR-006**: System MUST propagate the error code to the session record when a job fails, so downstream consumers can access it without fetching the job document.
- **FR-007**: System MUST continue logging full technical error details (stack traces, raw responses) to system logs for debugging purposes.
- **FR-008**: The guest-facing share page MUST display differentiated error messages based on the error code: a content guidelines message for safety-filtered errors, a timeout message for timeout errors, and a generic fallback for all other errors.
- **FR-009**: The guest-facing share page MUST NOT display any technical details, internal error codes, filter reasons, or system information to guests.
- **FR-010**: System MUST preserve existing specific error codes (e.g., `TIMEOUT`, `STORAGE_ERROR`) when they are already set, rather than overwriting them with a generic code.

### Key Entities

- **Job Error**: Represents a failure that occurred during processing. Contains an error code (classification), a user-safe message, the pipeline step where the failure occurred, and optional structured details (e.g., filter reasons) for operational use.
- **Session Error State**: A lightweight reference on the session record containing just the error code, enabling the guest-facing application to determine the failure type without fetching the full job record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of safety-filtered generations include the specific filter reason(s) in the internal error record, where the AI provider supplies them.
- **SC-002**: Operations team can distinguish between safety filter blocks, provider errors, timeouts, and general failures by querying job records by error code.
- **SC-003**: Guests who encounter a safety-filtered failure see a content-guidelines-specific message instead of a generic error, within the same page load (no additional data fetching required).
- **SC-004**: Zero technical details, filter reasons, or internal error codes are exposed on the guest-facing share page under any failure scenario.
- **SC-005**: Full technical error details remain available in system logs for every failure, with no loss of existing debugging information.

## Clarifications

### Session 2026-03-06

No critical ambiguities identified. The brief provided sufficient detail to resolve all material decisions during specification. Coverage scan completed with no questions required.

## Assumptions

- The AI video provider already returns filter reason data (count and reasons) in its operation response; no additional API calls are needed to retrieve this information.
- The AI image provider may or may not return structured filter metadata; the system should capture it when available and gracefully handle its absence.
- The existing error logging infrastructure (system logs) does not need modification; only the structured data stored in job and session documents is changing.
- The share page already fetches session data on load; adding the error code field does not require an additional data fetch.
- The set of error codes (`SAFETY_FILTERED`, `AI_MODEL_ERROR`, `TIMEOUT`, `STORAGE_ERROR`, `PROCESSING_FAILED`) is sufficient for the initial release and can be extended later without breaking changes.

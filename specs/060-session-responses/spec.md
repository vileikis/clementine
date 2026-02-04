# Feature Specification: Session Responses + Guest Runtime

**Feature Branch**: `060-session-responses`
**Created**: 2026-02-04
**Status**: Draft
**Input**: PRD 1C - Update session schema to use unified `responses[]` array and modify guest runtime to write responses instead of separate `answers[]` and `capturedMedia[]`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Completes Text Input Step (Priority: P1)

A guest participating in an AI photobooth experience encounters a text input step (short text, long text, scale, or yes/no). When they provide their answer and proceed, the system stores their response in a unified format that includes the step identifier, step name, step type, and their answer value.

**Why this priority**: Text inputs are the most common step type in experiences. Without this working, no guest data can be captured in the new unified format.

**Independent Test**: Can be fully tested by having a guest complete a short text input step and verifying the response is stored with correct structure and values.

**Acceptance Scenarios**:

1. **Given** a guest is on a short text input step, **When** they enter "Blue" and submit, **Then** a response is stored with the text value "Blue", step type "input.shortText", step name from the step definition, and automatic timestamps.
2. **Given** a guest is on a scale input step (1-5), **When** they select rating 4, **Then** a response is stored with value "4" and step type "input.scale".
3. **Given** a guest is on a yes/no input step, **When** they select "yes", **Then** a response is stored with value "yes" and step type "input.yesNo".
4. **Given** a guest re-answers a previously completed step, **When** they submit a new answer, **Then** the existing response is updated (not duplicated) with the new value and updated timestamp.

---

### User Story 2 - Guest Completes Photo/Video Capture Step (Priority: P1)

A guest encounters a capture step (photo or video). When they complete the capture, the system stores their response with media reference information in the context field, while the value field remains null (since asset IDs have no analytical use as primitive values).

**Why this priority**: Media capture is core to the AI photobooth product. This must work alongside text inputs for a complete guest experience.

**Independent Test**: Can be fully tested by having a guest complete a photo capture and verifying the response stores media references in the context field.

**Acceptance Scenarios**:

1. **Given** a guest is on a photo capture step, **When** they capture a photo, **Then** a response is stored with value as null, context containing a single-item array with media asset ID, URL, file path, and display name.
2. **Given** a guest is on a video capture step, **When** they record a video, **Then** a response is stored with value as null, context containing a single-item array with the video media reference.
3. **Given** the response is stored, **Then** the file path is included in the media reference for downstream processing.

---

### User Story 3 - Guest Completes Multi-Select Input Step (Priority: P2)

A guest encounters a multi-select input step with multiple options. When they select their choices and submit, the system stores both the selected values and the full option details for later prompt expansion.

**Why this priority**: Multi-select inputs are more complex than single-value inputs as they require storing both the selection array and the option metadata for prompt fragments.

**Independent Test**: Can be fully tested by having a guest select multiple options and verifying both the value array and context with option details are stored.

**Acceptance Scenarios**:

1. **Given** a guest is on a multi-select step with options, **When** they select "cat" and "dog", **Then** a response is stored with value as ["cat", "dog"] and context containing the full option objects including prompt fragments.
2. **Given** options have prompt fragments defined, **Then** the context preserves each option's prompt fragment for use in prompt expansion.

---

### User Story 4 - Responses Persist to Storage (Priority: P1)

When a guest provides responses during an experience, the responses are persisted to permanent storage so they survive page refreshes and can be accessed by backend processing.

**Why this priority**: Data persistence is essential for the product to function. Responses must be reliably stored for AI processing.

**Independent Test**: Can be fully tested by having a guest complete a step, refreshing the page, and verifying responses are still available.

**Acceptance Scenarios**:

1. **Given** a guest completes an input or capture step, **When** the response is recorded, **Then** it is synchronized to permanent storage.
2. **Given** responses exist in storage, **When** the session is loaded, **Then** all previously recorded responses are available.
3. **Given** the old answers and capturedMedia fields exist, **Then** they remain readable for backward compatibility but new data writes to responses.

---

### Edge Cases

- What happens when a guest tries to submit an empty text input? The system should handle validation according to step configuration (required vs optional).
- What happens when a media capture fails (camera error, upload failure)? The system should not create a response until media is successfully processed.
- What happens when storage sync fails? The system should retry and preserve local state until sync succeeds.
- What happens when a step is deleted from the experience after a guest already responded? The response remains in storage but may be ignored by downstream processing.
- What happens when a guest completes the same step multiple times (going back)? The response is updated in place, not duplicated.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store all step responses in a unified `responses` array on the session.
- **FR-002**: System MUST include `stepId`, `stepName`, `stepType`, `value`, `context`, `createdAt`, and `updatedAt` fields in each response.
- **FR-003**: System MUST automatically populate `stepName` from the step definition when creating a response.
- **FR-004**: System MUST automatically set `createdAt` and `updatedAt` timestamps when creating or updating responses.
- **FR-005**: System MUST update existing responses in place (by stepId) rather than creating duplicates when a step is re-answered.
- **FR-006**: System MUST store text input responses with the text value in `value` and `context` as null.
- **FR-007**: System MUST store scale input responses with the numeric value as a string (e.g., "4") in `value`.
- **FR-008**: System MUST store yes/no input responses with "yes" or "no" string in `value`.
- **FR-009**: System MUST store multi-select responses with selected values array in `value` and full option objects in `context`.
- **FR-010**: System MUST store capture responses (photo, video) with `value` as null and media references in `context`.
- **FR-011**: System MUST store media references as an array (single item for photo/video).
- **FR-012**: System MUST include `mediaAssetId`, `url`, `filePath`, and `displayName` in each media reference.
- **FR-013**: System MUST persist responses to permanent storage after each step completion.
- **FR-014**: System MUST maintain backward compatibility by keeping deprecated `answers` and `capturedMedia` fields readable.
- **FR-015**: System MUST NOT write to the deprecated `answers` and `capturedMedia` fields for new sessions.

### Key Entities

- **Session Response**: A single response to an experience step, containing the step identifier, step name, step type, the user's value, optional context data, and timestamps. Responses are stored in an array on the session.
- **Media Reference**: Information about a captured media asset, including its unique identifier, accessible URL, storage file path, and human-readable display name. Used in the context field for capture steps.
- **Multi-Select Option**: An option choice that includes the value, prompt fragment text for AI prompt expansion, and optional prompt media. Stored in context when multi-select responses are recorded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new guest responses are stored in the unified responses array format.
- **SC-002**: All response types (text, scale, yes/no, multi-select, photo, video) successfully persist to storage.
- **SC-003**: Response updates (re-answering a step) correctly modify the existing response without creating duplicates.
- **SC-004**: Media references include all required fields (asset ID, URL, file path, display name) for downstream processing.
- **SC-005**: System maintains zero data loss during the transition period with deprecated fields remaining accessible.
- **SC-006**: Guest experiences complete without errors when using the new response system.

## Assumptions

- The step definition always provides a valid `id`, `name`, and `type` for populating response fields.
- Media upload and processing completes successfully before a capture response is recorded.
- The storage system supports atomic updates for response arrays.
- Existing sessions with old `answers` and `capturedMedia` data will continue to function until explicitly migrated in a future cleanup phase.
- Prompt expansion using `@{step:...}` references will be addressed in a separate feature.

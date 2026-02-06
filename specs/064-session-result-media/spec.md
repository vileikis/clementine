# Feature Specification: Session Result Media Schema Alignment

**Feature Branch**: `064-session-result-media`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "I want session resultMedia from session.schema.ts to use media-reference.schema.ts and all writers and consumers utilise respect that format"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Result Media Data (Priority: P1)

When a guest completes an AI-powered experience and receives a transformed result, the session's result media is stored in a standardized format that matches how all other media references work across the platform. This ensures every piece of media in the system — whether it's a theme background, an event overlay, or a session result — follows the same data shape, making it straightforward for any part of the system to display, link, or process that media.

**Why this priority**: This is the core of the feature. Without the data structure alignment, no downstream benefit (consistent display, reliable file tracking, uniform naming) is possible.

**Independent Test**: Can be fully tested by triggering a session result (e.g., completing an AI transform) and verifying the stored result media contains all standard media reference fields (asset identifier, public URL, file path, and display name) instead of the legacy shape.

**Acceptance Scenarios**:

1. **Given** a guest completes a session that produces result media, **When** the result is saved, **Then** the stored result media record includes an asset identifier, a public URL, a storage file path, and a display name — all matching the standard media reference format used elsewhere in the system.
2. **Given** result media is stored in the new format, **When** any part of the system reads the session's result media, **Then** it can process the data using the same logic used for all other media references (theme backgrounds, overlays, etc.) without special handling.
3. **Given** a session was created before this change (legacy format with stepId, assetId, url, createdAt), **When** the system reads that session's result media, **Then** it handles the legacy format gracefully without errors or data loss.

---

### User Story 2 - All Result Writers Produce Standard Format (Priority: P2)

Every part of the system that creates or updates session result media (backend processing, transform jobs, etc.) writes data in the standard media reference format. This eliminates format inconsistencies at the source.

**Why this priority**: Even with a correct schema definition, the feature delivers no value unless every writer actually produces data in the new format. This story ensures write-side compliance.

**Independent Test**: Can be tested by triggering each known result-writing pathway (transform completion, direct capture result) and verifying the output matches the standard format.

**Acceptance Scenarios**:

1. **Given** a transform job completes successfully, **When** the system writes the result media to the session, **Then** the written data contains the standard media reference fields (asset identifier, public URL, file path, display name).
2. **Given** a writer previously produced the legacy format (stepId, assetId, url, createdAt), **When** the same writer runs after this change, **Then** it produces the standard media reference format instead.

---

### User Story 3 - All Result Consumers Read Standard Format (Priority: P3)

Every part of the system that reads session result media (result display pages, sharing features, analytics) correctly interprets the standard media reference format. Consumers that previously expected the legacy shape are updated to work with the new shape.

**Why this priority**: Consumers must be updated to match the new format so that result media displays correctly, shares resolve to the right assets, and no consumer breaks due to missing or renamed fields.

**Independent Test**: Can be tested by loading a session with result media in the new format in each consumer context (result display page, share flow, analytics dashboard) and verifying correct behavior.

**Acceptance Scenarios**:

1. **Given** a session has result media in the standard format, **When** the result display page loads that session, **Then** the result media is shown correctly to the guest.
2. **Given** a session has result media in the standard format, **When** a guest shares their result, **Then** the share link resolves to the correct media asset.
3. **Given** a session has result media in the legacy format, **When** any consumer reads that session, **Then** it still displays the result without errors (backward compatibility).

---

### Edge Cases

- What happens when a session has result media with a missing or null file path? The system should treat it as valid (file path is optional for backward compatibility) and fall back to using the URL directly.
- What happens when a session has result media in the legacy format (stepId, assetId, url, createdAt) and a consumer expects the new format? The system should handle the mismatch gracefully, either through a compatibility layer or by normalizing legacy data on read.
- What happens when result media has no display name? The system should apply a sensible default (e.g., "Result") rather than failing.
- What happens when the public URL in result media becomes invalid or expired? The system should handle this the same way it handles expired URLs in any other media reference.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The session's result media field MUST follow the same data structure as the standard media reference used across the platform (asset identifier, public URL, file path, display name).
- **FR-002**: The result media field MUST retain backward compatibility — sessions created before this change with the legacy format (stepId, assetId, url, createdAt) MUST remain readable without data loss.
- **FR-003**: All system components that write result media to a session MUST produce data in the standard media reference format.
- **FR-004**: All system components that read result media from a session MUST correctly interpret the standard media reference format.
- **FR-005**: The file path field in result media MUST be optional (nullable) to support both existing records without file paths and new records that include them.
- **FR-006**: The display name field in result media MUST have a sensible default value when not explicitly provided, consistent with how display names work elsewhere in the system.
- **FR-007**: The result media field MUST remain nullable at the session level (a session may not yet have a result).
- **FR-008**: Validation of result media MUST enforce the same rules as the standard media reference (e.g., URL format, display name character constraints).

### Key Entities

- **Session**: Represents a guest's or admin's progress through an experience. Contains a `resultMedia` field that holds the final output from AI transformation or capture.
- **Media Reference**: The standard data shape used across the platform to reference any media asset. Includes an asset identifier, public URL, optional file path, and a display name. Used for theme backgrounds, event overlays, experience media, and now session result media.
- **Session Result Media (Legacy)**: The previous data shape for result media that included step identifier, asset identifier, URL, and creation timestamp. Being replaced by the standard Media Reference format.

## Assumptions

- The legacy `stepId` and `createdAt` fields currently on `sessionResultMediaSchema` are not critical for downstream consumers. If any consumer relies on `stepId`, it can retrieve the originating step from other session data (e.g., the responses array). If any consumer relies on `createdAt`, it can use the session's own `updatedAt` or `completedAt` timestamps.
- The number of existing sessions with legacy-format result media is manageable, and a read-time compatibility approach (rather than a bulk data migration) is acceptable.
- The `displayName` for result media will default to a sensible value (e.g., "Result") since result media is system-generated rather than user-uploaded with a custom name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new session result media records conform to the standard media reference format — no new records are written in the legacy format after the change is deployed.
- **SC-002**: 100% of consumers that display or process result media work correctly with both the new standard format and the legacy format without errors.
- **SC-003**: Zero data loss during the transition — all existing sessions with legacy result media remain fully accessible and displayable.
- **SC-004**: Any system component that handles media references can process session result media without special-case logic, reducing the number of distinct media formats in the codebase from 2+ to 1.

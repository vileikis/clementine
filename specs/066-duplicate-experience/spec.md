# Feature Specification: Duplicate Experience

**Feature Branch**: `066-duplicate-experience`
**Created**: 2026-02-09
**Status**: Draft
**Input**: User description: "From the Experience list, let a creator duplicate an existing experience into a new one, safely and predictably."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Duplicate an Experience from the List (Priority: P1)

A creator views their experience library and wants to create a new experience based on an existing one. They open the context menu on an experience list item, click "Duplicate", and a new experience appears near the top of the list with the name "{Original name} (Copy)". The duplicate happens instantly without a confirmation modal. A toast notification confirms the action (e.g., "Duplicated as {New name}").

**Why this priority**: This is the core value of the feature — creators need a fast, friction-free way to duplicate experiences to iterate on new variations without starting from scratch.

**Independent Test**: Can be fully tested by duplicating any experience from the list and verifying the new experience appears with the correct name, correct draft configuration, and is not publicly accessible.

**Acceptance Scenarios**:

1. **Given** a creator has at least one experience in the library, **When** they click "Duplicate" from the context menu, **Then** a new experience is created with the name "{Original name} (Copy)" and appears near the top of the list.
2. **Given** a creator duplicates an experience, **When** the duplication completes, **Then** a toast notification confirms the action with the new experience name.
3. **Given** a creator duplicates an experience, **When** they open the new experience, **Then** the draft configuration is identical to the source experience's draft configuration.
4. **Given** the source experience has a published configuration, **When** it is duplicated, **Then** the new experience preserves the published configuration internally but is not live/publicly accessible.
5. **Given** the source experience has no published configuration, **When** it is duplicated, **Then** the new experience has no published configuration.

---

### User Story 2 - Duplicate Naming with "(Copy)" Suffix (Priority: P2)

A creator duplicates an experience. If the source name does not already end with "(Copy)", the system appends "(Copy)" to the name. If it already ends with "(Copy)", the name is kept as-is (duplicate names are allowed in a workspace). This keeps naming simple and predictable without requiring collision detection.

**Why this priority**: Clean naming helps creators identify duplicated experiences at a glance. The logic is minimal — just check for an existing suffix — and avoids over-engineering with incremental counters.

**Independent Test**: Can be tested by duplicating experiences with and without the "(Copy)" suffix and verifying the resulting names.

**Acceptance Scenarios**:

1. **Given** an experience named "Photo Booth", **When** the creator duplicates it, **Then** the new experience is named "Photo Booth (Copy)".
2. **Given** an experience named "Photo Booth (Copy)", **When** the creator duplicates it, **Then** the new experience is also named "Photo Booth (Copy)" (no double suffix).
3. **Given** an experience named "My Event (Copy) Special", **When** the creator duplicates it, **Then** the new experience is named "My Event (Copy) Special (Copy)" (suffix only stripped when it is the trailing text).

---

### User Story 3 - Duplicate Failure Handling (Priority: P3)

A creator attempts to duplicate an experience, but the operation fails (e.g., the source was deleted by another user mid-action, or a network error occurs). The system shows a clear error message and the experience list remains unchanged.

**Why this priority**: Graceful error handling prevents data corruption and user confusion, but it's a less common path than the happy flow.

**Independent Test**: Can be tested by simulating failure conditions and verifying the error message appears and no partial data is created.

**Acceptance Scenarios**:

1. **Given** a creator clicks "Duplicate" on an experience, **When** the source experience has been deleted by another user, **Then** the system shows an error toast "Couldn't duplicate experience" and the list remains unchanged.
2. **Given** a creator clicks "Duplicate" on an experience, **When** a network error occurs, **Then** the system shows an error toast and no duplicate is created.

---

### Edge Cases

- What happens when the experience name is at the maximum character limit (100 chars) and "(Copy)" would exceed it? The system truncates the original name to fit the "(Copy)" suffix within the 100-character limit.
- What happens when a creator rapidly clicks "Duplicate" multiple times? The system prevents concurrent duplicate operations on the same source by disabling the action while a duplication is in progress.
- What happens when the source experience has references to media assets (e.g., thumbnails)? The duplicate references the same assets without duplicating the underlying files.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add a "Duplicate" action to the experience list item context menu, positioned between "Rename" and "Delete" with a separator before "Delete".
- **FR-002**: System MUST create a new experience immediately upon clicking "Duplicate" without requiring a confirmation modal.
- **FR-003**: System MUST deep-copy the source experience's `draft` configuration to the new experience, with no shared object references.
- **FR-004**: System MUST copy the source experience's `published` configuration (if it exists) to the new experience, preserving it as an internal baseline.
- **FR-005**: System MUST set the new experience's publish state to unpublished (not live, no published timestamp, no published version).
- **FR-006**: System MUST generate a new unique identifier for the duplicated experience and set its creation timestamp to the current time.
- **FR-007**: System MUST store a reference to the source experience (`sourceExperienceId`) on the new experience for provenance tracking.
- **FR-008**: System MUST name the new experience by appending "(Copy)" to the source name, unless the source name already ends with "(Copy)", in which case the name is kept unchanged. Duplicate names within a workspace are allowed.
- **FR-009**: System MUST copy the source experience's profile type (freeform, survey, story) to the new experience unchanged.
- **FR-010**: System MUST NOT carry over any session data, analytics counters, gallery references, or job history to the new experience.
- **FR-011**: System MUST copy media asset references (e.g., thumbnails) without duplicating the underlying files.
- **FR-012**: System MUST show a success toast notification upon successful duplication, displaying the new experience name.
- **FR-013**: System MUST show an error toast notification if duplication fails, with the message "Couldn't duplicate experience".
- **FR-014**: System MUST ensure the new experience appears in the experience list immediately after creation via the existing real-time update mechanism.
- **FR-015**: System MUST truncate the original name if appending "(Copy)" would exceed the 100-character name limit.
- **FR-016**: System MUST prevent concurrent duplicate operations on the same source experience (disable the action while in progress).

### Key Entities

- **Duplicated Experience**: A new experience document with a fresh identifier, current creation timestamp, `status: active`, deep-copied `draft` and `published` configurations, inherited `profile` and `media` references, a `sourceExperienceId` linking back to the original, and all publish-related fields reset to indicate unpublished state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can duplicate an experience in a single click (no modal, no extra steps) and the duplicate appears in the list within 2 seconds.
- **SC-002**: 100% of duplicated experiences are not publicly accessible until explicitly published by the creator.
- **SC-003**: Duplicated experiences produce identical draft behavior and output as the source when previewed or run as a draft.
- **SC-004**: The "(Copy)" suffix naming convention is applied correctly — appended when absent, not duplicated when already present.
- **SC-005**: Failed duplication attempts show a clear error message and result in no orphaned or partial data in the system.

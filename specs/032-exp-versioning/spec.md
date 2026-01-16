# Feature Specification: Experience Designer Draft & Publish Versioning

**Feature Branch**: `030-exp-versioning`
**Created**: 2026-01-15
**Status**: Draft
**Input**: User description: "Experience Designer: Draft & Publish Versioning - Track draftVersion and publishedVersion on experiences. Enable reliable diffing between draft and published snapshots. Draft updates must use Firestore dot-notation partial updates (same pattern as Event Designer). Publish explicitly promotes draft → published snapshot and increments published version. ExperienceDesignerLayout EditorChangesBadge should use those versions instead of dummy values."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Experience Creator Sees Accurate Change Indicator (Priority: P1)

An experience creator is editing their experience steps and configuration. They need to know whether they have unpublished changes that differ from what guests see. Currently, the change indicator uses placeholder values. With versioning, the indicator accurately reflects whether draft changes exist.

**Why this priority**: This is the core value proposition. Without accurate change detection, creators cannot confidently publish or know when their work differs from the live version. This affects every editing session.

**Independent Test**: Can be fully tested by making any edit to an experience and verifying the EditorChangesBadge shows "Unpublished changes" state. Reverting and re-publishing should show the badge as cleared.

**Acceptance Scenarios**:

1. **Given** an experience with draftVersion=3 and publishedVersion=3, **When** the creator opens the designer, **Then** EditorChangesBadge shows no unpublished changes (versions match)
2. **Given** an experience with draftVersion=5 and publishedVersion=3, **When** the creator opens the designer, **Then** EditorChangesBadge shows unpublished changes indicator (draft is ahead)
3. **Given** an experience with publishedVersion=null, **When** the creator opens the designer, **Then** EditorChangesBadge shows "Never published" state

---

### User Story 2 - Draft Updates Increment Version Atomically (Priority: P1)

When a creator modifies any part of the experience draft (steps, configuration, settings), the system must atomically increment the draft version number. This ensures every change is tracked and version numbers are consistent even with concurrent editing.

**Why this priority**: Core infrastructure that enables all version-based features. Without atomic version increments, version numbers become unreliable and change detection breaks.

**Independent Test**: Can be fully tested by making a change, observing the draftVersion increment in the database, and verifying subsequent changes continue incrementing correctly.

**Acceptance Scenarios**:

1. **Given** an experience with draftVersion=5, **When** the creator adds a new step, **Then** draftVersion becomes 6 and updatedAt timestamp is refreshed
2. **Given** an experience with draftVersion=7, **When** the creator modifies step configuration, **Then** draftVersion becomes 8
3. **Given** two concurrent edits to the same experience, **When** both complete, **Then** draftVersion reflects both increments correctly (no lost updates)

---

### User Story 3 - Publishing Promotes Draft to Published with Version Sync (Priority: P1)

When a creator publishes their experience, the system copies the draft configuration to published and sets publishedVersion to match draftVersion. This creates a clear snapshot of what version is live.

**Why this priority**: Publishing is the primary action that makes changes visible to guests. Version synchronization on publish enables accurate "has unpublished changes" detection afterward.

**Independent Test**: Can be fully tested by publishing an experience and verifying publishedVersion equals draftVersion, the published configuration matches draft, and EditorChangesBadge clears.

**Acceptance Scenarios**:

1. **Given** an experience with draftVersion=10 and publishedVersion=5, **When** the creator publishes, **Then** publishedVersion becomes 10 and published config matches draft config
2. **Given** a never-published experience with draftVersion=3, **When** the creator publishes, **Then** publishedVersion becomes 3 and publishedAt timestamp is set
3. **Given** a successful publish, **When** the creator views the designer, **Then** EditorChangesBadge shows no unpublished changes

---

### User Story 4 - Partial Draft Updates Use Dot-Notation (Priority: P2)

When updating specific fields within the draft configuration, the system must use Firestore dot-notation for partial updates. This avoids overwriting unrelated fields and ensures atomic, efficient updates.

**Why this priority**: Important for data integrity and performance, but the system would function (less efficiently) without it. Follows the established Event Designer pattern for consistency.

**Independent Test**: Can be tested by updating a single field and verifying other draft fields remain unchanged in the database.

**Acceptance Scenarios**:

1. **Given** a draft with multiple configured steps, **When** the creator updates only one step's title, **Then** only that step's data is modified (other steps untouched)
2. **Given** a draft with name and media configured, **When** the creator updates only the name, **Then** media configuration remains unchanged

---

### Edge Cases

- What happens when a creator tries to publish an experience with no steps? System should prevent publish with appropriate error message (existing behavior preserved).
- How does the system handle version overflow? Version is stored as a number that can grow indefinitely; no practical limit for normal usage.
- What happens if publishedVersion is somehow greater than draftVersion? This should never occur with proper atomic operations, but UI should handle gracefully (show as "synced").
- What happens during network failure mid-update? Firestore transactions ensure atomicity - either version increments or entire update fails.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store a `draftVersion` number on each experience, starting at 1 for new experiences
- **FR-002**: System MUST store a `publishedVersion` number on each experience, null until first publish
- **FR-003**: System MUST atomically increment `draftVersion` on every draft modification using Firestore's atomic increment operation
- **FR-004**: System MUST update `updatedAt` timestamp alongside every draft modification
- **FR-005**: System MUST set `publishedVersion` equal to current `draftVersion` when publishing
- **FR-006**: System MUST use Firestore dot-notation for partial draft updates (e.g., `draft.steps` instead of replacing entire draft object)
- **FR-007**: System MUST preserve existing draft mutation hooks' error handling and Sentry reporting patterns
- **FR-008**: EditorChangesBadge MUST display "unpublished changes" when `draftVersion > publishedVersion`
- **FR-009**: EditorChangesBadge MUST display "never published" state when `publishedVersion === null`
- **FR-010**: EditorChangesBadge MUST display "synced" state when `draftVersion === publishedVersion`
- **FR-011**: System MUST invalidate relevant query cache keys after successful version updates
- **FR-012**: System MUST run all version updates within database transactions to ensure consistency

### Key Entities

- **Experience**: Core entity representing a configurable experience. Key attributes: `id`, `name`, `draft` (configuration), `published` (configuration), `draftVersion` (number, starts at 1), `publishedVersion` (number or null), `updatedAt`, `publishedAt`
- **Draft Configuration**: Nested object within Experience containing steps and settings. Updates to this trigger draftVersion increment.
- **Published Configuration**: Snapshot of draft configuration at time of publish. Set when publishedVersion is updated.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can determine unpublished changes state within 1 second of opening the designer (version comparison vs. previous deep object comparison)
- **SC-002**: 100% of draft modifications result in exactly one version increment (no skipped or double increments)
- **SC-003**: EditorChangesBadge accurately reflects version state in all scenarios: never published, has changes, synced
- **SC-004**: Publishing operation atomically syncs versions such that EditorChangesBadge immediately shows correct state after publish
- **SC-005**: Concurrent editing sessions on the same experience maintain version consistency (no lost updates)

## Assumptions

- The Event Designer's versioning pattern using `draftVersion`/`publishedVersion` with atomic increment is the proven reference implementation to follow
- Existing database transaction patterns in the codebase provide sufficient atomicity guarantees
- The `EditorChangesBadge` component already accepts `draftVersion` and `publishedVersion` props and handles display logic correctly
- Schema migrations or data backfills for existing experiences (setting initial versions) are out of scope for this feature - existing experiences will get versions on first edit/publish
- The experience domain's existing query cache invalidation patterns should be preserved

# Feature Specification: Experience Type Flattening

**Feature Branch**: `081-experience-type-flattening`
**Created**: 2026-02-24
**Status**: Draft
**Input**: PRD P4 — Experience Type Flattening (requirements/w9-mvp-polish/prd-p4-experience-type-flattening.md)

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Single-Step Experience Type Selection (Priority: P1)

As an experience creator, I want to choose the type of experience (Photo, GIF, Video, AI Image, AI Video, or Survey) in a single step when creating a new experience, so that I don't have to go through a meaningless two-step selection process.

**Why this priority**: This is the core UX improvement. Today, creators must first pick a "profile" (which has no real meaning), then pick an outcome type. Collapsing this into one step removes friction from the most common creator action — starting a new experience.

**Independent Test**: Can be fully tested by creating a new experience and verifying that a single type picker is presented with all available types, and selecting one immediately proceeds to configuration.

**Acceptance Scenarios**:

1. **Given** I am on the "Create Experience" form, **When** I view the type selection, **Then** I see all available experience types displayed as selectable options: Photo, GIF (coming soon), Video (coming soon), AI Image, AI Video, Survey
2. **Given** I am on the "Create Experience" form, **When** I select "AI Image" as the experience type, **Then** the experience is created with that type and I am taken directly to configure it — no second type selection step is required
3. **Given** I am on the "Create Experience" form, **When** I select "Survey", **Then** the experience is created as a survey type with no output configuration section shown

---

### User Story 2 — Experience Type Visible in Library (Priority: P2)

As an experience creator, I want to see the type of each experience displayed prominently in the library view, so that I can quickly identify and manage my experiences by type.

**Why this priority**: Once type becomes a first-class concept, it should be visible wherever experiences are listed. This enables future features like filtering and type-based analytics.

**Independent Test**: Can be tested by viewing the experience library and verifying each experience card displays its type (e.g., "AI Image", "Survey", "Photo").

**Acceptance Scenarios**:

1. **Given** I have multiple experiences of different types, **When** I view the experience library, **Then** each experience card displays its type as a visible label or badge
2. **Given** I have an experience that was migrated from the old structure, **When** I view it in the library, **Then** its type is correctly displayed based on the migrated data

---

### User Story 3 — Simplified Configuration Layout (Priority: P3)

As an experience creator, I want the configuration for my experience's output to be presented directly without unnecessary nesting or wrapper sections, so that the editing experience feels streamlined.

**Why this priority**: Removing the intermediate "outcome" grouping simplifies the creator's mental model. Configuration options for the selected type appear directly in the configuration area.

**Independent Test**: Can be tested by opening the configuration view for any non-survey experience and verifying that output settings appear directly without an intermediate "outcome" section.

**Acceptance Scenarios**:

1. **Given** I have an AI Image experience, **When** I open its configuration, **Then** I see AI Image settings (prompt task, capture step, aspect ratio, image generation settings) directly in the configuration area — not nested under an "outcome" section
2. **Given** I have a Survey experience, **When** I open its configuration, **Then** no output configuration section is shown (since surveys have no output)
3. **Given** I change experience type via the type selector in the configuration header, **When** I switch from "AI Image" to "AI Video", **Then** the configuration form updates to show the relevant settings for the new type

---

### User Story 4 — Data Migration (Priority: P4)

As a system administrator, I want all existing experiences to be migrated to the new type structure before the new version launches, so that the application works correctly with the updated data model without any backward compatibility logic.

**Why this priority**: This is a foundational requirement — the new UI and backend cannot function correctly without migrated data. However, it ranks lower because it's an operational task, not a user-facing feature.

**Independent Test**: Can be tested by running the migration script against existing data and verifying that all experiences have a correct top-level type, flattened configuration, and that the old fields are removed.

**Acceptance Scenarios**:

1. **Given** an existing experience with profile "freeform" and outcome type "ai.image", **When** the migration runs, **Then** the experience has type "ai.image" at the top level and the outcome configuration is flattened into the main configuration
2. **Given** an existing experience with profile "survey", **When** the migration runs, **Then** the experience has type "survey" at the top level
3. **Given** an existing experience with profile "story" (unused), **When** the migration runs, **Then** the experience is converted to type "survey" (safe default)
4. **Given** an experience with both draft and published configurations, **When** the migration runs, **Then** both configurations are flattened and the old wrapper fields are removed from both

---

### Edge Cases

- What happens when a creator tries to create an experience and selects a "coming soon" type (GIF, Video)? The type should be visible but not selectable, with a "coming soon" indicator.
- What happens if the migration script encounters an experience with no profile or no outcome type? The script should log the anomaly, skip the record, and continue processing remaining records.
- What happens when a creator changes experience type after initial creation? The previous type's configuration should be cleared, and the new type's default configuration should be presented.
- What happens if an experience has a published configuration with a different outcome type than the draft? The migration should independently flatten each configuration based on its own outcome type.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single-step type selection when creating a new experience, presenting all available types: Survey, Photo, GIF, Video, AI Image, AI Video
- **FR-002**: System MUST store the experience type as a top-level attribute on the experience, not nested within configuration
- **FR-003**: System MUST display the experience type on each experience card in the library view
- **FR-004**: System MUST show type-appropriate configuration directly in the configuration area without an intermediate "outcome" wrapper
- **FR-005**: System MUST hide the output configuration section entirely for Survey-type experiences
- **FR-006**: System MUST allow creators to switch experience type from the configuration view header
- **FR-007**: System MUST support the following experience types: survey, photo, gif, video, ai.image, ai.video
- **FR-008**: System MUST mark GIF and Video types as "coming soon" (visible but not selectable) until those features are fully implemented
- **FR-009**: System MUST provide a data migration script that converts all existing experiences from the old two-level structure (profile + outcome type) to the new single type structure
- **FR-010**: The migration script MUST flatten outcome configuration from the nested structure into the main configuration level for both draft and published configurations
- **FR-011**: The migration script MUST remove deprecated fields (profile, outcome wrapper) after migration
- **FR-012**: The migration script MUST handle all existing profile values: "freeform" (map to outcome type), "survey" (map to "survey"), "story" (map to "survey" as safe default)
- **FR-013**: System MUST remove all references to the deprecated "profile" concept and "story" profile from the user interface
- **FR-014**: The backend processing pipeline MUST read outcome configuration from the new flattened location when generating outputs

### Key Entities

- **Experience**: The core entity representing a creator's configured photobooth-style interaction. Gains a new top-level `type` attribute replacing the old `profile` field. Types: survey, photo, gif, video, ai.image, ai.video
- **Experience Configuration**: The settings for an experience (steps, output settings). Output-type-specific settings move from a nested outcome wrapper to the top level of the configuration. Only the active type's configuration is populated; others are empty.
- **Experience Type**: A first-class enumeration representing what kind of output an experience produces. Replaces the combination of "profile" and "outcome type" with a single concept.

## Assumptions

- This is a pre-launch migration; no backward compatibility logic is needed in application code. The migration script will be run before the updated application is deployed.
- The "story" profile is confirmed unused and can be safely mapped to "survey" type during migration.
- Per-type configuration schemas (the internal structure of photo, aiImage, aiVideo settings) remain unchanged — only their location in the data model changes.
- The step system within experience configuration is unaffected by this change.
- "Coming soon" types (GIF, Video) should be visible in the type picker for discoverability but not selectable until their respective features are implemented.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of experience creation flows require exactly one type-selection step (zero two-step selections remain)
- **SC-002**: Experience type is visible on every experience card in the library view
- **SC-003**: Configuration editing for any experience type requires zero navigation through "outcome" wrapper sections
- **SC-004**: Migration script successfully converts 100% of existing experiences to the new structure with no data loss
- **SC-005**: All existing creator workflows (creating, editing, publishing, processing experiences) function correctly after the change with no regressions
- **SC-006**: Zero references to deprecated concepts ("profile", "story" profile, "outcome type picker") remain in the user interface

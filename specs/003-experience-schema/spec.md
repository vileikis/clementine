# Feature Specification: Evolve Experiences Schema

**Feature Branch**: `003-experience-schema`
**Created**: 2025-11-19
**Status**: Draft
**Input**: User description: "Refactor and evolve the experiences document structure into a scalable, type-safe, and future-proof schema that supports multiple experience types (photo, video, gif, wheel, survey). The new schema introduces a discriminated union driven by the type field and separates concerns using config for type-specific configuration and aiConfig for shared AI configuration."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create New Photo Experience with Default Configuration (Priority: P1)

An event creator creates a new photo experience by providing only a title. The system automatically creates the experience document with the new schema structure, initializing `config` with default values (countdown: 0) and `aiConfig` with AI disabled by default (enabled: false). The creator can later edit these settings through the builder UI.

**Why this priority**: This is the core creation flow that all new photo experiences must follow. Without this, no new experiences can be created using the new schema. Keeping creation simple (title only) reduces friction and allows creators to configure details later.

**Independent Test**: Can be fully tested by creating a new photo experience with just a title and verifying the Firestore document structure matches the new schema with `type: "photo"`, `config: {countdown: 0}`, and `aiConfig: {enabled: false}`.

**Acceptance Scenarios**:

1. **Given** an event creator is on the create experience page, **When** they enter a title "Summer Photo Booth" and select type "photo", **Then** the system creates a Firestore document with `type: "photo"`, `config: {countdown: 0}`, and `aiConfig: {enabled: false, aspectRatio: "1:1"}`
2. **Given** an event creator views the create experience dialog, **When** they see the type selection options, **Then** only "photo" is enabled and all other types (video, gif, wheel, survey) are disabled and marked as "coming soon"
3. **Given** a photo experience is created with default values, **When** the creator opens it in the builder, **Then** they can edit countdown, overlay frame, AI settings, and all changes save to the new schema structure

---

### User Story 2 - Edit Existing Photo Experience Configuration (Priority: P1)

An event creator edits an existing photo experience to change the countdown timer from 3 seconds to 5 seconds, update the AI prompt, and change the aspect ratio. The builder UI reads from and writes to the new schema structure.

**Why this priority**: Editing is as critical as creation for the core user workflow. Without this, creators cannot iterate on their experiences.

**Independent Test**: Can be fully tested by loading an existing photo experience, modifying its configuration through the UI, saving, and verifying that Firestore updates show changes only in `config` and `aiConfig` fields (not legacy flat fields).

**Acceptance Scenarios**:

1. **Given** an existing photo experience with `config: {countdown: 3}`, **When** the creator changes countdown to 5 in the builder UI, **Then** the system updates only `config.countdown` to 5 (not any legacy flat field)
2. **Given** a photo experience with `aiConfig: {prompt: "old prompt"}`, **When** the creator updates the AI prompt, **Then** the system updates `aiConfig.prompt` and preserves all other `aiConfig` properties
3. **Given** a photo experience with both old flat fields and new schema fields exist, **When** the creator saves any change, **Then** the system migrates all configuration into `config` and `aiConfig` and removes legacy flat fields

---

### User Story 3 - Backward Compatibility Migration (Priority: P1)

An event has existing photo experiences created before the schema migration with flat fields like `countdown`, `overlayFramePath`, and AI settings at the root level. When an event creator opens any of these experiences in the builder, the system automatically migrates them to the new schema structure on save.

**Why this priority**: Critical for production continuity. Existing experiences must continue working without data loss or manual intervention.

**Independent Test**: Can be fully tested by creating a legacy-format experience in Firestore, loading it in the builder UI, making any edit, saving, and verifying the document now has the new schema structure with all data preserved.

**Acceptance Scenarios**:

1. **Given** an experience document with flat fields `countdown: 3` and `aiEnabled: true`, **When** the creator loads it in the builder, **Then** the UI reads these values correctly and displays them
2. **Given** a legacy experience is loaded and the creator changes any setting, **When** they save, **Then** the system writes to the new schema (`config`, `aiConfig`) and removes all legacy flat fields
3. **Given** a legacy experience has AI settings in flat fields, **When** migration occurs, **Then** all AI-related fields move into `aiConfig` with correct property names (e.g., `aiEnabled` → `aiConfig.enabled`)

---

### Edge Cases

- What happens when an experience document has both old flat fields AND new schema fields? System should prioritize new schema fields when reading, and consolidate into new schema when writing.
- What happens if a creator attempts to select a non-photo experience type during creation? The UI should disable those options and show "coming soon" indicators to prevent selection.
- How does the UI handle partially migrated experiences during the transition period? Builder should gracefully read from both old and new fields with new fields taking precedence.
- What happens when loading a photo experience with missing `config` or `aiConfig`? System should initialize with default values (countdown: 0, aiConfig.enabled: false) and allow editing.
- What happens if default aspectRatio is not specified during creation? System should default to "1:1" as the most common use case for photo booths.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create all new photo experiences using the discriminated union schema with `type: "photo"`, `config`, and `aiConfig`
- **FR-002**: Creation flow MUST only ask for title and type (photo), with all other configuration fields initialized to defaults
- **FR-003**: System MUST initialize new photo experiences with default values: `config: {countdown: 0}` and `aiConfig: {enabled: false, aspectRatio: "1:1"}`
- **FR-004**: Create experience UI MUST disable and mark as "coming soon" all non-photo experience types (video, gif, wheel, survey)
- **FR-005**: System MUST validate that experiences cannot be saved without `label` and `type` fields
- **FR-006**: Builder UI MUST read photo experience settings from `config.countdown`, `config.overlayFramePath`, and `aiConfig.*` (not from legacy flat fields)
- **FR-007**: Builder UI MUST write all photo experience settings to `config` and `aiConfig` objects (not to legacy flat fields)
- **FR-008**: System MUST migrate legacy experiences to new schema structure on save (preserve all data, move flat fields into `config` and `aiConfig`)
- **FR-009**: System MUST handle experiences with missing `config` or `aiConfig` gracefully by initializing them with default values
- **FR-010**: System MUST remove deprecated flat fields from documents after migration to new schema
- **FR-011**: System MUST preserve all existing fields during backward-compatible reads (createdAt, updatedAt, enabled, hidden, previewPath, etc.)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Experience builder configuration panels MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Create experience dialog MUST use touch-friendly controls with minimum 44x44px hit areas for type selection
- **MFR-003**: Configuration form inputs MUST be readable and usable on mobile devices (≥14px text, appropriately sized inputs)
- **MFR-004**: "Coming soon" indicators for disabled experience types MUST display clearly on mobile viewports

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All photo experience documents MUST be validated against PhotoExperience schema using Zod before write operations
- **TSR-002**: PhotoConfig schema MUST validate countdown (optional number) and overlayFramePath (optional string)
- **TSR-003**: `aiConfig` validation MUST ensure `enabled: boolean`, optional `model`, `prompt`, `referenceImagePaths`, and required `aspectRatio`
- **TSR-004**: Form inputs for experience configuration MUST be validated client-side using Zod schemas before submission
- **TSR-005**: TypeScript discriminated union MUST provide compile-time type safety for accessing photo-specific config fields

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: All experience create/update operations MUST use Admin SDK via Server Actions
- **FAR-002**: Builder UI MUST use Client SDK for real-time experience document subscriptions
- **FAR-003**: PhotoExperience schema and related types MUST be defined in `web/src/lib/schemas/experiences.ts`
- **FAR-004**: Experience preview images and overlay frames MUST be stored as full public URLs
- **FAR-005**: Migration logic for legacy experiences MUST be implemented in Server Actions to ensure atomic updates
- **FAR-006**: Schema MUST support future experience types (video, gif, wheel, survey) through discriminated union structure, even though only photo is implemented now

### Key Entities *(include if feature involves data)*

- **Experience (base)**: Represents any interactive experience within an event. Contains shared fields: id, eventId, label, type (discriminator), enabled, hidden, preview media, timestamps.
- **PhotoExperience**: Photo capture experience with specific config for countdown and overlay frame, plus AI configuration. This is the only experience type actively implemented in this feature.
- **PhotoConfig**: Type-specific configuration containing optional countdown (number, defaults to 0) and optional overlayFramePath (string).
- **AiConfig**: Shared AI configuration for photo experiences, containing enabled flag (defaults to false), optional model/prompt/references, and aspectRatio (defaults to "1:1").
- **Future Experience Types** (schema defined, UI not implemented): VideoExperience, GifExperience, WheelExperience, SurveyExperience - all disabled with "coming soon" indicators in create UI.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event creators can create new photo experiences by providing only title, and the system automatically initializes with default configuration in under 5 seconds
- **SC-002**: Existing legacy photo experiences are automatically migrated to new schema on first edit with 100% data preservation (zero reported data loss)
- **SC-003**: Builder UI loads and displays photo experience configuration without errors in under 2 seconds
- **SC-004**: 100% of photo experience documents created after deployment conform to the new discriminated union schema with `config` and `aiConfig` objects (validated via Firestore query)
- **SC-005**: Zero production errors related to schema mismatches between UI and Firestore after migration (measured over 30-day period)
- **SC-006**: Event creators see clear "coming soon" indicators for non-photo experience types and understand these are not yet available (measured by absence of support tickets requesting immediate video/gif/survey features)
- **SC-007**: All photo experiences created with new schema have correct default values: countdown=0, aiConfig.enabled=false, aspectRatio="1:1" (validated via Firestore query)

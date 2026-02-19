# Feature Specification: Outcome Schema Redesign — Photo & AI Photo

**Feature Branch**: `072-outcome-schema-redesign`
**Created**: 2026-02-19
**Status**: Draft
**Input**: Phase 1 of Experience Designer v4 — Refactor outcome system from flat, conditional schema to per-type config architecture with full-stack support for photo and ai.photo outcome types.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure a Photo Output (Priority: P1)

An experience creator opens the experience designer, navigates to the output configuration section, and selects "Photo" from the output type picker. They choose a source capture step (a photo capture step already defined in the experience) and set the desired aspect ratio. The system saves the configuration automatically. When a guest later completes the experience, they receive a passthrough photo result based on this configuration.

**Why this priority**: Photo output is the most common outcome type and the foundation for the entire outcome system. Without it, the platform cannot deliver its core value.

**Independent Test**: Can be fully tested by creating an experience with a photo capture step, configuring a photo output, and verifying a guest receives a correctly-processed photo result.

**Acceptance Scenarios**:

1. **Given** an experience with no output configured, **When** the creator opens the output section, **Then** they see an output type picker with grouped options (Media: Photo, GIF, Video; AI Generated: AI Photo, AI Video).
2. **Given** the output type picker is displayed, **When** the creator selects "Photo", **Then** the system shows the photo configuration form with source step selector and aspect ratio selector.
3. **Given** the photo config form is shown and the experience has exactly one photo capture step, **When** the form loads, **Then** the source step is auto-selected.
4. **Given** the creator has selected a source step and aspect ratio, **When** changes are made, **Then** the configuration is auto-saved and the aspect ratio cascades to the referenced capture step.
5. **Given** a fully configured photo output, **When** a guest completes the experience, **Then** the guest receives a passthrough photo result (captured media with optional overlay applied).

---

### User Story 2 - Configure an AI Photo Output (Text-to-Image) (Priority: P1)

An experience creator selects "AI Photo" from the output type picker and configures a text-to-image generation. They set an aspect ratio, write a prompt (using mention placeholders for step responses and reference media), select an AI model, and optionally upload reference images. The system saves automatically. When a guest completes the experience, they receive an AI-generated image based on the prompt.

**Why this priority**: AI photo generation is the platform's differentiating feature and equally critical as basic photo output.

**Independent Test**: Can be fully tested by creating an experience with an AI Photo (text-to-image) output, providing a prompt with placeholders, and verifying a guest receives an AI-generated result.

**Acceptance Scenarios**:

1. **Given** the creator selects "AI Photo" from the type picker, **When** the AI Photo config form loads, **Then** it shows: task selector (defaulting to text-to-image), aspect ratio selector, prompt composer, model selector, and reference media uploader.
2. **Given** the task is "text-to-image", **When** the creator views the form, **Then** the source step selector is hidden (no capture step needed).
3. **Given** the creator writes a prompt, **When** they type a mention trigger, **Then** the system offers autocomplete for step references and reference media placeholders.
4. **Given** a fully configured text-to-image output, **When** a guest completes the experience, **Then** the system resolves prompt mentions, generates an image via the selected AI model, applies any overlay, and delivers the result to the guest.

---

### User Story 3 - Configure an AI Photo Output (Image-to-Image) (Priority: P2)

An experience creator selects "AI Photo" and switches the task to "image-to-image". They choose a source capture step (the guest's photo to transform), set an aspect ratio, write a transformation prompt, select an AI model, and optionally upload reference images. The aspect ratio cascades to the capture step.

**Why this priority**: Image-to-image is a secondary AI workflow that builds on both the photo capture and AI generation capabilities.

**Independent Test**: Can be fully tested by creating an experience with a photo capture step, configuring an AI Photo (image-to-image) output, and verifying a guest receives an AI-transformed version of their captured photo.

**Acceptance Scenarios**:

1. **Given** the creator switches the task to "image-to-image", **When** the form updates, **Then** the source step selector becomes visible and is required.
2. **Given** a source step is selected for image-to-image, **When** the creator changes the aspect ratio, **Then** the aspect ratio cascades to the referenced capture step.
3. **Given** a fully configured image-to-image output, **When** a guest completes the experience, **Then** the system uses the guest's captured photo as input, resolves prompt mentions, generates a transformed image, applies overlay, and delivers the result.

---

### User Story 4 - Switch Between Output Types (Priority: P2)

An experience creator who has already configured a "Photo" output decides to switch to "AI Photo". The system updates the visible form to show the AI Photo configuration. The previous photo configuration is preserved so that if they switch back, their settings are retained.

**Why this priority**: Type switching enables experimentation and reduces friction when creators change their minds during setup.

**Independent Test**: Can be fully tested by configuring a Photo output, switching to AI Photo, switching back, and verifying all settings are preserved.

**Acceptance Scenarios**:

1. **Given** a photo output is configured, **When** the creator changes the output type to "AI Photo", **Then** the AI Photo form is displayed and the photo config is preserved.
2. **Given** the creator switches back to "Photo", **When** the photo form loads, **Then** all previously configured photo settings (source step, aspect ratio) are restored.

---

### User Story 5 - Remove Output Configuration (Priority: P3)

An experience creator wants to clear the current output type entirely. They click "Remove output", which resets the output type to empty and returns them to the type picker. The per-type configs are preserved internally in case the creator reselects the same type.

**Why this priority**: Removing output is a less common action but necessary for configuration flexibility.

**Independent Test**: Can be fully tested by configuring an output, removing it, verifying the type picker returns, and reselecting the same type to confirm settings are preserved.

**Acceptance Scenarios**:

1. **Given** a configured output, **When** the creator clicks "Remove output", **Then** the output type is cleared and the type picker is shown.
2. **Given** the output was removed, **When** the creator re-selects the same type, **Then** the previous configuration for that type is restored.

---

### User Story 6 - Data Migration from Old Schema (Priority: P1)

Existing experiences stored in the old flat outcome schema format must be migrated to the new per-type config structure. The migration must handle all existing outcome configurations (plain photo, AI text-to-image, AI image-to-image, and unconfigured outcomes) without data loss. Both draft and published versions of each experience must be migrated.

**Why this priority**: Without migration, all existing experiences would break after the schema change deploys.

**Independent Test**: Can be fully tested by running the migration script against a set of known old-format documents and verifying each maps correctly to the new format.

**Acceptance Scenarios**:

1. **Given** an experience with `type: 'image'` and `aiEnabled: false`, **When** the migration runs, **Then** the outcome becomes `type: 'photo'` with photo config populated from existing fields.
2. **Given** an experience with `type: 'image'`, `aiEnabled: true`, and no capture step, **When** the migration runs, **Then** the outcome becomes `type: 'ai.photo'` with task `text-to-image`.
3. **Given** an experience with `type: 'image'`, `aiEnabled: true`, and a capture step, **When** the migration runs, **Then** the outcome becomes `type: 'ai.photo'` with task `image-to-image`.
4. **Given** an experience with `type: null`, **When** the migration runs, **Then** the outcome type remains `null` with all config fields set to `null`.
5. **Given** the migration has already run, **When** it runs again, **Then** no changes are made (idempotent).
6. **Given** any experience, **When** the migration runs, **Then** both `draft.outcome` and `published.outcome` are migrated.

---

### User Story 7 - Coming Soon Types Displayed (Priority: P3)

When a creator views the output type picker, GIF, Video, and AI Video options are visible but disabled with a "Coming soon" label. This communicates the product roadmap without blocking current functionality.

**Why this priority**: Low priority — purely informational UI that sets expectations for future features.

**Independent Test**: Can be fully tested by opening the output type picker and verifying disabled items with "Coming soon" labels.

**Acceptance Scenarios**:

1. **Given** the output type picker is shown, **When** the creator views GIF, Video, or AI Video options, **Then** they are displayed as disabled with a "Coming soon" label.
2. **Given** a disabled "Coming soon" option, **When** the creator attempts to select it, **Then** nothing happens (no type change, no error).

---

### Edge Cases

- What happens when the creator configures an image-to-image task but then deletes the referenced capture step? The source step selector should indicate the step is missing and require re-selection.
- What happens when there are no photo capture steps in the experience? The source step selector should show an empty state prompting the creator to add a capture step first.
- What happens when a guest triggers an experience with a `gif`, `video`, or `ai.video` outcome type? The backend rejects the request with a "not implemented" error.
- What happens when the outcome type is `null` at the time a guest attempts to complete the experience? The backend rejects the request (no outcome configured).
- What happens if the migration encounters a document that already has the new schema format? The migration skips it (idempotent behavior).
- What happens if old schema fields remain on a migrated document? The new schema tolerates unknown fields gracefully (they are ignored during parsing).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support five outcome types: photo, gif, video, ai.photo, ai.video.
- **FR-002**: System MUST store outcome configuration as a per-type structure where each type has its own dedicated config field (all defaulting to null when not configured).
- **FR-003**: System MUST provide an output type picker when no type is selected, displaying options in two groups: Media (Photo, GIF, Video) and AI Generated (AI Photo, AI Video).
- **FR-004**: GIF, Video, and AI Video options MUST be displayed as disabled with "Coming soon" labels in the type picker.
- **FR-005**: System MUST provide a photo configuration form with source step selector (limited to photo capture steps) and aspect ratio selector (1:1, 3:2, 2:3, 9:16).
- **FR-006**: System MUST provide an AI photo configuration form with: task selector (text-to-image / image-to-image), conditional source step selector, aspect ratio selector, prompt composer with mention support, model selector, and reference media management.
- **FR-007**: When a type is selected, system MUST show a type switcher allowing the creator to change between types.
- **FR-008**: Switching output types MUST preserve the previous type's configuration in its dedicated field.
- **FR-009**: Removing the output MUST clear the type to null while preserving all per-type configurations.
- **FR-010**: Aspect ratio changes MUST cascade to the referenced capture step's configuration.
- **FR-011**: When only one photo capture step exists, it MUST be auto-selected as the source step.
- **FR-012**: Configuration changes MUST be auto-saved using the existing debounced save pattern.
- **FR-013**: All user-facing labels MUST use "output" terminology instead of "outcome".
- **FR-014**: The photo outcome executor MUST process captured media through a passthrough flow: download captured media, apply overlay if configured, upload output.
- **FR-015**: The AI photo outcome executor MUST handle text-to-image: resolve prompt mentions, generate image via AI model, apply overlay, upload output.
- **FR-016**: The AI photo outcome executor MUST handle image-to-image: download source media from capture step, resolve prompt mentions, generate transformed image via AI model, apply overlay, upload output.
- **FR-017**: The backend MUST reject processing requests for outcome types without executors (gif, video, ai.video) with a "not implemented" error.
- **FR-018**: The backend MUST reject processing requests when outcome type is null.
- **FR-019**: A migration MUST transform all existing experience documents from the old flat schema to the new per-type config structure.
- **FR-020**: The migration MUST handle both `draft.outcome` and `published.outcome` fields.
- **FR-021**: The migration MUST be idempotent (safe to re-run without side effects).
- **FR-022**: The new schema MUST tolerate old/unknown fields on documents that haven't been fully cleaned up.
- **FR-023**: The old flat schema fields (aiEnabled, top-level captureStepId, top-level aspectRatio, top-level imageGeneration, outcomeOptionsSchema, imageOptionsSchema, gifOptionsSchema, videoOptionsSchema) MUST be removed or deprecated.

### Key Entities

- **Outcome**: Top-level output configuration for an experience. Contains a type selector and per-type config fields. Only one type is active at a time.
- **PhotoOutcomeConfig**: Configuration for direct photo capture output. Links to a capture step and defines aspect ratio.
- **AIPhotoOutcomeConfig**: Configuration for AI-generated photo output. Defines generation task (text-to-image or image-to-image), optional source capture step, aspect ratio, prompt template, AI model, and reference media.
- **GifOutcomeConfig / VideoOutcomeConfig / AIVideoOutcomeConfig**: Placeholder configs for future outcome types (defined in schema but not active in this phase).
- **OutcomeType**: Enumeration of all supported outcome types (photo, gif, video, ai.photo, ai.video).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can configure a photo output and guests receive the correct passthrough result with no regressions from current functionality.
- **SC-002**: Creators can configure an AI photo (text-to-image) output and guests receive an AI-generated image result.
- **SC-003**: Creators can configure an AI photo (image-to-image) output and guests receive an AI-transformed image result based on their captured photo.
- **SC-004**: All existing experience documents are successfully migrated to the new schema format with zero data loss.
- **SC-005**: Creators can switch between output types and return to previously configured settings without re-entering data.
- **SC-006**: Schema, editor, backend, and migration deploy together as a single coordinated release with no schema mismatch errors.
- **SC-007**: GIF, Video, and AI Video options are visible in the picker as "Coming soon" without causing errors when interacted with.
- **SC-008**: Backend correctly rejects unimplemented outcome types and null outcomes with appropriate error responses.

## Assumptions

- The existing autosave/debounced save pattern in the editor is stable and will be reused without modification.
- Existing overlay and AI image generation operations remain unchanged and are compatible with the new executor structure.
- The prompt composer mention system follows the existing implementation pattern.
- Completed and failed jobs with old snapshot formats are treated as historical records and do not require migration.
- The deployment of schema changes, editor updates, backend updates, and data migration will be coordinated as a single release.
- Category grouping in the type picker (Media vs AI Generated) is hardcoded in the frontend and not stored in the schema.

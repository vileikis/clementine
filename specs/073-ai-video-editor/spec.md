# Feature Specification: AI Video Editor

**Feature Branch**: `073-ai-video-editor`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: "Phase 2 of Experience Designer v4 — Add AI Video configuration UI to the experience designer, enabling admins to fully configure ai.video outcomes with animate, transform, and reimagine tasks."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select AI Video Output Type (Priority: P1)

An experience creator opens the experience designer and wants to configure an AI Video outcome. They click the output type picker and see "AI Video" as an enabled option (previously shown as "coming soon"). They select it, and the designer switches to show the AI Video configuration form with smart defaults already applied.

**Why this priority**: This is the entry point for all AI Video configuration. Without the ability to select AI Video as an output type, no other AI Video features are accessible.

**Independent Test**: Can be fully tested by opening the experience designer, selecting AI Video from the output type picker, and verifying the config form appears with default values (animate task, 9:16 aspect ratio, 5-second duration).

**Acceptance Scenarios**:

1. **Given** an experience with a photo capture step, **When** the creator opens the output type picker, **Then** "AI Video" appears as an enabled option without a "coming soon" badge
2. **Given** an experience with no AI Video config, **When** the creator selects "AI Video", **Then** the outcome type is set to `ai.video` and the config form appears with smart defaults: animate task, 9:16 aspect ratio, 5-second duration, and the only capture step auto-selected
3. **Given** an experience with multiple capture.photo steps, **When** the creator selects "AI Video" for the first time, **Then** the source step selector is shown without a pre-selected value, requiring the creator to choose one

---

### User Story 2 - Configure Animate Task (Priority: P1)

A creator selects the "Animate" task to bring a guest's photo to life as a video. They configure the source photo step, choose an aspect ratio, and set up the video generation prompt, model, and duration. The configuration auto-saves as changes are made.

**Why this priority**: Animate is the simplest task (no image generation config), making it the default and most common starting point.

**Independent Test**: Can be tested by selecting AI Video, choosing the animate task, configuring shared fields (source step, aspect ratio, video prompt, model, duration), and verifying all changes auto-save to the experience document.

**Acceptance Scenarios**:

1. **Given** AI Video is selected with animate task, **When** the creator views the config form, **Then** only shared fields are visible: source step selector, aspect ratio selector (9:16 or 1:1), video generation prompt, model selector, and duration input
2. **Given** the creator changes the aspect ratio, **When** a new aspect ratio is selected, **Then** the referenced capture step's aspect ratio config is updated to match
3. **Given** the creator modifies any config field, **When** the change is made, **Then** the configuration auto-saves after a debounce period

---

### User Story 3 - Configure Transform Task (Priority: P2)

A creator selects the "Transform" task to generate a video that transitions from the guest's original photo to an AI-generated end frame. In addition to the shared video fields, they configure the end frame image generation with a prompt (supporting mentions), an AI image model, and optional reference media.

**Why this priority**: Transform adds the first image generation config layer, enabling more creative outcomes while building on the animate foundation.

**Independent Test**: Can be tested by selecting the transform task, configuring the end frame image generation section (prompt with mentions, model, reference media), and verifying the complete config saves correctly.

**Acceptance Scenarios**:

1. **Given** AI Video is selected, **When** the creator selects the "Transform" task, **Then** an "End Frame Image Generation" section appears below the shared fields with prompt, model, and reference media inputs
2. **Given** the transform task is active, **When** the creator types in the end frame prompt, **Then** they can insert `@{step:...}` and `@{ref:...}` mentions
3. **Given** the transform task is active, **When** the creator uploads reference images for the end frame, **Then** the images appear in a manageable list and are included in the config
4. **Given** the transform task is active, **Then** the end frame image generation section does NOT show an aspect ratio selector (aspect ratio is inherited from the parent AI Video config)

---

### User Story 4 - Configure Reimagine Task (Priority: P2)

A creator selects the "Reimagine" task to generate a video between two AI-generated frames. They configure both start frame and end frame image generation sections independently, each with its own prompt, model, and reference media.

**Why this priority**: Reimagine is the most complex task, adding a second image generation config. It builds directly on the transform task patterns.

**Independent Test**: Can be tested by selecting the reimagine task, configuring both start and end frame image generation sections independently, and verifying each section saves its own config.

**Acceptance Scenarios**:

1. **Given** AI Video is selected, **When** the creator selects the "Reimagine" task, **Then** both "Start Frame Image Generation" and "End Frame Image Generation" sections appear, each with prompt, model, and reference media inputs
2. **Given** the reimagine task is active, **When** the creator configures start frame prompt and end frame prompt, **Then** both prompts support `@{step:...}` and `@{ref:...}` mentions independently
3. **Given** the reimagine task is active, **When** the creator uploads reference images for the start frame, **Then** they are separate from the end frame reference images
4. **Given** the reimagine task is active, **Then** neither frame generation section shows an aspect ratio selector (both inherit from parent)

---

### User Story 5 - Switch Tasks While Preserving Config (Priority: P2)

A creator initially configures the transform task with an end frame prompt and reference images. They then switch to reimagine. The end frame config is preserved, and a new start frame section appears. If they switch to animate, both frame configs are hidden but not lost. Switching back to reimagine restores everything.

**Why this priority**: Config preservation during task switching prevents data loss and reduces re-work, which is critical for a smooth editing experience.

**Independent Test**: Can be tested by configuring transform task fully, switching to reimagine (verify end frame preserved, start frame appears), switching to animate (verify frame sections hidden), and switching back to reimagine (verify both frames restored).

**Acceptance Scenarios**:

1. **Given** the creator has configured end frame image generation on the transform task, **When** they switch to reimagine, **Then** the end frame config is preserved and a start frame section appears (initialized with defaults if not previously configured)
2. **Given** the creator has configured both frame sections on reimagine, **When** they switch to animate, **Then** both frame sections are hidden but the config data is not cleared
3. **Given** the creator has configured reimagine, **When** they switch to animate then back to reimagine, **Then** both start and end frame configs are fully restored
4. **Given** the creator has configured transform with end frame, **When** they switch to animate then to transform, **Then** the end frame config is fully restored

---

### User Story 6 - Switch Between Output Types While Preserving AI Video Config (Priority: P2)

A creator configures an AI Video outcome with the reimagine task and detailed frame generation settings. They switch to "Photo" output type to compare, then switch back to "AI Video". All AI Video configuration is fully restored.

**Why this priority**: Output type switching with config preservation is a Phase 1 pattern that must extend seamlessly to AI Video.

**Independent Test**: Can be tested by fully configuring AI Video, switching to Photo, switching back to AI Video, and verifying all config (task, source step, aspect ratio, video gen, frame gen) is restored.

**Acceptance Scenarios**:

1. **Given** the creator has fully configured an AI Video outcome, **When** they switch to Photo or AI Image output type, **Then** the AI Video config is preserved in the background
2. **Given** the creator previously configured AI Video and switched away, **When** they switch back to AI Video, **Then** all config is restored: task selection, source step, aspect ratio, video generation settings, and all frame generation configs
3. **Given** a brand new experience, **When** the creator selects AI Video for the first time, **Then** smart defaults are applied (not stale config from a previous session)

---

### Edge Cases

- What happens when all capture.photo steps are removed after AI Video is configured? The source step selector should indicate the previously selected step is missing, prompting the creator to select a new one or add a capture step.
- What happens when the creator switches aspect ratio after configuring frame generation? The aspect ratio change cascades to the capture step config but does not affect frame generation configs (they inherit automatically).
- What happens if the creator leaves the video generation prompt empty? The config saves with an empty prompt; validation is deferred to the execution phase (Phase 3).
- What happens when a published experience uses AI Video but the backend isn't implemented yet? The backend dispatcher returns a graceful "not implemented" error. This is expected behavior for Phase 2.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display "AI Video" as an enabled option in the output type picker, without a "coming soon" badge
- **FR-002**: System MUST show a task picker with three options when AI Video is selected: Animate, Transform, and Reimagine
- **FR-003**: System MUST display a source step selector for choosing a `capture.photo` step, visible for all three AI Video tasks
- **FR-004**: System MUST display an aspect ratio selector with options 9:16 and 1:1, visible for all three AI Video tasks
- **FR-005**: System MUST cascade the selected aspect ratio to the referenced capture step's configuration
- **FR-006**: System MUST display video generation config fields (prompt, model selector, duration) for all three AI Video tasks
- **FR-007**: System MUST display an end frame image generation section (prompt with mention support, model selector, reference media) when the Transform task is selected
- **FR-008**: System MUST display both start frame and end frame image generation sections (each with prompt with mention support, model selector, reference media) when the Reimagine task is selected
- **FR-009**: System MUST NOT display frame image generation sections when the Animate task is selected
- **FR-010**: System MUST preserve frame generation configs when switching between tasks (configs are hidden but not cleared)
- **FR-011**: System MUST preserve the complete AI Video config when switching to a different output type and restore it when switching back
- **FR-012**: System MUST apply smart defaults when AI Video is selected for the first time: animate task, 9:16 aspect ratio, 5-second duration, and auto-select the only capture.photo step if exactly one exists
- **FR-013**: System MUST auto-save all AI Video configuration changes using the existing debounced autosave pattern
- **FR-014**: Frame image generation sections MUST NOT include their own aspect ratio selector (aspect ratio is inherited from the parent AI Video config)
- **FR-015**: Prompt inputs in frame image generation sections MUST support `@{step:...}` and `@{ref:...}` mention syntax
- **FR-016**: Frame image generation sections MUST support uploading and managing reference media images
- **FR-017**: System MUST include a video generation model selector (can start with a single placeholder model option)

### Key Entities

- **AI Video Config**: The top-level configuration for an AI Video outcome, containing task type, source step reference, aspect ratio, video generation settings, and optional frame generation configs
- **Video Generation Config**: Settings for the video generation itself — prompt, model, and duration in seconds
- **Frame Image Generation Config**: Settings for generating an AI image frame — prompt (with mention support), AI image model, and reference media. Used for end frame (transform/reimagine) and start frame (reimagine)
- **AI Video Task**: One of three task types — animate (photo to video), transform (photo transitions to AI end frame), reimagine (video between two AI-generated frames)
- **Video Aspect Ratio**: Constrained set of aspect ratios for video output — 9:16 and 1:1

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can fully configure all three AI Video tasks (animate, transform, reimagine) through the experience designer UI
- **SC-002**: Switching between tasks preserves all previously entered configuration data with zero data loss
- **SC-003**: Switching between output types (Photo, AI Image, AI Video) preserves all type-specific configuration with zero data loss
- **SC-004**: Smart defaults are applied on first AI Video selection, allowing creators to have a valid animate configuration with minimal interaction (select output type only, when a single capture step exists)
- **SC-005**: All configuration changes auto-save without requiring manual save actions
- **SC-006**: Existing Photo and AI Image outcome configurations continue to function correctly with no regressions
- **SC-007**: Frame generation prompt inputs support mention syntax, enabling creators to reference steps and media in their prompts

## Assumptions

- Phase 1 (Schema Redesign + Photo & AI Image) is complete and deployed, including the output type picker and per-type config persistence pattern
- The `ai.video` slot exists in the outcome schema with config set to `null`
- The backend dispatcher has `'ai.video': null` and returns a "not implemented" error gracefully
- The AIVideoModel enum may start with a single placeholder value; the actual model integration happens in Phase 3
- The existing mention system (`@{step:...}` and `@{ref:...}`) is already implemented and available for reuse in frame generation prompt inputs
- Reference media upload uses the same patterns and infrastructure as existing AI Image reference media
- The debounced autosave mechanism from existing config forms is reusable for AI Video config

## Dependencies

- Phase 1: Schema Redesign + Photo & AI Image (must be complete)
- Existing output type picker component
- Existing mention system for prompt inputs
- Existing reference media upload infrastructure
- Existing debounced autosave mechanism

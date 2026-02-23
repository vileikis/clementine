# Feature Specification: AI Video Editor v2

**Feature Branch**: `075-ai-video-editor-v2`
**Created**: 2026-02-22
**Status**: Draft
**Input**: Requirements document: `requirements/exp-designer-v4/phase-4-ai-video-editor-v2.md`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Video Task and Configure Prompt (Priority: P1)

An experience creator opens the AI Video editor and sees a task selector with four options: Animate, Remix, Transform, and Reimagine. They select "Animate" (the default) and compose a video generation prompt using a rich text composer that supports @mentions to reference input steps. They pick a video model, choose a duration (4s, 6s, or 8s), and save.

**Why this priority**: This is the core interaction — task selection and prompt composition drive every video generation. Without this, no video can be configured.

**Independent Test**: Can be fully tested by opening the AI Video editor, selecting a task, composing a prompt with @mentions, picking a model and duration, and verifying the configuration saves correctly.

**Acceptance Scenarios**:

1. **Given** an experience with an AI Video outcome, **When** the creator opens the editor, **Then** the task selector displays four options: Animate, Remix, Transform (coming soon), and Reimagine (coming soon), with Animate selected by default.
2. **Given** the task selector is visible, **When** the creator selects "Animate" or "Remix", **Then** the task updates in the configuration and the editor shows appropriate controls for that task.
3. **Given** the task selector is visible, **When** the creator attempts to select "Transform" or "Reimagine", **Then** the option is not selectable and displays a "coming soon" badge.
4. **Given** a task is selected, **When** the creator types a prompt, **Then** the prompt composer supports @mentions to reference input steps.
5. **Given** the prompt composer is shown, **When** the creator picks a model, **Then** only AI video models are available for selection.
6. **Given** the prompt composer is shown, **When** the creator selects a duration, **Then** only fixed options (4s, 6s, 8s) are available, with 6s as the default.

---

### User Story 2 - Add Reference Media for Remix Task (Priority: P2)

An experience creator selects the "Remix" task and adds up to 2 reference images to influence the creative direction of the generated video. The user's source photo always occupies one reference slot automatically, leaving room for 2 additional reference images.

**Why this priority**: Reference media is what differentiates Remix from Animate. Without it, Remix has no unique value beyond Animate.

**Independent Test**: Can be fully tested by selecting Remix, uploading reference images, verifying the count limit, and confirming the references persist in the configuration.

**Acceptance Scenarios**:

1. **Given** the "Remix" task is selected, **When** the editor loads, **Then** a reference media strip is visible with an option to add images.
2. **Given** the reference media strip is visible, **When** the creator uploads reference images, **Then** up to 2 reference images can be added.
3. **Given** 2 reference images are already added, **When** the creator tries to add another, **Then** the system prevents the addition (max reached).
4. **Given** reference images are added, **When** the creator removes one, **Then** the image is removed and a slot opens up.
5. **Given** reference media is added for Remix, **When** the creator switches to "Animate", **Then** the reference media strip is hidden but the data persists silently.
6. **Given** reference media was previously added, **When** the creator switches back to "Remix", **Then** the previously added reference media reappears.

---

### User Story 3 - Backend Generates Video Using Correct API Path (Priority: P1)

When a video generation job runs, the backend correctly routes to the appropriate API path based on the selected task. "Animate" uses the image-to-video path (source photo as first frame), while "Remix" uses the reference-images-to-video path (source photo and reference images as creative input).

**Why this priority**: Correct backend routing is essential — without it, the wrong API is called and video generation fails or produces incorrect results.

**Independent Test**: Can be fully tested by triggering video generation for each task type and verifying the correct API parameters are sent and a valid video is returned.

**Acceptance Scenarios**:

1. **Given** a job with the "Animate" task, **When** the executor runs, **Then** it sends the user photo as the first frame via the image parameter, along with the resolved prompt, duration, and aspect ratio.
2. **Given** a job with the "Remix" task, **When** the executor runs, **Then** it sends the user photo and any reference images via the reference images configuration, along with the resolved prompt, duration, and aspect ratio.
3. **Given** a job with the "Remix" task, **When** the executor runs, **Then** the image parameter is NOT set (mutually exclusive with reference images).
4. **Given** a prompt containing @mentions, **When** the executor runs, **Then** @mentions are resolved to actual values before being sent to the video generation API.

---

### User Story 4 - Existing Configurations Migrate Seamlessly (Priority: P2)

Experience creators who previously configured AI Video outcomes with the old "animate" task value can still open and use their experiences without errors. The system automatically maps the legacy task value to the new identifier.

**Why this priority**: Without migration, existing experiences would break or display incorrectly.

**Independent Test**: Can be fully tested by loading an experience with the old `task: 'animate'` value and verifying it displays and functions correctly as "Animate" (image-to-video).

**Acceptance Scenarios**:

1. **Given** an existing experience with the legacy "animate" task value, **When** the editor loads, **Then** the task is displayed as "Animate" and functions correctly.
2. **Given** an existing experience with the legacy "animate" task value, **When** the creator saves, **Then** the task value is updated to the new identifier transparently.

---

### Edge Cases

- What happens when a creator switches tasks rapidly between Animate and Remix? The UI should correctly show/hide reference media without data loss.
- What happens when reference media files fail to upload? The system should show an appropriate error and not count the failed upload against the limit.
- What happens when a creator has a legacy duration value (e.g., 5) that is no longer valid? The system should coerce to the nearest valid value or apply the default (6s).
- What happens when reference media URLs become invalid between save and execution? The backend should handle missing media gracefully and report the error.
- What happens when a creator selects Remix but adds no reference images? The system should still allow generation (user photo serves as the sole creative reference).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a task selector with four options displaying labels: Animate, Remix, Transform, and Reimagine.
- **FR-002**: System MUST disable Transform and Reimagine tasks with a visible "coming soon" indicator; these tasks MUST NOT be selectable.
- **FR-003**: System MUST default to the "Animate" task when creating a new AI Video outcome.
- **FR-004**: System MUST provide a prompt composer for video generation that supports @mentions for referencing input steps.
- **FR-005**: System MUST provide a model picker within the prompt composer showing only AI video models.
- **FR-006**: System MUST constrain video duration to exactly three fixed options: 4 seconds, 6 seconds, and 8 seconds, defaulting to 6 seconds.
- **FR-007**: System MUST hide aspect ratio controls within the prompt composer (aspect ratio is controlled at the outcome level).
- **FR-008**: System MUST show a reference media strip for the "Remix" task allowing up to 2 additional reference images.
- **FR-009**: System MUST hide the reference media strip entirely for the "Animate" task.
- **FR-010**: System MUST preserve reference media data silently when switching away from "Remix" to another task, and restore it when switching back.
- **FR-011**: Backend MUST route "Animate" jobs to the image-to-video generation path (user photo as first frame).
- **FR-012**: Backend MUST route "Remix" jobs to the reference-images-to-video generation path (user photo + reference images as creative input).
- **FR-013**: Backend MUST resolve @mentions in prompts before sending to the video generation API.
- **FR-014**: Backend MUST NOT set the image parameter when using the reference-images-to-video path (these fields are mutually exclusive).
- **FR-015**: System MUST migrate legacy "animate" task values to the new "image-to-video" identifier transparently.
- **FR-016**: System MUST validate only fields relevant to the active task; stale fields from other tasks are ignored during validation.

### Key Entities

- **AI Video Task**: The type of video generation operation. Has a technical identifier (used in data/backend) and a display label (shown in UI). Four possible values: image-to-video (Animate), ref-images-to-video (Remix), transform (Transform, coming soon), reimagine (Reimagine, coming soon).
- **Video Generation Config**: Configuration for the video prompt including the text prompt (with @mention support), selected model, duration (4/6/8 seconds), aspect ratio, and reference media array.
- **Reference Media**: Images uploaded by the creator to influence creative direction for the Remix task. Limited to 2 additional images per configuration. Only relevant for the ref-images-to-video task; the user's source photo automatically occupies one of the available reference slots.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can configure and generate videos using both Animate and Remix tasks end-to-end without errors.
- **SC-002**: Duration selection is limited to exactly 3 options (4s, 6s, 8s) with no free-form input possible.
- **SC-003**: Reference media upload, removal, and persistence work correctly for Remix, with the 2-image limit enforced.
- **SC-004**: Existing experiences with the legacy "animate" task value load and function correctly without manual intervention.
- **SC-005**: Transform and Reimagine tasks are visible but not selectable, clearly indicating "coming soon" status.
- **SC-006**: Video generation prompts with @mentions resolve correctly and produce valid API calls.
- **SC-007**: Switching between Animate and Remix preserves all configuration data (prompt, model, duration, reference media) without data loss.
- **SC-008**: No regressions in Photo and AI Image outcome types after these changes.

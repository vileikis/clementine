# Feature Specification: Experience Create Outcome Configuration

**Feature Branch**: `059-experience-create`
**Created**: 2026-02-04
**Status**: Draft
**Input**: PRD 1B - Add create outcome field to experience config with publish-time validation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Outcome Type Before Publishing (Priority: P1)

As an experience creator, I need to select an outcome type (Image, GIF, or Video) for my experience before I can publish it, ensuring guests know what type of result they'll receive.

**Why this priority**: Without an outcome type configured, the experience cannot be published. This is the foundational requirement that gates all other functionality.

**Independent Test**: Can be fully tested by creating a new experience and attempting to publish without selecting an outcome type - the system should prevent publishing with a clear error message.

**Acceptance Scenarios**:

1. **Given** a new experience with no outcome type selected, **When** the creator attempts to publish, **Then** the system prevents publishing and displays "Select an outcome type (Image, GIF, or Video)"
2. **Given** an experience with outcome type set to "image", **When** the creator attempts to publish, **Then** the system allows publishing to proceed (assuming other validations pass)
3. **Given** an experience with outcome type set to "gif" or "video", **When** the creator attempts to publish, **Then** the system displays "GIF/VIDEO outcome is coming soon" and prevents publishing

---

### User Story 2 - Configure AI-Generated Outcomes (Priority: P1)

As an experience creator, I need to configure AI image generation settings (prompt, reference media, model, aspect ratio) so that guests receive AI-transformed photos based on my creative vision.

**Why this priority**: AI-enabled generation is the core differentiator and primary use case for most experiences. This enables the magical transformation that guests expect.

**Independent Test**: Can be tested by creating an experience with AI enabled, entering a prompt and reference media, then publishing and verifying the configuration is saved correctly.

**Acceptance Scenarios**:

1. **Given** an experience with AI enabled and an empty prompt, **When** the creator attempts to publish, **Then** the system displays "Prompt is required when AI is enabled" and prevents publishing
2. **Given** an experience with AI enabled and a valid prompt, **When** the creator publishes, **Then** the prompt is saved with the published experience
3. **Given** reference media with duplicate display names, **When** the creator attempts to publish, **Then** the system displays "Duplicate reference media names: [names]" and prevents publishing
4. **Given** reference media with unique display names, **When** the creator publishes, **Then** all reference media is included in the published configuration

---

### User Story 3 - Configure Passthrough Mode (Priority: P2)

As an experience creator, I need to configure passthrough mode (AI disabled) with a source capture step, so that guest photos pass through without AI transformation when that's my desired outcome.

**Why this priority**: Passthrough is a valid but secondary use case for experiences that want to collect and distribute photos without AI enhancement.

**Independent Test**: Can be tested by disabling AI, selecting a capture step as source, and publishing - verifying the experience publishes successfully.

**Acceptance Scenarios**:

1. **Given** an experience with AI disabled and no source capture step selected, **When** the creator attempts to publish, **Then** the system displays "Passthrough mode requires a source image. Enable AI or select a source step." and prevents publishing
2. **Given** an experience with AI disabled and a valid capture step selected, **When** the creator publishes, **Then** the experience publishes successfully with passthrough configuration
3. **Given** a source step ID that references a deleted step, **When** the creator attempts to publish, **Then** the system displays "Selected source step no longer exists"
4. **Given** a source step ID that references a non-capture step, **When** the creator attempts to publish, **Then** the system displays "Source step must be a capture step"

---

### User Story 4 - Switch Outcome Types While Preserving Settings (Priority: P2)

As an experience creator, I need to switch between outcome types while preserving my image generation settings (prompt, reference media, model, aspect ratio), so I don't lose my creative work when exploring different outcome formats.

**Why this priority**: Reduces friction in the configuration process and prevents data loss during exploration.

**Independent Test**: Can be tested by configuring image generation settings, switching outcome type, and verifying the settings are preserved.

**Acceptance Scenarios**:

1. **Given** an experience with configured image generation settings, **When** the creator switches from Image to GIF outcome type, **Then** the prompt, reference media, model, and aspect ratio settings are preserved
2. **Given** an experience configured as Image, **When** the creator switches to GIF, **Then** the type-specific options are reset to GIF defaults (fps: 24, duration: 3)
3. **Given** an experience with AI enabled and a source capture step selected, **When** switching outcome types, **Then** both aiEnabled and captureStepId values are preserved

---

### User Story 5 - New Experience Initialization (Priority: P3)

As an experience creator, when I create a new experience, I expect sensible defaults that require minimal configuration while still prompting me to make key decisions.

**Why this priority**: Good defaults reduce friction but this is foundational setup that happens automatically.

**Independent Test**: Can be tested by creating a new experience and verifying the default configuration values.

**Acceptance Scenarios**:

1. **Given** a creator creates a new experience, **When** the experience is initialized, **Then** the create configuration has type: null, forcing an explicit choice
2. **Given** a new experience, **When** inspecting defaults, **Then** aiEnabled is true, prompt is empty, refMedia is empty array, model is "gemini-2.5-flash-image", and aspectRatio is "1:1"

---

### Edge Cases

- What happens when a capture step referenced by captureStepId is deleted?
  - The system detects this at publish time and displays "Selected source step no longer exists"
- What happens when an admin changes a step from capture type to non-capture type while it's referenced?
  - The system detects this at publish time and displays "Source step must be a capture step"
- What happens when options.kind doesn't match the selected type?
  - The system displays "Options kind must match outcome type" and prevents publishing
- What happens to existing experiences that don't have a create configuration?
  - They fail validation at publish time with "Select an outcome type" message; draft mode continues to work

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add a `create` field to the experience configuration schema containing outcome type, capture step reference, AI settings, and type-specific options
- **FR-002**: System MUST maintain the existing `transformNodes` field for backward compatibility but set it to empty array on publish
- **FR-003**: System MUST prevent publishing when `create.type` is null with message "Select an outcome type (Image, GIF, or Video)"
- **FR-004**: System MUST prevent publishing when AI is disabled and no captureStepId is set with message "Passthrough mode requires a source image. Enable AI or select a source step."
- **FR-005**: System MUST prevent publishing when captureStepId references a non-existent step with message "Selected source step no longer exists"
- **FR-006**: System MUST prevent publishing when captureStepId references a non-capture step with message "Source step must be a capture step"
- **FR-007**: System MUST prevent publishing when AI is enabled but prompt is empty with message "Prompt is required when AI is enabled"
- **FR-008**: System MUST prevent publishing when reference media has duplicate displayName values with message listing the duplicates
- **FR-009**: System MUST prevent publishing for gif/video types with message "[TYPE] outcome is coming soon"
- **FR-010**: System MUST prevent publishing when options.kind doesn't match create.type
- **FR-011**: System MUST initialize new experiences with default create configuration (type: null, aiEnabled: true, empty prompt, default model and aspect ratio)
- **FR-012**: System MUST preserve imageGeneration settings when switching between outcome types
- **FR-013**: System MUST reset type-specific options to defaults when switching outcome types
- **FR-014**: System MUST copy draft.create to published.create and set published.transformNodes to empty array on successful publish

### Key Entities

- **CreateOutcome**: The main configuration object containing type (image/gif/video/null), captureStepId (optional reference to capture step), aiEnabled (boolean), imageGeneration settings, and type-specific options
- **ImageGeneration**: Configuration for AI generation including prompt (text), refMedia (array of reference media items), model (AI model identifier), and aspectRatio (output dimensions)
- **RefMedia**: Reference media item with displayName (unique identifier), mediaUrl (source location), and influence (how strongly it affects generation)
- **OutcomeOptions**: Discriminated union based on outcome type - image options, gif options (fps, duration), or video options (videoPrompt, duration)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new experiences initialize with correct default create configuration
- **SC-002**: All validation error messages are actionable and clearly explain what needs to be fixed
- **SC-003**: Experience creators can configure and publish an AI-enabled image experience within 5 minutes of creation
- **SC-004**: No data loss when switching between outcome types - image generation settings persist through type changes
- **SC-005**: Publishing validation catches all invalid configurations before experiences go live
- **SC-006**: Existing experiences without create configuration receive clear guidance on required updates

## Assumptions

- The capture step type is identified by steps having a `type` property that starts with "capture."
- The default AI model "gemini-2.5-flash-image" is an appropriate default for new experiences
- Reference media displayName uniqueness is important for template variable resolution
- GIF and video outcome types will be implemented in future releases but should be selectable with a "coming soon" message
- The imageGeneration configuration structure is shared across all outcome types (image, gif, video) as the starting point for content generation

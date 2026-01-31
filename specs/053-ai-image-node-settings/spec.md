# Feature Specification: AI Image Node Settings

**Feature Branch**: `053-ai-image-node-settings`
**Created**: 2026-01-31
**Status**: Draft
**Input**: User description: "Allow an admin to configure an AI Image transform node by editing AI model, output aspect ratio, prompt text, and optional reference images"

## Clarifications

### Session 2026-01-31

- Q: Should there be a maximum number of reference images allowed per AI Image node? → A: Limit to 10 reference images

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure AI Image Node with Prompt (Priority: P1)

An admin opens the AI Image node settings panel and writes a prompt to describe the desired image transformation. The prompt supports placeholder syntax for dynamic content (step outputs and reference media). The admin can see validation feedback if the prompt is empty.

**Why this priority**: The prompt is the core configuration that drives the AI image generation. Without a valid prompt, the node cannot function.

**Independent Test**: Can be fully tested by opening a node settings panel, entering a prompt, and verifying it persists. Delivers the fundamental capability to describe AI transformations.

**Acceptance Scenarios**:

1. **Given** an admin opens the AI Image node settings panel, **When** the prompt field is empty, **Then** a validation error "Prompt is required" is displayed
2. **Given** an admin opens the AI Image node settings panel, **When** they enter a non-empty prompt, **Then** the prompt value is saved to the node configuration
3. **Given** an admin is editing a prompt, **When** they use placeholder syntax like `@{step:userName}` or `@{ref:mediaAssetId}`, **Then** the placeholders are preserved in the saved prompt

---

### User Story 2 - Select AI Model and Aspect Ratio (Priority: P1)

An admin selects the AI model and output aspect ratio for the image generation using dropdown selectors. These controls are always visible and allow switching between available options.

**Why this priority**: Model and aspect ratio are required configuration fields that determine the output characteristics. Both are equally critical to the node's function.

**Independent Test**: Can be fully tested by selecting different model and aspect ratio options and verifying the selection persists.

**Acceptance Scenarios**:

1. **Given** an admin opens the AI Image node settings panel, **When** the panel loads, **Then** the model and aspect ratio selectors are visible in the bottom control row
2. **Given** an admin clicks the model selector, **When** they select a different model, **Then** the configuration is updated with the selected model value
3. **Given** an admin clicks the aspect ratio selector, **When** they select a different ratio, **Then** the configuration is updated with the selected aspect ratio value

---

### User Story 3 - Add Reference Images via Media Picker (Priority: P2)

An admin adds reference images to guide the AI generation by clicking a plus button that opens a media picker. Selected images appear as thumbnails above the prompt area and can be removed individually.

**Why this priority**: Reference images enhance AI output quality but are optional. The core functionality works without them.

**Independent Test**: Can be fully tested by clicking the plus button, selecting images from the picker, and verifying they appear in the reference strip.

**Acceptance Scenarios**:

1. **Given** an admin views the AI Image node settings, **When** they click the plus button in the bottom-right of the control row, **Then** a media picker opens
2. **Given** the media picker is open, **When** the admin selects one or more images, **Then** the images are added to the reference media collection
3. **Given** reference images exist, **When** the admin views the settings panel, **Then** thumbnails with display names appear in a strip above the prompt input
4. **Given** a reference image is displayed, **When** the admin clicks the remove (✕) control, **Then** the image is removed from the reference media collection

---

### User Story 4 - Add Reference Images via Drag and Drop (Priority: P2)

An admin drags image files from their computer and drops them anywhere on the PromptComposer to add them as reference images. The entire composer area highlights during drag to indicate it accepts drops.

**Why this priority**: Drag and drop is an alternative input method that improves usability but is not essential for core functionality.

**Independent Test**: Can be fully tested by dragging image files over the composer area and dropping them.

**Acceptance Scenarios**:

1. **Given** an admin drags image files over the PromptComposer, **When** the drag enters the composer area, **Then** the entire composer container displays a visible highlight/active state
2. **Given** the composer is in drop-ready state, **When** the admin drops image files, **Then** the images are added to the reference media collection
3. **Given** an admin drags non-image files over the composer, **When** they attempt to drop, **Then** the drop is rejected and no changes occur to the configuration

---

### Edge Cases

- What happens when a duplicate reference image is added? The system prevents duplicates by checking `mediaAssetId`, preserving existing references.
- What happens when reference media collection is empty? The reference media strip is hidden; no empty placeholder is shown.
- What happens when the admin attempts to save with an empty prompt? Validation prevents saving/publishing with clear error messaging.
- What happens when multiple images are added simultaneously (via picker or drop)? All valid images are appended to existing references.
- What happens when the reference image limit is reached? The system prevents adding more images when 10 references already exist; the plus button and drop zone are disabled or show appropriate feedback.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a PromptComposer as a single rounded bordered container for all AI Image node settings
- **FR-002**: System MUST provide a multiline prompt input field without its own border inside the composer
- **FR-003**: System MUST validate that prompt is non-empty and display "Prompt is required" error when empty
- **FR-004**: System MUST provide a model selector in the bottom control row (without label) that allows selection from available AI models
- **FR-005**: System MUST provide an aspect ratio selector in the bottom control row (without label) that allows selection from available aspect ratios
- **FR-006**: System MUST display reference media as thumbnails with display names in a horizontal strip above the prompt input when references exist
- **FR-007**: System MUST provide a remove (✕) control on each reference media thumbnail to delete it from the collection
- **FR-008**: System MUST provide a plus button on the far right of the bottom control row that opens a media picker
- **FR-009**: System MUST support adding reference images by selecting them from the media picker
- **FR-010**: System MUST support drag and drop of image files anywhere within the PromptComposer area
- **FR-011**: System MUST display a visible highlight/active state on the entire composer when images are dragged over it
- **FR-012**: System MUST reject non-image file drops without modifying the configuration
- **FR-013**: System MUST prevent duplicate reference images by deduplicating on `mediaAssetId`
- **FR-014**: System MUST preserve existing reference images when adding new ones (append behavior)
- **FR-015**: System MUST hide the reference media strip when no reference images exist (no empty state shown)
- **FR-016**: System MUST enforce a maximum of 10 reference images per AI Image node configuration

### Key Entities

- **AI Image Node Configuration**: Contains model (required), aspectRatio (required), prompt (required, non-empty), and refMedia (optional array of media references)
- **Media Reference**: Represents a reference image with mediaAssetId (unique identifier), url (preview source), displayName (shown under thumbnail), and filePath (nullable for compatibility)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can configure all required fields (model, aspect ratio, prompt) and save a valid AI Image node configuration
- **SC-002**: Admins can add reference images via both media picker and drag-and-drop methods
- **SC-003**: Reference images display correctly with thumbnails and names, and can be removed individually
- **SC-004**: Validation feedback is shown immediately when prompt is empty, preventing invalid configurations
- **SC-005**: Drag and drop interactions provide clear visual feedback indicating the drop zone
- **SC-006**: The PromptComposer maintains a clean, unified visual appearance with a single border around all elements

## Assumptions

- The media picker component already exists and can be integrated for image selection
- Placeholder syntax (`@{step:name}` and `@{ref:mediaAssetId}`) is stored as plain text and rendered/processed elsewhere
- Available AI models and aspect ratios are defined by existing schemas and do not need to be configurable at runtime
- Reference image files dropped by users will be uploaded to storage and converted to MediaReference objects through existing upload infrastructure

# Feature Specification: PromptComposer Refactor

**Feature Branch**: `001-prompt-composer-refactor`
**Created**: 2026-02-23
**Status**: Draft
**Input**: User description: "Move from prop explosion to modular modality-based configuration"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a New Modality with Minimal Effort (Priority: P1)

A developer needs to add support for a new generation type (e.g., audio, motion style, or brand layers) to the prompt composer. Today, this requires threading new props through PromptComposer (currently 19 props), ControlRow (13 props), and every consumer form. The refactored system should allow a developer to define a new modality's capabilities in one place and have the prompt composer automatically adapt its controls — showing or hiding features like negative prompt, reference media, duration, or sound settings based on the modality definition.

**Why this priority**: This is the core goal of the refactor. If adding a new modality still requires touching every layer of the component tree, the refactor has failed. The platform roadmap (Text → Image → Video → Multi-step) demands modality scalability.

**Independent Test**: Can be tested by defining a hypothetical new modality (e.g., "audio") and verifying the prompt composer correctly renders only the controls that modality supports — without modifying any existing component code beyond the modality definition itself.

**Acceptance Scenarios**:

1. **Given** an existing prompt composer with image and video modalities configured, **When** a developer creates a new modality definition specifying which features it supports, **Then** the prompt composer renders the correct subset of controls for that modality without changes to the composer or its sub-components.
2. **Given** a modality definition that does not support reference media, **When** the prompt composer renders for that modality, **Then** the reference media strip and add media button are not shown.
3. **Given** a modality definition that supports duration selection, **When** the prompt composer renders for that modality, **Then** the duration picker appears with the modality's allowed options.
4. **Given** a modality definition with specific limits (e.g., max 2 reference images, max 500 character prompt), **When** a user interacts with the composer, **Then** those limits are enforced automatically.

---

### User Story 2 - Preserve All Existing Image and Video Functionality (Priority: P1)

An experience creator uses the prompt composer today to configure AI image generation (with model selection, aspect ratio, reference images with drag-and-drop, and rich text prompt with @mentions) and AI video generation (with model selection, duration selection, and conditional reference media). After the refactor, all existing functionality must work identically — the same forms, the same controls, the same behavior, the same validation.

**Why this priority**: Shared P1 with Story 1. A refactor that breaks existing behavior is worse than no refactor at all. Zero regressions is a hard requirement.

**Independent Test**: Can be tested by exercising every existing prompt composer usage (AIImageConfigForm, AIVideoConfigForm, FrameGenerationSection) and verifying identical behavior: model selection, aspect ratio changes, reference image upload/remove/drag-drop, @mention autocomplete for steps and media, duration selection, validation errors, and disabled states.

**Acceptance Scenarios**:

1. **Given** the AI Image config form, **When** a creator configures a prompt with model selection, reference images, and @mentions, **Then** the behavior is identical to pre-refactor.
2. **Given** the AI Video config form with image-to-video task, **When** a creator configures a prompt with video model, duration (4s/6s/8s), and hidden reference media, **Then** the behavior is identical to pre-refactor.
3. **Given** the AI Video config form with ref-images-to-video task, **When** a creator configures reference images with a max of 2 and duration locked to 8s, **Then** the behavior is identical to pre-refactor.
4. **Given** the Frame Generation section, **When** a creator configures start/end frame image generation, **Then** the behavior is identical to pre-refactor.
5. **Given** any prompt composer instance, **When** drag-and-drop, @mention autocomplete, validation errors, and disabled states are exercised, **Then** all behave identically to pre-refactor.

---

### User Story 3 - Reduce Prop Drilling Through Modality Context (Priority: P2)

A developer maintaining the prompt composer currently traces data flow through 3 levels of prop drilling (PromptComposer → ControlRow → individual controls). When a bug occurs, they must trace through each layer. After the refactor, the prompt composer should provide modality configuration through a shared context so that child components can access what they need directly, reducing the surface area for prop-threading bugs and making the code easier to understand.

**Why this priority**: Improves developer experience and maintainability but is secondary to ensuring new modalities are easy to add (Story 1) and existing behavior is preserved (Story 2).

**Independent Test**: Can be tested by counting the number of props on the main PromptComposer component and its direct children before and after refactor, verifying at least a 50% reduction in prop count at the top-level component.

**Acceptance Scenarios**:

1. **Given** the refactored PromptComposer, **When** a developer inspects the component's interface, **Then** the number of directly-passed props is reduced by at least 50% compared to the current 19-prop interface.
2. **Given** child components (controls, media strip, prompt input), **When** they need modality-specific configuration, **Then** they access it from a shared context rather than receiving it through intermediate props.

---

### User Story 4 - Modality-Driven Control Rendering (Priority: P2)

An experience creator switches between configuring an image outcome and a video outcome. The prompt composer should automatically adapt its visible controls — showing/hiding reference media, duration picker, model options, and aspect ratio — based on the active modality, without the parent form needing to manually toggle each control via individual boolean props (hideAspectRatio, hideRefMedia, etc.).

**Why this priority**: Simplifies consumer code and eliminates the current pattern of boolean flags controlling visibility. Important for scalability but the system works today with boolean props.

**Independent Test**: Can be tested by rendering the prompt composer with an image modality definition and verifying controls match image expectations, then switching to a video modality definition and verifying controls match video expectations.

**Acceptance Scenarios**:

1. **Given** a prompt composer configured for image modality, **When** it renders, **Then** it shows model selection, aspect ratio (when not controlled at outcome level), reference media with a max of 5, and prompt input — but no duration picker.
2. **Given** a prompt composer configured for video modality, **When** it renders, **Then** it shows model selection, duration picker, and conditionally shows reference media based on the video task type — but may hide aspect ratio.
3. **Given** a modality definition change, **When** the prompt composer re-renders, **Then** controls appear or disappear based solely on the new modality definition, without the parent form managing individual visibility flags.

---

### Edge Cases

- What happens when a modality definition is missing or invalid? The system should fall back to a safe default (e.g., text-only mode with no optional controls).
- What happens when a modality defines a feature (e.g., reference media) but the required callbacks aren't provided by the parent? The system should gracefully hide that control rather than crash.
- What happens when modality limits (e.g., max reference images) change while files are already uploaded? Existing files beyond the new limit should remain visible but no additional uploads should be allowed.
- How does the system handle a modality that supports no optional features (no reference media, no duration, no aspect ratio)? It should render a minimal composer with just the prompt input and model selection.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a modality definition structure that declares which features a modality supports (negative prompt, reference media, sound, enhance, duration) and its limits (max reference images, max prompt length).
- **FR-002**: System MUST support at least three modality types: text, image, and video — with image and video matching current behavior exactly.
- **FR-003**: System MUST auto-render controls based on the active modality definition — controls for unsupported features are not rendered.
- **FR-004**: System MUST enforce modality-specific limits (e.g., max reference image count, max prompt length) automatically without consumer forms re-implementing limits.
- **FR-005**: System MUST provide a shared context that child components use to access modality configuration, reducing prop drilling from the current 19-prop top-level interface by at least 50%.
- **FR-006**: System MUST preserve all existing prompt composer functionality: rich text input with @mention support (step mentions, media mentions), reference media upload/remove/drag-and-drop, model selection, aspect ratio selection, duration selection, validation errors, and disabled states.
- **FR-007**: System MUST maintain compatibility with all three current consumers (AIImageConfigForm, AIVideoConfigForm, FrameGenerationSection) without breaking changes to their behavior.
- **FR-008**: System MUST fall back to a safe default when a modality definition is missing or invalid.
- **FR-009**: System MUST allow consumer forms to override specific modality behaviors when needed (e.g., video remix task locking duration to 8s only, or hiding reference media for image-to-video task).
- **FR-010**: Adding a new modality MUST NOT require modifications to the prompt composer component or its sub-components — only a new modality definition and a consumer form that uses it.

### Key Entities

- **ModalityDefinition**: Describes a generation type's capabilities and constraints. Attributes include: modality type, supported features (negative prompt, reference media, sound, enhance, duration), and limits (max reference images, max prompt length). Used by the prompt composer to determine which controls to render and what limits to enforce.
- **PromptComposerContext**: Shared configuration derived from the active ModalityDefinition plus runtime callbacks and state. Provides child components direct access to modality configuration, current values, and change handlers without prop drilling.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Adding a new modality (defining its capabilities and creating a consumer form) requires less than 10% new UI code relative to the total prompt composer codebase.
- **SC-002**: The top-level PromptComposer component interface is reduced from 19 props to 9 or fewer (at least 50% reduction).
- **SC-003**: All existing prompt composer functionality passes regression testing — zero behavioral changes for end users across all three consumer forms.
- **SC-004**: Zero new bugs introduced — all existing acceptance tests and manual test scenarios pass after refactor.
- **SC-005**: A developer unfamiliar with the codebase can add a new modality by following the modality definition pattern without reading prompt composer internals.

## Assumptions

- The Lexical rich text editor integration (LexicalPromptInput) and its @mention system do not need refactoring — they already accept a clean interface and are modality-agnostic.
- The `useRefMediaUpload` hook remains the mechanism for managing upload state — the refactor changes how its results flow to components, not the hook itself.
- The existing serialization format for prompts (@{step:name}, @{ref:name}) is preserved unchanged.
- "Negative prompt" and "sound" are listed in the ModalityDefinition for future use — current image and video modalities do not use them yet.
- Consumer forms (AIImageConfigForm, AIVideoConfigForm, FrameGenerationSection) will be updated to use the new modality-based interface, but their external behavior remains unchanged.

# Feature Specification: AI Video Advanced Controls

**Feature Branch**: `086-video-advanced-controls`
**Created**: 2026-02-28
**Status**: Draft
**Input**: User description: "Expose meaningful but not overwhelming control surface for AI video generation — Quality, Negative Prompt, Sound, and Enhance controls collapsed under an Advanced section."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle Sound On/Off for Video Generation (Priority: P1)

An experience creator configuring an AI video experience wants to control whether the generated video includes AI-generated audio. In the PromptComposer's control row, they see a Sound toggle defaulting to off and switch it on. When they publish the experience and a guest submits media, the generated video includes ambient sound matching the video content.

**Why this priority**: Sound is a high-impact differentiator that significantly changes the guest experience. It's a simple binary toggle with clear user value and is the most likely control users will want to adjust.

**Independent Test**: Can be fully tested by toggling the Sound switch and verifying the generated video includes or excludes audio.

**Acceptance Scenarios**:

1. **Given** a creator is editing an AI video experience, **When** they view the PromptComposer control row, **Then** they see a Sound toggle defaulting to off.
2. **Given** a creator has toggled Sound to on, **When** a guest submits media and the video is generated, **Then** the output video includes AI-generated audio.
3. **Given** a creator has left Sound off (default), **When** a guest submits media and the video is generated, **Then** the output video is silent (no audio track).

---

### User Story 2 - Select Video Resolution (Priority: P2)

An experience creator wants to control the output resolution of the generated video. In the PromptComposer's control row, they choose between 720p, 1080p, or 4K. The available resolution options depend on the selected model — the fast model supports 720p and 1080p, while the standard model supports 720p, 1080p, and 4K. A cost indicator is shown when selecting 4K to set expectations about increased processing time.

**Why this priority**: Resolution selection gives creators direct control over output fidelity with clear, familiar values. It coexists with the model picker, and the dynamic option filtering based on model prevents invalid configurations.

**Independent Test**: Can be fully tested by selecting each resolution and verifying the generated video matches the chosen resolution.

**Acceptance Scenarios**:

1. **Given** a creator is editing an AI video experience, **When** they view the PromptComposer control row, **Then** they see a Resolution selector with options dependent on the currently selected model.
2. **Given** the standard model is selected, **Then** the Resolution selector shows 720p, 1080p (default), and 4K.
3. **Given** the fast model is selected, **Then** the Resolution selector shows 720p and 1080p (default) only — 4K is not available.
4. **Given** a creator selects 4K resolution, **Then** a cost indicator is displayed explaining that higher resolution may increase processing time.
5. **Given** a creator has selected a resolution and published the experience, **When** a guest submits media, **Then** the video is generated at the chosen resolution.

---

### User Story 3 - Add a Negative Prompt (Priority: P3)

An experience creator wants to specify elements that should be avoided in the generated video. Below the PromptComposer, they see an optional Negative Prompt text field and type instructions like "no text overlays, no blurry faces." This helps refine results without needing to modify the main prompt.

**Why this priority**: Negative prompts are a power-user feature that improves output quality for experienced creators but is not essential for first-time users.

**Independent Test**: Can be fully tested by entering a negative prompt and verifying the generated video avoids the specified elements.

**Acceptance Scenarios**:

1. **Given** a creator is editing an AI video experience, **When** they view the video configuration below the PromptComposer, **Then** they see an optional Negative Prompt text field with placeholder text explaining its purpose.
2. **Given** a creator has entered a negative prompt, **When** a guest submits media, **Then** the generation request includes the negative prompt to guide the AI model.
3. **Given** a creator leaves the negative prompt empty, **When** a guest submits media, **Then** the video is generated normally without any negative prompt constraints.

---

### User Story 4 - Enable Enhance Mode (Priority: P4)

An experience creator wants to apply AI-powered post-processing enhancements to the generated video. In the PromptComposer's control row, they toggle Enhance on. When enabled, the generated video receives additional processing to improve visual quality (e.g., upscaling, color correction, detail refinement).

**Why this priority**: Enhance is a nice-to-have polish feature that adds value but depends on the underlying AI model's support for enhancement passes. It's the least critical control.

**Independent Test**: Can be fully tested by toggling Enhance on/off and comparing the visual quality of generated videos.

**Acceptance Scenarios**:

1. **Given** a creator is editing an AI video experience, **When** they view the PromptComposer control row, **Then** they see an Enhance toggle defaulting to off.
2. **Given** a creator has toggled Enhance on, **When** a guest submits media, **Then** the generated video undergoes post-processing enhancement.
3. **Given** a creator leaves Enhance off (default), **When** a guest submits media, **Then** the video is generated without additional enhancement processing.
4. **Given** Enhance is toggled on, **Then** a brief description is shown explaining what enhancement does.

---

### Edge Cases

- What happens when a creator changes advanced settings after the experience is already published? Settings apply to all new guest submissions going forward; previously generated videos are not affected.
- What happens when a creator has 4K selected and then switches the model from standard to fast? The system automatically downgrades the resolution to 1080p (the highest available for the fast model) and shows an inline notice explaining the change.
- What happens when a guest submits media but the selected resolution or enhance option is temporarily unavailable from the AI provider? The system falls back to 1080p / no enhancement and notifies the creator if degraded settings were used.
- What happens when the negative prompt exceeds the character limit? The system enforces a maximum character limit and shows a validation message preventing submission.
- What happens when Sound is enabled but the AI model does not support audio generation? The system generates the video without audio and does not surface an error to the guest.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Resolution selector, Sound toggle, and Enhance toggle MUST be displayed inline within the PromptComposer's control row, alongside existing model and duration controls.
- **FR-002**: Negative Prompt MUST be displayed as a standalone text field below the PromptComposer in the video configuration area.
- **FR-003**: The Resolution selector MUST display options based on the currently selected model — 720p and 1080p for the fast model; 720p, 1080p, and 4K for the standard model — with 1080p selected by default.
- **FR-004**: When 4K resolution is selected, the system MUST display a cost indicator communicating that higher resolution may increase processing time.
- **FR-004a**: When a creator switches to a model that does not support the currently selected resolution, the system MUST automatically downgrade to the highest available resolution and display an inline notice explaining the change.
- **FR-005**: The Negative Prompt field MUST be optional, with a placeholder describing its purpose (e.g., "Describe what to avoid in the generated video").
- **FR-006**: The Negative Prompt field MUST enforce a maximum character limit of 500 characters.
- **FR-007**: The Sound toggle MUST default to off and allow creators to enable AI-generated audio for the video output.
- **FR-008**: The Enhance toggle MUST default to off and allow creators to enable post-processing video enhancement.
- **FR-009**: All advanced control values MUST be persisted as part of the experience configuration and included in the job snapshot when a guest triggers video generation.
- **FR-010**: The system MUST pass the selected advanced control values to the AI video generation backend when processing a guest's submission.
- **FR-011**: When an advanced setting is unsupported by the current AI model or task type, the system MUST gracefully fall back to the default value without surfacing errors to the guest.
- **FR-012**: Advanced settings MUST apply only to new guest submissions after the settings are saved; previously generated videos are not retroactively affected.

### Key Entities

- **VideoGenerationConfig (extended)**: The existing video generation configuration entity, extended with four new attributes: resolution, negative prompt text, sound enabled flag, and enhance enabled flag.
- **Resolution**: An enumerated value representing output video resolution — 720p, 1080p, or 4K. Available options are constrained by the selected model (fast model: 720p, 1080p; standard model: 720p, 1080p, 4K).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Resolution, Sound, and Enhance controls are immediately visible in the PromptComposer control row without additional clicks. Negative Prompt is visible below the PromptComposer.
- **SC-002**: At least 15% of experience creators who configure AI video engage with one or more advanced controls within the first 30 days after launch.
- **SC-003**: Creators who use advanced controls report equal or higher satisfaction with generated video quality compared to creators who do not.
- **SC-004**: Video regeneration rate decreases by at least 10% among creators who use advanced controls, indicating improved first-attempt output quality.
- **SC-005**: No increase in guest-facing errors attributable to advanced control settings (error rate remains below 1%).

## Clarifications

### Session 2026-02-28

- Q: Should the Quality selector replace the existing model picker, or coexist as a separate control? What do the quality tiers represent? → A: "Quality" means output resolution (720p, 1080p, 4K). Renamed to Resolution selector. Coexists with the model picker. Available resolutions are model-dependent: fast model offers 720p/1080p; standard model offers 720p/1080p/4K.
- Q: Where should the four controls be placed in the UI? → A: Resolution, Sound, and Enhance are inline in the PromptComposer's ControlRow (alongside model and duration). Negative Prompt is a standalone textarea below the PromptComposer. No collapsible "Advanced" section needed.

## Assumptions

- The AI video generation provider (Google Veo 3.1) supports resolution parameters (720p, 1080p, 4K), negative prompts, sound generation, and enhancement. The fast model variant supports 720p and 1080p only; the standard model supports 720p, 1080p, and 4K.
- The Resolution selector coexists with the existing model picker. The model picker remains unchanged; the resolution picker dynamically adjusts its available options based on the selected model.
- Sound generation refers to AI-generated ambient audio that accompanies the video, not user-uploaded audio tracks.
- Enhancement refers to a model-level or post-processing step that improves visual quality (details, sharpness, color) — not a separate third-party service.
- The Advanced section is part of the experience creator's configuration view only; guests do not see or interact with these controls.
- The maximum negative prompt length of 500 characters is a reasonable default based on typical AI model input constraints.

## Scope

### In Scope

- Resolution selector (720p / 1080p / 4K) inline in PromptComposer control row, with model-dependent options and cost indication for 4K
- Negative prompt text field below PromptComposer with character limit
- Sound on/off toggle inline in PromptComposer control row
- Enhance on/off toggle inline in PromptComposer control row
- Persisting advanced settings in experience config and job snapshots
- Passing advanced settings to the backend video generation pipeline

### Out of Scope

- Custom resolution presets or fine-grained quality sliders
- Audio upload or custom sound design
- Per-guest override of advanced settings
- A/B testing or analytics dashboard for advanced control usage (tracked via existing analytics)
- Cost/billing changes based on resolution selection (future consideration)

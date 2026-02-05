# Feature Specification: Admin Create Tab UX

**Feature Branch**: `061-admin-create-ux`
**Created**: 2026-02-05
**Status**: Draft
**Input**: PRD 2 - Admin Create Tab UX (Outcome-based Create Epic)
**Dependencies**: PRD 1B (Experience Create Config)

## Overview

Replace the existing node-based Generate UI with a simplified Create tab where experience admins configure outcome parameters through an intuitive form interface. This feature enables admins to configure AI-generated image outputs by selecting outcome types, source images, and AI generation settings including prompts with dynamic mention support.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure AI Image Generation (Priority: P1)

An experience admin opens the Create tab and configures AI image generation by writing a prompt, selecting a model, and choosing an aspect ratio. They can reference capture steps and uploaded style images within their prompt using @mentions.

**Why this priority**: This is the core functionality that enables admins to create AI-enhanced experiences. Without this, the Create tab provides no value.

**Independent Test**: Can be fully tested by opening the Create tab, selecting "Image" outcome, enabling AI generation, entering a prompt with @mentions, selecting model and aspect ratio, and verifying values persist in the draft config.

**Acceptance Scenarios**:

1. **Given** an admin is on the Create tab with AI generation enabled, **When** they type a prompt in the Lexical editor, **Then** the prompt value is saved to the draft configuration
2. **Given** an admin is typing a prompt, **When** they type `@`, **Then** an autocomplete menu appears showing available steps and reference images
3. **Given** an admin selects a step mention from autocomplete, **When** the mention is inserted, **Then** it displays as a styled chip with the step name
4. **Given** an admin has configured model and aspect ratio, **When** they navigate away and return, **Then** their selections are preserved

---

### User Story 2 - Select Outcome Type (Priority: P1)

An experience admin selects the type of output they want to generate. Currently only Image is available, with GIF and Video showing as "coming soon".

**Why this priority**: The outcome type determines the entire form structure. This is foundational to the Create tab interface.

**Independent Test**: Can be fully tested by viewing the outcome type selector, selecting Image, and verifying GIF/Video are disabled with "coming soon" labels.

**Acceptance Scenarios**:

1. **Given** an admin is on the Create tab, **When** they view the outcome type selector, **Then** they see Image, GIF, and Video options
2. **Given** an admin views outcome options, **When** they look at GIF and Video, **Then** they appear disabled with "coming soon" labels
3. **Given** an admin selects Image, **When** the selection is made, **Then** the form shows image-specific configuration options
4. **Given** an admin has Image selected with AI settings configured, **When** they click GIF or Video, **Then** the disabled options show "Coming soon" and do not change the selection

---

### User Story 3 - Configure Source Image (Priority: P2)

An experience admin selects a capture step from the Collect tab as the base image for AI transformation. Alternatively, they can select "None" for prompt-only generation.

**Why this priority**: Source image selection determines whether the AI transforms an existing photo or generates from scratch. Important for transformation workflows but not strictly required for basic AI generation.

**Independent Test**: Can be fully tested by opening source image dropdown, viewing available capture steps, selecting one, and verifying the selection persists.

**Acceptance Scenarios**:

1. **Given** an admin is on the Create tab, **When** they open the source image dropdown, **Then** they see "None (prompt only)" plus all capture steps from the Collect tab
2. **Given** the Collect tab has no capture steps, **When** the admin opens source image dropdown, **Then** only "None (prompt only)" is shown
3. **Given** an admin selects a capture step, **When** the selection is saved, **Then** the step ID is stored in the draft configuration
4. **Given** an admin selects "None", **When** the selection is saved, **Then** the captureStepId is set to null

---

### User Story 4 - Manage Reference Images (Priority: P2)

An experience admin uploads reference images that can be mentioned in prompts to guide AI generation style or content.

**Why this priority**: Reference images enhance prompt capabilities but are optional for basic AI generation.

**Independent Test**: Can be fully tested by clicking "Add" to upload an image, seeing it appear in the strip, editing its display name, and verifying it appears in @mention autocomplete.

**Acceptance Scenarios**:

1. **Given** an admin is in the Prompt Composer section, **When** they click "Add" in Reference Images, **Then** a media picker opens for image selection
2. **Given** an admin has uploaded a reference image, **When** they view the reference strip, **Then** they see a thumbnail with an editable display name
3. **Given** an admin has reference images uploaded, **When** they type `@` in the prompt, **Then** the reference images appear in the autocomplete options
4. **Given** an admin edits a display name to include forbidden characters (`}`, `:`, `{`), **When** they try to save, **Then** a validation error is shown

---

### User Story 5 - Toggle AI Generation (Priority: P2)

An experience admin disables AI generation to use passthrough mode, where the source image is output directly with only overlay applied.

**Why this priority**: Passthrough mode is an alternative workflow but not the primary use case for the Create tab.

**Independent Test**: Can be fully tested by toggling AI generation off, verifying the prompt composer collapses, selecting a source image, and confirming passthrough mode is configured.

**Acceptance Scenarios**:

1. **Given** an admin has AI generation enabled, **When** they uncheck "Enable AI Generation", **Then** the Prompt Composer section collapses (hides)
2. **Given** an admin toggles AI off then back on, **When** AI is re-enabled, **Then** the previous prompt, model, and aspect ratio values are preserved
3. **Given** AI is disabled and no source image selected, **When** validation runs, **Then** a warning shows "Passthrough mode requires a source image"

---

### User Story 6 - Validate and Publish (Priority: P3)

An experience admin attempts to publish their experience and receives clear validation feedback if the Create configuration is incomplete or invalid.

**Why this priority**: Validation is essential for data integrity but only comes into play after primary configuration is complete.

**Independent Test**: Can be fully tested by leaving required fields empty, clicking publish, and verifying appropriate error messages appear inline and publish is blocked.

**Acceptance Scenarios**:

1. **Given** AI is enabled but prompt is empty, **When** admin attempts to publish, **Then** inline error shows "Prompt is required"
2. **Given** reference images have duplicate display names, **When** admin attempts to publish, **Then** error shows "Reference images must have unique names"
3. **Given** all required fields are valid, **When** admin views publish button, **Then** the button is enabled
4. **Given** a validation error exists, **When** admin fixes the issue, **Then** the error disappears and publish becomes enabled

---

### Edge Cases

- What happens when a capture step is deleted after being selected as source? Show "Selected source step no longer exists" error on publish validation
- What happens when a reference image upload fails mid-process? Show error toast, don't add incomplete image to the list
- What happens when the user has many capture steps? Dropdown scrolls to accommodate all options
- What happens when display name is edited to match an existing one? Show duplicate error immediately on blur
- What happens when prompt is very long? Editor scrolls, no character limit enforced at UI level

## Requirements *(mandatory)*

### Functional Requirements

#### Outcome Type Selection
- **FR-001**: System MUST display outcome type selector with Image, GIF, and Video options
- **FR-002**: System MUST enable only the Image option; GIF and Video MUST be visually disabled with "coming soon" label
- **FR-003**: System MUST persist outcome type selection in the draft configuration
- **FR-004**: System MUST preserve AI generation settings (prompt, refMedia, model, aspectRatio) when switching between outcome types

#### Source Image Selection
- **FR-005**: System MUST display a source image dropdown with "None (prompt only)" as the first option
- **FR-006**: System MUST list only capture steps from the Collect tab in the dropdown (excluding input and info steps)
- **FR-007**: System MUST save selected step ID or null (for "None") to the draft configuration
- **FR-008**: System MUST show helper text explaining the optional source image behavior

#### AI Generation Toggle
- **FR-009**: System MUST provide a toggle/checkbox to enable or disable AI generation
- **FR-010**: System MUST collapse (hide) the Prompt Composer section when AI generation is disabled
- **FR-011**: System MUST preserve Prompt Composer values when AI is toggled off and back on
- **FR-012**: System MUST show warning when passthrough mode (AI disabled) is selected without a source image

#### Prompt Editor
- **FR-013**: System MUST render the prompt editor using the existing Lexical editor component
- **FR-014**: System MUST trigger mention autocomplete when user types `@`
- **FR-015**: System MUST show step mentions from Collect tab (excluding info steps) in autocomplete
- **FR-016**: System MUST show reference image mentions in autocomplete
- **FR-017**: System MUST save prompt value to the draft configuration

#### Reference Images
- **FR-018**: System MUST allow adding 0 to N reference images via media picker
- **FR-019**: System MUST display each reference image as thumbnail with editable display name
- **FR-020**: System MUST validate display names do not contain `}`, `:`, or `{` characters
- **FR-021**: System MUST validate display names are unique within the reference images list
- **FR-022**: System MUST update mention autocomplete when reference images change

#### Model Selection
- **FR-023**: System MUST display dropdown with available AI models
- **FR-024**: System MUST default to `gemini-2.5-flash-image`
- **FR-025**: System MUST save selected model to draft configuration

#### Aspect Ratio Selection
- **FR-026**: System MUST display all aspect ratio options: 1:1, 3:2, 2:3, 9:16, 16:9
- **FR-027**: System MUST default to 1:1
- **FR-028**: System MUST save selected aspect ratio to draft configuration

#### Validation
- **FR-029**: System MUST display inline validation errors next to invalid fields
- **FR-030**: System MUST display summary error at top of form when validation fails
- **FR-031**: System MUST disable publish button when validation fails
- **FR-032**: System MUST show error "Select an outcome type" when no outcome type selected
- **FR-033**: System MUST show error "Passthrough mode requires a source image" when AI disabled and no source selected
- **FR-034**: System MUST show error "Prompt is required" when AI enabled but prompt is empty
- **FR-035**: System MUST show error "Selected source step no longer exists" when captureStepId references deleted step
- **FR-036**: System MUST show error "Reference images must have unique names" for duplicate display names

#### Legacy UI Removal
- **FR-037**: System MUST NOT display any node-based transform UI components
- **FR-038**: System MUST NOT provide access to node-editing functionality

### Key Entities

- **Outcome Type**: The type of generated output (image, gif, video). Determines available configuration options.
- **Source Image Reference**: Optional link to a capture step that provides the base image for transformation.
- **AI Generation Settings**: Collection of parameters including prompt text, model selection, aspect ratio, and reference media.
- **Reference Media**: Uploaded images used as style/content references in prompts. Each has a unique display name for @mention references.
- **Step Mention**: Dynamic reference to a Collect tab step value, inserted via @mention in prompts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can complete Create tab configuration (outcome, source, prompt, model, aspect ratio) in under 3 minutes
- **SC-002**: 95% of admins successfully configure an AI image generation experience on first attempt
- **SC-003**: @mention autocomplete appears within 500ms of typing `@`
- **SC-004**: All validation errors are visible without scrolling when they occur
- **SC-005**: Toggling AI generation on/off preserves all prompt settings 100% of the time
- **SC-006**: Admins receive clear, actionable error messages that enable self-correction without support intervention

## Assumptions

- The Lexical prompt editor from 055-lexical-prompt-editor is fully functional and reusable
- Reference media upload uses existing workspace media picker infrastructure
- Draft configuration autosaves on field changes (standard experience editor behavior)
- Model options come from existing schema definitions (aiImageModelSchema)
- Aspect ratio options come from existing schema definitions (aiImageAspectRatioSchema)
- Capture steps can be reliably identified and distinguished from input/info steps via existing step type data

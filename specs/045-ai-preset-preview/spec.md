# Feature Specification: AI Preset Editor - Preview Panel

**Feature Branch**: `045-ai-preset-preview`
**Created**: 2025-01-28
**Status**: Draft
**Input**: User description: "Phase 4: AI Preset Editor Preview - Build the right side of the AI Preset editor for live preview and test inputs"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Test Variable Inputs (Priority: P1)

Preset creators need to test their AI preset configurations with different variable values to verify the prompt resolves correctly before using the preset in production pipelines.

**Why this priority**: This is the foundational capability enabling creators to validate their configurations. Without input testing, creators cannot verify their presets work as intended, making this the most critical user journey.

**Independent Test**: Can be fully tested by entering values in the test input form and observing that the preview updates immediately, delivering immediate validation feedback without requiring AI generation.

**Acceptance Scenarios**:

1. **Given** a preset with text variables that have value mappings, **When** the creator selects a mapped value from the dropdown, **Then** the prompt preview shows the corresponding text replacement
2. **Given** a preset with text variables without value mappings, **When** the creator types free text, **Then** the prompt preview shows the text substitution in real-time
3. **Given** a preset with image variables, **When** the creator uploads an image, **Then** the media preview grid displays the uploaded image with its reference name
4. **Given** default values defined for variables, **When** the test inputs form loads, **Then** all fields are pre-filled with their default values
5. **Given** the creator has changed test input values, **When** they click "Reset to Defaults", **Then** all inputs return to their default values

---

### User Story 2 - Live Prompt Resolution (Priority: P2)

Preset creators need to see the fully resolved prompt text with all variable and media references replaced to understand exactly what will be sent to the AI model.

**Why this priority**: After being able to input test values (P1), creators need to see the output. This provides the "preview" part of the preview panel and is essential for validating prompt construction.

**Independent Test**: Can be fully tested by changing any variable or editing the prompt template and verifying the resolved prompt updates automatically, demonstrating the resolution logic works correctly.

**Acceptance Scenarios**:

1. **Given** a prompt template with `@{text:name}` references, **When** test input values are provided, **Then** the resolved prompt shows text values substituted in place of references
2. **Given** a text variable with value mappings, **When** a mapped value is selected, **Then** the resolved prompt shows the mapped output text, not the input value
3. **Given** a prompt template with `@{input:name}` image references, **When** images are uploaded, **Then** the resolved prompt shows placeholder text like "[Image: variableName]"
4. **Given** a prompt template with `@{ref:name}` media references, **When** media exists in the registry, **Then** the resolved prompt shows placeholder text like "[Media: mediaName]"
5. **Given** the prompt template is edited in the configuration panel, **When** changes are made, **Then** the resolved prompt updates automatically within 300ms
6. **Given** the resolved prompt is displayed, **When** viewing the prompt, **Then** a character count is shown at the bottom

---

### User Story 3 - Media Preview Grid (Priority: P3)

Preset creators need to see all images that will be sent to the AI model (from both registry and test inputs) to verify the correct media is included.

**Why this priority**: After input testing (P1) and prompt resolution (P2), creators need to see the complete picture of what gets sent to AI. This is less critical than the previous two because creators can infer media inclusion from the prompt, but visual confirmation improves confidence.

**Independent Test**: Can be fully tested by referencing media in the prompt and uploading test images, then verifying the grid shows the correct thumbnails with proper labels and counts.

**Acceptance Scenarios**:

1. **Given** the prompt references media from the registry using `@{ref:name}`, **When** viewing the media preview grid, **Then** the grid shows thumbnails of referenced registry media
2. **Given** the prompt references image variables using `@{input:name}`, **When** test images are uploaded, **Then** the grid shows thumbnails of uploaded test images
3. **Given** media exists in the registry but is not referenced in the prompt, **When** viewing the media preview grid, **Then** unreferenced media appears grayed out or excluded
4. **Given** multiple media items are in use, **When** viewing the grid, **Then** a counter shows "X of Y media items used" where X is referenced media and Y is total registry media
5. **Given** any media thumbnail in the grid, **When** hovering over the thumbnail, **Then** a tooltip shows the reference name and source (registry vs. input)

---

### User Story 4 - Validation Display (Priority: P4)

Preset creators need clear feedback about configuration errors or incomplete test inputs so they know when their preset is ready to test or use.

**Why this priority**: Validation is important but builds on the previous capabilities. Creators can see resolution results even with warnings, so validation is more about quality assurance than core functionality.

**Independent Test**: Can be fully tested by creating presets with missing variables, undefined references, or incomplete inputs, and verifying appropriate warnings and error states appear.

**Acceptance Scenarios**:

1. **Given** required variable inputs are not provided, **When** viewing the validation display, **Then** missing inputs are highlighted with an error indicator
2. **Given** the prompt references an undefined variable, **When** viewing the validation display, **Then** a warning shows "Undefined variable: @{text:varName}"
3. **Given** the prompt references an undefined media item, **When** viewing the validation display, **Then** a warning shows "Undefined media: @{ref:mediaName}"
4. **Given** a text variable with value mappings receives an unmapped value, **When** viewing the validation display, **Then** a warning shows "Using default value for: @{text:varName}"
5. **Given** all validation passes, **When** viewing the validation display, **Then** a green status indicator shows "Valid" or "Ready"
6. **Given** validation fails, **When** viewing the test generation button, **Then** the button is disabled with a tooltip explaining the specific validation error

---

### User Story 5 - Test Generation Button (Priority: P5)

Preset creators see a placeholder for future test generation capability to understand where the feature will eventually trigger AI generation.

**Why this priority**: This is purely a UI placeholder for Phase 5 functionality. It has no functional value in Phase 4 but provides visual continuity and sets expectations for the next phase.

**Independent Test**: Can be fully tested by verifying the button exists, is disabled when validation fails, and shows appropriate hover states and tooltips.

**Acceptance Scenarios**:

1. **Given** the preview panel is displayed, **When** viewing the interface, **Then** a "Run Test Generation" button is visible at the bottom
2. **Given** validation fails, **When** hovering over the disabled button, **Then** a tooltip explains why the button is disabled
3. **Given** validation passes, **When** hovering over the button, **Then** the button appears enabled but does nothing when clicked (Phase 5 implementation)

---

### Edge Cases

- What happens when a variable is deleted from the configuration while test inputs exist for it?
- What happens when the prompt template is edited to remove a reference that had a test input?
- How does the system handle very long resolved prompts (10,000+ characters)?
- What happens when an image upload fails during test input?
- How does the system handle media references when the referenced media is deleted from the registry?
- What happens when a text variable has a value mapping but the test input provides a value not in the mapping?
- How does resolution handle nested or malformed reference syntax (e.g., `@{text:@{ref:name}}`)?
- What happens when the prompt contains no references at all?
- How does the system handle rapid changes to test inputs (debouncing, performance)?
- What happens when an image variable is required but no image is uploaded?

## Requirements *(mandatory)*

### Functional Requirements

**Test Inputs Section**

- **FR-001**: System MUST generate a dynamic form based on the preset's defined variables
- **FR-002**: For image variables (`@{input:name}`), system MUST provide an upload zone accepting image files
- **FR-003**: For text variables with value mappings, system MUST display a dropdown selector with mapped values
- **FR-004**: For text variables without value mappings, system MUST display a free text input field
- **FR-005**: System MUST pre-fill all input fields with default values when the form loads
- **FR-006**: System MUST provide a "Reset to Defaults" action that restores all inputs to their default values
- **FR-007**: System MUST store test input values in local component state (not persisted to Firestore)

**Prompt Preview**

- **FR-008**: System MUST display the fully resolved prompt text with all references substituted
- **FR-009**: System MUST resolve `@{text:name}` references by substituting test input values or value mapping results
- **FR-010**: System MUST resolve `@{input:name}` references by displaying placeholder text like "[Image: variableName]"
- **FR-011**: System MUST resolve `@{ref:name}` references by displaying placeholder text like "[Media: mediaName]"
- **FR-012**: System MUST update the resolved prompt automatically within 300ms of any input change or template edit
- **FR-013**: System MUST display a character count for the resolved prompt text
- **FR-014**: System MUST visually distinguish resolved references from unresolved references (e.g., highlighting unresolved in red)

**Media Preview Grid**

- **FR-015**: System MUST display thumbnails of all images that will be sent to the AI model
- **FR-016**: System MUST include images from `@{ref:name}` references (media registry) in the preview grid
- **FR-017**: System MUST include images from `@{input:name}` references (test uploads) in the preview grid
- **FR-018**: System MUST show an indicator of "X of Y media items used" where X is referenced media and Y is total registry count
- **FR-019**: System MUST visually indicate unused registry media (grayed out or excluded from grid)
- **FR-020**: System MUST display reference name and source (registry vs. input) on thumbnail hover

**Validation Display**

- **FR-021**: System MUST show a validation status indicator with three states: valid, invalid, incomplete
- **FR-022**: System MUST highlight missing required variable inputs with clear error messaging
- **FR-023**: System MUST show warnings for undefined variables referenced in the prompt template
- **FR-024**: System MUST show warnings for undefined media referenced in the prompt template
- **FR-025**: System MUST show warnings when text variables receive unmapped values and use defaults
- **FR-026**: System MUST disable the test generation button when validation status is invalid or incomplete
- **FR-027**: System MUST display a tooltip on disabled button explaining specific validation failures

**Test Generation UI (Placeholder)**

- **FR-028**: System MUST display a "Run Test Generation" button in the preview panel
- **FR-029**: Button MUST show disabled state when validation fails
- **FR-030**: Button MUST show enabled state when validation passes (but remain non-functional in Phase 4)
- **FR-031**: Button MUST display a placeholder loading state indicator (spinner) for future use
- **FR-032**: System MUST provide a placeholder result display area below the button

**Resolution Logic**

- **FR-033**: System MUST parse the prompt template to identify all `@{type:name}` references
- **FR-034**: System MUST validate that all referenced variables exist in the preset's variable definitions
- **FR-035**: System MUST validate that all referenced media exists in the preset's media registry
- **FR-036**: For text variables with value mappings, system MUST look up the input value and substitute the mapped output text
- **FR-037**: For text variables without value mappings, system MUST substitute the raw input value
- **FR-038**: System MUST collect all image references (both `@{input:name}` and `@{ref:name}`) for the media preview grid
- **FR-039**: System MUST debounce resolution logic to trigger 300ms after the last input change for performance

**Performance Requirements**

- **FR-040**: System MUST debounce prompt resolution to execute no more than once per 300ms
- **FR-041**: System MUST lazy load media thumbnails in the preview grid
- **FR-042**: System MUST optimize component re-renders using memoization for preview panel components

### Key Entities

- **Test Input State**: Temporary state holding variable names and their current test values (text or uploaded images). Not persisted to Firestore. Lives in component state during editing session.

- **Resolved Prompt**: Computed string representing the final prompt text after all variable substitutions. Derived on-the-fly from prompt template + test input values + value mappings. Includes placeholder text for image references.

- **Media Reference List**: Computed array of image objects to be sent to AI, derived from prompt references. Includes both registry media (from `@{ref:name}`) and test uploads (from `@{input:name}`). Used to populate the media preview grid.

- **Validation State**: Computed object containing validation status (valid/invalid/incomplete), list of errors (missing required inputs), and list of warnings (undefined references, unmapped values). Drives UI state for indicators and button disabling.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Preset creators can enter test input values and see the resolved prompt update in under 500ms
- **SC-002**: Creators can identify all validation errors within 5 seconds of viewing the preview panel
- **SC-003**: 95% of preset test sessions correctly resolve all variable references on the first attempt
- **SC-004**: Creators can upload test images and see them appear in the media preview grid within 2 seconds
- **SC-005**: The preview panel handles presets with up to 20 variables and 10 media items without performance degradation
- **SC-006**: Creators can reset test inputs to defaults with a single action taking less than 1 second
- **SC-007**: 90% of creators understand what will be sent to the AI model before attempting test generation (measured by validation pass rate before clicking generate)

## Assumptions

### Technical Assumptions

1. **Lexical Editor Integration**: Phase 3 has already implemented Lexical-based prompt editing with the `@{type:name}` reference format. Phase 4 resolution logic will parse this format.

2. **Reference Format**: The established reference format is:
   - `@{text:variableName}` - Text variable
   - `@{input:variableName}` - Image variable (user upload)
   - `@{ref:mediaName}` - Media registry reference

3. **State Management**: Zustand store (`useAIPresetEditorStore`) exists from Phase 3 and contains preset configuration data. Test input state will be separate local state in the preview panel component.

4. **Media Storage**: Media registry items have accessible URLs for thumbnail display. Image uploads for test inputs will use the same upload infrastructure as Phase 3 media uploads.

5. **Performance Target**: 300ms debounce for resolution is sufficient to balance responsiveness with performance, based on industry standards for live preview features.

### Business Assumptions

1. **No Persistence**: Test input values are intentionally not persisted. They are for temporary testing only and should reset when the editor is closed or refreshed.

2. **Default Values**: All variables should have sensible default values defined in Phase 3 to enable immediate preview without manual input.

3. **Validation Warnings vs. Errors**: Undefined references are warnings (allowing preview) rather than hard errors, because creators may be in the process of building the configuration.

4. **Media Preview Scope**: The media preview grid shows only images that will be sent to AI, not all registry media. This focuses attention on what's actively being used.

5. **Phase 5 Dependency**: The test generation button is a placeholder. Actual generation functionality (calling AI models) is explicitly deferred to Phase 5.

### User Experience Assumptions

1. **Real-time Feedback**: Creators expect immediate visual feedback when changing inputs, hence the 300ms debounce rather than requiring a "preview" button click.

2. **Visual Distinction**: Creators need to clearly see the difference between resolved and unresolved references to quickly identify configuration issues.

3. **Character Count Visibility**: Showing character count for the resolved prompt helps creators stay within AI model token limits.

4. **Tooltip Guidance**: Disabled buttons should explain why they're disabled to prevent user frustration and guide toward resolution.

5. **Default-First Testing**: Pre-filling with defaults enables creators to immediately see what the prompt looks like without entering test data, speeding up the testing workflow.

## Dependencies

### Required (Phase 3 Complete)

- ✅ AI Preset Editor configuration panel with Lexical-based prompt editor
- ✅ Variable definitions with types (text/image), default values, and value mappings
- ✅ Media registry with upload and management
- ✅ Zustand store (`useAIPresetEditorStore`) containing preset data
- ✅ Reference format: `@{text:name}`, `@{input:name}`, `@{ref:name}`
- ✅ Auto-save infrastructure with debouncing

### External Services

- Firebase Storage for test image uploads (same as Phase 3 media uploads)
- Firestore for reading preset configuration data (read-only for preview panel)

### Out of Scope (Phase 5)

- Actual AI generation functionality (test generation button is UI-only placeholder)
- Backend test endpoint (`testAIPreset` Cloud Function)
- Result display with generated images
- Error handling for AI generation failures
- Rate limiting or cost tracking for test generation

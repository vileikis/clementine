# Feature Specification: AI Preset Editor - Configuration

**Feature Branch**: `043-ai-preset-editor`
**Created**: 2025-01-26
**Status**: Draft
**Input**: User description: "Phase 3 of AI Presets PRD - Build the left side of the AI Preset editor for configuring media, variables, and prompt. Editor page should implement layout pattern like ExperienceDesignerLayout with Save button (no Publish), editor save status indicator, and editable preset name in breadcrumb."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate to Editor and Edit Preset Name (Priority: P1)

A workspace admin navigates to an AI Preset from the list page to configure it. They see the editor layout with the preset name displayed in the breadcrumb. They can click on the preset name to edit it inline, providing a quick way to rename without leaving the editor.

**Why this priority**: Navigation and the ability to identify/rename the preset is foundational. Without this, users cannot access or organize their presets effectively.

**Independent Test**: Can be fully tested by clicking a preset card from the list, verifying the editor loads with the correct name displayed, editing the name inline, and confirming the change persists.

**Acceptance Scenarios**:

1. **Given** I am on the AI Presets list page, **When** I click on a preset card, **Then** I am navigated to `/workspace/{workspaceSlug}/ai-presets/{presetId}` and see the editor layout with a two-column design.
2. **Given** I am on the AI Preset editor page, **When** I view the top navigation bar, **Then** I see a breadcrumb with an icon linking back to the AI Presets list and the preset name displayed as editable text.
3. **Given** I am on the AI Preset editor page, **When** I click on the preset name in the breadcrumb, **Then** it becomes an editable input field with the current name selected.
4. **Given** I am editing the preset name, **When** I type a new name and press Enter or click away, **Then** the name is saved and I see a save status indicator showing the save completed.
5. **Given** I am editing the preset name, **When** I press Escape, **Then** the edit is cancelled and the original name is restored.
6. **Given** I have made changes and they are saving, **When** I look at the top navigation bar, **Then** I see a spinner indicating save in progress, which changes to a checkmark when complete.

---

### User Story 2 - Configure Model Settings (Priority: P2)

A workspace admin configures the AI model and aspect ratio for their preset. These settings determine which AI model generates images and what dimensions the output images will have.

**Why this priority**: Model settings are essential configuration that affects every generation. This is a simple but critical piece of the editor.

**Independent Test**: Can be fully tested by opening the editor, selecting different model and aspect ratio options, and verifying the selections persist after page reload.

**Acceptance Scenarios**:

1. **Given** I am on the AI Preset editor page, **When** I view the configuration panel (left side), **Then** I see a Model Settings section with dropdowns for Model and Aspect Ratio.
2. **Given** I am viewing Model Settings, **When** I open the Model dropdown, **Then** I see options: "Gemini 2.5 Flash", "Gemini 2.5 Pro", "Gemini 3.0".
3. **Given** I am viewing Model Settings, **When** I open the Aspect Ratio dropdown, **Then** I see options: "1:1", "3:2", "2:3", "16:9", "9:16".
4. **Given** I have selected a model and aspect ratio, **When** I select a different option, **Then** the change is saved automatically and I see the save status indicator.

---

### User Story 3 - Manage Media Registry (Priority: P3)

A workspace admin adds reference images from their media library to use in prompts. These images can be referenced in the prompt template using @mentions, allowing the AI to use them as style references or inputs.

**Why this priority**: Media references enable rich AI prompts with visual examples. However, text-only prompts are still functional, making this valuable but not blocking.

**Independent Test**: Can be fully tested by opening the editor, clicking "Add from Library", selecting media, and verifying the media appears in the registry with the correct reference name.

**Acceptance Scenarios**:

1. **Given** I am on the AI Preset editor page, **When** I view the configuration panel, **Then** I see a Media Registry section with a compact thumbnail grid (or empty state if no media).
2. **Given** the Media Registry is empty, **When** I view it, **Then** I see an "Add from Library" button prominently displayed.
3. **Given** I click "Add from Library", **When** the media library picker opens, **Then** I can browse and select one or more images from my workspace media library.
4. **Given** I have selected media in the picker, **When** I confirm the selection, **Then** the selected images appear in the Media Registry as thumbnails.
5. **Given** I have media in the registry, **When** I view a media thumbnail, **Then** I see the media reference name displayed below it.
6. **Given** I have media in the registry, **When** I hover over a media thumbnail, **Then** I see the full name and a delete button appears.
7. **Given** I hover over a media thumbnail, **When** I click the delete button, **Then** the media is removed from the registry and the change is saved.

---

### User Story 4 - Define Variables (Priority: P4)

A workspace admin creates variables that can be used in prompt templates. Variables act as placeholders that get filled with actual values when the preset is used, allowing the same preset to generate different outputs based on inputs.

**Why this priority**: Variables enable dynamic, reusable presets. A preset without variables works but is static. Variables unlock the full power of presets.

**Independent Test**: Can be fully tested by creating a text variable, setting its properties, creating an image variable, and verifying both appear in the variables list with correct configuration.

**Acceptance Scenarios**:

1. **Given** I am on the AI Preset editor page, **When** I view the configuration panel, **Then** I see a Variables section with an "Add Variable" button.
2. **Given** the Variables section is empty, **When** I view it, **Then** I see an empty state encouraging me to add variables.
3. **Given** I click "Add Variable", **When** the variable editor appears, **Then** I can configure: Name (alphanumeric, shown with @ prefix), Label (display name), Type (text or image), and Required toggle.
4. **Given** I am creating a text variable, **When** I select type "text", **Then** I see additional options for Default Value (free text input).
5. **Given** I have configured a variable, **When** I save it, **Then** it appears in the Variables list as a collapsible card showing: @name, type badge, and label.
6. **Given** I have variables in the list, **When** I click on a variable card, **Then** it expands to show the variable editor with current values for editing.
7. **Given** I am editing a variable, **When** I change any property and save, **Then** the changes are saved automatically and the save status indicator shows progress.
8. **Given** I have a variable, **When** I delete it, **Then** it is removed from the list and the change is saved.

---

### User Story 5 - Configure Value Mappings for Text Variables (Priority: P5)

A workspace admin sets up value mappings for a text variable. Value mappings allow predefined input options to map to specific prompt text, enabling dropdown selection instead of free-form input.

**Why this priority**: Value mappings are an advanced feature that enhances text variables. Basic text variables work without mappings, making this a refinement.

**Independent Test**: Can be fully tested by creating a text variable, adding value mappings, and verifying the mappings appear correctly with their input values and output text.

**Acceptance Scenarios**:

1. **Given** I am editing a text variable, **When** I view the variable editor, **Then** I see a Value Mappings section with an "Add Mapping" button.
2. **Given** I click "Add Mapping", **When** a new mapping row appears, **Then** I see inputs for: Value (what user selects) and Text Output (what goes in the prompt).
3. **Given** I have added a mapping, **When** I fill in the Value and Text Output fields, **Then** the mapping is saved automatically.
4. **Given** I have multiple mappings, **When** I view them, **Then** they appear in a list showing "Value → Output" format.
5. **Given** I have a mapping, **When** I click delete on that mapping row, **Then** it is removed from the list.
6. **Given** the Text Output field, **When** I type @, **Then** I see an autocomplete dropdown showing available variables and media references.

---

### User Story 6 - Write Prompt Template with @mentions (Priority: P6)

A workspace admin writes a prompt template using @mentions to reference variables and media. The prompt template is the core instruction sent to the AI, with @mentions replaced by actual values at generation time.

**Why this priority**: The prompt template is the heart of the AI Preset, but building it requires the other pieces (media, variables) to be in place first. It integrates everything.

**Independent Test**: Can be fully tested by writing a prompt, typing @ to trigger autocomplete, selecting variables/media, and verifying the mentions appear as visual pills in the editor.

**Acceptance Scenarios**:

1. **Given** I am on the AI Preset editor page, **When** I view the configuration panel, **Then** I see a Prompt Template section with a rich text area.
2. **Given** I am in the prompt template editor, **When** I type text, **Then** it appears normally as editable text.
3. **Given** I am typing in the prompt template, **When** I type the @ character, **Then** an autocomplete dropdown appears showing available variables (with blue indicator) and media references (with green indicator).
4. **Given** the autocomplete dropdown is open, **When** I continue typing, **Then** the list filters to match my input.
5. **Given** the autocomplete dropdown is open, **When** I select an item (click or Enter), **Then** a visual pill is inserted representing that @mention (blue for variables, green for media).
6. **Given** I have @mention pills in my prompt, **When** I view them, **Then** they are clearly distinguishable from regular text and show the reference name.
7. **Given** I have @mention pills in my prompt, **When** I press Backspace adjacent to a pill, **Then** the entire pill is deleted as a unit.
8. **Given** I am in the prompt template section, **When** I look below the editor, **Then** I see syntax help text explaining @mention usage.

---

### User Story 7 - Save and Navigate Away (Priority: P7)

A workspace admin finishes editing and wants to save their work and return to the presets list. They use the explicit Save button or rely on auto-save, then navigate back.

**Why this priority**: Saving is implicit via auto-save, but having an explicit save button provides confidence. Navigation completes the editing workflow.

**Independent Test**: Can be fully tested by making changes, clicking Save, verifying changes persist, then clicking the back button and confirming navigation to the list.

**Acceptance Scenarios**:

1. **Given** I have made changes in the editor, **When** I look at the top navigation bar, **Then** I see a "Save" button.
2. **Given** there are unsaved changes, **When** I click the Save button, **Then** all pending changes are saved and the save status shows completion.
3. **Given** I am on the editor page, **When** I click the icon in the breadcrumb (AI Presets list link), **Then** I am navigated back to the AI Presets list page.
4. **Given** I have made changes and they are still saving, **When** I view the save status indicator, **Then** I see a spinner showing save in progress.

---

### Edge Cases

- What happens when a user deletes a variable that is referenced in the prompt template? The @mention pill should become invalid/highlighted and the user should be notified.
- What happens when a user deletes media that is referenced in the prompt template? The @mention pill should become invalid/highlighted and the user should be notified.
- What happens when the preset fails to load (network error)? An error state should be displayed with a retry option.
- What happens when a save operation fails? A toast notification should inform the user of the failure with the option to retry.
- What happens when two users edit the same preset simultaneously? The most recent save wins (last-write-wins), and users should see updated content on refetch.
- What happens if the user enters an empty preset name? Validation should prevent empty names and show an error message.
- What happens if a variable name conflicts with existing variables? Validation should prevent duplicate variable names.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an editor page at route `/workspace/{workspaceSlug}/ai-presets/{presetId}` accessible from the preset list.
- **FR-002**: System MUST display a two-column layout with configuration panel on the left and placeholder for test area on the right.
- **FR-003**: System MUST display a top navigation bar with: breadcrumb showing editable preset name with icon link to list, save status indicator, and Save button.
- **FR-004**: System MUST allow inline editing of the preset name by clicking on it in the breadcrumb.
- **FR-005**: System MUST auto-save changes as they are made (debounced to prevent excessive writes).
- **FR-006**: System MUST provide a Model dropdown with options: gemini-2.5-flash, gemini-2.5-pro, gemini-3.0.
- **FR-007**: System MUST provide an Aspect Ratio dropdown with options: 1:1, 3:2, 2:3, 16:9, 9:16.
- **FR-008**: System MUST display a Media Registry section showing thumbnails of registered media with reference names.
- **FR-009**: System MUST provide an "Add from Library" button that opens the workspace media library picker.
- **FR-010**: System MUST allow deleting media from the registry via hover action.
- **FR-011**: System MUST display a Variables section with the ability to add, edit, and delete variables.
- **FR-012**: System MUST support two variable types: text and image.
- **FR-013**: System MUST validate variable names to be alphanumeric with underscores, starting with a letter or underscore.
- **FR-014**: System MUST support value mappings for text variables with value-to-text pairs.
- **FR-015**: System MUST provide a rich text prompt template editor with @mention autocomplete.
- **FR-016**: System MUST display @mentions as visual pills (blue for variables, green for media).
- **FR-017**: System MUST filter autocomplete suggestions based on typed characters after @.
- **FR-018**: System MUST display syntax help text below the prompt template editor.
- **FR-019**: System MUST show a save status indicator (spinner during save, checkmark on completion).
- **FR-020**: System MUST display error states and provide retry options when operations fail.

### Key Entities

- **AIPreset**: The main entity being edited. Contains name, description, mediaRegistry, variables, promptTemplate, model, and aspectRatio.
- **PresetVariable**: A variable definition with name, label, type (text/image), required flag, and for text: defaultValue and valueMap.
- **PresetMediaEntry**: A reference to a media asset from the workspace library with a unique reference name for @mentions.
- **ValueMappingEntry**: A mapping from an input value to output text for text variables with predefined options.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate to and load the AI Preset editor within 2 seconds from clicking on a preset card.
- **SC-002**: Users can successfully edit the preset name inline with changes saved within 3 seconds.
- **SC-003**: Users can add media from the library to the preset with the thumbnail appearing within 2 seconds.
- **SC-004**: Users can create a new variable with all required fields in under 30 seconds.
- **SC-005**: The @mention autocomplete dropdown appears within 200ms of typing the @ character.
- **SC-006**: Users can write a prompt template with multiple @mentions and see all pills render correctly.
- **SC-007**: All editor changes are persisted and survive page reload without data loss.
- **SC-008**: The save status indicator accurately reflects the current save state (saving vs. saved vs. error).
- **SC-009**: Users can complete a full preset configuration (model, aspect ratio, at least one variable, prompt template) in under 5 minutes.
- **SC-010**: Error states provide clear messaging and actionable recovery options (retry button).

## Assumptions

- The AI Presets list page (Phase 2) is complete and provides navigation to the editor.
- The workspace media library and its picker component are available for integration.
- The existing CRUD hooks (create, update, delete, duplicate) from Phase 1 can be extended for granular field updates.
- The EditorSaveStatus and createEditorStore patterns from the shared editor-status module can be reused.
- The TopNavBar component from the navigation domain supports custom breadcrumb content including editable elements.
- Firebase Firestore security rules allow workspace admins to read and write AI Presets in their workspace.
- Real-time updates via Firestore onSnapshot are sufficient for the editor (no need for WebSocket or custom sync).

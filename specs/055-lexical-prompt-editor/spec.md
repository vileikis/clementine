# Feature Specification: Lexical Prompt Editor with Mentions

**Feature Branch**: `055-lexical-prompt-editor`
**Created**: 2026-02-01
**Status**: Draft
**Input**: Add Lexical rich text editor to AIImageNode prompt composer with step and media mention support

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Type @ to Insert Step Mention (Priority: P1)

Experience creators need to reference dynamic step values (like user inputs or captured photos) within their AI prompts. When typing a prompt, they type "@" to trigger an autocomplete menu, select a step, and see it displayed as a visual pill.

**Why this priority**: Step mentions are the core value proposition—without them, prompts cannot be dynamic. This enables the fundamental use case of personalized AI experiences.

**Independent Test**: Can be fully tested by typing "@" in the prompt input, selecting a step from the autocomplete, and verifying the step appears as a styled pill with the step name visible.

**Acceptance Scenarios**:

1. **Given** the prompt editor is focused, **When** the user types "@", **Then** an autocomplete menu appears showing available steps
2. **Given** the autocomplete menu is visible, **When** the user selects a step (e.g., "Pet Choice"), **Then** a blue pill appears showing "@Pet Choice" and the autocomplete closes
3. **Given** a step mention exists in the editor, **When** the user views the saved prompt, **Then** the storage format is `@{step:Step Name}` (using human-readable step name for debuggability)

---

### User Story 2 - Type @ to Insert Media Reference (Priority: P1)

Experience creators need to reference static media assets (reference images for style guidance) in their prompts. The workflow mirrors step mentions but displays media with thumbnails in the autocomplete.

**Why this priority**: Media references are equally critical for AI image generation—style references are a key feature for brand consistency.

**Independent Test**: Can be fully tested by typing "@" in the prompt input, selecting a media asset from the autocomplete (shown with thumbnail), and verifying it appears as a styled pill.

**Acceptance Scenarios**:

1. **Given** the autocomplete menu is visible, **When** the user views media options, **Then** each media item shows a thumbnail preview and display name
2. **Given** the autocomplete menu is visible, **When** the user selects a media asset, **Then** a pill appears showing "@media display name" (media display name can contain spaces)
3. **Given** a media mention exists in the editor, **When** the user views the saved prompt, **Then** the storage format is `@{ref:display name}` (using human-readable display name for debuggability)

---

### User Story 3 - Navigate Autocomplete with Keyboard (Priority: P2)

Experience creators should be able to navigate and select mentions using keyboard only for efficiency and accessibility.

**Why this priority**: Power users expect keyboard navigation; accessibility requirements demand it.

**Independent Test**: Can be tested by triggering autocomplete with "@", using arrow keys to navigate, Enter to select, and Escape to dismiss.

**Acceptance Scenarios**:

1. **Given** the autocomplete menu is visible, **When** the user presses Down arrow, **Then** the next item is highlighted
2. **Given** the autocomplete menu is visible, **When** the user presses Up arrow, **Then** the previous item is highlighted
3. **Given** an item is highlighted, **When** the user presses Enter, **Then** that item is inserted and autocomplete closes
4. **Given** the autocomplete menu is visible, **When** the user presses Escape, **Then** the menu closes without inserting

---

### User Story 4 - Filter Autocomplete by Typing (Priority: P2)

Experience creators should be able to filter the autocomplete list by typing after "@" to quickly find the desired step or media.

**Why this priority**: Experiences may have many steps and media assets; filtering improves efficiency.

**Independent Test**: Can be tested by typing "@pet" and verifying only items containing "pet" appear in the autocomplete.

**Acceptance Scenarios**:

1. **Given** the user has typed "@pet", **When** the autocomplete menu is visible, **Then** only steps and media containing "pet" (case-insensitive) are shown
2. **Given** no items match the filter, **When** the autocomplete is visible, **Then** a "No results" message is displayed

---

### User Story 5 - Load Existing Prompt with Mentions (Priority: P1)

When opening an experience that already has a prompt with mentions, the editor must deserialize the stored format back into visual pills.

**Why this priority**: Without deserialization, saved prompts would appear as raw syntax instead of user-friendly pills—breaking the editing experience.

**Independent Test**: Can be tested by loading a prompt containing `@{step:Pet Choice}` and verifying it displays as "@Pet Choice" pill (matched by step name).

**Acceptance Scenarios**:

1. **Given** a saved prompt contains `@{step:Pet Choice}`, **When** the editor loads, **Then** it displays as a blue pill showing "@Pet Choice" (matched by step name)
2. **Given** a saved prompt contains `@{ref:cat image.jpeg}`, **When** the editor loads, **Then** it displays as a pill showing "@cat image.jpeg" (matched by display name)
3. **Given** a saved prompt references a step name that no longer exists (e.g., step was renamed or deleted), **When** the editor loads, **Then** the mention displays with an error state (e.g., strikethrough, red styling)

---

### User Story 6 - Delete Mentions (Priority: P2)

Experience creators must be able to remove mentions by selecting and deleting them.

**Why this priority**: Editing prompts requires the ability to remove as well as add content.

**Independent Test**: Can be tested by clicking on a mention pill and pressing Backspace/Delete, verifying the entire pill is removed.

**Acceptance Scenarios**:

1. **Given** a mention pill is in the editor, **When** the user positions cursor after it and presses Backspace, **Then** the entire pill is deleted as a single unit
2. **Given** a mention pill is in the editor, **When** the user selects it and presses Delete, **Then** the entire pill is deleted

---

### Edge Cases

- What happens when a step is renamed after being referenced? The stored name becomes invalid; the mention shows an error state, prompting the author to update the reference.
- What happens when a step is deleted after being referenced? The mention shows an error state indicating the reference is invalid.
- What happens when the user pastes text containing mention syntax? The syntax should be parsed and converted to mention nodes (smart paste).
- What happens with empty prompt? The editor shows placeholder text and saves as empty string.
- What happens when user types "@" but immediately continues typing other text? If no valid mention is selected, "@" remains as literal text.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an autocomplete menu when the user types "@" in the prompt editor
- **FR-002**: System MUST show experience steps in the autocomplete with their display name and type icon
- **FR-003**: System MUST show reference media in the autocomplete with thumbnail preview and display name
- **FR-004**: System MUST insert a visual pill when the user selects a mention, displaying "@" followed by the display name
- **FR-005**: System MUST support step names and media display names containing spaces (e.g., "@Pet Choice", "@Summer Background")
- **FR-006**: System MUST serialize mentions to storage format: `@{step:stepName}` for steps and `@{ref:displayName}` for media (human-readable names for debuggability)
- **FR-007**: System MUST deserialize storage format back to visual pills by matching names against current steps and refMedia
- **FR-008**: System MUST display step mentions with blue styling (pill appearance)
- **FR-009**: System MUST treat mention pills as atomic units (select/delete as one)
- **FR-010**: System MUST support keyboard navigation in autocomplete (arrow keys, Enter, Escape)
- **FR-011**: System MUST filter autocomplete results as the user types after "@"
- **FR-012**: System MUST indicate invalid mentions (deleted steps/media) with error styling
- **FR-013**: System MUST convert pasted text containing mention syntax into visual pills

### Key Entities

- **StepMentionNode**: Represents a reference to an experience step. Stores step name for both display and storage (`@{step:stepName}`). Blue pill styling.
- **MediaMentionNode**: Represents a reference to a media asset. Stores display name for both display and storage (`@{ref:displayName}`). Green pill styling.
- **Autocomplete Option**: Represents an item in the autocomplete menu. Can be either a step (with type icon) or media (with thumbnail).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can insert a mention in under 3 seconds (trigger autocomplete, select item)
- **SC-002**: Autocomplete menu appears within 200ms of typing "@"
- **SC-003**: 100% of saved prompts with mentions load correctly as visual pills (no raw syntax visible)
- **SC-004**: 100% of mention pills serialize to correct storage format on save
- **SC-005**: Users can navigate autocomplete using only keyboard without errors
- **SC-006**: Filter results update within 100ms of typing
- **SC-007**: Invalid mentions (deleted steps/media) are visually distinguishable with 100% accuracy

## Assumptions

- Experience steps and reference media assets are already available in the application context (via props or state)
- Step names are unique within an experience (enforced by existing schema)
- Media display names are unique within a node's refMedia array (reasonable assumption for small arrays)
- The existing Lexical implementation in `domains/ai-presets/lexical/` provides reusable patterns for mention nodes, plugins, and serialization
- The prompt editor replaces the current plain textarea in PromptInput component
- Step names follow existing schema validation: `[a-zA-Z0-9 \-_]` characters only

## Out of Scope

- Server-side prompt resolution (converting mentions to actual values) - this is handled by cloud functions
- Creating or editing steps/media from within the prompt editor
- Rich text formatting beyond mentions (bold, italic, etc.)
- Drag-and-drop reordering of mentions
- Undo/redo beyond what Lexical provides by default

## Resolution Logic Reference (For Future Implementation)

This section documents how mentions should be resolved at runtime (in cloud functions, not client-side):

**Step Mentions (`@{step:stepName}`)**:
- For input steps: Look up answer by `stepName` in session.answers, resolve to `value` or `context` (promptFragment + promptMediaAssetId)
- For capture steps: Look up capture by `stepName` in session.capturedMedia, resolve to `assetId`

**Media Mentions (`@{ref:displayName}`)**:
- Look up media by `displayName` in node.config.refMedia, resolve to `mediaAssetId` for use as a reference image

**Prerequisite for backend resolution**: The session schema must include `stepName` in answers and capturedMedia. See `future-session-schema-refactor.md` for the required schema changes.

This resolution logic is documented here for future reference but is explicitly out of scope for this client-side feature.

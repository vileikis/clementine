# Feature Specification: Inline Prompt Architecture - Phase 1a & 1b Foundation

**Feature Branch**: `048-inline-prompt-phase-1ab`
**Created**: 2026-01-29
**Status**: Draft
**Input**: User description: "phase 1a and 1b from '/Users/iggyvileikis/Projects/@attempt-n2/clementine/requirements/inline-prompt-arch-v2/plan.md' '/Users/iggyvileikis/Projects/@attempt-n2/clementine/requirements/inline-prompt-arch-v2/README.md'"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure AI-Aware Step Names (Priority: P1)

Experience creators need to assign unique, human-readable names to experience steps so they can reference them in AI prompts using meaningful identifiers like "Pet Choice" or "User Photo" instead of cryptic IDs.

**Why this priority**: Step names are the foundation of the inline prompt architecture. Without unique step names, creators cannot reference steps in prompts, making the entire AI prompt system unusable. This is the most critical piece of infrastructure.

**Independent Test**: Can be fully tested by creating an experience, adding steps, editing step names with spaces (e.g., "Pet Choice"), validating uniqueness on blur, and verifying the step list displays the custom names. Delivers immediate value by making the step list more readable.

**Acceptance Scenarios**:

1. **Given** I'm editing an experience step, **When** I open the step settings panel, **Then** I see a text input field for the step name with current value pre-filled
2. **Given** I'm creating a new step, **When** the step is added, **Then** an initial name is auto-generated from the step type (e.g., "Pet Choice" for multiselect, "User Photo" for capture)
3. **Given** I'm editing a step name, **When** I type a name with spaces, letters, numbers, hyphens, and underscores, **Then** the name is accepted and auto-saved after debounce
4. **Given** I'm editing a step name, **When** I enter a name that already exists (case-sensitive), **Then** I see an inline error message indicating the name is duplicate
5. **Given** I'm editing a step name, **When** I enter invalid characters or exceed 50 characters, **Then** I see an inline validation error
6. **Given** I've edited a step name successfully, **When** I view the step list, **Then** the step displays my custom name instead of the config title

---

### User Story 2 - Add AI Context to Multiselect Options (Priority: P2)

Experience creators need to add optional AI context (text fragments and reference media) to multiselect options so that when users select an option, the AI prompt automatically includes relevant details and visual references.

**Why this priority**: This enables AI-aware step options, which is the key innovation of inline prompts. However, it builds on P1 (step names) and can be tested independently by adding promptFragment/promptMedia to options and verifying they save correctly.

**Independent Test**: Can be fully tested by editing a multiselect step, adding promptFragment text and promptMedia to an option, saving, and verifying the data persists. Delivers value by allowing creators to prepare AI-ready content even before the full prompt resolution system is built.

**Acceptance Scenarios**:

1. **Given** I'm editing a multiselect option, **When** I open the option editor, **Then** I see optional fields for "Prompt Fragment" (text input, max 500 chars) and "Prompt Media" (media picker)
2. **Given** I'm adding a prompt fragment to an option, **When** I type text up to 500 characters, **Then** the text is saved after debounce
3. **Given** I'm adding prompt media to an option, **When** I click the upload button or media picker, **Then** I can select/upload an image which is stored as a MediaReference
4. **Given** I've added promptFragment or promptMedia to an option, **When** I view the option in the list, **Then** I see a visual indicator (badge/icon) showing "AI-enabled"
5. **Given** I've added prompt media to an option, **When** I view the option editor, **Then** I see a thumbnail of the media with a remove button
6. **Given** I'm adding prompt fragment text, **When** I exceed 500 characters, **Then** I see a validation error

---

### User Story 3 - Update Experience Schemas for AI Features (Priority: P1)

As a system, schemas must be updated to support step names (required), AI-aware option fields (promptFragment, promptMedia), and AI image node configuration before any UI can be built.

**Why this priority**: This is foundational infrastructure that enables all other stories. Without schema updates, no data can be stored or validated. This must be completed first but is grouped as P1 because it's technical infrastructure rather than a user-facing feature.

**Independent Test**: Can be fully tested by writing unit tests that validate schema behavior: step names are required, regex validation works, promptFragment/promptMedia are optional, and all schemas generate correct TypeScript types.

**Acceptance Scenarios**:

1. **Given** a step schema with a name field, **When** validation runs, **Then** the name is required (not optional) and must match regex `/^[a-zA-Z0-9 \-_]+$/`
2. **Given** a multiselect option with promptFragment, **When** validation runs, **Then** promptFragment accepts strings up to 500 characters
3. **Given** a multiselect option with promptMedia, **When** validation runs, **Then** promptMedia accepts a valid MediaReference schema
4. **Given** AI node schemas exist, **When** TypeScript types are generated, **Then** types correctly reflect all required and optional fields
5. **Given** all schema changes are complete, **When** unit tests run, **Then** all tests pass with 100% coverage

---

### Edge Cases

- What happens when a step name is changed after being referenced in a prompt? (Future: show validation warning "Step 'Old Name' not found")
- How does the system handle empty promptFragment with non-empty promptMedia? (Fallback to option value)
- What happens when duplicate step names exist across different step types? (Error: names must be unique regardless of type)
- How does the system handle special characters in step names? (Validation error: only letters, numbers, spaces, hyphens, underscores)
- What happens when promptFragment is exactly 500 characters? (Accepted: max length is inclusive)
- How does the system handle promptMedia that points to deleted media? (Validation warning: media not found)

## Requirements *(mandatory)*

### Functional Requirements

**Schema Updates (Phase 1a)**:

- **FR-001**: System MUST update `experienceStepNameSchema` to be required (remove `.optional()`)
- **FR-002**: System MUST validate step names with regex `/^[a-zA-Z0-9 \-_]+$/` (letters, numbers, spaces, hyphens, underscores only)
- **FR-003**: System MUST enforce max length of 50 characters for step names
- **FR-004**: System MUST add `promptFragment: z.string().max(500).optional()` to `multiSelectOptionSchema`
- **FR-005**: System MUST add `promptMedia: mediaReferenceSchema.optional()` to `multiSelectOptionSchema`
- **FR-006**: System MUST create `refMediaEntrySchema` extending `mediaReferenceSchema` with `displayName` field
- **FR-007**: System MUST create `aiImageNodeSchema` with fields: `model`, `aspectRatio`, `prompt`, `refMedia`
- **FR-008**: System MUST remove obsolete `variableMappings` field from `transformConfigSchema`
- **FR-009**: System MUST update `transformNodeSchema` to support typed configs including AI image node
- **FR-010**: All schema changes MUST have corresponding unit tests with 100% coverage

**Step Name Editing (Phase 1b)**:

- **FR-011**: System MUST display a text input for step name in all step editor settings panels
- **FR-012**: System MUST auto-generate initial step names from step type on creation (e.g., "Pet Choice" for multiselect, "User Photo" for capture)
- **FR-013**: System MUST validate step name uniqueness on blur (case-sensitive comparison)
- **FR-014**: System MUST show inline error messages for duplicate or invalid step names
- **FR-015**: System MUST debounce step name auto-save to prevent excessive Firestore writes
- **FR-016**: System MUST allow spaces in step names (e.g., "Pet Choice" is valid)
- **FR-017**: System MUST prevent saving duplicate step names across the experience

**Step List Display**:

- **FR-018**: StepList component MUST display `step.name` instead of `step.config.title`
- **FR-019**: StepList MUST fallback to title if name is empty (backward compatibility)
- **FR-020**: StepList MUST display step type badge/icon next to each step name
- **FR-021**: StepListItem component MUST be updated to show the new display format

**AI-Aware Multiselect Options**:

- **FR-022**: Option editor MUST display a "Prompt Fragment (optional)" text input with max 500 characters
- **FR-023**: Option editor MUST display a "Prompt Media (optional)" picker with upload button or media library access
- **FR-024**: Option editor MUST show help text: "Text to insert when this option is selected" for promptFragment
- **FR-025**: Option editor MUST show thumbnail when promptMedia is set, with a remove button
- **FR-026**: Option list MUST show visual indicator (badge/icon "AI-enabled") when promptFragment or promptMedia is set
- **FR-027**: System MUST validate promptFragment max length (500 chars)
- **FR-028**: System MUST validate promptMedia as valid MediaReference
- **FR-029**: System MUST debounce promptFragment auto-save
- **FR-030**: All changes MUST save to experience draft in Firestore

### Key Entities

- **ExperienceStep**: Represents a step in the experience flow with a unique required name, type, and configuration. Step names support spaces and human-friendly formatting (e.g., "Pet Choice", "User Photo").

- **MultiSelectOption**: Represents a selectable option in a multiselect step, optionally enhanced with AI context via `promptFragment` (text up to 500 chars) and `promptMedia` (MediaReference).

- **MediaReference**: Represents a reference to uploaded media with `mediaAssetId`, `url`, `filePath`, and optional `fileName`. Used for promptMedia and refMedia.

- **RefMediaEntry**: Extends MediaReference with an additional `displayName` field for user-friendly labeling of reference media in AI nodes.

- **AIImageNode**: Represents an AI image generation node in the transform pipeline with `model`, `aspectRatio`, `prompt` (containing step mentions), and `refMedia` array.

- **ExperienceDraft**: Represents the working copy of an experience being edited, stored in Firestore, containing all steps and transform configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Experience creators can successfully create and edit step names with spaces (e.g., "Pet Choice") and see them displayed in the step list within 2 seconds of saving

- **SC-002**: System validates step name uniqueness on blur and displays inline error messages within 200ms, preventing duplicate names from being saved

- **SC-003**: Experience creators can add promptFragment and promptMedia to multiselect options, with changes auto-saving after debounce (2 seconds), and visual "AI-enabled" indicators appearing immediately

- **SC-004**: All schema validations pass 100% of unit tests, correctly enforcing step name regex, character limits, and optional AI fields

- **SC-005**: StepList component displays custom step names instead of config titles, with fallback to title for backward compatibility with existing experiences

- **SC-006**: Experience creators can identify AI-enabled options at a glance via visual indicators (badges/icons) without needing to open the option editor

- **SC-007**: System prevents invalid step names (special characters, duplicates, exceeding 50 chars) from being saved, with clear error messages guiding creators to fix issues

- **SC-008**: All changes to step names and option AI fields persist correctly in Firestore experience drafts, surviving page refreshes and editor reopens

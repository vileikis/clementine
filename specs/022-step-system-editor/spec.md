# Feature Specification: Step System & Experience Editor

**Feature Branch**: `022-step-system-editor`
**Created**: 2026-01-13
**Status**: Draft
**Input**: Epic E2 - Enable admins to build experiences by adding, configuring, and previewing steps within a 3-column experience editor

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add and Configure Steps in Experience Editor (Priority: P1)

As an admin, I need to add steps to my experience and configure them so that I can build the content flow guests will see. I open the experience editor, see a 3-column layout with step list, preview, and configuration panel. I click "Add Step" to open a dialog showing available step types filtered by my experience profile. I select a step type, and it appears in my step list. I can then configure the step using the right panel while seeing a live preview in the center.

**Why this priority**: This is the core functionality that enables experience creation. Without the ability to add and configure steps, the editor has no purpose.

**Independent Test**: Can be fully tested by creating a new experience, adding multiple steps of different types, and configuring each step. Delivers the foundational capability to build experiences.

**Acceptance Scenarios**:

1. **Given** I am on the experience editor page, **When** I click "Add Step", **Then** I see a dialog showing step types grouped by category (info, input, capture, transform)
2. **Given** I have the "Add Step" dialog open, **When** I select a step type, **Then** the step is added to my step list and becomes selected
3. **Given** I have a step selected, **When** I modify configuration fields in the right panel, **Then** the preview updates immediately to reflect my changes
4. **Given** my experience has a "survey" profile, **When** I open the "Add Step" dialog, **Then** I do not see transform step types (they are filtered out)

---

### User Story 2 - Reorder and Delete Steps (Priority: P2)

As an admin, I need to organize my steps by reordering them and removing ones I no longer need so that I can refine my experience flow. I can drag steps in the list to change their order. I can delete a step through a context menu or action.

**Why this priority**: Managing step order and removing steps is essential for iterating on experience design, but secondary to the initial creation capability.

**Independent Test**: Can be tested by adding 3+ steps, dragging them to new positions, and deleting steps. Verifies the step management workflow.

**Acceptance Scenarios**:

1. **Given** I have multiple steps in my experience, **When** I drag a step to a new position, **Then** the step list reorders and the new order is preserved
2. **Given** I have a step selected, **When** I choose "Delete" from the context menu, **Then** the step is removed from the list
3. **Given** I delete the currently selected step, **When** the deletion completes, **Then** either the next step is selected or the preview shows "No step selected" if no steps remain

---

### User Story 3 - Auto-Save Draft Changes (Priority: P3)

As an admin, I want my changes to be automatically saved so that I don't lose work if I navigate away or close the browser. When I make changes to steps or their configuration, the system saves to draft after a brief pause. I see a visual indicator showing save status.

**Why this priority**: Auto-save protects user work and enables a seamless editing experience, but the core editing functionality must work first.

**Independent Test**: Can be tested by making changes, waiting for save indicator, refreshing the page, and verifying changes persisted.

**Acceptance Scenarios**:

1. **Given** I modify a step configuration, **When** I stop making changes for 2 seconds, **Then** the system auto-saves and shows "Saving..." then "Saved" indicator
2. **Given** I have unsaved changes, **When** I refresh the page, **Then** my changes have been saved and appear when the page reloads
3. **Given** I add, reorder, or delete steps, **When** the action completes, **Then** the system auto-saves the updated step list

---

### User Story 4 - Publish Experience (Priority: P4)

As an admin, I need to publish my experience so that it becomes available for guests to use. I click the "Publish" button, the system validates my steps, and if valid, copies my draft to published. I see a confirmation when publishing succeeds.

**Why this priority**: Publishing is the culmination of the editing workflow, enabling experiences to go live, but requires all editing capabilities to be in place first.

**Independent Test**: Can be tested by creating a complete experience with valid steps, clicking Publish, and verifying the published data is updated.

**Acceptance Scenarios**:

1. **Given** I have a valid experience with at least one step, **When** I click "Publish", **Then** the system copies draft to published and shows success confirmation
2. **Given** I have no steps in my experience, **When** I click "Publish", **Then** the system shows a validation error indicating at least one step is required
3. **Given** I have a step with invalid configuration, **When** I click "Publish", **Then** the system shows validation errors for the specific issues
4. **Given** my experience profile is "survey" but contains transform steps, **When** I click "Publish", **Then** the system shows a validation error about disallowed step types

---

### User Story 5 - Preview Steps in Edit Mode (Priority: P5)

As an admin, I want to see how my steps will appear to guests so that I can ensure the visual presentation is correct. The center panel shows a phone-frame preview of the selected step. The preview is non-interactive but accurately reflects the configuration.

**Why this priority**: Visual preview enhances the editing experience but is supplementary to the core configuration capabilities.

**Independent Test**: Can be tested by selecting different step types and verifying the preview displays appropriate content and placeholder text.

**Acceptance Scenarios**:

1. **Given** I select an info step, **When** it has no title configured, **Then** the preview shows placeholder text "Add a title..."
2. **Given** I select an input.scale step, **When** I configure the question and scale range, **Then** the preview shows the question and disabled scale buttons with labels
3. **Given** I select a transform.pipeline step, **When** viewing the preview, **Then** I see "AI Processing" title with "Coming soon" badge

---

### Edge Cases

- What happens when the admin tries to publish with steps that have empty required fields?
  - System shows validation errors indicating which fields need values
- How does the system handle network errors during auto-save?
  - Show error indicator and retry save; preserve local changes until save succeeds
- What happens if admin navigates away with unsaved changes?
  - Changes are saved via debounced auto-save; no explicit confirmation needed as save is automatic
- How does the system handle concurrent editing (same experience in multiple tabs)?
  - Last save wins; this is acceptable for MVP as single-user editing is typical
- What happens when adding a step to an experience that has reached maximum steps?
  - Experiences do not have a maximum step limit in MVP

## Requirements *(mandatory)*

### Functional Requirements

**Step Registry & Management**

- **FR-001**: System MUST provide a step registry containing all MVP step types: info, input.scale, input.yesNo, input.multiSelect, input.shortText, input.longText, capture.photo, and transform.pipeline
- **FR-002**: System MUST filter available step types based on experience profile (freeform: all types; survey: all except transform; story: info only)
- **FR-003**: System MUST generate unique identifiers for each step when created
- **FR-004**: System MUST validate step configuration against defined schemas before allowing publish

**Experience Editor Layout**

- **FR-005**: System MUST display a 3-column layout with step list (left), step preview (center), and step configuration panel (right)
- **FR-006**: System MUST show breadcrumb navigation indicating workspace and experience hierarchy
- **FR-007**: System MUST display a "Publish" button in the editor header
- **FR-008**: System MUST sync selected step with URL parameter for deep linking

**Step List**

- **FR-009**: Admin MUST be able to add new steps via an "Add Step" dialog showing step types grouped by category
- **FR-010**: Admin MUST be able to reorder steps via drag-and-drop interaction
- **FR-011**: Admin MUST be able to delete steps via context menu
- **FR-012**: System MUST visually indicate the currently selected step in the list
- **FR-013**: System MUST display step icon and label for each step in the list

**Step Preview**

- **FR-014**: System MUST display selected step in a phone-frame preview shell
- **FR-015**: System MUST render step preview in non-interactive "edit mode" (visual only, no functional inputs)
- **FR-016**: System MUST update preview immediately when configuration changes
- **FR-017**: System MUST show placeholder when no step is selected

**Step Configuration**

- **FR-018**: System MUST display type-specific configuration panel for the selected step
- **FR-019**: Each step type MUST have defined configuration fields as specified:
  - info: title, description, media
  - input.scale: question, min, max, min label, max label
  - input.yesNo: question
  - input.multiSelect: question, options list, min selections, max selections
  - input.shortText: question, placeholder, max length
  - input.longText: question, placeholder, max length
  - capture.photo: instructions, countdown toggle and value, overlay (future)
  - transform.pipeline: no configuration (shows "Coming soon" message)

**Auto-Save**

- **FR-020**: System MUST auto-save changes to draft after 2 seconds of inactivity
- **FR-021**: System MUST display save status indicator (Saving.../Saved)
- **FR-022**: System MUST save step list order, step configurations, and step additions/deletions

**Publish**

- **FR-023**: Admin MUST be able to publish experience via "Publish" button
- **FR-024**: System MUST validate before publish: at least one step exists, all steps have valid configuration, step types comply with profile constraints
- **FR-025**: System MUST copy draft to published data upon successful publish
- **FR-026**: System MUST record publish timestamp and publisher information
- **FR-027**: System MUST display publish status indicator (Publishing.../Published)
- **FR-028**: System MUST show success notification upon publish completion
- **FR-029**: System MUST display specific validation errors if publish fails

### Key Entities

- **Step**: Represents a single unit in an experience flow. Has unique identifier, type (from registry), and type-specific configuration. Ordered within an experience.
- **Step Registry Entry**: Defines a step type including its category (info/input/capture/transform), display label, icon, configuration schema, default configuration, and renderer components.
- **Experience Draft**: Working version of an experience containing the step list and configurations being edited. Auto-saved during editing.
- **Experience Published**: Production version of an experience visible to guests. Created by copying draft during publish action.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can create a complete multi-step experience in under 10 minutes (for an experience with 5 steps)
- **SC-002**: Configuration changes are reflected in the preview within 100 milliseconds
- **SC-003**: Auto-save completes within 2 seconds of triggering
- **SC-004**: 100% of step types in the registry have functional edit-mode previews and configuration panels
- **SC-005**: Publish validation catches and reports all configuration errors before attempting to save
- **SC-006**: Drag-and-drop reordering provides immediate visual feedback during the drag operation
- **SC-007**: Admins can successfully publish an experience with valid steps on first attempt without encountering unexpected errors

## Assumptions

- Experience data layer (E1) is already implemented and provides access to experience documents with draft/published structure
- Media library for selecting media in info steps is available or a placeholder can be shown
- The authentication and workspace context is available to determine current admin and workspace
- Profile-based filtering logic will follow the exact mapping: freeform=all, survey=all except transform, story=info only
- "Coming soon" is acceptable placeholder for transform.pipeline in MVP; full implementation deferred to E9

## Out of Scope

- Run mode renderers for guest-facing experience (Epic E5)
- Event-experience assignment and linking (Epic E3)
- Session creation and runtime engine (Epic E5)
- Photo capture implementation in run mode (Epic E5)
- Transform pipeline full implementation (Epic E9)
- Undo/redo functionality
- Duplicate step action
- Step templates/presets
- Collaborative editing / concurrent user handling beyond last-write-wins

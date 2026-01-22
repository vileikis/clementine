# Feature Specification: Transform Pipeline Creator Config UI

**Feature Branch**: `039-transform-config-ui`
**Created**: 2026-01-22
**Status**: Draft
**Input**: User description: "Phase 3 of Transform Pipeline PRD - Enable admins to configure transform pipeline in experience designer with node management, variable mappings, and basic node configuration"

## Clarifications

### Session 2026-01-22

- Q: Where should the node configuration panel appear in the UI? → A: Right panel (same location as step config) - reuse existing config panel area

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Transform Tab to Experience Designer (Priority: P1)

Experience creators need a dedicated place within the experience designer to configure transform pipelines. The transform configuration should be accessible alongside the existing step list, allowing creators to easily switch between managing steps and configuring the transform pipeline.

**Why this priority**: This is the foundational UI that enables all other transform configuration functionality. Without a visible entry point, creators cannot access any transform features.

**Independent Test**: Can be fully tested by opening the experience designer and verifying the Transform tab appears alongside the Steps tab in the left panel, and clicking between tabs shows the appropriate content.

**Acceptance Scenarios**:

1. **Given** an experience designer is open, **When** the creator views the left panel, **Then** they see both a "Steps" tab and a "Transform" tab in the panel header.
2. **Given** the creator is on the Steps tab, **When** they click the Transform tab, **Then** the panel content switches to show transform configuration options.
3. **Given** the experience has no transform configured yet, **When** the creator views the Transform tab, **Then** they see an empty state with guidance to add their first node.

---

### User Story 2 - Manage Transform Nodes (Priority: P1)

Experience creators need to add, remove, and reorder transform nodes to build their image processing pipeline. Each node represents a transformation operation (Cut Out, Combine, Background Swap, AI Image) that will be applied to guest photos.

**Why this priority**: The core value of the transform system is the ability to chain processing nodes. Without node management, the transform feature has no functionality.

**Independent Test**: Can be fully tested by adding nodes of each type, removing nodes, and reordering them via drag-and-drop, then verifying the changes persist after page reload.

**Acceptance Scenarios**:

1. **Given** the creator is on the Transform tab, **When** they click "Add Node", **Then** they see a dialog/menu with available node types: Cut Out, Combine, Background Swap, AI Image.
2. **Given** a node type is selected, **When** the creator confirms the selection, **Then** a new node is added to the pipeline and appears in the node list with its display name and icon.
3. **Given** multiple nodes exist in the pipeline, **When** the creator drags a node to a new position, **Then** the node order updates and the new order persists.
4. **Given** a node exists in the pipeline, **When** the creator clicks the delete action for that node, **Then** the node is removed from the pipeline.
5. **Given** nodes have been added/removed/reordered, **When** the experience is reloaded, **Then** the transform configuration reflects the saved state.

---

### User Story 3 - Configure Variable Mappings (Priority: P1)

Experience creators need to define variable mappings that connect step data (answers and captured media) to the transform pipeline. These mappings allow nodes to reference guest input data using variable names.

**Why this priority**: Variable mappings are the bridge between guest-provided data and the transform pipeline. Without them, nodes cannot access the photos or answers that make the transform personalized.

**Independent Test**: Can be fully tested by adding a variable mapping, selecting a step and data type, saving, and verifying the mapping appears in the mappings list and persists after reload.

**Acceptance Scenarios**:

1. **Given** the creator is in the Transform configuration, **When** they view the Variables section, **Then** they see a list of defined variable mappings (empty if none exist).
2. **Given** no variable mappings exist, **When** the creator clicks "Add Variable", **Then** they see a form to define a variable with: name, source step, data type (answer or capturedMedia), and optional default value.
3. **Given** the creator is adding a variable, **When** they select a source step, **Then** only steps that exist before the transform phase are available for selection.
4. **Given** a variable mapping is defined, **When** the creator saves the experience draft, **Then** the variable mapping is stored in `experience.draft.transform.variableMappings`.
5. **Given** variable mappings exist, **When** the creator edits a mapping, **Then** they can change the variable name, source step, or default value.
6. **Given** a variable mapping exists, **When** the creator deletes it, **Then** the mapping is removed from the list.

---

### User Story 4 - Configure Basic Node Settings (Priority: P2)

Experience creators need to configure basic settings for each node type. For the MVP, this includes selecting input sources and configuring type-specific options. Full configuration editors (like rich prompt editing for AI Image nodes) will be implemented in later phases.

**Why this priority**: While node management gets the structure in place, basic configuration is needed for nodes to function. This is foundational for later phases but not blocking the core node management workflow.

**Independent Test**: Can be fully tested by selecting a node, viewing its configuration panel, changing settings (like input source), and verifying changes persist.

**Acceptance Scenarios**:

1. **Given** a node exists in the pipeline, **When** the creator selects/clicks on the node, **Then** the right panel (same location as step configuration) displays node-specific settings.
2. **Given** any node is selected, **When** viewing its configuration, **Then** the creator can select the input source (Variable, Previous Node, or Specific Node).
3. **Given** a Remove Background (Cut Out) node is selected, **When** viewing its configuration, **Then** the creator can choose the mode (Keep Subject or Keep Background).
4. **Given** a Composite (Combine) node is selected, **When** viewing its configuration, **Then** the creator sees a placeholder indicating layer configuration will be available in a future phase.
5. **Given** a Background Swap node is selected, **When** viewing its configuration, **Then** the creator can select the background source type (Asset or Node Output).
6. **Given** an AI Image node is selected, **When** viewing its configuration, **Then** the creator sees a simple text field for the prompt template (rich editor in Phase 5).
7. **Given** node configuration has been changed, **When** the experience draft is saved, **Then** the node configuration persists in `experience.draft.transform.nodes`.

---

### User Story 5 - Visual Node List with Display Names (Priority: P2)

Experience creators should see user-friendly display names and icons for each node type, making the pipeline easy to understand at a glance without needing to know technical node type identifiers.

**Why this priority**: Good UX improves adoption and reduces errors. Display names are specified in the technical spec and should be implemented for clarity.

**Independent Test**: Can be fully tested by adding each node type and verifying the correct display name and icon appears.

**Acceptance Scenarios**:

1. **Given** a removeBackground node is added, **When** it appears in the node list, **Then** it displays as "Cut Out" with a scissors icon.
2. **Given** a composite node is added, **When** it appears in the node list, **Then** it displays as "Combine" with a layers/squares icon.
3. **Given** a backgroundSwap node is added, **When** it appears in the node list, **Then** it displays as "Background Swap" with an image/frame icon.
4. **Given** an aiImage node is added, **When** it appears in the node list, **Then** it displays as "AI Image" with a sparkles icon.

---

### Edge Cases

- What happens when a step referenced by a variable mapping is deleted? The variable mapping becomes invalid and should be flagged visually (warning indicator). Publish validation (Phase 8) will block publishing until fixed.
- What happens when there are no steps in the experience? The Variables section should show a message indicating steps must be added first.
- What happens when the first node needs input but no variables are defined? The input source selector should show available options but validation warnings guide the creator.
- How does the system handle concurrent editing? Same as step editing - last write wins with optimistic UI updates.
- What happens if the creator tries to add more than the maximum number of nodes? The system should allow reasonable pipeline lengths (10+ nodes) without artificial limits for MVP.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a "Transform" tab alongside the "Steps" tab in the experience designer left panel.
- **FR-002**: System MUST allow creators to add nodes of types: Remove Background (Cut Out), Composite (Combine), Background Swap, and AI Image.
- **FR-003**: System MUST allow creators to remove any node from the pipeline.
- **FR-004**: System MUST allow creators to reorder nodes via drag-and-drop interaction.
- **FR-005**: System MUST allow creators to define variable mappings with name, source step, data type, and optional default value.
- **FR-006**: System MUST restrict variable mapping source step selection to steps that exist before the transform phase.
- **FR-007**: System MUST allow creators to edit and delete existing variable mappings.
- **FR-008**: System MUST display nodes with user-friendly display names and icons (Cut Out, Combine, Background Swap, AI Image).
- **FR-009**: System MUST persist transform configuration to `experience.draft.transform` on save.
- **FR-010**: System MUST show node configuration in the right panel (same location as step configuration) when a node is selected, displaying type-appropriate settings.
- **FR-011**: System MUST allow configuration of node input source (Variable, Previous Node, Specific Node).
- **FR-012**: System MUST allow configuration of Remove Background node mode (keepSubject, keepBackground).
- **FR-013**: System MUST allow configuration of Background Swap node background source type (Asset, Node Output).
- **FR-014**: System MUST allow configuration of AI Image node prompt template (basic text input for MVP).
- **FR-015**: System MUST show an empty state with guidance when no nodes are configured.
- **FR-016**: System MUST visually indicate when a variable mapping references a deleted or invalid step.

### Key Entities

- **TransformConfig**: The complete transform configuration containing variable mappings, nodes array, and output format. Stored in `experience.draft.transform`.
- **TransformNode**: An individual processing operation in the pipeline. Has an ID, type, input source configuration, and type-specific settings.
- **VariableMapping**: Maps a variable name to a step's data. Contains variable name, step ID, data type (answer or capturedMedia), and optional default value.
- **NodeInputSource**: Specifies where a node gets its input from - either a variable, the previous node's output, or a specific node's output.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can add a new transform node in under 10 seconds (click Transform tab, click Add Node, select type, confirm).
- **SC-002**: Creators can configure a basic 3-node pipeline (capture variable mapping, remove background, AI image) in under 5 minutes on first use.
- **SC-003**: 100% of node operations (add, delete, reorder) persist correctly after page reload.
- **SC-004**: 100% of variable mapping operations (add, edit, delete) persist correctly after page reload.
- **SC-005**: All four MVP node types are accessible and configurable from the UI.
- **SC-006**: Node display names and icons match the specification (Cut Out, Combine, Background Swap, AI Image).
- **SC-007**: Creators complete the transform configuration workflow without encountering blocking errors or unexpected behaviors.

## Assumptions

- The experience designer already exists with a functioning step list in the left panel (confirmed via codebase review).
- The transform schema and types from Phase 1 are available in the shared package.
- Standard drag-and-drop patterns using @dnd-kit are acceptable for node reordering.
- The existing debounced save mechanism used for step configuration will work for transform configuration.
- Mobile/tablet responsive behavior will follow the existing patterns (sheets for collapsed panels).
- Rich prompt editing with variable insertion will be implemented in Phase 5 (AI Image Node), not this phase.
- Layer configuration for Composite nodes will be implemented in Phase 6, not this phase.
- Validation errors and publish-time validation will be implemented in Phase 8.

## Dependencies

- **Phase 1 (Completed)**: Transform schema definitions in shared package.
- **Existing**: Experience designer infrastructure (ExperienceDesignerPage, StepList, etc.).
- **Existing**: Mutation hooks for updating experience drafts.
- **Existing**: @dnd-kit library for drag-and-drop.

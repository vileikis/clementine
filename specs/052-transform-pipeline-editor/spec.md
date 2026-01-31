# Feature Specification: Transform Pipeline Editor

**Feature Branch**: `052-transform-pipeline-editor`
**Created**: 2026-01-31
**Status**: Draft
**Input**: User description: "phase 1b-2 from '/Users/iggyvileikis/Projects/@attempt-n2/transfomr-nodes-crud/requirements/inline-prompt-arch-v2/plan.md'"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage AI Image Nodes (Priority: P1)

As an experience creator, I want to add, view, and delete AI Image nodes in my transform pipeline so that I can configure AI-generated outputs for my experience.

**Why this priority**: This is the foundational capability - users cannot configure AI transformations without the ability to manage nodes. Without this, the entire transform pipeline feature is non-functional.

**Independent Test**: Can be fully tested by creating a new experience, navigating to the transform pipeline editor, adding an AI Image node, viewing the node card with its summary, and deleting the node. Delivers the core CRUD operations for transform nodes.

**Acceptance Scenarios**:

1. **Given** I am viewing an empty transform pipeline, **When** I click "Add Node", **Then** a new AI Image node is created with default settings and appears in the node list
2. **Given** I have added an AI Image node, **When** I view the node card, **Then** I see a summary showing the model name, aspect ratio, and a preview of the prompt
3. **Given** I have an AI Image node in the pipeline, **When** I click the delete button and confirm deletion, **Then** the node is removed from the pipeline and no longer appears in the list
4. **Given** I am viewing an empty pipeline, **When** I view the editor, **Then** I see an empty state with an "Add Node" button

---

### User Story 2 - Configure Node Settings (Priority: P2)

As an experience creator, I want to select a node to open its editor panel so that I can configure detailed settings like model, aspect ratio, prompt, and reference media.

**Why this priority**: After being able to create nodes, users need to configure them. This provides the interface structure for detailed configuration, though individual configuration features are implemented in subsequent phases.

**Independent Test**: Can be tested by adding a node, clicking on the node card, and verifying that an editor panel opens with placeholder sections for Model Settings, Prompt, RefMedia, and Test Run. Delivers the navigation and panel structure needed for configuration.

**Acceptance Scenarios**:

1. **Given** I have an AI Image node in the pipeline, **When** I click on the node card, **Then** the node editor panel opens in a sidebar
2. **Given** the node editor panel is open, **When** I view the panel, **Then** I see placeholder sections for Model Settings, Prompt, RefMedia, and Test Run
3. **Given** the node editor panel is open, **When** I click the close button, **Then** the panel closes and I return to the node list view

---

### User Story 3 - Persist Transform Configuration (Priority: P3)

As an experience creator, I want my transform pipeline changes to be automatically saved so that I don't lose my work when navigating away or refreshing the page.

**Why this priority**: While important for user experience, auto-save is less critical than the core CRUD and configuration interfaces. Users can still create and configure nodes without auto-save, though they would need manual save actions.

**Independent Test**: Can be tested by adding a node, making changes, waiting for the debounce period, and verifying that the transform config is persisted to the experience draft in the database. Delivers data persistence that ensures work is not lost.

**Acceptance Scenarios**:

1. **Given** I have made changes to the transform pipeline, **When** 2 seconds have elapsed after my last change, **Then** the changes are automatically saved to the experience draft
2. **Given** changes are being saved, **When** I view the save status indicator, **Then** I see "Saving..." during the save and "Saved" when complete
3. **Given** I have saved changes and navigate away, **When** I return to the transform pipeline editor, **Then** I see all my previously configured nodes

---

### Edge Cases

- What happens when a user tries to delete the only node in the pipeline?
  - Deletion should proceed normally, returning to the empty state
- What happens if auto-save fails due to network issues?
  - Show an error status indicator and retry on next change
- What happens when a user clicks multiple node cards in rapid succession?
  - Only the most recently clicked node's editor panel should be displayed
- What happens if a user navigates away while changes are being saved?
  - The save operation should complete in the background before navigation

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a list or canvas view of all AI Image nodes in the transform pipeline
- **FR-002**: System MUST provide an "Add Node" button that creates a new AI Image node with default configuration (model: gemini-2.5-pro, aspectRatio: 3:2)
- **FR-003**: System MUST auto-generate a unique node ID when creating a new node
- **FR-004**: System MUST display a node card for each AI Image node showing model name, aspect ratio, and prompt preview (first 50 characters)
- **FR-005**: System MUST provide a delete button on each node card (visible on hover)
- **FR-006**: System MUST show a confirmation dialog when the user attempts to delete a node
- **FR-007**: System MUST remove the node from the transform config when deletion is confirmed
- **FR-008**: System MUST display an empty state with "Add Node" button when the pipeline contains no nodes
- **FR-009**: System MUST open a node editor panel in a sidebar when a node card is clicked
- **FR-010**: Node editor panel MUST include placeholder sections for Model Settings, Prompt, RefMedia, and Test Run
- **FR-011**: Node editor panel MUST provide a close button to dismiss the panel
- **FR-012**: System MUST auto-save changes to the transform config after 2000ms of inactivity
- **FR-013**: System MUST display a save status indicator showing "Saving...", "Saved", or error states
- **FR-014**: System MUST persist transform config to `experience.draft.transform` in the database
- **FR-015**: System MUST display a node type badge showing "AI Image Generation" on each node card

### Key Entities

- **AI Image Node**: Represents a single AI image generation transformation in the pipeline. Contains configuration for model selection, aspect ratio, prompt template, and reference media. Each node has a unique ID and maintains its own configuration state.

- **Transform Config**: The container for all transformation nodes in an experience. Stored as part of the experience draft and contains an array of AI Image nodes. This is the root data structure that gets persisted to the database.

- **Node Editor State**: Manages which node is currently selected for editing in the sidebar panel. Maintains a reference to the selected node ID and controls the visibility of the editor panel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Experience creators can add a new AI Image node to their transform pipeline in under 5 seconds
- **SC-002**: All node configuration changes are automatically saved within 2 seconds of the last user action
- **SC-003**: Node cards display sufficient information (model, aspect ratio, prompt preview) for users to identify nodes without opening the editor panel
- **SC-004**: Users can navigate between multiple nodes' configurations without data loss or UI lag
- **SC-005**: The empty state clearly guides new users to add their first node, with 90% of users successfully adding a node without additional help
- **SC-006**: Transform configuration persists reliably across page refreshes and navigation events with 100% data integrity

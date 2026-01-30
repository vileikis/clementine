# Feature Specification: Experience Designer Tabs - Collect and Generate

**Feature Branch**: `050-exp-designer-tabs`
**Created**: 2026-01-30
**Status**: Draft
**Input**: User description: "Update experience routes and navigation with Collect and Generate tabs. Add two tabs (Collect and Generate) to ExperienceDesignerLayout. Create routes: /workspace/[slug]/experiences/[expId]/collect?step={stepId} for steps management and /workspace/[slug]/experiences/[expId]/generate for transform pipeline management. Generate tab renders WIP page for now. Remove AI transform step support from backend (functions/src/services/media-pipeline/ai-transform-step.ts) as it's superseded by the transform field in experienceConfigSchema."

## User Scenarios & Testing

### User Story 1 - Navigate Between Collect and Generate Tabs (Priority: P1)

Experience creators need to switch between managing data collection steps and configuring AI transformation settings within a single experience. This provides a clear mental model separating "what we collect" from "how we transform it".

**Why this priority**: Core navigation structure that enables all other functionality. Without this, users cannot access the generate workflow.

**Independent Test**: Can be fully tested by navigating to an experience and clicking between the Collect and Generate tabs. Delivers a complete tab navigation experience with URL updates.

**Acceptance Scenarios**:

1. **Given** I am viewing an experience designer, **When** I click the "Collect" tab, **Then** I am navigated to `/workspace/{slug}/experiences/{expId}/collect` and the tab is visually highlighted as active
2. **Given** I am on the Collect tab, **When** I click the "Generate" tab, **Then** I am navigated to `/workspace/{slug}/experiences/{expId}/generate` and the Generate tab becomes active
3. **Given** I am viewing a specific step in the Collect tab with URL `/workspace/{slug}/experiences/{expId}/collect?step={stepId}`, **When** I navigate to Generate and back to Collect, **Then** I return to the same step selection state
4. **Given** I navigate directly to `/workspace/{slug}/experiences/{expId}` (no tab suffix), **When** the page loads, **Then** I am automatically redirected to the Collect tab

---

### User Story 2 - Manage Steps in Collect Tab (Priority: P1)

Experience creators need to add, edit, reorder, and configure data collection steps (info, input, capture) in a dedicated workspace. The Collect tab preserves all existing step management functionality with step-specific URL deep linking.

**Why this priority**: This is the existing core functionality that must continue working. Users rely on this daily to build experiences.

**Independent Test**: Can be fully tested by accessing the Collect tab and performing step operations (add, delete, reorder, edit config). Delivers complete step management without requiring the Generate tab.

**Acceptance Scenarios**:

1. **Given** I am on the Collect tab, **When** I add a new step, **Then** the step appears in the step list and the URL updates to `?step={newStepId}`
2. **Given** I am viewing a step with URL `/workspace/{slug}/experiences/{expId}/collect?step={stepId}`, **When** I refresh the page, **Then** the same step remains selected in the step preview and config panel
3. **Given** I am on the Collect tab, **When** I reorder steps via drag-and-drop, **Then** the changes save immediately and the step order persists
4. **Given** I am editing a step configuration, **When** I make changes, **Then** the changes are saved with a 2-second debounce and save status indicators update
5. **Given** I click a step in the step list, **When** the selection changes, **Then** the URL updates to include the new step ID as a query parameter

---

### User Story 3 - View Generate Tab Placeholder (Priority: P2)

Experience creators need to access the Generate tab to understand where future AI transformation configuration will happen. For now, this tab shows a work-in-progress message indicating future functionality.

**Why this priority**: Sets up the structure for future transform pipeline work. Not critical for current functionality but prevents confusion about where this feature will live.

**Independent Test**: Can be fully tested by navigating to the Generate tab and verifying the WIP message displays correctly. Delivers a complete placeholder experience.

**Acceptance Scenarios**:

1. **Given** I am on the Collect tab, **When** I click the Generate tab, **Then** I see a placeholder page with a message indicating this feature is coming soon
2. **Given** I navigate directly to `/workspace/{slug}/experiences/{expId}/generate`, **When** the page loads, **Then** I see the WIP placeholder content
3. **Given** I am on the Generate tab, **When** I observe the TopNavBar, **Then** I see the same experience breadcrumbs, save status, changes badge, and publish button as in the Collect tab

---

### User Story 4 - Preserve Experience-Level Actions Across Tabs (Priority: P1)

Experience creators need access to experience-level actions (preview, publish, save status, experience details) regardless of which tab they are viewing. These actions apply to the entire experience, not individual tabs.

**Why this priority**: Critical for maintaining existing workflows. Users need to publish, preview, and track save status while working in either tab.

**Independent Test**: Can be fully tested by switching tabs and verifying all TopNavBar actions remain available and functional. Delivers consistent cross-tab functionality.

**Acceptance Scenarios**:

1. **Given** I am on the Collect tab, **When** I click the Preview button, **Then** the experience preview modal opens showing all configured steps
2. **Given** I am on the Generate tab, **When** I click the Publish button, **Then** the experience publishes and I see a success toast notification
3. **Given** I make changes in the Collect tab, **When** I switch to the Generate tab, **Then** the save status indicators (pending saves, changes badge) reflect the same state
4. **Given** I am on either tab, **When** I click the experience identity badge, **Then** the experience details dialog opens allowing me to edit the experience name and metadata

---

### Edge Cases

- What happens when a user navigates to `/workspace/{slug}/experiences/{expId}/collect?step=invalid-id`? System should gracefully handle invalid step IDs by showing no step selected or redirecting to the first step.
- What happens when a user bookmarks `/workspace/{slug}/experiences/{expId}/generate` and the route structure changes in the future? The route should remain stable or implement proper redirects.
- How does the system handle navigation when there are unsaved changes in the Collect tab and the user switches to Generate? Save status indicators should accurately reflect pending saves across tab switches.
- What happens when a user uses browser back/forward buttons after switching between tabs? Browser history should work correctly, navigating between tab URLs.
- How does the system handle concurrent edits if a user has the same experience open in multiple tabs? This is an existing edge case not specific to tabs, but worth documenting.

## Requirements

### Functional Requirements

#### Navigation & Routing

- **FR-001**: System MUST provide two tabs in the experience designer: "Collect" and "Generate"
- **FR-002**: System MUST support route `/workspace/{workspaceSlug}/experiences/{experienceId}/collect` for the Collect tab
- **FR-003**: System MUST support route `/workspace/{workspaceSlug}/experiences/{experienceId}/generate` for the Generate tab
- **FR-004**: Collect tab MUST support query parameter `?step={stepId}` for deep linking to specific steps
- **FR-005**: System MUST visually indicate which tab is currently active
- **FR-006**: System MUST preserve step selection query parameters when navigating between tabs
- **FR-007**: System MUST redirect `/workspace/{workspaceSlug}/experiences/{experienceId}` to the Collect tab by default

#### Collect Tab Functionality

- **FR-008**: Collect tab MUST display the existing 3-column layout (step list, step preview, step config panel)
- **FR-009**: Collect tab MUST support all existing step management operations (add, delete, reorder, rename, configure)
- **FR-010**: Collect tab MUST maintain URL synchronization with selected step ID
- **FR-011**: Collect tab MUST preserve all existing save behaviors (immediate saves for list operations, debounced saves for config edits)
- **FR-012**: Collect tab MUST support all existing responsive behaviors (mobile sheets, tablet layouts)

#### Generate Tab Functionality

- **FR-013**: Generate tab MUST display a work-in-progress placeholder page indicating future functionality
- **FR-014**: Generate tab placeholder MUST include a clear message about future transform pipeline configuration
- **FR-015**: Generate tab MUST share the same TopNavBar layout as the Collect tab

#### Experience-Level Actions

- **FR-016**: Both tabs MUST display the same TopNavBar with experience breadcrumbs, save status, changes badge, preview button, and publish button
- **FR-017**: Preview button MUST open the experience preview modal showing all configured steps regardless of current tab
- **FR-018**: Publish button MUST publish the entire experience (both collect steps and transform config) regardless of current tab
- **FR-019**: Save status indicators MUST reflect the same state across both tabs
- **FR-020**: Experience identity badge MUST be clickable from both tabs and open the experience details dialog

#### Backend Cleanup

- **FR-021**: System MUST remove AI transform step implementation from backend media pipeline (`functions/src/services/media-pipeline/ai-transform-step.ts`)
- **FR-022**: System MUST remove all references to AI transform step type from step schemas and registries
- **FR-023**: System MUST remove AI transform step configuration panels from the frontend
- **FR-024**: System MUST update any validation logic that references AI transform steps

### Key Entities

- **Experience Designer Route**: Represents the top-level experience designer route that now branches into Collect and Generate tabs. Contains tab configuration (id, label, to path).
- **Tab State**: Represents which tab is currently active (Collect or Generate) and is synchronized with the URL path.
- **Step Selection State**: Represents the currently selected step ID in the Collect tab, synchronized with the `?step={stepId}` query parameter.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can navigate between Collect and Generate tabs in under 1 second with visual feedback confirming the active tab
- **SC-002**: All existing step management workflows complete successfully in the Collect tab with identical functionality to the current experience designer
- **SC-003**: 100% of experience-level actions (preview, publish, save status) remain accessible and functional from both tabs
- **SC-004**: Step selection via URL deep linking works correctly, with selected step preserved across tab navigation and page refreshes
- **SC-005**: Browser back/forward navigation works correctly when switching between tabs and step selections
- **SC-006**: Backend successfully deploys without AI transform step code, with no errors or references to removed functionality

## Assumptions

1. **Tab Structure**: Following the same pattern as ProjectConfigDesignerLayout with tabs defined in the layout component and passed to TopNavBar
2. **Default Tab**: The Collect tab is the primary/default tab since it contains existing functionality users rely on daily
3. **Generate Placeholder**: A simple "Coming Soon" or "Work in Progress" message is sufficient for the Generate tab placeholder
4. **AI Transform Step Removal**: All AI transform step code can be safely removed as it has been fully superseded by the transform pipeline approach
5. **Route Migration**: Existing bookmarks and links to `/workspace/{slug}/experiences/{expId}` can be redirected to the Collect tab without user confusion
6. **Tab Independence**: Each tab will eventually have its own page component (CollectPage and GeneratePage) following the pattern in project config designer
7. **Save State Sharing**: Save state from the experience designer store is shared across tabs since they operate on the same experience document
8. **Mobile Responsiveness**: The Generate tab placeholder will use the same responsive layout pattern as other designer pages

## Out of Scope

- Implementation of actual Generate tab functionality (transform pipeline configuration UI)
- Migration of existing transform configuration to the new Generate tab interface
- Changes to experience validation logic related to transform pipelines
- Updates to the experience preview to support transform pipeline visualization
- Documentation or migration guides for users transitioning from AI transform steps to transform pipelines
- Changes to backend transform processing logic (only removing deprecated AI transform step)

# Feature Specification: Step List Styling Updates

**Feature Branch**: `001-step-list-styling`
**Created**: 2026-01-20
**Status**: Draft
**Input**: User description: "Update StepList, StepListItem, and AddStepDialog styling and behavior with category-based colors, rounded icon wrappers, remove drag handles, and cursor pointer on hover with drag interaction"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visual Category Identification in Step List (Priority: P1)

As an experience designer, I want each step in the step list to display a colored icon wrapper that indicates the step's category, so I can quickly identify step types at a glance.

**Why this priority**: Visual category identification is the core value of this feature - it enables faster comprehension of experience structure and step types. Without this, the other changes have less impact.

**Independent Test**: Can be fully tested by viewing a step list containing multiple step categories and verifying each displays the correct colored background behind its icon.

**Acceptance Scenarios**:

1. **Given** a step list with an Information step, **When** viewing the step list, **Then** the Information step icon displays within a grey/muted rounded wrapper
2. **Given** a step list with an Input step (scale, yes/no, multi-select, short text, long text), **When** viewing the step list, **Then** the Input step icon displays within a blue (info color token) rounded wrapper
3. **Given** a step list with a Capture step (photo capture), **When** viewing the step list, **Then** the Capture step icon displays within a green (success color token) rounded wrapper
4. **Given** a step list with a Transform step (AI pipeline), **When** viewing the step list, **Then** the Transform step icon displays within a red (destructive color token) rounded wrapper
5. **Given** both light and dark mode themes, **When** viewing step icons with colored wrappers, **Then** the colors adapt appropriately using the design system's theme tokens

---

### User Story 2 - Visual Category Identification in Add Step Dialog (Priority: P1)

As an experience designer, I want step type options in the Add Step dialog to display colored icon wrappers matching their category, so I can visually connect available step types with their categories.

**Why this priority**: The Add Step dialog is where users discover and select step types. Consistent visual language with the step list creates a cohesive user experience.

**Independent Test**: Can be fully tested by opening the Add Step dialog and verifying each step type button displays the correct category-colored icon wrapper.

**Acceptance Scenarios**:

1. **Given** the Add Step dialog is open, **When** viewing Information category steps, **Then** step type buttons show icons with grey/muted rounded wrappers
2. **Given** the Add Step dialog is open, **When** viewing Input category steps, **Then** step type buttons show icons with blue (info) rounded wrappers
3. **Given** the Add Step dialog is open, **When** viewing Capture category steps, **Then** step type buttons show icons with green (success) rounded wrappers
4. **Given** the Add Step dialog is open, **When** viewing Transform category steps, **Then** step type buttons show icons with red (destructive) rounded wrappers

---

### User Story 3 - Simplified Drag Interaction (Priority: P2)

As an experience designer, I want to drag steps to reorder them by clicking anywhere on the step item (with cursor pointer feedback), so I can reorder steps more intuitively without needing to locate a specific drag handle.

**Why this priority**: Improves usability by making the entire step item draggable, reducing cognitive load. This is an enhancement to existing functionality rather than core visual identity.

**Independent Test**: Can be fully tested by hovering over a step item (verifying pointer cursor), then dragging it to a new position in the list.

**Acceptance Scenarios**:

1. **Given** a step list with multiple steps, **When** hovering over a step item, **Then** the cursor changes to pointer to indicate interactivity
2. **Given** a step list with multiple steps, **When** clicking and dragging a step item, **Then** the step can be dragged to reorder without needing to target a specific drag handle
3. **Given** a step list with a visible drag handle (GripVertical icon), **When** viewing the step list after update, **Then** the dedicated drag handle is no longer visible
4. **Given** a step is being dragged, **When** the drag operation is in progress, **Then** appropriate visual feedback indicates the dragging state (opacity change, cursor: grabbing)

---

### Edge Cases

- What happens when viewing the step list with a step type that has an unknown/unregistered category? (Fallback to muted/grey color)
- How does the system handle rapid dragging and dropping of multiple steps? (Existing dnd-kit behavior preserved)
- What happens when the step list is in disabled state? (No pointer cursor, no drag interaction)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display step icons within rounded colored wrappers in the step list
- **FR-002**: System MUST use the `muted` design token (grey) for Information category step icons
- **FR-003**: System MUST use the `info` design token (blue) for Input category step icons
- **FR-004**: System MUST use the `success` design token (green) for Capture category step icons
- **FR-005**: System MUST use the `destructive` design token (red) for Transform category step icons
- **FR-006**: System MUST display step type icons with rounded colored wrappers in the Add Step dialog
- **FR-007**: System MUST remove the visible drag handle (GripVertical icon) from step list items
- **FR-008**: System MUST enable drag-to-reorder from anywhere on the step item
- **FR-009**: System MUST display pointer cursor on step item hover (when not disabled)
- **FR-010**: System MUST display grabbing cursor during active drag operations
- **FR-011**: System MUST use opacity modifiers on color tokens for subtle icon wrapper backgrounds (e.g., `bg-info/10` or `bg-info/20`)
- **FR-012**: System MUST maintain proper color contrast using the appropriate foreground tokens for icons

### Key Entities

- **Step**: Has a `type` property that maps to a `StepDefinition`
- **StepDefinition**: Contains `category` (info, input, capture, transform) that determines the color
- **StepCategory**: Enum defining the four categories: info, input, capture, transform

### Category-to-Color Mapping

| Category  | Color Token | Usage                                    |
| --------- | ----------- | ---------------------------------------- |
| info      | muted       | Grey - Information/display steps         |
| input     | info        | Blue - User input collection steps       |
| capture   | success     | Green - Media capture steps              |
| transform | destructive | Red - AI/processing transformation steps |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can visually distinguish step categories in the step list within 1 second of viewing
- **SC-002**: Color-coded icons in the Add Step dialog match the corresponding step list icons 100% of the time
- **SC-003**: Users can successfully reorder steps by dragging from any point on the step item
- **SC-004**: All color implementations use design system tokens (no hard-coded colors)
- **SC-005**: Feature works correctly in both light and dark mode themes
- **SC-006**: Step list maintains existing accessibility features (keyboard navigation, ARIA attributes)

## Assumptions

- The existing design tokens (`muted`, `info`, `success`, `destructive`) and their foreground variants are available and appropriate for the intended visual hierarchy
- Opacity modifiers (e.g., `/10`, `/20`) on color tokens provide sufficient contrast in both light and dark modes
- The dnd-kit library supports enabling drag from the entire element rather than just a drag handle
- Removing the visible drag handle will not negatively impact discoverability, as the pointer cursor provides sufficient affordance

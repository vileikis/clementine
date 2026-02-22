# Feature Specification: Project UX & Actions

**Feature Branch**: `076-project-ux-actions`
**Created**: 2026-02-22
**Status**: Draft
**Input**: Improve project UX and actions — add inline rename in designer, duplicate project, and fully clickable/hoverable list items

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rename project from designer (Priority: P1)

A creator is working inside the project designer and realizes the project name has a typo or needs updating. Instead of navigating back to the project list to rename it, they click the project name in the top navigation bar. A pencil icon appears on hover, signaling the name is editable. Clicking opens a rename dialog where they type the new name and save. The name updates immediately in the navigation bar.

**Why this priority**: Renaming is the most frequent project management action. Forcing users to leave the designer to rename breaks flow and wastes time. This directly mirrors the existing experience designer pattern, creating consistency across the platform.

**Independent Test**: Can be tested by opening any project in the designer, clicking the project name in the top bar, entering a new name, and confirming the name persists after refresh.

**Acceptance Scenarios**:

1. **Given** a creator is on the project designer page, **When** they hover over the project name in the top navigation, **Then** a pencil icon appears indicating the name is editable
2. **Given** a creator clicks the project name badge, **When** the rename dialog opens, **Then** it is pre-filled with the current project name and the input is focused
3. **Given** a creator enters a valid new name and submits, **When** the save completes, **Then** the project name updates in the navigation bar and a success confirmation is shown
4. **Given** a creator enters an empty name or whitespace only, **When** they attempt to save, **Then** a validation error is shown and the save is prevented
5. **Given** a creator opens the rename dialog, **When** they cancel or close the dialog, **Then** no changes are made

---

### User Story 2 - Duplicate project from project list (Priority: P1)

A creator wants to create a new project based on an existing one. From the project list, they open the context menu on a project card and select "Duplicate." The system creates a copy named "Copy of {original name}" and it appears in the project list. A confirmation toast is shown.

**Why this priority**: Duplication saves significant setup time. Creators frequently reuse project configurations for similar events. This is a high-value action that experiences already support but projects lack.

**Independent Test**: Can be tested by navigating to the project list, opening the context menu on any project, selecting "Duplicate," and verifying a new project appears with the copied name.

**Acceptance Scenarios**:

1. **Given** a creator is on the project list page, **When** they open the context menu on a project, **Then** they see Rename, Duplicate, and Delete actions
2. **Given** a creator selects "Duplicate" from the context menu, **When** the duplication completes, **Then** a new project appears in the list named "Copy of {original name}" and a success toast is shown
3. **Given** a duplication is in progress, **When** the creator views the context menu, **Then** the Duplicate action is disabled to prevent double-submission
4. **Given** the duplication fails (e.g., network error), **When** the error occurs, **Then** an error toast is shown and no partial project is created
5. **Given** the duplicated project, **When** the creator opens it, **Then** it contains the same configuration (draft settings, theme, etc.) as the original

---

### User Story 3 - Fully clickable project cards (Priority: P2)

A creator is browsing their project list. They click anywhere on a project card — not just the project name — and are navigated to that project's designer. The card shows a subtle hover effect when the mouse enters, providing clear visual feedback that the entire card is interactive.

**Why this priority**: Clickable cards are a usability improvement that reduces misclicks and makes the interface feel more responsive. It is lower priority than functional features (rename, duplicate) but improves daily interaction quality.

**Independent Test**: Can be tested by hovering over any project card to verify visual feedback, clicking anywhere on the card body to verify navigation, and clicking the context menu to verify it does not trigger navigation.

**Acceptance Scenarios**:

1. **Given** a creator hovers over a project card, **When** the cursor enters the card, **Then** the card shows a visual hover effect (background or border change)
2. **Given** a creator clicks anywhere on the card body (outside the context menu), **When** the click occurs, **Then** they are navigated to the project designer
3. **Given** a creator clicks the context menu button on the card, **When** the click occurs, **Then** the menu opens without triggering navigation
4. **Given** a creator navigates via keyboard, **When** they focus a project card and press Enter or Space, **Then** they are navigated to the project designer

---

### User Story 4 - Fully clickable experience cards (Priority: P2)

A creator is browsing the experience library. The same clickable card behavior from project cards is applied: the entire card is a click target with hover feedback, and the context menu remains independently interactive.

**Why this priority**: Same priority as project cards — this ensures consistent behavior across both list views. Implementing both together avoids UX inconsistency.

**Independent Test**: Can be tested by hovering and clicking experience cards in the experience library, verifying navigation and hover feedback match the project card behavior.

**Acceptance Scenarios**:

1. **Given** a creator hovers over an experience card, **When** the cursor enters the card, **Then** the card shows a visual hover effect consistent with project cards
2. **Given** a creator clicks anywhere on the experience card body (outside the context menu), **When** the click occurs, **Then** they are navigated to the experience designer
3. **Given** a creator clicks the context menu button on the experience card, **When** the click occurs, **Then** the menu opens without triggering navigation
4. **Given** a creator navigates via keyboard, **When** they focus an experience card and press Enter or Space, **Then** they are navigated to the experience designer

---

### Edge Cases

- What happens when a creator renames a project to a name that already exists? The system allows it — project names are not unique identifiers.
- What happens when the creator duplicates a project whose name already starts with "Copy of"? The duplicate is named "Copy of Copy of {name}" — no special logic to avoid nesting.
- What happens if multiple duplications are triggered rapidly? Only one duplication runs at a time; the Duplicate action is disabled while a mutation is pending.
- What happens when the creator clicks a card while a context menu action (like delete confirmation dialog) is open? The dialog takes focus priority; the card click does not navigate.
- What happens on touch devices? The hover effect does not apply; the card remains fully tappable. The context menu trigger has a minimum 44px touch target for accessibility.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a clickable project name badge in the project designer top navigation bar
- **FR-002**: The project name badge MUST show a pencil icon on hover to indicate editability
- **FR-003**: Clicking the project name badge MUST open a rename dialog pre-filled with the current name
- **FR-004**: The rename dialog MUST validate that the name is non-empty and within 100 characters
- **FR-005**: Successful rename MUST update the displayed name immediately and show a success notification
- **FR-006**: The project list context menu MUST include Rename, Duplicate, and Delete actions organized in logical sections (Rename + Duplicate in one group, Delete in a separate group)
- **FR-007**: System MUST support duplicating a project, creating a copy with name "Copy of {original name}" containing the same draft configuration
- **FR-008**: The Duplicate action MUST be disabled while a duplication is in progress
- **FR-009**: Successful duplication MUST show a confirmation notification with the new project name
- **FR-010**: Failed duplication MUST show an error notification
- **FR-011**: Project list cards MUST be fully clickable — clicking anywhere on the card (except the context menu) navigates to the project
- **FR-012**: Experience list cards MUST be fully clickable — clicking anywhere on the card (except the context menu) navigates to the experience
- **FR-013**: Both project and experience list cards MUST show a visual hover effect when the cursor enters the card
- **FR-014**: Context menu buttons on list cards MUST NOT trigger card navigation when clicked
- **FR-015**: List cards MUST be keyboard-accessible — focusable and activatable via Enter or Space
- **FR-016**: The project list context menu MUST use the shared context dropdown menu component for consistency with the experience list

### Key Entities

- **Project**: Represents a creator's project configuration. Key attributes: name, draft configuration, published version. A project can be renamed and duplicated.
- **Experience**: Represents an AI photo/video experience. Already supports rename and duplicate. List items receive the same clickability improvements as projects.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can rename a project from the designer without leaving the page, completing the rename in under 10 seconds
- **SC-002**: Creators can duplicate a project from the list in a single action, with the duplicate appearing within 3 seconds
- **SC-003**: 100% of the card surface area is clickable for navigation on both project and experience list items (excluding the context menu button area)
- **SC-004**: Both project and experience list cards provide visual hover feedback instantly on cursor enter
- **SC-005**: All interactive elements meet minimum touch target size of 44px for accessibility
- **SC-006**: Project and experience list items behave consistently — same hover effect, same click behavior, same context menu pattern

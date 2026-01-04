# Feature Specification: Project & Event Top Navigation Bar

**Feature Branch**: `010-project-event-topnav`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Provide contextual top navigation bars for project and event detail pages, enabling users to understand their current location in the hierarchy and access key actions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Project Context (Priority: P1)

A workspace admin viewing a project needs to understand their current location and access project-level actions.

**Why this priority**: Core navigation requirement - users must know where they are in the application hierarchy. Foundation for all other navigation features.

**Independent Test**: Can be fully tested by navigating to any project page and verifying the breadcrumb displays the project name and share button is present. Delivers immediate value by showing context and enabling future share functionality.

**Acceptance Scenarios**:

1. **Given** a workspace admin is viewing a project details page, **When** the page loads, **Then** the top navigation bar displays a folder icon and the project name on the left, and a share button on the right
2. **Given** a workspace admin views a project with a long name, **When** the page renders on a narrow screen, **Then** the project name truncates with ellipsis while maintaining minimum touch targets
3. **Given** a workspace admin clicks the share button, **When** the click completes, **Then** a toast notification appears with message "Coming soon"

---

### User Story 2 - Navigate Event Context with Breadcrumb (Priority: P1)

A workspace admin viewing an event needs to understand the event's relationship to its parent project and navigate back to the project.

**Why this priority**: Essential for hierarchical navigation - events exist within projects, and users need clear paths to navigate up the hierarchy. Equally critical as project navigation.

**Independent Test**: Can be fully tested by navigating to any event page and verifying the breadcrumb shows project > event hierarchy and clicking project name navigates to project page. Delivers value by enabling upward navigation.

**Acceptance Scenarios**:

1. **Given** a workspace admin is viewing an event page, **When** the page loads, **Then** the top navigation bar displays folder icon, project name, separator, and event name on the left
2. **Given** a workspace admin sees the event breadcrumb, **When** they click the project name, **Then** they navigate to the project details page
3. **Given** a workspace admin views an event with long project and event names, **When** the page renders on a narrow screen, **Then** both names truncate appropriately while maintaining readability
4. **Given** a workspace admin is on the event page, **When** they view the breadcrumb, **Then** the event name appears as plain text (not clickable) since it represents the current page

---

### User Story 3 - Access Event Actions (Priority: P2)

A workspace admin viewing an event needs quick access to preview and publish actions.

**Why this priority**: Enhances workflow efficiency by providing action shortcuts. Lower priority than navigation context because users can still complete tasks without quick-access buttons (via other UI paths).

**Independent Test**: Can be fully tested by navigating to an event page and clicking the play and publish buttons, verifying toast notifications appear. Delivers value by establishing UI patterns for future functionality.

**Acceptance Scenarios**:

1. **Given** a workspace admin is viewing an event page, **When** the page loads, **Then** play and publish buttons are visible on the right side of the top navigation bar
2. **Given** a workspace admin clicks the play button, **When** the click completes, **Then** a toast notification appears with message "Coming soon"
3. **Given** a workspace admin clicks the publish button, **When** the click completes, **Then** a toast notification appears with message "Coming soon"
4. **Given** a workspace admin views the event page on mobile, **When** buttons render, **Then** they maintain minimum 44x44px touch targets

---

### Edge Cases

- What happens when project or event names are extremely long (100+ characters)?
  - Names should truncate with ellipsis, showing as much text as possible while maintaining layout integrity
  - Full names should be available via tooltip on hover/long-press

- How does the system handle missing or deleted parent projects when viewing an event?
  - This is a data integrity issue handled by existing loaders - if parent project doesn't exist or user lacks access, route loader will fail and redirect appropriately (existing behavior)

- What happens if the user lacks permissions to view the parent project but has access to the event?
  - Project name in breadcrumb should still display (read-only context) but not be clickable. This maintains context without granting unauthorized navigation.

- How does the navigation behave during page transitions or when data is loading?
  - Navigation should show loading states (skeleton or spinner) during initial load
  - Navigation should persist during tab changes within the same project/event

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a top navigation bar on project details pages showing folder icon + project name on the left and share button on the right
- **FR-002**: System MUST display a top navigation bar on event pages showing folder icon + project name + separator + event name on the left, and play + publish buttons on the right
- **FR-003**: System MUST make the project name in the event breadcrumb clickable and navigate to the project details page when clicked
- **FR-004**: System MUST display the event name in the breadcrumb as non-clickable text (current page indicator)
- **FR-005**: System MUST truncate project and event names with ellipsis when text exceeds available space on narrow screens
- **FR-006**: System MUST maintain minimum 44x44px touch targets for all interactive elements (buttons, clickable breadcrumb items)
- **FR-007**: System MUST display a toast notification with message "Coming soon" when the share button is clicked on project pages
- **FR-008**: System MUST display a toast notification with message "Coming soon" when the play or publish buttons are clicked on event pages
- **FR-009**: System MUST fetch project name from existing route loader data (no additional data fetching required)
- **FR-010**: System MUST fetch event name from existing route loader data (no additional data fetching required)
- **FR-011**: System MUST render the top navigation bar above all other page content (tabs, page body, etc.)
- **FR-012**: System MUST use existing toast notification system (shadcn/ui sonner or equivalent)
- **FR-013**: System MUST use Lucide React icons for all icon elements (FolderOpen, Share2, Play, Upload/Globe)

### Key Entities

- **Project**: Existing entity with `name` attribute used in breadcrumb display
- **Event**: Existing entity with `name` attribute used in breadcrumb display, has parent relationship to Project
- **Workspace**: Existing entity providing authorization context (workspace admin role required)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify their current location (project or event) within 1 second of page load by viewing the top navigation breadcrumb
- **SC-002**: Users can navigate from event page to parent project page in one click via breadcrumb
- **SC-003**: All interactive elements maintain usability on mobile devices with minimum 44x44px touch targets
- **SC-004**: Navigation component renders consistently across both project and event pages with shared visual design
- **SC-005**: Long project/event names (50+ characters) truncate gracefully without breaking layout on screens as narrow as 320px
- **SC-006**: Action buttons (share, play, publish) provide visual feedback (toast) when clicked, establishing patterns for future functionality

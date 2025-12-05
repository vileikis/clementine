# Feature Specification: Project Navigation Tabs

**Feature Branch**: `021-project-navigation-tabs`
**Created**: 2025-12-05
**Status**: Draft
**Input**: User description: "Update project layout navigation with inline tabs matching Experience Editor pattern, ensure navigation persists when viewing events, and center content with reasonable width"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Between Project Sections (Priority: P1)

As a workspace admin, I want to navigate between different sections of a project (Events, Distribute) using inline tabs displayed in the header, so that I can quickly access different project management features without visual clutter.

**Why this priority**: This is the core navigation functionality. Without it, users cannot efficiently navigate project sections.

**Independent Test**: Can be fully tested by clicking tabs in the project header and verifying navigation to correct sections. Delivers immediate value by improving navigation UX.

**Acceptance Scenarios**:

1. **Given** I am on the project Events page, **When** I click the "Distribute" tab, **Then** I navigate to the Distribute page and the tab appears selected
2. **Given** I am on the project Distribute page, **When** I click the "Events" tab, **Then** I navigate to the Events page and the tab appears selected
3. **Given** I am on any project tab page, **When** I view the header, **Then** I see inline tabs centered in the header matching the Experience Editor style

---

### User Story 2 - Maintain Project Navigation While Viewing Events (Priority: P2)

As a workspace admin, I want to see the project-level navigation tabs even when I am viewing an event within a project, so that I can easily return to project sections without multiple back navigation steps.

**Why this priority**: This improves navigation flow when working within nested event pages. Currently navigation is hidden when viewing events.

**Independent Test**: Can be tested by navigating to an event within a project and verifying the project tabs remain visible and functional.

**Acceptance Scenarios**:

1. **Given** I am viewing an event within a project, **When** I look at the page layout, **Then** I see the project header with inline tabs visible above the event content
2. **Given** I am viewing an event, **When** I click the "Events" tab, **Then** I navigate back to the project's Events list
3. **Given** I am viewing an event, **When** I click the "Distribute" tab, **Then** I navigate to the project's Distribute page

---

### User Story 3 - View Content in Centered, Readable Width (Priority: P3)

As a workspace admin, I want project tab content to be displayed at a reasonable, centered width rather than stretching across the entire viewport, so that the interface is more readable and matches modern design patterns.

**Why this priority**: This is a visual/UX enhancement that improves readability but doesn't affect core functionality.

**Independent Test**: Can be tested by viewing any project tab page on a wide screen and verifying content is centered with constrained width.

**Acceptance Scenarios**:

1. **Given** I am viewing any project tab page on a wide screen (>1024px), **When** I look at the content area, **Then** the content is horizontally centered with a maximum width constraint
2. **Given** I am viewing a project tab page on a mobile device, **When** I look at the content area, **Then** the content uses the full available width appropriately for the viewport

---

### Edge Cases

- What happens when navigating between tabs with unsaved changes? Standard browser navigation behavior applies - no custom confirmation dialogs needed
- How does the layout behave when project name is very long? Name truncates with ellipsis as currently implemented
- What happens on very narrow mobile viewports (<375px)? Tabs remain accessible and do not overflow, adjusting spacing as needed

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display inline navigation tabs within the project header component
- **FR-002**: System MUST render tabs in the centered area of the header, between the left title section and right action buttons
- **FR-003**: System MUST visually indicate the currently active tab with distinct styling (background highlight)
- **FR-004**: System MUST maintain consistent tab styling with the existing Experience Editor tabs pattern
- **FR-005**: System MUST display project navigation tabs even when an event route is active within the project
- **FR-006**: System MUST constrain tab content areas to a reasonable maximum width on large viewports
- **FR-007**: System MUST horizontally center tab content within the viewport when max-width is applied
- **FR-008**: System MUST provide a reusable inline tabs component that can be shared between Project and Experience layouts

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Tabs MUST be accessible on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Tab touch targets MUST meet minimum touch target size (44x44px)
- **MFR-003**: Tab text MUST be readable on mobile (minimum 14px font size)
- **MFR-004**: On mobile viewports, content width constraints MAY be relaxed to use full available width

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Tab configuration props MUST be strongly typed
- **TSR-002**: TypeScript strict mode MUST be maintained (no `any` escapes)

### Key Entities

- **InlineTabs Component**: Reusable navigation component accepting tab configuration (label, href pairs) and displaying centered inline tab navigation
- **Project Layout**: Wrapper layout that renders header with inline tabs and constrains content width
- **Tab Configuration**: Definition of available tabs (name, navigation path) for a given context

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate between all project sections (Events, Distribute) within 1 click from any project page
- **SC-002**: 100% visual consistency between Project tabs and Experience Editor tabs appearance
- **SC-003**: Project navigation remains accessible from 100% of nested event pages
- **SC-004**: Content is readable without horizontal scrolling on viewports 375px and wider
- **SC-005**: Tab content maximum width improves readability on screens wider than 1024px by constraining content to a comfortable reading width

## Assumptions

- Tab labels remain static ("Events", "Distribute") for the initial implementation
- The existing Experience Editor tabs styling is the approved design pattern
- No additional tabs beyond Events and Distribute are needed at this time
- Standard browser navigation behavior is acceptable (no unsaved changes warnings needed)
- The reusable tabs component will support the current tab styling without requiring customization props

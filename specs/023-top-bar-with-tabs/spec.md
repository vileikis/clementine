# Feature Specification: Horizontal Tabs Navigation in Top Bar

**Feature Branch**: `023-top-bar-with-tabs`
**Created**: 2026-01-13
**Status**: Draft
**Input**: User description: "Change event designer layout from vertical sidebar to horizontal tabs in TopNavBar, with page-specific content layouts"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Event Designer Tabs (Priority: P1)

As an event creator editing an event, I want to see the event designer navigation tabs (Welcome, Theme, Settings) displayed horizontally in the top navigation bar instead of a vertical sidebar, so I can more easily navigate between sections while maintaining better visual consistency with the application's overall navigation.

**Why this priority**: This is the core layout change that affects how users interact with the event designer. Without this, the feature has no value.

**Independent Test**: Can be tested by navigating to any event designer page and verifying tabs appear horizontally in the top bar with correct active state highlighting, and clicking tabs navigates to the correct page.

**Acceptance Scenarios**:

1. **Given** I am on the event designer page for any event, **When** I view the top navigation bar, **Then** I see horizontal tabs for Welcome, Theme, and Settings displayed below the breadcrumb area
2. **Given** I am on the Welcome tab, **When** I click the Theme tab, **Then** I navigate to the Theme editor page and the Theme tab becomes visually active
3. **Given** I am on any event designer tab, **When** I view the page layout, **Then** there is no vertical sidebar on the left side of the page
4. **Given** I am viewing the tabs, **When** I look at the currently active page's tab, **Then** it is visually distinguished from inactive tabs (e.g., highlighted, underlined, or different color)

---

### User Story 2 - Reusable Tabs in Top Navigation (Priority: P1)

As a developer or product owner, I want the horizontal tabs to be a reusable feature of the TopNavBar component, so other pages in the application can also display contextual navigation tabs when needed.

**Why this priority**: This ensures the solution is architecturally sound and extensible, preventing tech debt and enabling future use cases.

**Independent Test**: Can be tested by configuring the TopNavBar with different tab configurations on different pages and verifying tabs render correctly with active state management.

**Acceptance Scenarios**:

1. **Given** a page uses the TopNavBar component, **When** I provide a tabs configuration, **Then** the tabs are rendered horizontally below the breadcrumbs
2. **Given** a page uses the TopNavBar component, **When** I do not provide a tabs configuration, **Then** no tabs are displayed and the component behaves as before
3. **Given** tabs are configured, **When** the page URL matches a tab's destination, **Then** that tab is marked as active

---

### User Story 3 - Editor Pages Show Controls on Left, Preview on Right (Priority: P2)

As an event creator using the Welcome or Theme editor, I want to see the editing controls on the left side and the live preview on the right side, so my workflow feels more natural (configure first, see results second) and there is more horizontal space for the preview.

**Why this priority**: This improves the user experience for the two main editing interfaces but is not required for basic navigation functionality.

**Independent Test**: Can be tested by navigating to the Welcome or Theme editor pages and verifying the controls panel appears on the left and the preview panel appears on the right.

**Acceptance Scenarios**:

1. **Given** I navigate to the Welcome editor page, **When** the page loads, **Then** the controls panel is displayed on the left side and the preview is displayed on the right side
2. **Given** I navigate to the Theme editor page, **When** the page loads, **Then** the controls panel is displayed on the left side and the preview is displayed on the right side
3. **Given** I am on an editor page with controls and preview, **When** I make changes in the controls, **Then** the preview on the right updates accordingly

---

### User Story 4 - Settings Page Shows Centered Content (Priority: P2)

As an event creator on the Settings page, I want to see the settings content centered on the page, so the content is easier to read and the layout feels balanced since there is no preview needed.

**Why this priority**: This is a layout polish for the Settings page specifically, improving usability but not critical for core functionality.

**Independent Test**: Can be tested by navigating to the Settings page and verifying the content is horizontally centered.

**Acceptance Scenarios**:

1. **Given** I navigate to the Settings page, **When** the page loads, **Then** the settings content is horizontally centered within the available space
2. **Given** I am on the Settings page, **When** I view the page, **Then** the content has appropriate maximum width to maintain readability

---

### Edge Cases

- What happens when browser window is narrow? Tabs should remain usable (either wrap or scroll horizontally)
- What happens when there are many tabs? The system should handle graceful overflow
- What happens on mobile/tablet viewports? Tabs should adapt appropriately to smaller screens
- What happens if a user directly navigates to an event designer URL? The correct tab should be highlighted

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The TopNavBar component MUST support an optional tabs configuration to render horizontal navigation tabs
- **FR-002**: When tabs are configured, they MUST appear as a horizontal row below the breadcrumb area
- **FR-003**: The active tab MUST be visually distinguished from inactive tabs
- **FR-004**: Clicking a tab MUST navigate to its configured destination
- **FR-005**: The EventDesignerPage MUST no longer render a vertical sidebar
- **FR-006**: The EventDesignerPage MUST pass tab configuration to the TopNavBar for Welcome, Theme, and Settings
- **FR-007**: The WelcomeEditorPage MUST display controls on the left and preview on the right
- **FR-008**: The ThemeEditorPage MUST display controls on the left and preview on the right
- **FR-009**: The EventSettingsPage MUST display its content horizontally centered
- **FR-010**: The tabs MUST maintain correct active state based on the current URL/route
- **FR-011**: The TopNavBar MUST continue to function normally when no tabs are provided (backward compatibility)

### Key Entities

- **Tab**: Represents a single navigation tab with a label, destination route, and active state
- **TabsConfiguration**: A collection of tabs to be displayed in the TopNavBar

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate between all three event designer sections (Welcome, Theme, Settings) using the horizontal tabs
- **SC-002**: 100% of existing event designer functionality remains accessible after the layout change
- **SC-003**: Page load time for event designer pages remains within 200ms of current baseline
- **SC-004**: The horizontal tabs are visually consistent with the application's design system
- **SC-005**: Users can identify the currently active tab within 1 second of page load

## Assumptions

- The TopNavBar component is the appropriate place to add horizontal tabs functionality
- Three tabs (Welcome, Theme, Settings) are sufficient for the event designer navigation
- The controls-left, preview-right layout is the preferred orientation for editor pages
- The current tab structure (simple links without nested sections) is sufficient for this use case
- No additional tabs will be added to the event designer in the immediate future

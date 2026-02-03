# Feature Specification: Project Router Restructure

**Feature Branch**: `056-project-router`
**Created**: 2026-02-03
**Status**: Draft
**Input**: User description: "Restructure project router with Designer, Distribute, and Analytics layers, splitting responsibilities between project and project-config domains"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Between Project Layers (Priority: P1)

An experience creator managing their project needs to easily switch between designing, distributing, and analyzing their project. They should see clear visual tabs in the top navigation bar and be able to switch contexts with a single click.

**Why this priority**: This is the core navigation change that enables the entire restructure. Without this, users cannot access the new sections.

**Independent Test**: Can be fully tested by navigating to a project and clicking between Designer, Distribute, and Analytics tabs - each should load the correct content area.

**Acceptance Scenarios**:

1. **Given** a user is viewing any project page, **When** they look at the top navigation bar, **Then** they see three clearly labeled tabs: "Designer", "Distribute", and "Analytics" in the center of the bar.
2. **Given** a user is on the Designer tab, **When** they click the "Distribute" tab, **Then** they are navigated to the distribute section and the Distribute tab appears active.
3. **Given** a user is on any tab, **When** they refresh the page, **Then** they return to the same tab they were viewing.

---

### User Story 2 - Access Designer Section (Priority: P1)

An experience creator needs to configure their project's welcome screen, share settings, theme, and general settings through the Designer section. This section should contain sub-navigation for each configuration area.

**Why this priority**: The Designer section is where creators spend most of their time configuring experiences. It must work correctly to maintain current functionality.

**Independent Test**: Can be fully tested by navigating to Designer and accessing Welcome, Share, Theme, and Settings sub-tabs - all current functionality should remain accessible.

**Acceptance Scenarios**:

1. **Given** a user is in the Designer section, **When** they view the interface, **Then** they see sub-tabs for Welcome, Share, Theme, and Settings.
2. **Given** a user clicks on the "Welcome" sub-tab, **When** the page loads, **Then** they see the welcome screen editor.
3. **Given** a user clicks on the "Theme" sub-tab, **When** the page loads, **Then** they see the theme configuration options.
4. **Given** a user makes changes in any Designer sub-tab, **When** they switch to another sub-tab and return, **Then** their changes are preserved (if saved).

---

### User Story 3 - Access Distribute Section (Priority: P2)

An experience creator needs a dedicated place to share their project with guests. The Distribute section should display the project's shareable link, QR code, and sharing instructions prominently.

**Why this priority**: Distribution is a key workflow, but it builds upon the navigation structure established in P1 stories.

**Independent Test**: Can be fully tested by navigating to Distribute and verifying the shareable link, QR code, and help instructions are displayed.

**Acceptance Scenarios**:

1. **Given** a user navigates to the Distribute section, **When** the page loads, **Then** they see the project's shareable guest URL displayed prominently.
2. **Given** a user is in the Distribute section, **When** they view the page, **Then** they see a QR code for the project's guest URL.
3. **Given** a user is in the Distribute section, **When** they click the copy button next to the URL, **Then** the URL is copied to their clipboard and they see confirmation feedback.
4. **Given** a user is in the Distribute section, **When** they view the page, **Then** they see help instructions explaining how to use the link and QR code.

---

### User Story 4 - Access Analytics Section (Priority: P3)

An experience creator wants to understand how their project is performing. The Analytics section should be accessible, even if initially showing a placeholder indicating the feature is in development.

**Why this priority**: Analytics is planned for future implementation; this story establishes the navigation placeholder.

**Independent Test**: Can be fully tested by navigating to Analytics and verifying a "Coming Soon" or work-in-progress message is displayed.

**Acceptance Scenarios**:

1. **Given** a user navigates to the Analytics section, **When** the page loads, **Then** they see a clear message indicating the analytics feature is under development.
2. **Given** a user is in the Analytics section, **When** they view the page, **Then** they understand that analytics functionality will be available in the future.

---

### Edge Cases

- What happens when a user navigates directly to a URL for a section that doesn't exist? (Should redirect to Designer by default)
- How does the system handle navigation when project data is loading? (Should show loading state without broken navigation)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display three primary navigation tabs (Designer, Distribute, Analytics) in the center of the TopNavBar when viewing a project.
- **FR-002**: System MUST maintain the current Designer sub-tabs (Welcome, Share, Theme, Settings) within the Designer section.
- **FR-003**: System MUST route the project index page to the Designer section by default.
- **FR-004**: System MUST display the Distribute page as a full page (not a dialog) showing the shareable URL, QR code, and usage instructions.
- **FR-005**: System MUST display the Analytics page with a work-in-progress placeholder message.
- **FR-006**: The `project` domain MUST handle the root project layout and primary navigation (Designer, Distribute, Analytics tabs).
- **FR-007**: The `project-config` domain MUST handle the Designer section with its sub-navigation (Welcome, Share, Theme, Settings).
- **FR-008**: System MUST display the publish workflow functionality (save status, changes badge, Preview button, Publish button) in the TopNavBar on Designer and Distribute sections, but not on Analytics.
- **FR-009**: System MUST support deep linking to all routes (users can bookmark and share URLs to specific sections).
- **FR-010**: The TopNavBar MUST display breadcrumbs showing the project name with navigation back to the projects list.

### Key Entities

- **Project**: The main entity being configured, containing draft/published version states.
- **ProjectConfig**: Configuration settings for welcome, theme, share, and general settings (managed in Designer).
- **Route Structure**:
  - `/workspace/:workspaceSlug/projects/:projectId` - Root layout (redirect to designer)
  - `/workspace/:workspaceSlug/projects/:projectId/designer/*` - Designer section with sub-routes
  - `/workspace/:workspaceSlug/projects/:projectId/distribute` - Distribution page
  - `/workspace/:workspaceSlug/projects/:projectId/analytics` - Analytics page (WIP)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate between Designer, Distribute, and Analytics tabs within 1 click from any project page.
- **SC-002**: All existing Designer functionality (Welcome, Share, Theme, Settings) remains fully accessible and operational.
- **SC-003**: All new routes are accessible via deep linking (users can bookmark and share URLs to specific sections).
- **SC-004**: Users can copy the project share link from the Distribute page and successfully share it with guests.
- **SC-005**: The navigation structure clearly communicates the three distinct project management areas to users.

## Clarifications

### Session 2026-02-03

- Q: Should publish workflow controls (save status, changes badge, Publish button) be visible on all tabs or only Designer? → A: Designer + Distribute - Publish controls visible on Designer and Distribute sections (since sharing needs published content), but not on Analytics.

## Assumptions

- The TopNavBar component already supports displaying tabs in the center (based on current implementation review).
- The ShareDialog component's content can be extracted and reused as a standalone page component.
- TanStack Router supports the nested route structure required for Designer sub-navigation.
- The publish workflow (save status, publish button) remains visible on Designer and Distribute tabs, but not on Analytics (which is read-only/WIP).

# Feature Specification: Base Navigation System

**Feature Branch**: `001-base-nav`
**Created**: 2025-12-26
**Status**: Draft
**Input**: User description: "Setup navigation backbone for clementine-app with three main routing areas (admin, workspace, guest) and a collapsible sidebar navigation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Navigation (Priority: P1)

An administrator needs to navigate between workspace management and developer tools to monitor and configure the platform.

**Why this priority**: Core administrative access is essential for platform management and serves as the foundation for all other administrative features.

**Independent Test**: Can be fully tested by accessing /admin routes, clicking navigation items, and verifying correct page transitions. Delivers immediate value by providing access to workspace and developer tools.

**Acceptance Scenarios**:

1. **Given** an admin is on any /admin page, **When** they click the hamburger icon, **Then** the sidebar opens showing "Workspaces" and "Dev Tools" navigation items
2. **Given** the sidebar is open, **When** the admin clicks "Workspaces", **Then** they navigate to /admin/workspaces showing WIP placeholder content
3. **Given** the sidebar is open, **When** the admin clicks "Dev Tools", **Then** they navigate to /admin/dev-tools showing WIP placeholder content
4. **Given** the sidebar is open, **When** the admin clicks the hamburger icon again, **Then** the sidebar collapses
5. **Given** the admin is on /admin, **When** the page loads, **Then** they are automatically redirected to /admin/workspaces (default route)

---

### User Story 2 - Workspace Navigation (Priority: P1)

A workspace member needs to navigate between their projects and workspace settings, with clear indication of which workspace they're currently viewing.

**Why this priority**: Workspace navigation is critical for the primary user flow - managing projects within a specific workspace context.

**Independent Test**: Can be fully tested by accessing /workspace/[workspaceId] routes with a valid workspace ID, verifying the workspace selector displays correctly, and confirming navigation between Projects and Settings works independently.

**Acceptance Scenarios**:

1. **Given** a user is on any /workspace/[workspaceId] page, **When** they click the hamburger icon, **Then** the sidebar opens showing the workspace selector, "Projects" and "Settings" navigation items
2. **Given** the sidebar is open for workspace "Acme", **When** viewing the workspace selector, **Then** it displays "A" as the workspace identifier
3. **Given** the sidebar is open for workspace "Acme Inc", **When** viewing the workspace selector, **Then** it displays "AI" as the workspace identifier
4. **Given** the sidebar is open for workspace "Acme Corporation Inc", **When** viewing the workspace selector, **Then** it displays "AC" as the workspace identifier
5. **Given** the sidebar is open, **When** the user clicks the workspace selector, **Then** a new tab opens to /admin/workspaces
6. **Given** the sidebar is open, **When** the user clicks "Projects", **Then** they navigate to /workspace/[workspaceId]/projects showing WIP placeholder content
7. **Given** the sidebar is open, **When** the user clicks "Settings", **Then** they navigate to /workspace/[workspaceId]/settings showing WIP placeholder content
8. **Given** a user is on /workspace/[workspaceId], **When** the page loads, **Then** they are automatically redirected to /workspace/[workspaceId]/projects (default route)

---

### User Story 3 - Guest Experience (Priority: P2)

A guest user visiting a project link needs a clean, distraction-free interface without navigation elements.

**Why this priority**: Guest experience is simpler and depends on project infrastructure being ready first. It's independently valuable for testing the guest upload flow.

**Independent Test**: Can be fully tested by accessing /guest/[projectId] route and verifying no sidebar is rendered. Delivers value by providing a focused guest experience.

**Acceptance Scenarios**:

1. **Given** a guest is on /guest/[projectId], **When** the page loads, **Then** no sidebar navigation is visible
2. **Given** a guest is on /guest/[projectId], **When** they view the page, **Then** they see WIP placeholder content without any navigation UI

---

### User Story 4 - Logout UI Placeholder (Priority: P3)

Users need to see where the logout functionality will be located in the navigation interface.

**Why this priority**: This is a UI placeholder only since authentication is out of scope for this phase. It establishes the visual structure but doesn't need to be functional yet.

**Independent Test**: Can be fully tested by verifying the logout button appears in the correct position in the sidebar. No actual authentication logic needed.

**Acceptance Scenarios**:

1. **Given** the sidebar is open on /admin or /workspace pages, **When** the user views the sidebar, **Then** they see a logout button at the bottom
2. **Given** the sidebar is open, **When** the user clicks the logout button, **Then** the button shows a visual response (e.g., hover state) but no authentication action occurs

---

### Edge Cases

- What happens when a user navigates directly to /admin without a trailing route (should redirect to /admin/workspaces)?
- What happens when a user navigates directly to /workspace/[workspaceId] without a trailing route (should redirect to /workspace/[workspaceId]/projects)?
- What happens when workspace name has only one word (display single capitalized letter)?
- What happens when workspace name is empty or null (should display a fallback identifier - e.g., "?")?
- How does the sidebar behave on mobile/narrow viewports?
- What happens when navigating between different workspace IDs (sidebar should update workspace selector using mock data)?
- What happens when a workspaceId in the URL doesn't match any mock workspace data (should display fallback or show error state)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide three distinct routing areas: /admin, /workspace/[workspaceId], and /guest/[projectId]
- **FR-002**: System MUST display a collapsible sidebar navigation on all /admin and /workspace routes
- **FR-003**: System MUST NOT display any sidebar navigation on /guest routes
- **FR-004**: Sidebar MUST include a hamburger icon at the top for toggling open/closed state
- **FR-005**: Sidebar MUST include a logout button placeholder at the bottom (visual only, no authentication logic required)
- **FR-006**: Admin sidebar MUST display two navigation items: "Workspaces" and "Dev Tools"
- **FR-007**: Workspace sidebar MUST display a workspace selector followed by two navigation items: "Projects" and "Settings"
- **FR-008**: Workspace selector MUST display workspace initials calculated as the first letter of the first two words in the workspace name, capitalized (e.g., "Acme" → "A", "Acme Inc" → "AI", "Acme Corporation Inc" → "AC")
- **FR-009**: Workspace selector MUST use mock workspace data (hardcoded workspace names for testing workspace selector logic)
- **FR-010**: Workspace selector MUST open /admin/workspaces in a new tab when clicked
- **FR-011**: System MUST redirect /admin to /admin/workspaces as the default route
- **FR-012**: System MUST redirect /workspace/[workspaceId] to /workspace/[workspaceId]/projects as the default route
- **FR-013**: All placeholder pages MUST display "WIP" text instead of real content
- **FR-014**: System MUST apply monochrome styling to the navigation interface
- **FR-015**: System MUST remove the existing home page that is no longer relevant

### Key Entities

- **Workspace**: Represents a team or organization context; has a name used for generating workspace selector initials
- **Project**: Represents a Clementine experience/campaign; identified by projectId in guest routes
- **Route Area**: Three distinct navigation contexts (admin, workspace, guest) with different navigation requirements

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate between all defined routes using the sidebar in under 2 clicks from any starting point
- **SC-002**: Workspace selector correctly displays initials for 100% of workspace names (single word, two words, three+ words)
- **SC-003**: Guest users see zero navigation UI elements, providing a distraction-free experience
- **SC-004**: Sidebar toggle animation completes within 300ms for smooth user experience
- **SC-005**: All WIP placeholder pages load and display within 1 second
- **SC-006**: Navigation state persists correctly when moving between different workspace IDs (workspace selector updates appropriately)

## Out of Scope

The following items are explicitly **not included** in this feature:

- **Authentication System**: No login, logout, or session management logic. The logout button is a visual placeholder only.
- **Real Data Fetching**: No integration with Firebase or any backend services. All workspace information uses hardcoded mock data.
- **User Permissions**: No role-based access control or permission checks.
- **Workspace Management**: No ability to create, edit, or delete workspaces. Use predefined mock workspace data.
- **Project Management**: No ability to create, edit, or delete projects.
- **Real Content**: All pages show "WIP" placeholder text instead of functional content.

**Rationale**: This feature establishes the navigation structure and visual framework only. Authentication, data fetching, and business logic will be added in subsequent features.

# Feature Specification: Projects List & Basic Project Management

**Feature Branch**: `008-projects-list`
**Created**: 2025-12-30
**Status**: Draft
**Input**: User description: "Enable workspace admins to view, create, access, and soft-delete projects within a workspace"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Projects List (Priority: P1)

As a workspace admin, I need to see all active projects in my workspace so I can understand what projects exist and select one to work on.

**Why this priority**: This is the foundation of project management - users must be able to discover existing projects before they can do anything else. Without a working project list, no other functionality is accessible.

**Independent Test**: Can be fully tested by authenticating as a workspace admin, navigating to the projects list route, and verifying that all non-deleted projects are displayed. Delivers immediate value by providing visibility into workspace projects.

**Acceptance Scenarios**:

1. **Given** I am a workspace admin with 5 active projects and 2 deleted projects, **When** I navigate to `/workspace/[workspaceSlug]/projects`, **Then** I see exactly 5 projects displayed, ordered by creation date (newest first)
2. **Given** I am a workspace admin with no projects in my workspace, **When** I navigate to the projects list, **Then** I see an empty state message prompting me to create a project
3. **Given** I am viewing the projects list, **When** I tap on any project, **Then** I navigate to that project's details page

---

### User Story 2 - Create New Project (Priority: P2)

As a workspace admin, I need to create a new project so I can start setting up a new photo/video experience for my event or campaign.

**Why this priority**: Project creation is the next critical step after viewing the list. Users need this to add new projects, but they can still interact with existing projects without this feature.

**Independent Test**: Can be fully tested by clicking the create project action, verifying a new project is created with correct defaults, and confirming navigation to the new project's details page. Delivers value by enabling users to start new projects.

**Acceptance Scenarios**:

1. **Given** I am on the projects list page, **When** I trigger the "Create project" action, **Then** a new project is created with name "Untitled project", status "draft", and I am redirected to its details page
2. **Given** I just created a project, **When** I return to the projects list, **Then** the new project appears at the top of the list (newest first)
3. **Given** I create a project in workspace A, **When** I view the projects list in workspace B, **Then** the new project does not appear (projects are workspace-scoped)

---

### User Story 3 - Delete Project (Priority: P3)

As a workspace admin, I need to delete projects I no longer need so I can keep my workspace organized and focused on active projects.

**Why this priority**: While important for long-term workspace hygiene, users can still create and view projects without deletion. This is a cleanup feature that becomes valuable over time.

**Independent Test**: Can be fully tested by deleting a project with confirmation, verifying it disappears from the list, and confirming it cannot be accessed via direct URL. Delivers value by enabling workspace cleanup.

**Acceptance Scenarios**:

1. **Given** I am viewing the projects list with a project I want to delete, **When** I trigger the delete action and confirm the deletion, **Then** the project is removed from the list immediately
2. **Given** I have deleted a project, **When** I try to access it via its direct URL `/workspace/[workspaceSlug]/projects/[projectId]`, **Then** I receive a 404 Not Found response
3. **Given** I trigger the delete action, **When** I cancel the confirmation dialog, **Then** the project remains in the list unchanged

---

### User Story 4 - Access Project Details (Priority: P2)

As a workspace admin, I need to access a project's details page so I can view and manage project-specific information.

**Why this priority**: This complements the view and create stories by providing navigation to individual projects. While the details page is a placeholder, the routing and access control are critical for the feature's foundation.

**Independent Test**: Can be fully tested by navigating to a valid project details URL and verifying the placeholder message appears, and by testing invalid/deleted project URLs return 404. Delivers value by establishing the navigation structure for future project management features.

**Acceptance Scenarios**:

1. **Given** I have access to an active project, **When** I navigate to `/workspace/[workspaceSlug]/projects/[projectId]`, **Then** I see the placeholder message "Project details – work in progress."
2. **Given** I attempt to access a deleted project, **When** I navigate to its URL, **Then** I receive a 404 Not Found response
3. **Given** I attempt to access a non-existent project ID, **When** I navigate to its URL, **Then** I receive a 404 Not Found response

---

### Edge Cases

- What happens when a workspace admin is removed from a workspace while viewing the projects list?
- How does the system handle creating a project when the user loses network connectivity mid-creation?
- What happens if two admins delete the same project simultaneously?
- How does the system handle accessing a project that was just deleted by another admin?
- What happens if the project list is empty after all projects are deleted?

## Requirements *(mandatory)*

### Functional Requirements

**List & Display**

- **FR-001**: System MUST display all projects belonging to the current workspace that do not have status "deleted"
- **FR-002**: System MUST order projects by creation date, with newest projects appearing first
- **FR-003**: System MUST show an empty state with a prompt to create a project when no active projects exist
- **FR-004**: System MUST allow navigation to a project's details page when a project is selected from the list

**Access Control**

- **FR-005**: Projects list MUST be accessible only to authenticated workspace admins
- **FR-006**: Project details page MUST be accessible only to authenticated workspace admins
- **FR-007**: System MUST prevent access to projects in other workspaces (projects are workspace-scoped)

**Project Creation**

- **FR-008**: System MUST provide a "Create project" action on the projects list page
- **FR-009**: System MUST create new projects with default name "Untitled project" and status "draft"
- **FR-010**: System MUST assign new projects to the current workspace
- **FR-011**: System MUST redirect users to the project details page immediately after successful creation
- **FR-012**: System MUST set creation and update timestamps when creating a project

**Project Deletion**

- **FR-013**: System MUST provide a delete action for each project in the list
- **FR-014**: System MUST require user confirmation before performing deletion
- **FR-015**: System MUST perform soft deletion by setting project status to "deleted" (not removing the document)
- **FR-016**: System MUST record deletion timestamp when soft-deleting a project
- **FR-017**: System MUST immediately remove soft-deleted projects from the projects list
- **FR-018**: System MUST prevent access to soft-deleted projects via direct URL (return 404)

**Project Details**

- **FR-019**: System MUST display a placeholder message "Project details – work in progress." for valid, non-deleted projects
- **FR-020**: System MUST return a 404 Not Found state for non-existent or deleted projects
- **FR-021**: System MUST validate project access (workspace membership and project status) before displaying details

### Key Entities

- **Project**: Represents a photo/video experience project within a workspace. Key attributes include:
  - Unique identifier
  - Display name
  - Current status (draft, live, or deleted)
  - Workspace relationship (which workspace owns this project)
  - Active event reference (switchboard pattern for controlling which event is active)
  - Soft deletion timestamp (for audit and potential future restore capability)
  - Creation and update timestamps

- **Workspace**: The organizational container for projects (existing entity, referenced by projects). Projects belong to exactly one workspace and are isolated from other workspaces.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Workspace admins can view all their active projects in under 2 seconds on a workspace with up to 100 projects
- **SC-002**: Workspace admins can create a new project and land on its details page in under 3 seconds
- **SC-003**: Deleted projects disappear from the list immediately (within 1 second of confirmation)
- **SC-004**: 100% of deleted projects return 404 when accessed via direct URL
- **SC-005**: Zero unauthorized users (non-workspace-members or guests) can access projects list or project details
- **SC-006**: Empty state appears correctly for workspaces with zero active projects
- **SC-007**: Projects list displays correct ordering (newest first) for 95% of page loads

### User Experience Outcomes

- **SC-008**: Workspace admins can complete their first project creation within 30 seconds of viewing the empty state
- **SC-009**: Delete confirmation prevents accidental deletions (user must explicitly confirm)
- **SC-010**: Navigation between projects list and project details feels instantaneous (perceived as immediate)

## Assumptions

1. **Authentication & Authorization**: Workspace admin authentication and authorization mechanisms already exist and can be reused for project access control
2. **Workspace Context**: The system can reliably determine the current workspace from the route parameter `[workspaceSlug]`
3. **Performance**: Workspaces typically have fewer than 100 projects, so simple client-side sorting and filtering is acceptable
4. **Data Model**: The Firestore data model with top-level `projects` collection is already established or will be created as part of implementation
5. **Soft Delete Standard**: Soft deletion (status-based) is the organization's standard approach for data removal across the platform
6. **Network Reliability**: Standard web application error handling is sufficient; no special offline-first requirements
7. **Project Uniqueness**: Project IDs are globally unique and generated by Firestore (auto-generated document IDs)

## Scope

### In Scope

- Viewing list of active projects in a workspace
- Creating new projects with default values
- Soft-deleting projects with confirmation
- Accessing placeholder project details page
- Basic access control (workspace admin only)
- Empty state for workspaces with no projects

### Out of Scope

- Editing project name or settings (future feature)
- Restoring deleted projects (data model supports it, UI does not)
- Guest access to projects
- Project sharing or collaboration features
- Events management within projects
- QR code generation for projects
- Project templates or duplication
- Bulk operations (multi-select, bulk delete)
- Search or filtering of projects list
- Pagination (assumed <100 projects per workspace)
- Project archiving (separate from deletion)

## Dependencies

1. **Existing Systems**:
   - Firebase Authentication for user authentication
   - Workspace authorization system to verify admin access
   - Firestore database for data persistence
   - Routing system that supports dynamic workspace and project parameters

2. **Data Requirements**:
   - Workspace data model with slug-based routing
   - User-to-workspace relationship for authorization
   - Firestore indexes for querying projects by workspaceId and status

3. **Constraints**:
   - Must maintain data isolation between workspaces
   - Must comply with existing authentication/authorization patterns
   - Must follow platform's soft delete conventions

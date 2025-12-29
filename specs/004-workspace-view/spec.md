# Feature Specification: Workspace View & Settings (Admin)

**Feature Branch**: `004-workspace-view`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "/Users/iggyvileikis/Projects/@attempt-n2/clementine/requirements/004-workspace-view.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Workspace Context (Priority: P1)

An admin navigates to a workspace by its slug and views the workspace context, seeing the workspace name and icon in the sidebar.

**Why this priority**: This is the foundation for all workspace-scoped features. Without the ability to view a workspace in its own context, admins cannot perform any workspace-specific operations.

**Independent Test**: Can be fully tested by navigating to `/workspace/[workspaceSlug]` as an admin and verifying the workspace selector shows the correct name and icon, and delivers value by providing workspace context awareness.

**Acceptance Scenarios**:

1. **Given** an admin is logged in and a workspace exists with slug "acme-corp", **When** the admin navigates to `/workspace/acme-corp`, **Then** the workspace selector in the sidebar displays the workspace name and a 2-letter icon derived from the first 2 words of the workspace name
2. **Given** an admin is logged in, **When** the admin navigates to `/workspace/nonexistent-slug`, **Then** a friendly 404 state is displayed with a title, short explanation, and a link back to `/admin/workspaces`
3. **Given** an admin is logged in and a workspace exists with status "deleted", **When** the admin navigates to that workspace's slug, **Then** a friendly 404 state is displayed (only active workspaces are accessible)

---

### User Story 2 - Edit Workspace Settings (Priority: P2)

An admin edits a workspace's name and slug via the settings page, with validation ensuring slug uniqueness and automatic redirection after slug changes.

**Why this priority**: After viewing a workspace, the ability to update its basic properties (name and slug) is the next most critical operation for workspace management.

**Independent Test**: Can be fully tested by navigating to `/workspace/[workspaceSlug]/settings`, editing the name and slug fields, saving changes, and verifying the updates persist and the redirect occurs.

**Acceptance Scenarios**:

1. **Given** an admin is viewing a workspace settings page, **When** the admin changes the workspace name and saves, **Then** the name is updated in the database with an updated timestamp, and the workspace selector reflects the new name
2. **Given** an admin is viewing a workspace settings page, **When** the admin changes the slug to a unique value and saves, **Then** the slug is updated in the database, the admin is redirected to `/workspace/[newSlug]/settings`, and the old slug URL shows a 404 state
3. **Given** an admin is viewing a workspace settings page, **When** the admin attempts to save a slug that already exists in another workspace, **Then** the save is prevented and an inline error message displays "Slug already in use" on the slug field
4. **Given** an admin is viewing a workspace settings page, **When** the admin enters a workspace name that violates min/max constraints, **Then** the save is prevented with appropriate validation feedback
5. **Given** an admin is viewing a workspace settings page, **When** the admin enters a slug that violates the slug schema (e.g., contains invalid characters), **Then** the save is prevented with appropriate validation feedback

---

### User Story 3 - View Projects Placeholder (Priority: P3)

An admin navigates to the projects page within a workspace context and sees a placeholder header indicating where future project management will occur.

**Why this priority**: This establishes the navigation structure for future workspace-scoped features but doesn't provide immediate functional value. It's a scaffolding element for future development.

**Independent Test**: Can be fully tested by navigating to `/workspace/[workspaceSlug]/projects` and verifying the header "Projects" is displayed and the workspace context is maintained.

**Acceptance Scenarios**:

1. **Given** an admin is viewing a workspace, **When** the admin navigates to `/workspace/[workspaceSlug]/projects`, **Then** the page displays a header with the text "Projects" and the workspace selector remains visible with the correct workspace context
2. **Given** an admin navigates to `/workspace/nonexistent-slug/projects`, **When** the workspace doesn't exist, **Then** a friendly 404 state is displayed with a link back to `/admin/workspaces`

---

### Edge Cases

- What happens when an admin attempts to change a workspace slug to a slug previously used by a deleted workspace? (The system should prevent this to avoid slug reuse)
- How does the system handle concurrent slug updates when two admins try to save different slugs for the same workspace simultaneously? (Last write should win with appropriate conflict detection)
- What happens when an admin bookmarks a workspace URL and the slug is changed by another admin? (The bookmarked URL should show a 404 state)
- What happens when the URL contains a malformed or injection-attempt slug? (The system should handle gracefully with 404, not crash)
- How does the system handle workspace resolution when the database is temporarily unavailable? (Should show an appropriate error state, not crash)

## Requirements *(mandatory)*

### Functional Requirements

**Access Control**

- **FR-001**: System MUST restrict all `/workspace/**` routes to admins only (users with `request.auth.token.admin == true`)
- **FR-002**: System MUST enforce admin-only access to the `workspaces` collection via Firestore security rules for all read and write operations

**Workspace Resolution**

- **FR-003**: System MUST resolve workspaces by matching the slug from the URL to a workspace document where `slug == [workspaceSlug]` AND `status == "active"`
- **FR-004**: System MUST display a friendly 404 state when a workspace is not found, including a title, short explanation, and a link back to `/admin/workspaces`

**Workspace Context Display**

- **FR-005**: System MUST display the workspace name in the sidebar workspace selector when a workspace is successfully resolved
- **FR-006**: System MUST generate and display a workspace icon in the sidebar selector using the first 2 letters from the first 2 words of the workspace name (maximum 2 letters)
- **FR-007**: Workspace selector MUST be display-only (no dropdown functionality) in this MVP

**Workspace Settings Page**

- **FR-008**: System MUST provide a settings page at `/workspace/[workspaceSlug]/settings` that displays editable fields for workspace name and workspace slug
- **FR-009**: System MUST validate that workspace name satisfies `WORKSPACE_NAME` min/max constraints before allowing save
- **FR-010**: System MUST validate that workspace slug satisfies `slugSchema` before allowing save
- **FR-011**: System MUST ensure workspace slug is globally unique across all workspaces (case-insensitive comparison)
- **FR-012**: System MUST prevent workspace slug reuse from deleted workspaces to avoid conflicts
- **FR-013**: System MUST allow duplicate workspace names across different workspaces

**Save Behavior**

- **FR-014**: When a workspace is updated, the system MUST update the `name`, `slug`, and `updatedAt` fields in the workspace document
- **FR-015**: System MUST re-check slug uniqueness at write-time before committing the update to prevent race conditions
- **FR-016**: When a slug is changed successfully, the system MUST redirect the admin to `/workspace/[newSlug]/settings`
- **FR-017**: After a slug change, the old slug URL MUST result in a 404 state (no slug history or legacy redirects in MVP)

**Error Handling**

- **FR-018**: When a slug conflict is detected, the system MUST prevent the save and display an inline error message "Slug already in use" on the slug field
- **FR-019**: When an update fails due to insufficient permissions, the system MUST display a "You don't have access" error state
- **FR-020**: System MUST handle malformed or invalid slugs in URLs gracefully without crashing

**Projects Placeholder**

- **FR-021**: System MUST provide a projects page at `/workspace/[workspaceSlug]/projects` that displays a header with the text "Projects"
- **FR-022**: Projects page MUST use the same workspace resolution logic as other workspace routes (active workspaces only)

**Data Integrity**

- **FR-023**: System MUST maintain the schema invariant: if `status == "deleted"` then `deletedAt != null`
- **FR-024**: System MUST maintain the schema invariant: if `status == "active"` then `deletedAt == null`
- **FR-025**: System MUST treat workspace slug as the canonical public identifier in all URLs

### Key Entities

- **Workspace**: Represents an organizational workspace with a unique slug, name, status (active/deleted), creation timestamp, update timestamp, and optional deletion timestamp. A workspace can have multiple projects and is the primary scoping mechanism for admin operations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can navigate to any active workspace by slug and view its context within 2 seconds
- **SC-002**: Admins can update a workspace name and see the change reflected in the sidebar selector immediately after save (within 1 second)
- **SC-003**: Admins can update a workspace slug and are automatically redirected to the new URL within 2 seconds of save
- **SC-004**: 100% of invalid slug changes (duplicates, invalid characters) are caught and prevented with clear error messages before database write
- **SC-005**: Admins attempting to access non-existent or deleted workspaces see a helpful 404 state 100% of the time
- **SC-006**: All workspace routes are inaccessible to non-admin users (0% unauthorized access)
- **SC-007**: Zero data corruption incidents where workspace slug uniqueness is violated or schema invariants are broken

## Assumptions

1. **Workspace Name Constraints**: Assuming `WORKSPACE_NAME` schema exists with reasonable min/max length constraints (e.g., 3-50 characters). If not defined, will need to establish during implementation.

2. **Slug Schema**: Assuming `slugSchema` exists and defines valid slug format (e.g., lowercase letters, numbers, hyphens, no spaces). Common pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

3. **Admin Authentication**: Assuming the admin authentication system is already implemented and the `request.auth.token.admin` claim is set correctly in Firebase Auth custom claims.

4. **Firestore Security Rules**: Assuming Firestore security rules are configured to check the admin claim for workspace collection access.

5. **Icon Generation Logic**: Assuming the 2-letter icon generation should take the first letter of the first word and the first letter of the second word. If there's only one word, use the first 2 letters of that word.

6. **Concurrent Update Handling**: Assuming last-write-wins is acceptable for concurrent updates, with the expectation that admin users will coordinate or conflicts will be rare.

7. **URL Encoding**: Assuming workspace slugs in URLs will be properly URL-encoded/decoded when necessary.

8. **Error States**: Assuming friendly error states should maintain the overall application layout (sidebar, navigation) but replace the main content area with error messaging.

## Out of Scope

- Non-admin workspace access (guest users, collaborators, etc.)
- Slug history or legacy URL redirects after slug changes
- Workspace switching functionality in the selector dropdown (display-only in MVP)
- Projects CRUD operations (only placeholder page)
- Workspace deletion functionality
- Workspace creation (assumed to exist elsewhere)
- Audit logging of workspace changes
- Undo/redo functionality for workspace edits
- Workspace permissions beyond basic admin-only access
- Multi-language support for error messages
- Workspace archival (separate from deletion)

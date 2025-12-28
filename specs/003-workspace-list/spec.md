# Feature Specification: Admin Workspace Management

**Feature Branch**: `003-workspace-list`
**Created**: 2025-12-28
**Status**: Draft
**Input**: User description: "Enable admins to view, create, open, and soft-delete workspaces using slug-based URLs"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Active Workspaces (Priority: P1)

An admin needs to see all active workspaces to understand what exists in the system and access them quickly.

**Why this priority**: This is the foundational view that enables all other workspace management tasks. Without it, admins cannot navigate to or manage workspaces.

**Independent Test**: Can be fully tested by logging in as an admin, navigating to the workspace list, and verifying all active workspaces are displayed. Delivers immediate value by providing workspace visibility.

**Acceptance Scenarios**:

1. **Given** an admin is authenticated **When** they navigate to `/admin/workspaces` **Then** they see a list of all active workspaces
2. **Given** there are 5 active workspaces in the system **When** an admin views the workspace list **Then** all 5 workspaces are displayed
3. **Given** there are deleted workspaces in the system **When** an admin views the workspace list **Then** only active workspaces are shown (deleted ones are hidden)
4. **Given** an admin views a workspace in the list **When** they click on a workspace **Then** they are navigated to `/workspace/[workspaceSlug]`

---

### User Story 2 - Create New Workspace (Priority: P2)

An admin needs to create a new workspace with a unique slug to organize work and provide a shareable URL for their team.

**Why this priority**: Workspace creation is essential but depends on having the list view (P1) to show the newly created workspace. It's the primary action admins take to grow the system.

**Independent Test**: Can be tested by clicking "Create workspace", filling the form, and verifying the workspace appears in the list and is accessible via its slug URL. Delivers value by enabling workspace expansion.

**Acceptance Scenarios**:

1. **Given** no active workspaces exist **When** an admin navigates to `/admin/workspaces` **Then** they see an empty state with a "Create workspace" button
2. **Given** an admin initiates workspace creation **When** they provide a workspace name **Then** a slug is automatically generated from the name
3. **Given** a slug is auto-generated **When** the admin reviews it **Then** they can edit the slug before submission
4. **Given** an admin submits a valid workspace name and unique slug **When** the workspace is created **Then** the workspace is saved with status "active" and the admin is redirected to `/workspace/[workspaceSlug]`
5. **Given** an admin tries to create a workspace **When** they use a slug that already exists (case-insensitive) **Then** they see an error message and cannot proceed
6. **Given** a workspace was previously deleted with slug "acme-corp" **When** an admin tries to create a new workspace with slug "acme-corp" **Then** they see an error that the slug is unavailable (no slug reuse)

---

### User Story 3 - Access Workspace by Slug (Priority: P1)

An admin needs to access a specific workspace using its slug URL to view or manage that workspace's content.

**Why this priority**: Slug-based routing is critical for shareable, readable URLs and direct access to workspaces. It's part of the core navigation pattern.

**Independent Test**: Can be tested by entering a workspace slug URL directly and verifying the correct workspace loads. Delivers value by enabling direct workspace access.

**Acceptance Scenarios**:

1. **Given** a workspace exists with slug "summer-campaign" and status "active" **When** an admin navigates to `/workspace/summer-campaign` **Then** they see the workspace page
2. **Given** an admin enters a slug that doesn't exist **When** they navigate to `/workspace/nonexistent` **Then** they see a "Workspace not found" message
3. **Given** a workspace exists but has status "deleted" **When** an admin navigates to its slug URL **Then** they see a "Workspace not found" message (deleted workspaces are treated as not found)
4. **Given** two workspaces exist with slugs "acme" and "ACME" (different case) **When** querying for slug "acme" **Then** only one workspace is returned (slugs are case-insensitive unique)

---

### User Story 4 - Soft Delete Workspace (Priority: P3)

An admin needs to remove a workspace from active use without permanently destroying it, preventing accidental data loss while keeping the system organized.

**Why this priority**: Deletion is important for cleanup but is used less frequently than viewing or creating workspaces. Soft delete provides safety against accidental removal.

**Independent Test**: Can be tested by deleting a workspace and verifying it disappears from the list and becomes inaccessible. Delivers value by enabling workspace lifecycle management.

**Acceptance Scenarios**:

1. **Given** an admin views the workspace list **When** they initiate deletion on a workspace **Then** they see a confirmation modal
2. **Given** an admin confirms deletion **When** the deletion is processed **Then** the workspace status is set to "deleted", deletedAt timestamp is set, and updatedAt is updated
3. **Given** a workspace is soft deleted **When** an admin views the workspace list **Then** the deleted workspace no longer appears
4. **Given** a workspace is soft deleted **When** someone navigates to its slug URL **Then** they see "Workspace not found" (workspace is inaccessible)
5. **Given** a workspace is soft deleted with slug "holiday-promo" **When** an admin tries to create a new workspace with slug "holiday-promo" **Then** they see an error that the slug is unavailable

---

### Edge Cases

- What happens when a slug contains special characters or spaces? (Slug schema validation must prevent invalid characters)
- How does the system handle concurrent workspace creation with the same slug? (Transaction or server-side validation must enforce uniqueness)
- What happens if an admin tries to access `/admin/workspaces` without admin privileges? (Access is denied, user sees unauthorized message)
- What happens when the workspace list is very long (50+ workspaces)? (Display uses pagination or infinite scroll to maintain performance)
- What happens if a workspace name is very long? (Name has max length constraint enforced by schema)
- What happens if createdAt/updatedAt timestamps fail to set? (Validation ensures timestamps are always set during create/update operations)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST restrict all workspace read and write operations to users with Firebase Auth custom claim `admin: true`
- **FR-002**: System MUST display only workspaces with status "active" on the `/admin/workspaces` list page
- **FR-003**: System MUST navigate to `/workspace/[workspaceSlug]` when a workspace is clicked from the list
- **FR-004**: System MUST show an empty state with a "Create workspace" button when no active workspaces exist
- **FR-005**: System MUST require workspace name during creation
- **FR-006**: System MUST auto-generate a slug from the workspace name during creation
- **FR-007**: System MUST allow admins to edit the auto-generated slug before submission
- **FR-008**: System MUST validate slugs against the slug schema (allowed characters, format, length)
- **FR-009**: System MUST enforce slug uniqueness (case-insensitive) across all workspaces, including deleted ones
- **FR-010**: System MUST prevent slug reuse from deleted workspaces
- **FR-011**: System MUST create workspaces with status "active", deletedAt null, and set createdAt and updatedAt timestamps
- **FR-012**: System MUST redirect admins to `/workspace/[workspaceSlug]` after successful workspace creation
- **FR-013**: System MUST resolve workspace URLs by querying for slug match and status "active"
- **FR-014**: System MUST display "Workspace not found" message when a slug doesn't match any active workspace
- **FR-015**: System MUST treat deleted workspaces (status "deleted") as not found to prevent information leakage
- **FR-016**: System MUST show a confirmation modal before processing workspace deletion
- **FR-017**: System MUST perform soft deletion by setting status to "deleted", deletedAt to current timestamp, and updating updatedAt
- **FR-018**: System MUST remove soft-deleted workspaces from the `/admin/workspaces` list immediately
- **FR-019**: System MUST make soft-deleted workspace URLs inaccessible (return "not found")
- **FR-020**: System MUST enforce slug uniqueness using server-side validation (transaction or callable function)
- **FR-021**: System MUST update the updatedAt timestamp on all workspace modifications

### Key Entities

- **Workspace**: Represents an organizational unit or project space with the following attributes:
  - id: Unique identifier
  - name: Human-readable workspace name (min/max length constraints)
  - slug: URL-safe, unique identifier derived from name (case-insensitive unique)
  - status: Current state ("active" or "deleted")
  - deletedAt: Timestamp when soft deleted (null for active workspaces)
  - createdAt: Timestamp when created
  - updatedAt: Timestamp of last modification
  - Constraint: If status is "deleted", deletedAt must not be null

- **Admin User**: A user with Firebase Authentication who has custom claim `admin: true`, granting access to workspace management operations

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can view the list of all active workspaces within 2 seconds of page load
- **SC-002**: Admins can create a new workspace and access it via slug URL within 30 seconds from start to finish
- **SC-003**: 100% of workspace creations with duplicate slugs are prevented (no duplicate slugs exist in the system)
- **SC-004**: Deleted workspace slugs cannot be reused, preventing URL conflicts and maintaining data integrity
- **SC-005**: Non-admin users are prevented from accessing workspace management features (0% unauthorized access)
- **SC-006**: Admins can successfully delete a workspace and see it removed from the list within 5 seconds
- **SC-007**: 100% of slug-based workspace URLs resolve to the correct workspace or show "not found" appropriately
- **SC-008**: System handles 100 concurrent workspace creation requests without creating duplicate slugs (server-side enforcement works under load)

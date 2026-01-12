# Feature Specification: Experience Data Layer & Library

**Feature Branch**: `021-experience-data-library`
**Created**: 2026-01-12
**Status**: Draft
**Input**: Epic E1: Experience Data Layer & Library - Enable admins to create and manage experiences at workspace level through a dedicated Experience Library UI

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Views Experience Library (Priority: P1)

As a workspace admin, I need to view all experiences in my workspace so I can manage my AI photo experiences and understand what's been created.

**Why this priority**: This is the foundational interaction - admins must be able to see existing experiences before they can create or manage them. Without this, no other functionality is usable.

**Independent Test**: Can be fully tested by navigating to the experiences page and verifying the list displays with proper filtering. Delivers immediate value by giving admins visibility into their workspace's experiences.

**Acceptance Scenarios**:

1. **Given** I am logged in as a workspace admin, **When** I navigate to `/workspace/:slug/experiences`, **Then** I see a list of all active experiences in that workspace
2. **Given** I am on the experiences list page, **When** I select a profile filter (Freeform, Survey, or Story), **Then** only experiences matching that profile are displayed
3. **Given** I am on the experiences list page with no experiences, **When** the page loads, **Then** I see an empty state with a call-to-action to create my first experience
4. **Given** I am on the experiences list page, **When** experiences are loading, **Then** I see a loading skeleton to indicate content is being fetched

---

### User Story 2 - Admin Creates New Experience (Priority: P1)

As a workspace admin, I need to create a new experience by providing a name and selecting a profile type so I can start building AI photo experiences for my events.

**Why this priority**: Creating experiences is core to the platform's value proposition. Without the ability to create experiences, the library has no content.

**Independent Test**: Can be fully tested by completing the create flow and verifying the experience appears in the library. Delivers value by enabling admins to start building their experience catalog.

**Acceptance Scenarios**:

1. **Given** I am on the experiences list page, **When** I click "Create Experience", **Then** I am navigated to the create experience page
2. **Given** I am on the create experience page, **When** I enter a valid name (1-100 characters) and select a profile, **Then** the Create button becomes enabled
3. **Given** I have filled out the create form, **When** I click Create, **Then** a new experience is created in draft status and I am navigated to the experience editor
4. **Given** I am on the create experience page, **When** I click the back button, **Then** I return to the experiences list without creating an experience
5. **Given** I am on the create experience page, **When** I view the profile options, **Then** I see descriptions/hints for each profile type (Freeform, Survey, Story)

---

### User Story 3 - Admin Renames Experience (Priority: P2)

As a workspace admin, I need to rename an existing experience so I can keep my experience library organized with meaningful names.

**Why this priority**: Renaming is essential for organization but depends on experiences existing first. Admins will naturally want to rename as they iterate on their experiences.

**Independent Test**: Can be fully tested by renaming an experience and verifying the new name persists. Delivers value by allowing admins to maintain clear, descriptive naming.

**Acceptance Scenarios**:

1. **Given** I am viewing an experience in the list, **When** I open the context menu and select "Rename", **Then** I see a rename dialog with the current name pre-filled
2. **Given** the rename dialog is open, **When** I enter a new valid name and confirm, **Then** the experience name is updated and the dialog closes
3. **Given** the rename dialog is open, **When** I cancel or close the dialog, **Then** the experience name remains unchanged

---

### User Story 4 - Admin Deletes Experience (Priority: P2)

As a workspace admin, I need to delete experiences I no longer need so I can keep my experience library clean and relevant.

**Why this priority**: Deletion is important for maintenance but is a secondary action. Admins need to manage their library size but this is less frequent than viewing or creating.

**Independent Test**: Can be fully tested by deleting an experience and verifying it no longer appears in the list. Delivers value by allowing admins to remove obsolete or test experiences.

**Acceptance Scenarios**:

1. **Given** I am viewing an experience in the list, **When** I open the context menu and select "Delete", **Then** I see a confirmation dialog warning about the deletion
2. **Given** the delete confirmation dialog is open, **When** I confirm the deletion, **Then** the experience is soft-deleted and no longer appears in the list
3. **Given** the delete confirmation dialog is open, **When** I cancel, **Then** the experience remains in the list unchanged

---

### User Story 5 - Admin Views Experience Editor Shell (Priority: P3)

As a workspace admin, I need to navigate to an experience's editor page so I can see where step editing will be available (in a future release).

**Why this priority**: This is a placeholder for future functionality. The route must exist for navigation to work, but the actual editing features come in Epic E2.

**Independent Test**: Can be fully tested by clicking on an experience and verifying the editor page loads with appropriate placeholder content. Delivers value by completing the navigation flow.

**Acceptance Scenarios**:

1. **Given** I am on the experiences list page, **When** I click on an experience, **Then** I am navigated to the experience editor page
2. **Given** I am on the experience editor page, **When** the page loads, **Then** I see a breadcrumb showing Workspace > Experiences > [Experience Name]
3. **Given** I am on the experience editor page, **When** the page loads, **Then** I see placeholder content indicating step editing is coming in a future release

---

### Edge Cases

- What happens when admin tries to create an experience with an empty name? System prevents submission and shows validation error.
- What happens when admin tries to create an experience with a name exceeding 100 characters? System prevents submission and shows character limit error.
- What happens when network request fails while loading experiences? System shows error state with retry option.
- What happens when network request fails while creating an experience? System shows error toast and preserves form input.
- How does system handle concurrent edits if two admins rename the same experience? Last write wins (standard optimistic concurrency); UI updates reflect final state.
- What happens when admin tries to access experiences for a workspace they don't have admin access to? Security rules prevent read/write; UI shows unauthorized state.
- What happens when admin tries to filter by a profile type with no matching experiences? System shows filtered empty state with option to create or clear filter.

## Requirements *(mandatory)*

### Functional Requirements

#### Data Layer

- **FR-001**: System MUST store experiences as documents within workspace subcollections at path `/workspaces/{workspaceId}/experiences/{experienceId}`
- **FR-002**: System MUST support three experience profiles: freeform, survey, and story
- **FR-003**: System MUST maintain separate draft and published configuration objects within each experience document
- **FR-004**: System MUST record creation, update, publish, and deletion timestamps for each experience
- **FR-005**: System MUST implement soft-delete by setting `status: 'deleted'` and `deletedAt` timestamp rather than removing documents
- **FR-006**: System MUST generate unique identifiers for new experience documents
- **FR-007**: System MUST store optional media thumbnail information (mediaAssetId and URL) at the experience root level

#### Security

- **FR-008**: System MUST allow only authenticated users to read experience documents
- **FR-009**: System MUST allow only workspace admins to create, update, or delete experience documents
- **FR-010**: System MUST prevent hard deletion of experience documents via security rules
- **FR-011**: System MUST record the user ID of the admin who publishes an experience in the `publishedBy` field

#### User Interface

- **FR-012**: System MUST provide a list view of all active experiences at `/workspace/:slug/experiences`
- **FR-013**: System MUST allow filtering the experience list by profile type
- **FR-014**: System MUST display each experience's name, profile badge, thumbnail, and publish status in the list
- **FR-015**: System MUST provide a creation form at `/workspace/:slug/experiences/create` with name input and profile selection
- **FR-016**: System MUST validate experience names are between 1 and 100 characters
- **FR-017**: System MUST make profile immutable after experience creation
- **FR-018**: System MUST navigate to the experience editor after successful creation
- **FR-019**: System MUST provide context menu actions for Edit and Delete on each list item
- **FR-020**: System MUST display a rename dialog when admin initiates rename action
- **FR-021**: System MUST display a confirmation dialog before soft-deleting an experience
- **FR-022**: System MUST show appropriate empty states when no experiences exist or no experiences match the current filter
- **FR-023**: System MUST display loading skeletons while experience data is being fetched
- **FR-024**: System MUST provide an editor route at `/workspace/:slug/experiences/:experienceId` with placeholder content

### Key Entities

- **Experience**: The primary entity representing an AI photo experience. Contains identity (id, name), metadata (status, profile, media), configuration (draft and published step arrays), and timestamps (created, updated, published, deleted). Belongs to a workspace.
- **Profile**: A category that determines what types of steps an experience can contain and where it can be used. Three profiles exist: freeform (full flexibility), survey (data collection focus), and story (display only).
- **Media**: Optional thumbnail or cover image for an experience, referenced by mediaAssetId and URL. Used for visual identification in the library list.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can view their complete experience library within 3 seconds of page load
- **SC-002**: Admins can create a new experience in under 30 seconds (name entry + profile selection + submission)
- **SC-003**: Experience list supports displaying 100+ experiences without pagination performance degradation
- **SC-004**: All CRUD operations provide visual feedback (loading state, success confirmation, or error message) within 500ms of user action
- **SC-005**: Profile filtering updates the displayed list within 1 second
- **SC-006**: Deleted experiences are immediately removed from the list view (no stale data visible to user)
- **SC-007**: 100% of write operations are blocked for non-admin users at the security layer
- **SC-008**: New experiences are initialized with correct default values (active status, empty draft steps, null published configuration)

## Assumptions

- Workspace and admin authentication systems already exist and are functional
- The state management patterns established in the codebase will be followed
- Security rules can be deployed alongside application changes
- The existing design system components provide necessary building blocks for the UI
- Profile definitions and their allowed step categories are fixed for this release (validation details deferred to E2)

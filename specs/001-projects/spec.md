# Feature Specification: Projects - Foundation for Nested Events

**Feature Branch**: `001-projects`
**Created**: 2025-12-02
**Status**: Draft
**Input**: User description: "phase 4 - projects from '/Users/iggyvileikis/Projects/@attempt-n2/clementine/features/scalable-arch/high-level-plan.md'"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Create and Manage Projects as Event Containers (Priority: P1)

Administrators need to organize their events within project containers that represent campaigns, tours, or other long-running initiatives. Each project has a shareable link and QR code that guests use to access experiences.

**Why this priority**: This is the foundational change required for the scalable architecture. Without projects, we cannot proceed with nested events in Phase 5.

**Independent Test**: Can be fully tested by creating a new project via the admin interface, verifying it appears in the project list, and confirming that the share link and QR code are generated correctly.

**Acceptance Scenarios**:

1. **Given** an administrator is logged into the company workspace, **When** they click "Create New Project", **Then** a project creation form is displayed
2. **Given** the project creation form is displayed, **When** they enter a project name and submit, **Then** a new project is created with draft status, unique share path, and QR code
3. **Given** a project exists, **When** an administrator views the project details, **Then** they see the project name, status, share link, and QR code
4. **Given** a project exists, **When** an administrator changes the project status from draft to live, **Then** the status is updated and persisted
5. **Given** a project exists with a share link, **When** a guest visits the share link, **Then** they are directed to the active experience (via activeEventId)

---

### User Story 2 - View and Navigate Project List (Priority: P1)

Administrators need to view all projects within their company and navigate to individual project details to manage them.

**Why this priority**: Essential for project management workflow - administrators must be able to see and access their projects.

**Independent Test**: Can be fully tested by creating multiple projects and verifying they all appear in the project list, and clicking on a project navigates to its details page.

**Acceptance Scenarios**:

1. **Given** multiple projects exist for a company, **When** an administrator views the projects page, **Then** all projects are displayed as cards showing name and status
2. **Given** the projects list is displayed, **When** an administrator clicks on a project card, **Then** they navigate to the project details page
3. **Given** no projects exist for a company, **When** an administrator views the projects page, **Then** an empty state with "Create Project" call-to-action is displayed

---

### User Story 3 - Access Distribution Tools (Share Link and QR Code) (Priority: P2)

Administrators need to share their project with guests via a unique link and downloadable QR code that can be printed or displayed at physical locations.

**Why this priority**: Critical for guest access, but can be deferred slightly as it builds on the project creation functionality.

**Independent Test**: Can be fully tested by viewing a project's Distribute tab, copying the share link, and downloading the QR code image.

**Acceptance Scenarios**:

1. **Given** a project exists, **When** an administrator views the Distribute tab, **Then** they see the share link and QR code
2. **Given** the Distribute tab is displayed, **When** an administrator clicks "Copy Link", **Then** the share link is copied to clipboard
3. **Given** the Distribute tab is displayed, **When** an administrator clicks "Download QR", **Then** the QR code image is downloaded to their device

---

### User Story 4 - Prepare for Future Nested Events (Priority: P3)

The project details page includes an Events tab that will be used in Phase 5 for managing nested events. For now, it displays a placeholder message.

**Why this priority**: This is preparation for future functionality and doesn't provide immediate value, but ensures the UI is structured correctly.

**Independent Test**: Can be fully tested by viewing a project's Events tab and confirming the placeholder message is displayed.

**Acceptance Scenarios**:

1. **Given** a project exists, **When** an administrator views the Events tab, **Then** they see a placeholder message "Coming in Phase 5"

---

### Edge Cases

- What happens when a guest visits a share link for a project with no activeEventId set? (Should show appropriate message or redirect)
- What happens when an administrator tries to change a project status to "live" when there is no active experience configured? (Should validate or warn)
- How does the system handle duplicate share paths? (Must ensure uniqueness)
- What happens when an administrator deletes a project? (Soft delete with deletedAt timestamp)
- What happens when multiple administrators try to edit the same project simultaneously? (Last-write-wins, standard Firestore behavior)

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.

  IMPORTANT - Constitution Compliance:
  - Mobile-First: Requirements MUST consider mobile viewport (320px-768px) as primary
  - Type-Safety: External inputs MUST specify validation requirements (Zod schemas)
  - Simplicity: Requirements MUST be minimal and focused (YAGNI principle)
-->

### Functional Requirements

- **FR-001**: System MUST rename the `/events` Firestore collection to `/projects` without data loss
- **FR-002**: System MUST rename all Event types, interfaces, and schemas to Project equivalents (Event → Project, EventTheme → ProjectTheme)
- **FR-003**: System MUST rename the `features/events/` directory to `features/projects/` and update all import paths
- **FR-004**: System MUST preserve all existing business logic including status transitions, soft deletion, theme management, and QR code generation
- **FR-005**: System MUST rename the `ownerId` field to `companyId` to align with company-scoped architecture
- **FR-006**: System MUST rename the `joinPath` field to `sharePath` to better reflect its purpose
- **FR-007**: System MUST rename the `activeJourneyId` field to `activeEventId` (note: in Phase 4 this still points to Experience IDs, but prepares for Phase 5)
- **FR-008**: System MUST temporarily preserve `theme`, `publishStartAt`, and `publishEndAt` fields at the project level (these will move to nested Events in Phase 5)
- **FR-009**: System MUST provide a Projects List page that displays all projects for the active company
- **FR-010**: System MUST provide a Create Project interface accessible from the Projects List page
- **FR-011**: System MUST provide a Project Details page with tabs for Events and Distribute
- **FR-012**: System MUST display a placeholder message "Coming in Phase 5" in the Events tab
- **FR-013**: System MUST display the share link, QR code, copy link button, and download QR button in the Distribute tab
- **FR-014**: System MUST allow administrators to change project status between draft, live, and archived
- **FR-015**: System MUST maintain the existing guest flow where sharePath resolves to activeEventId (which points to an Experience ID in Phase 4)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Projects List page MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Project cards MUST be touch-friendly with minimum 44x44px tap targets
- **MFR-003**: Project Details page tabs MUST be accessible and scrollable on mobile
- **MFR-004**: Share link and QR code in Distribute tab MUST be clearly visible and usable on mobile devices
- **MFR-005**: Copy link and download QR buttons MUST meet minimum touch target size (44x44px)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All Project data (create/update forms) MUST be validated with Zod schemas
- **TSR-002**: Project schema MUST enforce required fields: name, status, companyId, sharePath
- **TSR-003**: Project status MUST use a discriminated union type restricted to valid values (draft, live, archived, deleted)
- **TSR-004**: TypeScript strict mode MUST be maintained throughout the refactor (no `any` escapes)

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: All write operations (create/update/delete projects) MUST use Admin SDK via Server Actions
- **FAR-002**: Real-time project list subscriptions MUST use Client SDK for live updates
- **FAR-003**: Project schemas MUST be located in `features/projects/schemas/`
- **FAR-004**: QR code images MUST be stored in Firebase Storage at `media/{companyId}/qr/{projectId}.png` with full public URLs
- **FAR-005**: Firestore migration MUST rename collection path from `/events/{eventId}` to `/projects/{projectId}` with data preservation

### Key Entities

- **Project**: Represents a long-running container (campaign, tour, initiative) that organizes events. Contains name, status, company association, share path, QR code reference, theme (temporary), scheduling fields (temporary), and active event/experience reference.
- **ProjectTheme**: Theme configuration for a project including brand colors, logos, and styling. Temporarily stored at project level; will move to nested Events in Phase 5.
- **Share Path**: Unique URL path that guests use to access the project's active experience. Format: `/p/{uniqueId}` or similar.
- **QR Code**: Generated image stored in Firebase Storage that encodes the share link, used for physical distribution at events.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing Event data is successfully migrated to Projects collection without data loss (100% data integrity)
- **SC-002**: Administrators can create a new project in under 1 minute via the UI
- **SC-003**: Projects List page loads and displays all projects for a company in under 2 seconds
- **SC-004**: Guest access via share links continues to work without interruption (0 broken guest flows)
- **SC-005**: All TypeScript compilation succeeds with strict mode and 0 type errors after refactor
- **SC-006**: All existing tests pass or are updated to reflect Project terminology (100% test success rate)
- **SC-007**: Project Details page renders correctly on mobile viewports (320px-768px) with all interactive elements functional
- **SC-008**: QR codes are generated and accessible within 5 seconds of project creation
- **SC-009**: Share links can be copied to clipboard in 1 click with visual confirmation

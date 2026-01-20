# Feature Specification: Guest Access & Welcome

**Feature Branch**: `037-guest-welcome`
**Created**: 2026-01-20
**Status**: Draft
**Input**: Epic E6: Guest Access & Welcome - Enable guests to access events via shareable links and see the welcome screen with available experiences

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Accesses Event via Shareable Link (Priority: P1)

A guest receives a shareable link to an event (e.g., `yoursite.com/join/abc123`) from an event organizer or marketing material. They click the link and are taken directly to the event's welcome screen where they can see available experiences and choose which one to participate in.

**Why this priority**: This is the core entry point for the entire guest experience. Without a working join route, guests cannot access any event content. This forms the foundation for all subsequent guest interactions.

**Independent Test**: Can be fully tested by visiting a join URL with a valid project ID and verifying the welcome screen displays with event branding and available experiences.

**Acceptance Scenarios**:

1. **Given** a valid project with an active, published event, **When** a guest visits `/join/{projectId}`, **Then** they see the welcome screen with the event's title, description, hero media, and available experiences.

2. **Given** a project with an active, published event containing multiple enabled experiences, **When** the welcome screen loads, **Then** all enabled experiences are displayed as clickable cards showing their name and thumbnail.

3. **Given** a guest with no prior visit history, **When** they access a join link, **Then** they are automatically authenticated anonymously and a guest record is created for their session.

---

### User Story 2 - Guest Selects an Experience (Priority: P2)

After viewing the welcome screen, a guest clicks on one of the available experience cards to participate. The system creates a new session for tracking their participation and navigates them to the experience page.

**Why this priority**: Experience selection is the primary call-to-action on the welcome screen. It connects the entry point (P1) to the experience execution (handled in E7).

**Independent Test**: Can be tested by clicking an experience card from the welcome screen and verifying navigation occurs with a session ID in the URL.

**Acceptance Scenarios**:

1. **Given** a guest on the welcome screen, **When** they click an experience card, **Then** a new session is created and they are navigated to `/join/{projectId}/experience/{experienceId}?session={sessionId}`.

2. **Given** a guest navigating to an experience route without a session ID, **When** the page loads, **Then** a new session is automatically created and the URL is updated to include the session ID.

3. **Given** a guest navigating to an experience route with an existing valid session ID, **When** the page loads, **Then** the existing session is loaded (no new session created).

---

### User Story 3 - Guest Encounters Invalid or Unavailable Event (Priority: P3)

A guest visits a join link that either doesn't exist, has no active event, or has an unpublished event. They see an appropriate error page explaining the situation.

**Why this priority**: Error handling ensures graceful degradation and clear user communication, but it's secondary to the happy path functionality.

**Independent Test**: Can be tested by visiting join URLs with various invalid states and verifying appropriate error pages display.

**Acceptance Scenarios**:

1. **Given** a non-existent project ID, **When** a guest visits `/join/{invalidProjectId}`, **Then** they see a 404 error page with "This page doesn't exist" message.

2. **Given** a project with no active event (activeEventId is null), **When** a guest visits `/join/{projectId}`, **Then** they see a "Coming Soon" page with "This experience isn't ready yet. Check back soon!" message.

3. **Given** a project with an active event that is not published, **When** a guest visits `/join/{projectId}`, **Then** they see a "Coming Soon" page.

4. **Given** a non-existent event ID referenced by activeEventId, **When** a guest visits `/join/{projectId}`, **Then** they see a 404 error page.

---

### User Story 4 - Guest Views Event with No Available Experiences (Priority: P4)

A guest accesses a valid, published event that has no enabled experiences. They see the welcome screen header content but with a message indicating no experiences are currently available.

**Why this priority**: This is an edge case of the primary flow where the event exists but has no content to show.

**Independent Test**: Can be tested by visiting a join URL for an event with all experiences disabled.

**Acceptance Scenarios**:

1. **Given** a published event with zero enabled experiences, **When** a guest visits the join link, **Then** they see the welcome screen title and description along with "No experiences available. Check back later" message.

---

### Edge Cases

- What happens when a guest's anonymous auth session expires? The system should create a new guest record on their next visit.
- How does the system handle slow network conditions? A loading skeleton should be displayed during data fetch.
- What happens if the experience card thumbnail fails to load? A placeholder image should be shown.
- What happens if the guest record creation fails? The guest should still be able to view the welcome screen (read-only) but experience selection may fail with an appropriate error message.
- What happens if session creation fails when selecting an experience? Display an error message and allow the guest to retry.

## Requirements *(mandatory)*

### Functional Requirements

#### Route & Navigation

- **FR-001**: System MUST provide a `/join/{projectId}` route that serves as the entry point for guests.
- **FR-002**: System MUST provide a `/join/{projectId}/experience/{experienceId}` route for experience pages.
- **FR-003**: The experience route MUST accept an optional `session` query parameter for session identification.

#### Access Validation

- **FR-004**: System MUST validate that the project exists when a guest visits a join link.
- **FR-005**: System MUST retrieve the `activeEventId` from the project document.
- **FR-006**: System MUST validate that the referenced event exists.
- **FR-007**: System MUST validate that the event is published (has `publishedConfig`).
- **FR-008**: System MUST display a 404 page when the project does not exist.
- **FR-009**: System MUST display a 404 page when the event (referenced by activeEventId) does not exist.
- **FR-010**: System MUST display a "Coming Soon" page when no activeEventId is set.
- **FR-011**: System MUST display a "Coming Soon" page when the event is not published.

#### Guest Authentication & Records

- **FR-012**: System MUST trigger anonymous authentication when a guest accesses a join link.
- **FR-013**: System MUST create a guest record on first visit, stored at `/projects/{projectId}/guests/{guestId}`.
- **FR-014**: Guest record MUST contain: id, projectId, authUid (anonymous auth UID), and createdAt timestamp.
- **FR-015**: System MUST associate the guest's anonymous auth UID with their guest record.

#### Welcome Screen

- **FR-016**: Welcome screen MUST display the event's hero media (if configured).
- **FR-017**: Welcome screen MUST display the event's welcome title and description.
- **FR-018**: Welcome screen MUST display only enabled experiences from the event's `publishedConfig.experiences.main` array.
- **FR-019**: Experience cards MUST display the experience name and thumbnail image.
- **FR-020**: Experience cards MUST be clickable/tappable to initiate experience selection.
- **FR-021**: Welcome screen MUST apply the event's theme configuration (colors, fonts).
- **FR-022**: System MUST display "No experiences available" message when no experiences are enabled.

#### Session Management

- **FR-023**: System MUST create a new session when a guest selects an experience without an existing session ID.
- **FR-024**: System MUST include the session ID in the URL when navigating to the experience route.
- **FR-025**: System MUST load an existing session when the session ID is provided in the URL.
- **FR-026**: Session MUST be associated with the workspace, experience, and be marked as guest mode.

#### Experience Route (Placeholder)

- **FR-027**: Experience route MUST display a placeholder message indicating "Experience loading..." or similar.
- **FR-028**: Experience route MUST display the session ID for debugging purposes (placeholder implementation).

### Key Entities

- **Project**: Represents a shareable photo experience project. Contains workspaceId, activeEventId (nullable), and other project metadata. Path: `/projects/{projectId}`

- **Event**: Configuration for a specific event instance. Contains publishedConfig with welcome settings, theme, and enabled experiences. Path: `/projects/{projectId}/events/{eventId}`

- **Guest**: Represents an anonymous visitor to the event. Contains id, projectId, authUid, and createdAt. Path: `/projects/{projectId}/guests/{guestId}`

- **Experience**: A photo/video experience that guests can participate in. Contains name, media (thumbnail), and published step configuration. Path: `/workspaces/{workspaceId}/experiences/{experienceId}`

- **Session**: Tracks a guest's participation in an experience. Contains workspaceId, experienceId, mode (guest), and references to the guest. Path: `/workspaces/{workspaceId}/sessions/{sessionId}`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guests can navigate from a shareable link to the welcome screen in under 3 seconds on standard broadband connections.

- **SC-002**: 95% of valid join links successfully display the welcome screen without errors.

- **SC-003**: Experience selection (from card click to experience page display) completes in under 2 seconds.

- **SC-004**: Appropriate error pages (404, Coming Soon) display within 2 seconds for invalid access attempts.

- **SC-005**: All enabled experiences for an event are visible on the welcome screen without truncation or hidden content.

- **SC-006**: Guest can complete the flow from join link to experience route in under 5 seconds (happy path).

- **SC-007**: Welcome screen correctly applies event theming (colors, fonts) matching the configured theme.

## Scope Boundaries

### In Scope

- `/join/{projectId}` route implementation
- `/join/{projectId}/experience/{experienceId}` route (placeholder only)
- Access validation (project exists, active event, published status)
- 404 and Coming Soon error pages
- Anonymous authentication integration
- Guest record creation
- Welcome screen display (run mode)
- Experience card rendering with click handling
- Session creation on experience selection
- URL parameter handling for session ID
- Event theme application

### Out of Scope

- Experience execution/runtime (E7)
- Share screen functionality (E8)
- Pregate/preshare flow (E7)
- Transform processing (E9)
- Full experience step rendering (E7)
- Analytics or tracking beyond basic guest/session records
- Returning guest recognition via localStorage (nice-to-have, not required)
- Advanced loading animations (nice-to-have)

## Assumptions

- Anonymous Firebase authentication is already configured and available in the application.
- The session creation service/function exists and can be called from the guest domain.
- The project, event, and experience data structures follow the schemas defined in the epic.
- The event's `publishedConfig` contains all necessary data for rendering the welcome screen.
- The existing welcome screen component from the event designer can be adapted for run mode.
- Theme configuration includes sufficient data to apply colors and fonts to the welcome screen.
- The existing route at `/guest/$projectId.tsx` will be migrated to the new `/join/$projectId` pattern.

## Dependencies

- E3 (Event-Experience Integration) must be complete - the event must have publishedConfig with experiences array.
- Firebase anonymous authentication must be enabled for the project.
- Experience data must be readable from `/workspaces/{workspaceId}/experiences/{experienceId}` with published field.

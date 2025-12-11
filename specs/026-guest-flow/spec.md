# Feature Specification: Guest Flow

**Feature Branch**: `026-guest-flow`
**Created**: 2024-12-11
**Status**: Draft
**Input**: Guest flow implementation from `/features/w50/guest-flow-prd.md` - Enable guests to access branded event experiences through shareable project links

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access Event via Share Link (Priority: P1)

A guest receives a share link (e.g., from a QR code, social media, or event invite) and visits the URL to access a branded event experience. They should immediately see the event's welcome screen with available experiences to choose from.

**Why this priority**: This is the core entry point for all guest interactions. Without functioning share links, no guest can access any event—making this the foundational requirement.

**Independent Test**: Can be fully tested by visiting `/join/[projectId]` with a valid project that has an active event. Delivers the ability for guests to discover and view event content.

**Acceptance Scenarios**:

1. **Given** a guest has a valid share link, **When** they visit `/join/[projectId]`, **Then** they see the welcome screen with event branding, title, description, and available experiences
2. **Given** a project exists but has no active event, **When** a guest visits the share link, **Then** they see an "Event has not been launched yet" message
3. **Given** a project does not exist, **When** a guest visits the share link, **Then** they see a "404 — Not Found" page
4. **Given** an event has no enabled experiences, **When** a guest visits the share link, **Then** they see an "Event is empty" message

---

### User Story 2 - View Welcome Screen Content (Priority: P1)

A guest viewing the welcome screen sees the full event branding and content: hero media (image or video), welcome title, description, and a list of available experiences in their configured layout.

**Why this priority**: The welcome screen is the guest's first impression and must display all configured content correctly to drive engagement and experience selection.

**Independent Test**: Can be fully tested by configuring an event with welcome content (hero media, title, description, experiences) and verifying all elements display correctly with applied theme.

**Acceptance Scenarios**:

1. **Given** an event has hero media configured, **When** the welcome screen loads, **Then** the hero media displays at the top of the screen
2. **Given** an event has a welcome title and description, **When** the welcome screen loads, **Then** both are displayed below the hero media
3. **Given** an event has enabled experiences, **When** the welcome screen loads, **Then** experiences are listed in the configured layout (list or grid)
4. **Given** an event has a custom theme, **When** the welcome screen loads, **Then** the theme is applied to all visual elements

---

### User Story 3 - Start an Experience (Priority: P1)

A guest taps on an available experience to begin participating. This creates a session and navigates them to the experience screen.

**Why this priority**: Starting an experience is the primary conversion action—transforming a passive viewer into an active participant. Without this, guests cannot interact with the AI photobooth.

**Independent Test**: Can be fully tested by tapping an experience card on the welcome screen and verifying the URL updates and experience screen displays with session information.

**Acceptance Scenarios**:

1. **Given** a guest is on the welcome screen, **When** they tap an experience, **Then** the URL updates to include `?exp={experienceId}` and the experience screen displays
2. **Given** a guest starts an experience, **When** the session is created, **Then** the URL updates to include `&s={sessionId}`
3. **Given** a guest is on the experience screen, **When** they tap the home button, **Then** query params are cleared and they return to the welcome screen

---

### User Story 4 - Seamless Authentication (Priority: P2)

A guest accessing the event is automatically authenticated anonymously without any sign-up friction. Their identity is preserved for session tracking and analytics.

**Why this priority**: Authentication must happen transparently to avoid blocking the user experience, but it's a supporting function to the primary flows.

**Independent Test**: Can be tested by visiting the share link and verifying authentication happens without user interaction, with a guest record created in the database.

**Acceptance Scenarios**:

1. **Given** a guest visits the share link for the first time, **When** the page loads, **Then** anonymous authentication happens automatically
2. **Given** authentication is in progress, **When** the welcome screen is loading, **Then** a loading indicator is displayed
3. **Given** a guest is authenticated, **When** the welcome screen loads, **Then** a guest record exists in the project's guests collection

---

### User Story 5 - Resume Session on Refresh (Priority: P2)

A guest who refreshes the page while in an experience maintains their session state. The same session is reused if their identity matches.

**Why this priority**: Session persistence prevents frustration and data loss, but is secondary to core navigation flows.

**Independent Test**: Can be tested by starting an experience, refreshing the page, and verifying the same session ID is preserved in the URL.

**Acceptance Scenarios**:

1. **Given** a guest is on the experience screen with `?exp={id}&s={sessionId}`, **When** they refresh the page, **Then** the existing session is resumed if the guest ID matches
2. **Given** a guest's identity has changed (e.g., cleared cookies), **When** they refresh a page with a session URL, **Then** a new session is created and the URL updates with the new session ID
3. **Given** a guest refreshes the welcome screen (no query params), **When** the page reloads, **Then** they remain on the welcome screen without a new session being created

---

### Edge Cases

- What happens when a guest navigates to an invalid `exp` parameter? → Show error message or redirect to welcome screen
- What happens if an experience is disabled after a guest starts it? → Handle gracefully with error message or redirect (TBD behavior)
- What happens when a guest clears cookies and returns? → New anonymous auth, new guest record, new session (existing session orphaned)
- What happens when multiple experiences are available and a guest switches between them? → Each switch creates a new session; previous session remains stored

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST resolve the active event from a project when a guest visits `/join/[projectId]`
- **FR-002**: System MUST display appropriate empty states for: non-existent project (404), no active event, and event with no enabled experiences
- **FR-003**: System MUST display welcome screen content including hero media, title, description, and experience list
- **FR-004**: System MUST apply the event's configured theme to all guest-facing screens
- **FR-005**: System MUST authenticate guests anonymously on first visit without user interaction
- **FR-006**: System MUST create a guest record in `/projects/{projectId}/guests/{guestId}` on first visit
- **FR-007**: System MUST manage URL state using query parameters: `?exp={experienceId}` for active experience and `&s={sessionId}` for session
- **FR-008**: System MUST create a session record in `/projects/{projectId}/sessions/{sessionId}` when a guest taps an experience
- **FR-009**: System MUST reuse existing session on page refresh if guest identity matches
- **FR-010**: System MUST create a new session if guest identity changes
- **FR-011**: System MUST display loading states during authentication and data resolution
- **FR-012**: System MUST provide home navigation that clears query params and returns to welcome screen

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Guest flow MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Experience cards and buttons MUST meet minimum touch target size (44x44px)
- **MFR-003**: Typography MUST be readable on mobile (minimum 14px for body text)
- **MFR-004**: Welcome screen layout MUST adapt to mobile viewport with appropriate spacing
- **MFR-005**: Hero media MUST scale appropriately for mobile screens

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Project ID from URL params MUST be validated
- **TSR-002**: Experience ID from query params MUST be validated before session creation
- **TSR-003**: Session ID from query params MUST be validated before session reuse
- **TSR-004**: Guest record schema MUST be validated with Zod before write operations
- **TSR-005**: Session record schema MUST be validated with Zod before write operations

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Guest record creation MUST use Admin SDK via Server Actions
- **FAR-002**: Session record creation MUST use Admin SDK via Server Actions
- **FAR-003**: Project and event data reads MAY use Client SDK for real-time updates
- **FAR-004**: Schemas for Guest and Session records MUST be defined in `features/guest/schemas/`
- **FAR-005**: Guest media assets MUST use full public URLs for instant rendering

### Key Entities

- **Guest**: Represents an anonymous visitor to an event. Linked to anonymous Firebase auth user. Stored per-project for analytics (visit counts, return guests). Key attributes: auth user reference, created timestamp.
- **Session**: Represents a single guest interaction with an experience. Tracks state for future use (step progress, generated assets). Key attributes: guest ID reference, experience ID reference, created timestamp, session state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guests can navigate from share link to welcome screen in under 3 seconds (including authentication)
- **SC-002**: 100% of valid share links display the correct event welcome screen
- **SC-003**: All three empty states (404, no active event, no experiences) display appropriate messages
- **SC-004**: Guests can start an experience with a single tap from the welcome screen
- **SC-005**: Session persistence works correctly on page refresh 100% of the time when guest identity matches
- **SC-006**: All guest-facing screens display correctly on mobile viewports (320px width minimum)
- **SC-007**: Event theme is consistently applied across all guest flow screens
- **SC-008**: Loading states are displayed during all asynchronous operations (no blank screens)

## Assumptions

- Anonymous Firebase authentication is sufficient for MVP guest identification
- Session data will be extended in future phases to track step progress and generated assets
- Experience screen MVP displays placeholder content (experience name, guest ID, session ID)
- The full experience engine implementation is out of scope for this feature
- Guests do not need to create accounts or sign in with credentials
- Each project maintains its own isolated guest and session collections
- Event theme is already configured through the theming module
- Welcome screen content is already configured through the welcome content system

## Dependencies

- **Theming Module** (`features/theming/`) — For applying event theme to guest screens
- **Welcome Screen Config** — Event welcome content (title, description, media, layout) from Events module
- **Experiences Module** (`features/experiences/`) — List of enabled experiences from event
- **Firebase Auth** — Anonymous authentication capability
- **Firestore** — Guest and session storage in project subcollections
- **Preview Shell Module** (`features/preview-shell/`) — Shared components for welcome screen

## Out of Scope

- Full experience engine implementation (this spec covers navigation/session only)
- Step-by-step experience flow execution
- Session completion and results handling
- Social sharing of results
- Analytics dashboard for session data
- Guest profile or preferences
- Multi-device session synchronization
- Session expiration or cleanup

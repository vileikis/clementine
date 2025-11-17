# Feature Specification: Events Designer

**Feature Branch**: `001-events-designer`
**Created**: 2025-11-17
**Status**: Draft
**Input**: User description: "features/events-designer/events-designer.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Between Event Design Sections (Priority: P1)

Event organizers need to move between different sections of the event designer (Welcome, Experiences, Ending) using a clear, URL-based navigation system that maintains context and allows for deep linking.

**Why this priority**: This establishes the foundational navigation architecture that all other features depend on. Without URL-based routing, organizers cannot bookmark specific sections, share links to specific design areas, or use browser navigation effectively.

**Independent Test**: Can be fully tested by navigating to `/events/:eventId/design/welcome`, `/events/:eventId/design/ending`, and verifying the URL updates while the sidebar remains persistent and the event document is not reloaded.

**Acceptance Scenarios**:

1. **Given** an event organizer is on the event design page, **When** they click on a section in the sidebar (Welcome, Ending, or an Experience), **Then** the URL updates to reflect the selected section and the content area displays the appropriate editor
2. **Given** an event organizer navigates to `/events/:eventId/design/welcome` directly, **When** the page loads, **Then** the Welcome editor is displayed and the sidebar highlights the Welcome section
3. **Given** an event organizer is editing the Welcome section, **When** they navigate to the Ending section, **Then** the URL changes to `/events/:eventId/design/ending`, the content area updates, and the event document is not reloaded
4. **Given** an event organizer uses browser back/forward buttons, **When** they click back after navigating from Welcome to Ending, **Then** the URL returns to the Welcome route and the Welcome editor is displayed

---

### User Story 2 - Create New Experience Inline (Priority: P2)

Event organizers need to create new experiences directly on the page using an inline form, rather than through a modal dialog, to streamline the creation workflow and maintain visual context.

**Why this priority**: This improves the experience creation flow by reducing modal interruptions and providing a more intuitive creation process. It builds on the routing foundation (P1) by navigating to the create route.

**Independent Test**: Can be fully tested by navigating to `/events/:eventId/design/experiences/create`, filling in the experience name and type, submitting the form, and verifying redirect to the experience editor.

**Acceptance Scenarios**:

1. **Given** an event organizer clicks "Create Experience" in the sidebar, **When** the action is triggered, **Then** they are navigated to `/events/:eventId/design/experiences/create` and see an inline form on the page
2. **Given** an event organizer is on the create experience form, **When** they enter only an experience name without selecting a type, **Then** the submit button remains disabled
3. **Given** an event organizer is on the create experience form, **When** they select only a type without entering a name, **Then** the submit button remains disabled
4. **Given** an event organizer is on the create experience form, **When** they provide both a valid name (non-empty) and select a type, **Then** the submit button becomes enabled
5. **Given** an event organizer submits a valid create experience form, **When** the experience is successfully created, **Then** they are redirected to `/events/:eventId/design/experiences/:experienceId` (the experience editor)

---

### User Story 3 - View and Manage Experiences in Sidebar (Priority: P2)

Event organizers need to see all their created experiences in the sidebar immediately upon entering the design section, allowing them to quickly navigate between experiences without additional menu interactions.

**Why this priority**: This complements the create flow (also P2) by providing persistent visibility of all experiences. Together, these stories deliver a complete experience management workflow.

**Independent Test**: Can be fully tested by creating multiple experiences and verifying they appear in the sidebar, remain visible across all design routes, and can be clicked to navigate to their respective editors.

**Acceptance Scenarios**:

1. **Given** an event organizer has created experiences for their event, **When** they navigate to any design route (`/events/:eventId/design/*`), **Then** the sidebar displays all experiences in the Experiences section without requiring additional clicks
2. **Given** an event organizer is viewing the experiences in the sidebar, **When** they click on an experience, **Then** they are navigated to `/events/:eventId/design/experiences/:experienceId` and the experience editor is displayed
3. **Given** an event organizer is on the Welcome editor, **When** they view the sidebar, **Then** the Experiences section remains visible and interactive
4. **Given** an event organizer creates a new experience, **When** they are redirected to the experience editor, **Then** the new experience appears in the sidebar list

---

### User Story 4 - Rename Content to Design (Priority: P3)

Event organizers see clearer terminology that reflects their mental model of "designing an event" rather than "editing content."

**Why this priority**: This is a cosmetic improvement that enhances user understanding but doesn't affect core functionality. It can be implemented independently at any time.

**Independent Test**: Can be fully tested by verifying all UI references to "Content" have been updated to "Design" in the navigation, sidebar, and route paths.

**Acceptance Scenarios**:

1. **Given** an event organizer is viewing the event builder, **When** they look at the main navigation tabs, **Then** they see a "Design" tab instead of a "Content" tab
2. **Given** an event organizer navigates to the design section, **When** they view the URL, **Then** it contains `/design` rather than `/content`
3. **Given** an event organizer is in the design section, **When** they view the sidebar heading, **Then** it displays terminology consistent with "designing" rather than "editing content"

---

### Edge Cases

- What happens when an event organizer navigates to `/events/:eventId/design/experiences/:experienceId` for a non-existent experience ID?
- What happens when an event organizer tries to create an experience with whitespace-only name?
- What happens when an event organizer creates an experience while offline and the creation fails?
- How does the system handle concurrent edits if an event organizer has multiple design tabs open?
- What happens when an event organizer navigates directly to `/events/:eventId/design` without a specific section?
- What happens when an event organizer presses back button multiple times rapidly?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide dedicated routes for each design section: `/events/:eventId/design/welcome`, `/events/:eventId/design/experiences/create`, `/events/:eventId/design/experiences/:experienceId`, `/events/:eventId/design/ending`
- **FR-002**: System MUST maintain URL state to reflect the currently selected design section at all times
- **FR-003**: System MUST render the Experiences section in the sidebar by default without requiring menu expansion
- **FR-004**: System MUST remove the "Experiences" menu item from the sidebar navigation
- **FR-005**: System MUST replace the create experience dialog with an inline form displayed on the page at `/events/:eventId/design/experiences/create`
- **FR-006**: System MUST validate experience creation form by requiring both name (non-empty) and type before enabling submission
- **FR-007**: System MUST redirect users to the experience editor route after successful experience creation
- **FR-008**: System MUST preserve the event document across navigation between design sections (no reload)
- **FR-009**: System MUST keep the sidebar persistent and visible across all design routes
- **FR-010**: System MUST support browser back/forward navigation between design sections
- **FR-011**: System MUST rename all "Content" references to "Design" in navigation, routes, and UI elements
- **FR-012**: System MUST trim whitespace from experience names before validation
- **FR-013**: System MUST update the sidebar experience list immediately after creating a new experience
- **FR-014**: System MUST handle invalid experience IDs in routes by showing a 404 page with a link back to the design section
- **FR-015**: System MUST redirect to the Welcome editor (`/events/:eventId/design/welcome`) when navigating to `/events/:eventId/design` without a specific section

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Design section MUST work on mobile viewport (320px-768px) with collapsible sidebar for small screens
- **MFR-002**: Sidebar navigation items MUST meet minimum touch target size (44x44px) on mobile
- **MFR-003**: Inline experience creation form MUST be fully usable on mobile with appropriately sized input fields and touch-friendly controls
- **MFR-004**: Experience type selector MUST be easily tappable on mobile devices (consider dropdown or radio buttons with adequate spacing)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Experience creation form inputs MUST be validated with Zod schema requiring non-empty name (after trimming) and valid experience type
- **TSR-002**: Route parameters (eventId, experienceId) MUST be validated to ensure they are valid Firestore document IDs
- **TSR-003**: Experience type selection MUST be type-safe and restricted to allowed values (photo/video/gif/wheel)

### Key Entities

- **Experience**: Represents an interactive element in the event (photo, video, gif, or wheel). Key attributes: name (string, required), type (enum: photo/video/gif/wheel, required), enabled status, ID (Firestore document ID). Stored in `/events/{eventId}/experiences/{experienceId}` subcollection.
- **Event**: Root entity representing the photobooth event. Maintains reference to design sections (welcome, ending) and contains experiences subcollection. Navigation context is scoped to a single event ID.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event organizers can navigate between all design sections using browser back/forward buttons without breaking the interface
- **SC-002**: Event organizers can create a new experience in under 30 seconds from clicking the create button to landing in the experience editor
- **SC-003**: Event organizers can bookmark or share a direct link to any design section and have it load the correct editor on first visit
- **SC-004**: The sidebar remains visible and interactive across 100% of design route transitions without flicker or reload
- **SC-005**: Event organizers can complete the experience creation flow without encountering any modal dialogs
- **SC-006**: All navigation actions complete in under 200ms on standard mobile networks (3G or better)

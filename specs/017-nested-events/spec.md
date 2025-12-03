# Feature Specification: Nested Events

**Feature Branch**: `017-nested-events`
**Created**: 2025-12-03
**Status**: Draft
**Input**: User description: "Phase 5: Events - Create nested time-bound instances under Projects with theme migration"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Event Within Project (Priority: P1)

As an experience creator, I want to create events within my project so that I can organize multiple themed activations under a single campaign.

**Why this priority**: Events are the core deliverable of Phase 5. Without the ability to create events, no other functionality can be used. This enables the fundamental project → event hierarchy.

**Independent Test**: Can be fully tested by creating a new event within an existing project and verifying it appears in the events list. Delivers the ability to organize time-bound activations.

**Acceptance Scenarios**:

1. **Given** I am viewing a project's Events tab with no events, **When** I click "Create Event" and enter a name, **Then** the event is created and appears in the events list
2. **Given** I am viewing a project's Events tab with existing events, **When** I click "Create Event", **Then** a new event is added to the list without affecting existing events
3. **Given** I enter an event name, **When** the event is created, **Then** it receives a default theme configuration

---

### User Story 2 - Configure Event Theme (Priority: P1)

As an experience creator, I want to customize the theme for each event so that each activation can have its own visual identity (colors, logo, background, typography).

**Why this priority**: Theme customization is essential for brand differentiation across events. This is the core reason for moving theme to event level. Equal priority with event creation as they work together.

**Independent Test**: Can be fully tested by navigating to an event's Theme tab, modifying theme settings, saving, and verifying the preview updates. Delivers branded event customization.

**Acceptance Scenarios**:

1. **Given** I am on an event's Theme tab, **When** I modify the primary color and save, **Then** the change is persisted and the live preview reflects the new color
2. **Given** I am editing event theme, **When** I upload a logo image, **Then** the logo appears in the preview and is saved to the event
3. **Given** I am editing event theme, **When** I upload a background image and adjust overlay opacity, **Then** the preview shows the background with the correct overlay darkness
4. **Given** I am editing theme, **When** I press Cmd+S (or Ctrl+S), **Then** the theme is saved without clicking the save button

---

### User Story 3 - View and Navigate Events List (Priority: P2)

As an experience creator, I want to see all events in my project so that I can manage and navigate between different activations.

**Why this priority**: While P1 creates events, P2 enables efficient management of multiple events. Essential for projects with several activations.

**Independent Test**: Can be fully tested by viewing the Events tab on a project with multiple events and clicking to navigate to each event's detail page.

**Acceptance Scenarios**:

1. **Given** I am on a project's Events tab with multiple events, **When** I view the list, **Then** each event shows its name and creation date
2. **Given** I am viewing the events list, **When** I click on an event card, **Then** I navigate to that event's detail page
3. **Given** an event is set as active, **When** I view the events list, **Then** the active event is visually distinguished from other events
4. **Given** I am on an event detail page, **When** I click "Back", **Then** I return to the project's Events tab

---

### User Story 4 - Set Active Event (Priority: P2)

As an experience creator, I want to designate one event as "active" so that guests accessing my project's share link see that specific event's theme and experiences.

**Why this priority**: The switchboard pattern is critical for the guest flow, but requires events to exist first (P1). This enables project → event routing.

**Independent Test**: Can be fully tested by setting an event as active and verifying the project's activeEventId is updated. Delivers the switchboard mechanism.

**Acceptance Scenarios**:

1. **Given** I am viewing an event that is not active, **When** I click "Set as Active", **Then** this event becomes the active event for the project
2. **Given** I set event B as active when event A was previously active, **When** I view the events list, **Then** event B shows as active and event A no longer shows as active
3. **Given** an event is already active, **When** I view its detail page, **Then** the "Set as Active" button is disabled or shows "Active" state

---

### User Story 5 - Edit Event Details (Priority: P3)

As an experience creator, I want to rename my event so that I can organize my activations with meaningful names.

**Why this priority**: Event renaming is helpful but not essential for MVP. Events can work with their original names.

**Independent Test**: Can be fully tested by editing an event name and verifying the change persists across page refreshes.

**Acceptance Scenarios**:

1. **Given** I am on an event detail page, **When** I edit the event name and save, **Then** the new name is displayed in the header and persisted
2. **Given** I provide an empty event name, **When** I try to save, **Then** validation prevents saving with an appropriate error message

---

### User Story 6 - Delete Event (Priority: P3)

As an experience creator, I want to delete events I no longer need so that my project stays organized.

**Why this priority**: Deletion is a housekeeping feature. Not essential for core functionality but important for long-term project hygiene.

**Independent Test**: Can be fully tested by deleting an event and verifying it no longer appears in the events list.

**Acceptance Scenarios**:

1. **Given** I am viewing an event, **When** I choose to delete it and confirm, **Then** the event is soft-deleted and no longer appears in the events list
2. **Given** I try to delete the active event, **When** I confirm deletion, **Then** the project's activeEventId is cleared
3. **Given** I want to delete an event, **When** I am prompted for confirmation, **Then** I can cancel and the event remains unchanged

---

### Edge Cases

- What happens when user tries to create an event with a very long name (>200 characters)? → Validation prevents and shows error message
- What happens when user deletes the only event in a project? → Project has no active event; events tab shows empty state
- What happens when user navigates to a deleted event's URL directly? → Should show 404 or redirect to project events tab
- What happens when theme save fails due to network error? → Error toast displayed, user can retry
- What happens when two users edit the same event's theme simultaneously? → Last write wins (standard behavior)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow creation of events nested under projects
- **FR-002**: System MUST store companyId on each event for query efficiency (denormalized from parent project)
- **FR-003**: System MUST initialize new events with a default theme configuration
- **FR-004**: System MUST allow updating event theme including: logo, font family, primary color, text settings (color, alignment), button settings (background color, text color, radius), and background settings (color, image, overlay opacity)
- **FR-005**: System MUST validate event names to be between 1-200 characters
- **FR-006**: System MUST support soft-deletion of events using a deletedAt timestamp
- **FR-007**: System MUST allow setting exactly one event as active per project
- **FR-008**: System MUST display events list sorted by creation date (newest first)
- **FR-009**: System MUST visually distinguish the active event in the events list
- **FR-010**: System MUST provide a placeholder "Experiences" tab on the event detail page (implementation deferred)
- **FR-011**: System MUST preserve theme and publishStartAt/publishEndAt fields on Project for backwards compatibility
- **FR-012**: System MUST store experiences as an embedded array on events (empty by default, linking deferred)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Events list and event detail pages MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Theme editor form controls MUST meet minimum touch target size (44x44px)
- **MFR-003**: Theme editor preview panel MUST be viewable on mobile (stacked layout below form on small screens)
- **MFR-004**: Event cards in list MUST be tappable with sufficient spacing between items

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Event creation and update forms MUST validate input with Zod schemas
- **TSR-002**: Event theme updates MUST validate color values as valid hex colors (#RRGGBB format)
- **TSR-003**: Image URLs (logo, background) MUST validate as proper URL format when provided
- **TSR-004**: Overlay opacity MUST validate as number between 0 and 1
- **TSR-005**: TypeScript strict mode MUST be maintained (no `any` escapes)

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Event create/update/delete operations MUST use Admin SDK via Server Actions
- **FAR-002**: Events list MUST support real-time updates using Client SDK subscriptions
- **FAR-003**: Event schemas MUST be defined in `features/events/schemas/`
- **FAR-004**: Event theme images (logo, background) MUST be stored as full public URLs
- **FAR-005**: setActiveEvent action MUST update Project.activeEventId atomically

### Key Entities

- **Event**: A time-bound, themed instance nested under a Project. Contains name, theme configuration, experiences array (empty initially), and optional scheduling fields. Identified by companyId for query efficiency.
- **EventTheme**: Visual customization settings for an event including logo, colors, typography, button styles, and background. Same structure as current ProjectTheme.
- **EventExperienceLink**: Embedded object linking an event to an experience from the company library. Contains experienceId and optional label override. (Data model defined, linking UI deferred)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Experience creators can create a new event within a project in under 30 seconds
- **SC-002**: Theme customization changes are reflected in live preview instantly (within 100ms of input)
- **SC-003**: Theme changes save successfully and persist across page refreshes within 2 seconds
- **SC-004**: Events list loads and displays up to 50 events within 1 second
- **SC-005**: 95% of users successfully complete the create event → customize theme → set active flow on first attempt
- **SC-006**: Zero data loss when transitioning from project-level theming to event-level theming (project theme preserved for backwards compatibility)

## Assumptions

- Phase 4 (Projects) is complete and the Projects feature module is stable
- Experience Library (Phase 2) is complete but event → experience linking UI is deferred
- Existing ThemeEditor component from projects can be adapted with minimal changes
- One active event per project is sufficient (no need for multiple simultaneous active events)
- Event scheduling (publishStartAt/publishEndAt) is stored but not enforced in this phase
- Guest flow updates to use event theme will be implemented in Phase 7

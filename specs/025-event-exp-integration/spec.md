# Feature Specification: Event-Experience Integration

**Feature Branch**: `025-event-exp-integration`
**Created**: 2026-01-14
**Status**: Draft
**Input**: Epic E3 - Enable admins to connect workspace experiences to events, managing which experiences appear in the welcome screen and guest flow.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect Main Experiences to Event (Priority: P1)

As an event admin, I want to connect workspace experiences to my event's welcome screen so that guests can choose which experience to participate in when they arrive.

**Why this priority**: This is the core feature - without the ability to connect main experiences, the event has no interactive content for guests. This enables the primary guest journey.

**Independent Test**: Can be fully tested by creating an event, opening the Welcome tab, adding experiences via the connect drawer, and verifying they appear in the welcome preview. Delivers immediate value as guests can now select experiences.

**Acceptance Scenarios**:

1. **Given** I am on the Welcome tab of the event designer, **When** I click "Add" in the Experiences section, **Then** a slide-over drawer opens from the right showing available experiences to connect.

2. **Given** the connect drawer is open, **When** I type in the search field, **Then** the experience list filters in real-time (debounced) by name.

3. **Given** the connect drawer shows available experiences, **When** I click on an experience, **Then** it is added to the event's main experiences and the drawer closes.

4. **Given** I have connected multiple main experiences, **When** I drag and drop to reorder them, **Then** the order is updated and reflected in the welcome preview.

5. **Given** I have connected a main experience, **When** I toggle the "enabled" switch off, **Then** the experience is dimmed in the preview and won't be shown to guests.

6. **Given** I have connected a main experience, **When** I toggle the "applyOverlay" switch, **Then** the overlay setting is updated (controls whether event branding overlay appears on guest results).

---

### User Story 2 - Configure Pregate Experience (Priority: P2)

As an event admin, I want to configure a pregate experience that runs before guests see the welcome screen, so I can collect information or show content before they choose their main experience.

**Why this priority**: Pregate experiences enable important use cases like collecting guest information, showing legal disclaimers, or displaying sponsor content before the main flow. Secondary to main experiences but valuable for enhanced guest journeys.

**Independent Test**: Can be tested by opening Settings tab, connecting a pregate experience, and verifying it appears in the Guest Flow section. Value is delivered when guests see this experience before the welcome screen.

**Acceptance Scenarios**:

1. **Given** I am on the Settings tab of the event designer, **When** I view the Guest Flow section, **Then** I see a "Before Welcome (Pregate)" slot that can hold one experience.

2. **Given** the pregate slot is empty, **When** I click "Add", **Then** the connect drawer opens showing only survey and story profile experiences (not freeform).

3. **Given** I have connected a pregate experience, **When** I view the slot, **Then** I see the experience with enable toggle and can remove it via context menu.

4. **Given** a pregate experience is configured, **When** I open the Welcome tab, **Then** I see an info callout indicating pregate is configured with a link to Settings.

---

### User Story 3 - Configure Preshare Experience (Priority: P2)

As an event admin, I want to configure a preshare experience that runs after the main experience but before the share screen, so I can collect feedback or show additional content before guests share their results.

**Why this priority**: Preshare experiences enable post-experience surveys, thank-you messages, or upsell content. Same priority as pregate as both enhance the guest journey in similar ways.

**Independent Test**: Can be tested by opening Settings tab, connecting a preshare experience to the appropriate slot, and verifying configuration. Value is delivered when guests see this after completing their main experience.

**Acceptance Scenarios**:

1. **Given** I am on the Settings tab of the event designer, **When** I view the Guest Flow section, **Then** I see a "Before Share (Preshare)" slot that can hold one experience.

2. **Given** the preshare slot is empty, **When** I click "Add", **Then** the connect drawer opens showing only survey and story profile experiences.

3. **Given** I have connected a preshare experience, **When** I view the slot, **Then** I can enable/disable it and remove it via context menu.

4. **Given** a preshare experience is configured, **When** I open the Welcome tab, **Then** I see an info callout indicating preshare is configured.

---

### User Story 4 - Welcome Screen WYSIWYG Preview (Priority: P3)

As an event admin, I want to see a live preview of how experiences will appear on the welcome screen so I can visualize the guest experience while configuring.

**Why this priority**: While functional without preview, the WYSIWYG provides confidence that the configuration is correct. It's a polish feature that enhances the admin experience.

**Independent Test**: Can be tested by connecting experiences and verifying the center preview column updates to show actual experience cards with thumbnails, names, and profile badges.

**Acceptance Scenarios**:

1. **Given** I have connected main experiences, **When** I view the welcome preview in the center column, **Then** I see actual experience cards (not placeholders) showing thumbnail, name, and profile badge.

2. **Given** I have disabled an experience, **When** I view the welcome preview, **Then** the disabled experience appears dimmed.

3. **Given** I add or remove an experience, **When** I view the welcome preview, **Then** the preview updates immediately to reflect the change.

4. **Given** I reorder experiences, **When** I view the welcome preview, **Then** the card order matches my configured order.

---

### User Story 5 - Create New Experience from Connect Drawer (Priority: P3)

As an event admin, I want to quickly create a new experience when connecting, so I don't have to leave the event designer if I don't have a suitable experience ready.

**Why this priority**: Convenience feature - admins can always create experiences separately and then connect them. This streamlines the workflow but isn't blocking.

**Independent Test**: Can be tested by opening the connect drawer and clicking "Create New Experience" to verify a new browser tab opens to the experience creation page.

**Acceptance Scenarios**:

1. **Given** the connect drawer is open, **When** I click "+ Create New Experience", **Then** a new browser tab opens to the experience creation page at `/workspace/{workspaceSlug}/experiences/new`.

2. **Given** I clicked "Create New Experience", **When** the new tab opens, **Then** the connect drawer remains open in the original tab so I can continue when ready.

---

### Edge Cases

- What happens when an experience is deleted from the workspace while assigned to an event? The event should handle missing experiences gracefully, showing a "missing" indicator or auto-removing the reference.
- What happens when the connect drawer has no available experiences? Shows an empty state message encouraging the user to create experiences first.
- What happens when all compatible experiences are already assigned? The list shows all experiences but marks assigned ones as "(in use)" and disables selection.
- What happens when search returns no results? Shows "No experiences found" empty state with clear search option.
- How does the system handle very long experience lists? The drawer should scroll with the search field sticky at top.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store experience references in the event configuration with experienceId, enabled flag, and applyOverlay flag (for main slot only).
- **FR-002**: System MUST support three experience slots: main (array, 0-n), pregate (single, 0-1), and preshare (single, 0-1).
- **FR-003**: System MUST filter available experiences by slot-compatible profiles: main accepts freeform/survey, pregate/preshare accept survey/story.
- **FR-004**: System MUST display a slide-over drawer from the right when connecting experiences.
- **FR-005**: System MUST provide real-time search filtering with debounced input (as-you-type).
- **FR-006**: System MUST disable selection of experiences already assigned to the current event.
- **FR-007**: System MUST allow drag-and-drop reordering of main experiences.
- **FR-008**: System MUST allow toggling enabled/disabled state for all experience slots.
- **FR-009**: System MUST allow toggling applyOverlay flag for main experiences only.
- **FR-010**: System MUST open experience editor in a new browser tab via context menu "Edit" action.
- **FR-011**: System MUST allow removing experiences from event without deleting the experience itself.
- **FR-012**: System MUST open the create experience page in a new browser tab when user clicks "Create New Experience".
- **FR-013**: System MUST display an info callout in Welcome tab when pregate or preshare experiences are configured, linking to Settings tab.
- **FR-014**: System MUST update the welcome screen preview in real-time as experiences are added, removed, reordered, or toggled.
- **FR-015**: System MUST default applyOverlay to true and enabled to true when connecting a new experience.

### Key Entities

- **ExperienceReference**: A pointer to a workspace experience assigned to an event slot. Contains experienceId (reference), enabled (boolean), and applyOverlay (boolean, main slot only).
- **ExperienceSlot**: A named position in the event where experiences can be assigned. Types: main (multiple, welcome screen), pregate (single, before welcome), preshare (single, after experience).
- **Experience**: A workspace-level content unit with a profile (freeform, survey, story), name, thumbnail, and steps. Referenced but not embedded in event config.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can connect an experience to an event in under 30 seconds (open drawer, search/select, confirm).
- **SC-002**: Admins can configure a complete event experience flow (main + pregate + preshare) in under 3 minutes.
- **SC-003**: 100% of experience changes are immediately reflected in the welcome preview without page refresh.
- **SC-004**: Search returns filtered results within 500ms of user stopping typing.
- **SC-005**: Drag-and-drop reordering provides immediate visual feedback and persists order correctly.
- **SC-006**: All experience configuration persists correctly across page refreshes and sessions.
- **SC-007**: Admins can visually distinguish enabled vs disabled experiences and overlay-on vs overlay-off states.

## Assumptions

- Experiences already exist in the workspace; this feature handles connection, not creation (creation page already exists).
- The event designer already has Welcome and Settings tabs where this UI will be integrated.
- Experience profiles (freeform, survey, story) are already defined and enforced at the experience level.
- The welcome screen preview component already exists and can accept experience data for rendering.
- Event configuration changes are persisted via existing draft/publish mechanisms.

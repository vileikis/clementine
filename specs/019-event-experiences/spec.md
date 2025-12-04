# Feature Specification: Event Experiences & Extras (General Tab)

**Feature Branch**: `019-event-experiences`
**Created**: 2024-12-04
**Status**: Draft
**Input**: PRD Phase 6 - Event Experiences & Extras (General Tab)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Guest-Selectable Experiences to Event (Priority: P1)

As an event creator, I want to attach company experiences to my event so guests can choose which AI-powered flow to run during the event.

**Why this priority**: This is the core value proposition - without experiences attached to events, guests have nothing to interact with. This enables the fundamental link between Events and Experiences.

**Independent Test**: Can be fully tested by creating an event, adding experiences from the company library, and verifying they appear in the event configuration. Delivers the ability to configure what guests see.

**Acceptance Scenarios**:

1. **Given** I am on the Event detail page General tab, **When** I click "Add Experience", **Then** I see a drawer listing all active experiences from my company library
2. **Given** the experience picker drawer is open, **When** I click an experience, **Then** I see its details (name, description) and can optionally set a custom label
3. **Given** I have selected an experience with optional label, **When** I click "Add Experience", **Then** the drawer closes and the experience appears as a card in the Experiences section
4. **Given** an experience is attached to the event, **When** I view the Experiences section, **Then** I see the experience name (or custom label) and an enabled/disabled toggle

---

### User Story 2 - Enable/Disable Experiences Without Removing (Priority: P1)

As an event creator, I want to toggle experiences on/off without removing them so I can temporarily hide options while preserving my configuration.

**Why this priority**: Equal priority to Story 1 as it's essential for event management flexibility. Creators need to adjust available options without losing setup work.

**Independent Test**: Can be tested by toggling an attached experience and verifying it changes state without being removed from the list.

**Acceptance Scenarios**:

1. **Given** an experience is attached and enabled, **When** I click the toggle switch on its card, **Then** the experience becomes disabled (visually muted) but remains in the list
2. **Given** an experience is disabled, **When** I click the toggle switch, **Then** the experience becomes enabled again
3. **Given** an experience is disabled, **When** the event is published, **Then** guests do not see this experience as an option (verified in future Phase 7)

---

### User Story 3 - Edit Attached Experience Configuration (Priority: P2)

As an event creator, I want to edit the label of an attached experience so I can customize how it appears to guests for this specific event.

**Why this priority**: Customization is valuable but not blocking for basic event setup. Creators can use default names initially.

**Independent Test**: Can be tested by clicking an experience card, modifying the label, saving, and verifying the updated label displays.

**Acceptance Scenarios**:

1. **Given** an experience is attached to the event, **When** I click its card (not the toggle), **Then** a drawer opens showing experience details and edit options
2. **Given** the edit drawer is open, **When** I modify the label field and click "Save Changes", **Then** the drawer closes and the card shows the updated label
3. **Given** the edit drawer is open, **When** I click "Open in Editor", **Then** the experience editor opens in a new tab

---

### User Story 4 - Remove Experience from Event (Priority: P2)

As an event creator, I want to remove an experience from my event so I can clean up options I no longer need.

**Why this priority**: Important for event management but secondary to adding and toggling experiences.

**Independent Test**: Can be tested by opening an experience edit drawer, clicking remove, confirming, and verifying the experience no longer appears.

**Acceptance Scenarios**:

1. **Given** the edit drawer is open for an attached experience, **When** I click "Remove Experience", **Then** I see a confirmation prompt
2. **Given** the confirmation prompt is shown, **When** I confirm removal, **Then** the drawer closes and the experience is removed from the Experiences section
3. **Given** the confirmation prompt is shown, **When** I cancel, **Then** the experience remains attached

---

### User Story 5 - Configure Pre-Entry Gate Extra (Priority: P2)

As an event creator, I want to add a pre-entry gate flow (like age verification or consent screens) that runs before guests can access any experiences.

**Why this priority**: Extras provide important event control but are optional - events work without them. Pre-entry gate is common for compliance use cases.

**Independent Test**: Can be tested by adding an experience to the pre-entry gate slot, configuring frequency, and verifying the slot shows the configured experience.

**Acceptance Scenarios**:

1. **Given** the Pre-Entry Gate slot is empty, **When** I click the "+" button, **Then** a drawer opens to configure this slot
2. **Given** the configure drawer is open, **When** I select an experience and choose a frequency (Always or Once per session), **Then** I can save the configuration
3. **Given** a Pre-Entry Gate is configured, **When** I view the Extras section, **Then** I see the experience name, frequency badge, enabled toggle, and remove button
4. **Given** a Pre-Entry Gate is configured, **When** I hover over the info icon, **Then** I see help text explaining the slot's purpose

---

### User Story 6 - Configure Pre-Reward Extra (Priority: P2)

As an event creator, I want to add a pre-reward flow (like a short survey) that runs after guests complete their experience but before seeing results.

**Why this priority**: Same level as pre-entry gate - both are optional extras with similar interaction patterns.

**Independent Test**: Can be tested by adding an experience to the pre-reward slot and verifying configuration similar to pre-entry gate.

**Acceptance Scenarios**:

1. **Given** the Pre-Reward slot is empty, **When** I click the "+" button, **Then** a drawer opens to configure this slot
2. **Given** the configure drawer is open, **When** I select an experience and frequency, **Then** I can save the configuration
3. **Given** a Pre-Reward is configured, **When** I view the Extras section, **Then** I see the configured experience with frequency and controls

---

### User Story 7 - Enable/Disable Extras Without Removing (Priority: P3)

As an event creator, I want to toggle extras on/off without losing their configuration so I can temporarily disable them while preserving settings.

**Why this priority**: Mirrors the experience toggle behavior. Valuable for flexibility but extras are already optional.

**Independent Test**: Can be tested by toggling an extra's enabled state and verifying configuration is preserved.

**Acceptance Scenarios**:

1. **Given** an extra slot has a configured experience, **When** I click the toggle on the slot card, **Then** the extra becomes disabled (visually muted) but configuration is preserved
2. **Given** an extra is disabled, **When** I click the toggle, **Then** it becomes enabled again with same configuration

---

### User Story 8 - Edit Extra Slot Configuration (Priority: P3)

As an event creator, I want to edit an extra's label and frequency settings so I can adjust behavior without reconfiguring from scratch.

**Why this priority**: Fine-tuning extras is lower priority than initial setup.

**Independent Test**: Can be tested by clicking an extra slot, modifying settings, saving, and verifying updates.

**Acceptance Scenarios**:

1. **Given** an extra slot is configured, **When** I click the slot card body (not toggle/remove), **Then** a drawer opens with current settings
2. **Given** the edit drawer is open, **When** I change the frequency and save, **Then** the slot card shows the updated frequency
3. **Given** the edit drawer is open, **When** I click "Remove from Slot", **Then** the slot returns to empty state

---

### Edge Cases

- What happens when a company has no experiences? The picker drawer shows an empty state with guidance to create experiences first.
- What happens when the same experience is added twice to the experiences array? System prevents duplicate experienceIds in the array.
- What happens when an experience used in an extra is deleted from the company library? The reference remains but displays as "Experience not found" with option to remove.
- What happens when user clicks save with no changes? Save button is disabled when no changes detected, or save completes silently.
- How does system handle concurrent edits to the same event? Last write wins with standard optimistic updates.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a "General" tab (renamed from "Experiences") on the Event detail page containing two sections: Experiences and Extras
- **FR-002**: System MUST allow users to add experiences from their company library to an event's experiences array
- **FR-003**: System MUST prevent adding duplicate experiences (same experienceId) to the experiences array
- **FR-004**: System MUST allow users to set an optional custom label when adding or editing an experience link
- **FR-005**: System MUST allow users to enable/disable attached experiences via inline toggle without removing them
- **FR-006**: System MUST visually distinguish disabled experiences (muted/grayed appearance)
- **FR-007**: System MUST allow users to remove experiences from the event with confirmation
- **FR-008**: System MUST provide "Open in Editor" links to navigate to the experience editor in a new tab
- **FR-009**: System MUST display two extra slots: Pre-Entry Gate and Pre-Reward, each with informational tooltips
- **FR-010**: System MUST allow users to assign an experience to each extra slot with a required frequency setting (Always or Once per session)
- **FR-011**: System MUST allow users to enable/disable configured extras via inline toggle
- **FR-012**: System MUST allow users to edit extra configuration (label, frequency) without re-selecting the experience
- **FR-013**: System MUST allow users to remove an extra from its slot, returning it to empty state
- **FR-014**: System MUST persist all changes immediately upon user action (add, update, remove, toggle)
- **FR-015**: System MUST initialize new events with empty extras: `{ preEntryGate: null, preReward: null }`

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: General tab MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Experience cards in grid MUST stack vertically on mobile viewports
- **MFR-003**: Toggle switches MUST meet minimum touch target size (44x44px)
- **MFR-004**: Drawers MUST use full-width or near-full-width on mobile viewports
- **MFR-005**: Extra slot cards MUST be fully visible without horizontal scrolling on mobile

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All experience link data MUST be validated with Zod schema (experienceId required, label optional string, enabled boolean, frequency optional enum)
- **TSR-002**: All server action inputs MUST be validated before processing
- **TSR-003**: Frequency values MUST be constrained to enum: "always" | "once_per_session"
- **TSR-004**: Slot values MUST be constrained to enum: "preEntryGate" | "preReward"

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: All write operations (add/update/remove experience links, set/update/remove extras) MUST use Server Actions with Admin SDK
- **FAR-002**: Experience list for picker MUST be fetched using appropriate read pattern
- **FAR-003**: Event updates MUST use Firestore array operations for experiences array modifications
- **FAR-004**: Schemas MUST be defined in `features/events/schemas/` directory

### Key Entities

- **EventExperienceLink**: Unified configuration linking an experience to an event. Contains experienceId (reference), optional label override, enabled state, and optional frequency (for extras only).
- **EventExtras**: Container for slot-based extra flows. Contains preEntryGate and preReward slots, each holding an EventExperienceLink or null.
- **Event.experiences**: Array of EventExperienceLink for guest-selectable experiences.
- **Event.extras**: EventExtras object for slot-based flows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event creators can add an experience to an event in under 30 seconds (open drawer, select experience, confirm)
- **SC-002**: Event creators can toggle an experience or extra enabled/disabled with a single click
- **SC-003**: 100% of experience links preserve configuration when toggled disabled and back to enabled
- **SC-004**: Event creators can configure both extra slots within 2 minutes of entering the General tab
- **SC-005**: All drawer interactions (open, edit, save, cancel) complete without page navigation
- **SC-006**: Zero data loss when users cancel edits or navigate away from unsaved drawers (drawers don't auto-save partial state)

## Assumptions

- Company has at least one active experience available to attach to events
- Users have appropriate permissions to edit events within their company
- Experience data (name, description) is available for display when resolving experience links
- The "Open in Editor" navigation follows existing routing patterns in the application
- Existing Event detail page structure supports adding a new tab section

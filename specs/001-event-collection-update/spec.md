# Feature Specification: Event Collection Schema Refactor

**Feature Branch**: `001-event-collection-update`
**Created**: 2025-11-19
**Status**: Draft
**Input**: User description: "Refactor the events collection to create a more structured, scalable, and readable schema by grouping related fields into semantic objects, removing deprecated fields, and aligning the Event Designer UI with the new structure."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Welcome Screen (Priority: P1)

Event creators need to configure welcome screen settings (title, body, CTA, background) in the Event Designer. These settings should be organized under a single "welcome" object rather than scattered across multiple prefixed fields.

**Why this priority**: Welcome screen is the first impression guests receive. This is core functionality that must work for any event to be viable. Without it, creators cannot brand their event entrance.

**Independent Test**: Can be fully tested by opening the Event Designer, navigating to the welcome screen editor, modifying welcome settings, saving, and verifying the data is stored in the `event.welcome` object in Firestore.

**Acceptance Scenarios**:

1. **Given** an event creator is editing an event, **When** they navigate to the welcome screen editor and modify welcome title, body, CTA label, and background, **Then** the changes are saved to `event.welcome.*` fields in Firestore
2. **Given** an existing event with legacy welcome-prefixed fields, **When** the creator opens the Event Designer, **Then** the welcome editor displays existing values correctly from the new `event.welcome` object structure
3. **Given** a creator saves welcome screen changes, **When** they reload the page, **Then** all welcome settings persist and display correctly

---

### User Story 2 - Configure Ending Screen (Priority: P1)

Event creators need to configure ending screen settings (title, body, CTA label/URL) in the Event Designer. These settings should be organized under a single "ending" object.

**Why this priority**: Ending screen is the final touchpoint where creators can drive actions (e.g., "Visit our website"). This is essential for event conversion goals and must work for the feature to deliver value.

**Independent Test**: Can be fully tested by opening the Event Designer, navigating to the ending screen editor, modifying ending settings and share configuration, saving, and verifying the data is stored in the `event.ending` and `event.share` objects in Firestore.

**Acceptance Scenarios**:

1. **Given** an event creator is editing an event, **When** they navigate to the ending screen editor and modify ending title, body, CTA label, and CTA URL, **Then** the changes are saved to `event.ending.*` fields in Firestore
2. **Given** an event creator is editing an event, **When** they configure share settings (download, email, system share, social platforms), **Then** the changes are saved to `event.share.*` fields in Firestore
3. **Given** an existing event with legacy end-prefixed and share-prefixed fields, **When** the creator opens the Event Designer, **Then** the ending editor displays existing values correctly from the new `event.ending` and `event.share` object structures

---

### User Story 3 - Configure Event Theme (Priority: P2)

Event creators need to configure event-wide theme settings (button color, button text color, background color, background image) in the Event Designer. These settings should be organized under a single "theme" object.

**Why this priority**: Theme customization enables brand consistency across the event experience. While important for professional events, it's secondary to functional screens (welcome/ending). Events can function without custom theming but not without content.

**Independent Test**: Can be fully tested by opening the Event Designer, accessing theme settings, modifying colors and background, saving, and verifying the data is stored in the `event.theme` object in Firestore.

**Acceptance Scenarios**:

1. **Given** an event creator is editing an event, **When** they navigate to theme settings and modify button color, button text color, background color, and background image, **Then** the changes are saved to `event.theme.*` fields in Firestore
2. **Given** an existing event with legacy `brandColor` field, **When** the creator opens the Event Designer theme settings, **Then** the theme editor does NOT display or reference the deprecated `brandColor` field
3. **Given** a creator saves theme changes, **When** they preview the event, **Then** the theme settings are applied consistently across all event screens

---

### User Story 4 - Remove Deprecated Survey Fields (Priority: P3)

The system should no longer store or reference deprecated survey-related fields, `brandColor`, or `showTitleOverlay` fields. These were part of a cancelled feature and should be cleaned up.

**Why this priority**: This is cleanup work that improves code maintainability and prevents confusion. It doesn't directly impact user functionality but ensures the schema is accurate and future-proof. Lowest priority since existing events may have this legacy data, but new events won't use it.

**Independent Test**: Can be fully tested by inspecting Firestore validation rules to confirm deprecated fields are denied, and by searching the codebase to verify no code references these fields.

**Acceptance Scenarios**:

1. **Given** a developer attempts to write data to deprecated survey-prefixed fields via Firestore, **When** the write operation executes, **Then** it is rejected by Firestore validation rules
2. **Given** a code search for deprecated field names (`brandColor`, `showTitleOverlay`, survey-prefixed fields), **When** the search completes, **Then** no active code references are found (excluding legacy migration utilities)
3. **Given** an event creator creates a new event, **When** they save the event, **Then** the event document contains only the new grouped fields and none of the deprecated fields

---

### Edge Cases

- What happens when an existing event has both legacy prefixed fields AND new grouped object fields? (Assumption: New grouped fields take precedence; legacy fields are ignored)
- How does the system handle events with partial data (e.g., welcome title but no welcome body)? (Assumption: All welcome/ending/theme fields are optional; partial data is valid)
- What happens if share configuration is missing? (Assumption: `event.share` is required with default values: `allowDownload: true`, `allowSystemShare: true`, `allowEmail: false`, `socials: []`)
- How are theme settings applied if `event.theme` is undefined? (Assumption: System uses default theme values defined in the application)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Event document MUST store welcome screen settings in a `welcome` object containing optional fields: `title`, `body`, `ctaLabel`, `backgroundImage`, `backgroundColor`
- **FR-002**: Event document MUST store ending screen settings in an `ending` object containing optional fields: `title`, `body`, `ctaLabel`, `ctaUrl`
- **FR-003**: Event document MUST store share configuration in a `share` object (required) containing: `allowDownload`, `allowSystemShare`, `allowEmail`, `socials` array
- **FR-004**: Event document MUST store theme settings in a `theme` object containing optional fields: `buttonColor`, `buttonTextColor`, `backgroundColor`, `backgroundImage`
- **FR-005**: Event Designer welcome editor MUST read and write values from `event.welcome.*` fields only
- **FR-006**: Event Designer ending editor MUST read and write values from `event.ending.*` and `event.share.*` fields only
- **FR-007**: Event Designer theme editor MUST read and write values from `event.theme.*` fields only
- **FR-008**: System MUST NOT read or write to deprecated fields: survey-prefixed fields, `brandColor`, `showTitleOverlay`, welcome-prefixed fields, end-prefixed fields, share-prefixed fields
- **FR-009**: Firestore validation rules MUST deny write operations to deprecated fields
- **FR-010**: Event document MUST preserve all existing required fields unchanged: ownership fields (`companyId`, `joinPath`, `qrPngPath`), visibility window fields (`publishStartAt`, `publishEndAt`), denormalized counters (`experiencesCount`, `sessionsCount`, `readyCount`, `sharesCount`), timestamps (`createdAt`, `updatedAt`)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Event Designer editors (welcome, ending, theme) MUST be fully functional on mobile viewports (320px-768px)
- **MFR-002**: Form controls for editing nested object fields MUST meet minimum touch target size (44x44px)
- **MFR-003**: Event Designer navigation between editors MUST work seamlessly on mobile devices
- **MFR-004**: Field labels and help text MUST be readable on mobile screens (≥14px for body text)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Event schema MUST be validated with Zod schema defining `EventTheme`, `EventWelcome`, `EventEnding`, and `EventShareConfig` interfaces
- **TSR-002**: All Event Designer form inputs MUST validate nested object fields using Zod schemas before saving to Firestore
- **TSR-003**: TypeScript types for Event document MUST match the new nested object structure exactly
- **TSR-004**: No `any` types MUST be used when accessing nested object properties (e.g., `event.welcome.title` must be typed)

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: All event document write operations (create/update) MUST use Admin SDK via Server Actions for the new nested object structure
- **FAR-002**: Event Designer real-time subscriptions MUST use Client SDK to listen for changes to `event.welcome`, `event.ending`, `event.share`, `event.theme` objects
- **FAR-003**: Event schema definitions (Zod schemas for `EventTheme`, `EventWelcome`, `EventEnding`, `EventShareConfig`) MUST be located in `web/src/lib/schemas/event.ts`
- **FAR-004**: Firestore validation rules MUST be updated to enforce nested object structure and deny deprecated fields
- **FAR-005**: Image URLs in `welcome.backgroundImage`, `theme.backgroundImage` MUST be stored as full public URLs

### Key Entities *(include if feature involves data)*

- **Event**: Root event configuration document with nested objects for welcome screen (`welcome`), ending screen (`ending`), share settings (`share`), and theme customization (`theme`). Maintains existing ownership, visibility, and counter fields.
- **EventTheme**: Nested object storing event-wide visual customization (button colors, background color/image)
- **EventWelcome**: Nested object storing welcome screen configuration (title, body, CTA label, background)
- **EventEnding**: Nested object storing ending screen configuration (title, body, CTA label and URL)
- **EventShareConfig**: Nested object storing share settings (download/email/system share toggles, social platform array)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event creators can configure welcome screen settings and changes are persisted in under 2 seconds
- **SC-002**: Event creators can configure ending screen and share settings and changes are persisted in under 2 seconds
- **SC-003**: Event creators can configure theme settings and changes are persisted in under 2 seconds
- **SC-004**: 100% of Event Designer editors correctly read and write to new nested object fields (verified by integration tests)
- **SC-005**: 0% of codebase references deprecated fields (verified by codebase search)
- **SC-006**: Firestore validation rules reject 100% of write attempts to deprecated fields (verified by security rule tests)
- **SC-007**: Event Designer remains fully functional on mobile viewports with no usability regressions (verified by manual testing on 320px-768px screens)

## Assumptions

1. **No data migration required**: The specification states "No need to add any data migrations of existing data in firestore." This means existing events with legacy fields will remain unchanged in Firestore, but the application will only read/write using the new nested structure going forward.

2. **New events only use new structure**: Events created after this refactor will only contain the new nested object fields. Legacy events may have both old and new fields temporarily until naturally updated through the Event Designer.

3. **Default share configuration**: If `event.share` is undefined, the system will use defaults: `allowDownload: true`, `allowSystemShare: true`, `allowEmail: false`, `socials: []`.

4. **Default theme values**: If `event.theme` is undefined or specific theme fields are missing, the system will use application-defined default colors and backgrounds.

5. **Partial welcome/ending data is valid**: All fields within `welcome`, `ending`, and `theme` objects are optional. Events can have partial configurations (e.g., welcome title without body).

6. **Guest-facing screens unaffected**: This refactor focuses on the Event Designer (admin/creator experience). Guest-facing screens continue to function without modification, reading from the new nested structure.

7. **Survey feature remains cancelled**: The removal of survey-prefixed fields confirms the survey feature (defined in data model but not implemented) remains out of scope. No survey functionality will be developed as part of this refactor.

## Dependencies

- Existing Event Designer UI components for welcome, ending, and theme editors
- Firestore Admin SDK and Client SDK setup
- Zod validation library for schema definitions
- Existing event schema (`web/src/lib/schemas/event.ts`)
- Firestore security rules configuration

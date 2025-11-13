# Feature Specification: Events Builder Redesign

**Feature Branch**: `001-events-builder-redesign`
**Created**: 2025-11-13
**Status**: Draft
**Input**: User description: "redesign events builder to support fully fledged flows with 4 key components: welcome, experiences, survey, ending"

## User Scenarios & Testing *(mandatory)*

### User Story 0 - Base Events UI Navigation Shell (Priority: P0)

As an event creator, I need a custom navigation interface when viewing a specific event so that I can access all event management features from a central location.

**Why this priority**: This is the foundational infrastructure that enables all other features. Without this navigation shell, no other event builder features can be accessed. It must be implemented first.

**Independent Test**: Can be fully tested by navigating to an event page and verifying the custom navigation renders correctly with all required elements, even if tabs show WIP/placeholder content.

**Acceptance Scenarios**:

1. **Given** I navigate to a specific event URL, **When** the page loads, **Then** the default app navigation is hidden and replaced with custom event navigation
2. **Given** I am viewing an event, **When** I look at the navigation, **Then** I see: Events breadcrumb, Event name, Content/Distribute/Results tabs, Copy link button, and Status dropdown in a single row
3. **Given** I am viewing an event, **When** I click on "Events" in the breadcrumb, **Then** I am redirected to the main events dashboard
4. **Given** I am viewing an event, **When** I click on the event name, **Then** an edit name dialog opens
5. **Given** I am viewing an event, **When** I click the Copy link button, **Then** the event join link is copied to clipboard
6. **Given** I am viewing an event, **When** the page loads, **Then** the Content tab is selected by default
7. **Given** I click on the Distribute tab, **When** the tab loads, **Then** I see the distribution settings (same as current implementation)
8. **Given** I click on the Results tab, **When** the tab loads, **Then** I see placeholder analytics showing: "0 sessions, 0 shares, 0 downloads, 0 reach" with "WIP coming soon" message below
9. **Given** the Content tab is not yet implemented, **When** I click on the Content tab, **Then** I see a WIP/placeholder message (acceptable until other stories are implemented)

---

### User Story 1 - Content Tab Layout Infrastructure (Priority: P1)

As an event creator, I need the Content tab to have a structured layout with left sidebar and main content area so that I can organize and access all event configuration sections.

**Why this priority**: The Content tab layout is the foundation for all event configuration features (welcome, experiences, survey, ending). Without this structure, no content features can be built.

**Independent Test**: Can be fully tested by navigating to the Content tab and verifying the layout renders with left sidebar containing four sections (Welcome, Experiences, Survey, Ending) and a main content area, even if sections show placeholder content.

**Acceptance Scenarios**:

1. **Given** I am viewing an event, **When** I click on the Content tab, **Then** I see a layout with left sidebar and main content area
2. **Given** I am on the Content tab, **When** I view the left sidebar, **Then** I see four sections: Welcome (single item), Experiences (with + button), Survey (with + button), and Ending (single item)
3. **Given** I click on any sidebar item, **When** the selection changes, **Then** the main content area updates to show relevant controls (or placeholder if not yet implemented)
4. **Given** I am viewing the Content tab on mobile, **When** the page loads, **Then** the sidebar is collapsible/toggleable to allow full-width content view

---

### User Story 2 - Configure Welcome Screen (Priority: P1)

As an event creator, I need to configure the welcome screen for my event so that guests see branded entry experience when they join.

**Why this priority**: The welcome screen is the first guest touchpoint and critical for brand identity.

**Independent Test**: Can be fully tested by clicking the Welcome item in the sidebar, configuring welcome settings (title, description, CTA, colors/background), and verifying the preview displays correctly.

**Acceptance Scenarios**:

1. **Given** I am on the Content tab, **When** I click on the Welcome item in the left sidebar, **Then** I see design controls for title, description, CTA label, color, and background color with a live preview
2. **Given** I have configured welcome screen settings, **When** I update any field, **Then** the preview updates in real-time
3. **Given** I have set a welcome background image, **When** I view the preview, **Then** the image is displayed as the background
4. **Given** I have set a welcome background color without an image, **When** I view the preview, **Then** the solid color is displayed as the background
5. **Given** I have not set any background, **When** I view the preview, **Then** the default theme background is displayed

---

### User Story 3 - Manage Photo Experiences (Priority: P1)

As an event creator, I need to add and configure photo experiences so that guests can capture and transform photos during the event.

**Why this priority**: Photo experiences are the core value proposition of the platform and the minimum viable experience type.

**Independent Test**: Can be fully tested by clicking the + button in Experiences section, adding a photo experience, configuring its settings (label, overlays, AI settings), and verifying it appears in the experiences list and can be edited.

**Acceptance Scenarios**:

1. **Given** I am on the Content tab, **When** I click the + button in the Experiences section, **Then** I see a dialog to select experience type
2. **Given** I select "Photo" experience type, **When** I confirm, **Then** a new photo experience is created and appears in the experiences list
3. **Given** I have created a photo experience, **When** I click on it in the sidebar, **Then** the experience editor opens in the main content area
4. **Given** I am editing a photo experience, **When** I configure settings (label, capture options, overlays, AI prompt), **Then** the settings are saved
5. **Given** I have multiple experiences, **When** I view the experiences list, **Then** I see each experience listed with its label
6. **Given** I select a photo experience, **When** I view the experience editor, **Then** I see controls similar to the current scene builder interface

---

### User Story 4 - Configure Event Survey (Priority: P2)

As an event creator, I need to add and configure survey steps so that I can collect feedback from guests.

**Why this priority**: Surveys provide valuable data collection capability but are optional for basic event functionality.

**Independent Test**: Can be fully tested by adding survey steps, configuring their order and settings, enabling/disabling the survey, and verifying the preview displays correctly.

**Acceptance Scenarios**:

1. **Given** I am on the Content tab, **When** I click the + button in the Survey section, **Then** I see a dialog to select survey step type
2. **Given** I select a survey step type, **When** I confirm, **Then** a new step is created and appears in the survey list
3. **Given** I have created survey steps, **When** I view the Survey section, **Then** I see toggles to enable/disable survey and make it required
4. **Given** I have multiple survey steps, **When** I reorder them via drag-and-drop, **Then** the order is updated and persisted
5. **Given** I click on a survey step, **When** the step opens, **Then** I see design controls for that step type with a preview on the right
6. **Given** the survey is disabled, **When** guests complete experiences, **Then** they do not see survey steps

---

### User Story 5 - Configure Ending Screen (Priority: P2)

As an event creator, I need to configure the ending screen so that guests see branded completion experience with share options.

**Why this priority**: The ending screen completes the guest journey and enables sharing, but events can function with default settings.

**Independent Test**: Can be fully tested by configuring ending screen settings (headline, body, CTA, share options) and verifying the preview displays correctly.

**Acceptance Scenarios**:

1. **Given** I am on the Content tab, **When** I click on the Ending item in the left sidebar, **Then** I see design controls for end screen settings and share configuration
2. **Given** I configure ending screen fields (headline, body, CTA label, CTA URL), **When** I view the preview, **Then** all fields are displayed correctly
3. **Given** I configure share options (download, email, social platforms), **When** I view the preview, **Then** enabled options are visible
4. **Given** I disable a share option, **When** I view the preview, **Then** that option is hidden

---

### User Story 6 - View Experience Types (Priority: P3)

As an event creator, I want to see all available experience types (photo, video, gif, wheel) so that I understand future capabilities.

**Why this priority**: Visibility of future features helps creators plan, but only photo experiences are functional in this phase.

**Independent Test**: Can be fully tested by opening the experience type selector and verifying all types are listed with appropriate "coming soon" indicators.

**Acceptance Scenarios**:

1. **Given** I click the + button in Experiences section, **When** the type selector dialog opens, **Then** I see Photo (enabled), Video (coming soon), GIF (coming soon), and Wheel (coming soon)
2. **Given** I see a "coming soon" experience type, **When** I attempt to select it, **Then** it is disabled and cannot be selected

---

### Edge Cases

- What happens when a user tries to save an event with no experiences configured?
- How does the system handle invalid or missing required fields in welcome/ending screens?
- What happens when a user tries to reorder survey steps but the drag operation fails?
- How does the system handle very long titles or descriptions that exceed display limits?
- What happens when a user navigates away from the builder with unsaved changes?
- How does the system handle concurrent edits to the same event by multiple users?
- What happens when an experience is deleted but is still referenced in guest sessions?

## Assumptions

### Implementation Approach

- **Phased Development**: Implementation will follow a phased approach, starting with layout structure before adding business logic
  - **Phase 0**: Base Events UI navigation shell (User Story 0) - can show WIP/placeholder content initially
  - **Phase 1**: Content tab layout infrastructure (User Story 1) - establishes structure for all content features
  - **Phase 2**: Individual content features (User Stories 2-6) - implement welcome, experiences, survey, ending configurations
- **Layout-First Strategy**: The core layout (navigation shell + Content tab structure) will be implemented first to ensure correct visual structure, then features will be added incrementally
- **Out of Scope for Initial Implementation**:
  - Denormalized counters on events collection (can be added later without update logic)
  - Collections: /experienceItems, /participants, /sessions, /shares (guest experience is separate project)
  - Experience types: Only photo experiences are functional; video, gif, and wheel are visible but disabled with "coming soon" indicators

### Data Model

- Event data follows the structure defined in events-data-model.md
- Experience types supported: "photo" (functional), "video" | "gif" | "wheel" (visible but disabled)
- Survey step types supported: "short_text" | "long_text" | "multiple_choice" | "opinion_scale" | "email" | "statement"

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display custom event navigation when viewing a specific event (no default top navigation)
- **FR-002**: Navigation MUST include: Events breadcrumb, Event name, Content/Distribute/Results tabs, Copy link button, and Status dropdown
- **FR-003**: Content tab MUST display a left sidebar with four sections: Welcome (single item), Experiences (with + button), Survey (with + button), and Ending (single item)
- **FR-004**: Main content area MUST display design controls and preview based on the selected sidebar item
- **FR-005**: Welcome item MUST provide controls for: title, description, CTA label, color, and background color/image
- **FR-006**: Experiences section MUST allow adding new experiences via + button that opens experience type selector dialog
- **FR-007**: Experience type selector MUST show Photo (enabled), Video (disabled/coming soon), GIF (disabled/coming soon), and Wheel (disabled/coming soon)
- **FR-008**: Experiences list MUST display all created experiences using their label field
- **FR-009**: Clicking on an experience MUST open the experience editor in the main content area
- **FR-010**: Photo experience editor MUST provide controls similar to current scene builder (label, capture options, overlays, AI configuration)
- **FR-011**: Survey section MUST provide toggles to enable/disable survey and make it required
- **FR-012**: Survey section MUST allow adding new survey steps via + button that opens step type selector dialog
- **FR-013**: Survey step type selector MUST show available step types (short_text, long_text, multiple_choice, opinion_scale, email, statement)
- **FR-014**: Survey steps list MUST display all created steps using their title field
- **FR-015**: Survey steps MUST support drag-and-drop reordering
- **FR-016**: Clicking on a survey step MUST open design controls and preview in the main content area
- **FR-017**: Ending item MUST provide controls for: headline, body, CTA label, CTA URL, and share configuration
- **FR-018**: Share configuration MUST include toggles for: download, email, system share, and individual social platforms
- **FR-019**: Distribute tab MUST display the same content as currently implemented in the app
- **FR-020**: Results tab MUST display placeholder analytics: 0 sessions/shares/downloads/reach and "WIP coming soon" message
- **FR-021**: Clicking "Events" breadcrumb MUST redirect to main events dashboard
- **FR-022**: Clicking event name MUST open edit name dialog
- **FR-023**: Copy link button MUST copy the event join link to clipboard
- **FR-024**: Experience previews are NOT required in this phase (photo experiences use scene builder interface without preview)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Event builder layout MUST work on mobile viewport (320px-768px) with collapsible/toggleable sidebar
- **MFR-002**: Left sidebar MUST be collapsible on mobile to allow full-width content view
- **MFR-003**: Interactive elements (+ buttons, sidebar items, toggles) MUST meet minimum touch target size (44x44px)
- **MFR-004**: Tab navigation MUST be horizontally scrollable on mobile if tabs don't fit viewport width
- **MFR-005**: Preview pane MUST stack below controls on mobile (vertical layout) instead of side-by-side

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All form inputs (welcome settings, experience config, survey steps, ending screen) MUST be validated with Zod schemas
- **TSR-002**: Event data model fields MUST use TypeScript types matching the events-data-model.md specification
- **TSR-003**: Experience type must be validated against allowed types: "photo" | "video" | "gif" | "wheel"
- **TSR-004**: Survey step type must be validated against allowed types: "short_text" | "long_text" | "multiple_choice" | "opinion_scale" | "email" | "statement"
- **TSR-005**: Share social platforms must be validated against allowed values: "instagram" | "tiktok" | "facebook" | "x" | "snapchat" | "whatsapp" | "custom"

### Key Entities

- **Event**: Represents the overall event configuration with welcome/ending screens, survey settings, and denormalized counters. References data model from events-data-model.md with fields: id, title, brandColor, status, companyId, welcome* fields, end* fields, share* fields, survey* fields, and counters
- **Experience**: Represents a single interactive experience (photo/video/gif/wheel) with configuration for type, label, capture options, overlays, and AI settings. Lives in /events/{eventId}/experiences subcollection
- **Survey Step**: Represents a single survey question/step with type-specific configuration (options for multiple_choice, scale min/max for opinion_scale, etc.). Lives in /events/{eventId}/surveySteps subcollection
- **Experience Item**: Represents items used by certain experience types (e.g., wheel sectors). Lives in /events/{eventId}/experienceItems subcollection. Scope: only photo experiences are implemented in this phase

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event creators can configure welcome screen settings (title, description, CTA, branding) in under 2 minutes
- **SC-002**: Event creators can add and configure a photo experience in under 3 minutes
- **SC-003**: Event creators can add and reorder survey steps with zero failed drag operations
- **SC-004**: Event creators can navigate between all three tabs (Content, Distribute, Results) with instant transitions (<100ms perceived latency)
- **SC-005**: Event builder interface displays correctly on mobile devices (320px-768px) with all controls accessible
- **SC-006**: Preview updates reflect configuration changes within 500ms of input change
- **SC-007**: 100% of form inputs validate data before save operations with clear error messages
- **SC-008**: Event creators can identify which experience types are available vs "coming soon" within 5 seconds of viewing the selector

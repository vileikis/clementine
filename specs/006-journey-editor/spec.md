# Feature Specification: Journey Editor

**Feature Branch**: `006-journey-editor`
**Created**: 2025-11-26
**Status**: Draft
**Input**: User description: "Visual canvas for creating and editing guest journeys (step sequences) within an event. 3-panel interface for managing steps, previewing the guest experience, and configuring step properties."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Configure Journey Steps (Priority: P1)

An event creator needs to build a guest journey by adding, ordering, and configuring steps. They navigate to the journey editor, add steps from a categorized list (Navigation, Capture, Input, Completion), and configure each step's properties through a dedicated form panel.

**Why this priority**: This is the core functionality. Without the ability to create and configure steps, the journey editor serves no purpose. This enables event creators to design their guest experience flow.

**Independent Test**: Can be fully tested by creating a new journey, adding 3+ steps of different types, configuring their properties, and verifying the step list displays correctly. Delivers the fundamental journey building capability.

**Acceptance Scenarios**:

1. **Given** I am on the journey editor page, **When** I click the "Add Step" button, **Then** I see a dialog with step types organized by category (Navigation, Capture, Input, Completion)
2. **Given** the step type selector is open, **When** I select "Info" step type, **Then** a new Info step is added to the step list and automatically selected
3. **Given** a step is selected, **When** I modify fields in the configuration panel (title, description, media, CTA label), **Then** the changes are saved and reflected in the step
4. **Given** I have multiple steps, **When** I drag a step to a new position, **Then** the step order is updated and persisted

---

### User Story 2 - Preview Step with Event Theme (Priority: P1)

An event creator needs to see how each step will appear to guests, styled with the event's theme (colors, fonts, backgrounds). They select a step and view a live preview in a phone mockup that applies all theme settings.

**Why this priority**: Visual preview is essential for creators to understand the guest experience. Without it, they cannot validate their design decisions before publishing.

**Independent Test**: Can be fully tested by selecting different step types and verifying the preview displays correct content with the event's theme applied (background color/image, text color, button styling, font family).

**Acceptance Scenarios**:

1. **Given** I am on the journey editor, **When** I select a step, **Then** the middle panel shows a phone mockup preview of that step
2. **Given** the event has a custom theme (logo, colors, background image), **When** I view any step preview, **Then** the theme is applied correctly (background, text colors, button styles, font)
3. **Given** I am editing a step's configuration, **When** I change the title or description, **Then** the preview updates in real-time to show my changes

---

### User Story 3 - Navigate to Journey Editor (Priority: P2)

An event creator needs to access the journey editor from the event design interface. They navigate via URL pattern `/events/{eventId}/design/journeys/{journeyId}` and can deep-link to a specific step using query parameters.

**Why this priority**: Navigation and URL structure are important for user experience and bookmarking, but users can technically work with the editor even with basic navigation.

**Independent Test**: Can be fully tested by accessing URLs directly and verifying the correct journey and step are loaded and displayed.

**Acceptance Scenarios**:

1. **Given** I navigate to `/events/{eventId}/design/journeys/{journeyId}`, **When** the page loads, **Then** I see the 3-panel journey editor with the specified journey's steps
2. **Given** I navigate to a URL with `?stepId={stepId}`, **When** the page loads, **Then** the specified step is automatically selected
3. **Given** I click on a step in the step list, **When** the step is selected, **Then** the URL updates to include `?stepId={stepId}` for deep linking

---

### User Story 4 - Configure Experience Picker Step (Priority: P2)

An event creator needs to set up an Experience Picker step that allows guests to choose from available AI experiences. They configure which experiences to show, the display layout (grid/list/carousel), and the variable name to store the selection.

**Why this priority**: Experience selection is a key differentiator for the platform but requires the base step functionality to be in place first.

**Independent Test**: Can be fully tested by adding an Experience Picker step, linking it to available event experiences, configuring layout options, and verifying the preview shows the experience options correctly.

**Acceptance Scenarios**:

1. **Given** I add an Experience Picker step, **When** I view the configuration panel, **Then** I see options for layout (grid/list/carousel), variable name, and experience selection
2. **Given** my event has 3 experiences, **When** I configure the Experience Picker, **Then** I can select which experiences to include as options
3. **Given** I have configured experience options, **When** I view the preview, **Then** I see the experiences displayed in my chosen layout with their thumbnails and names

---

### User Story 5 - Configure Capture Step (Priority: P2)

An event creator needs to configure a Capture step that loads experience settings dynamically based on a previous selection. They specify the source variable (from Experience Picker) and optionally set a fallback experience.

**Why this priority**: Capture is the core value proposition but depends on Experience Picker flow being established.

**Independent Test**: Can be fully tested by adding a Capture step, setting the source variable, selecting a fallback experience, and verifying the preview shows camera UI with appropriate settings.

**Acceptance Scenarios**:

1. **Given** I add a Capture step, **When** I view the configuration panel, **Then** I see fields for source variable and fallback experience dropdown
2. **Given** I set a fallback experience, **When** I view the preview, **Then** I see the camera UI with that experience's overlay (if any)
3. **Given** no source variable or fallback is set, **When** I view the configuration, **Then** I see a warning that the step needs configuration

---

### User Story 6 - Configure Input Steps (Priority: P3)

An event creator needs to configure various input collection steps (short text, long text, multiple choice, yes/no, opinion scale, email) to gather guest information. Each input type has specific configuration options.

**Why this priority**: Input collection adds value but is not essential for a minimal journey flow. Many journeys may not require input collection.

**Independent Test**: Can be fully tested by adding each input step type and configuring their specific options (placeholder text, max length, options, scale range, required flag).

**Acceptance Scenarios**:

1. **Given** I add a Short Text step, **When** I view configuration, **Then** I see fields for variable name, placeholder, max length, and required toggle
2. **Given** I add a Multiple Choice step, **When** I configure options, **Then** I can add/remove options with label and value, toggle multiple selection
3. **Given** I add an Opinion Scale step, **When** I configure the scale, **Then** I can set min/max values and their labels

---

### User Story 7 - Configure Completion Steps (Priority: P3)

An event creator needs to configure Processing and Reward steps to show progress during AI generation and display the final result with sharing options.

**Why this priority**: Completion steps enhance the experience but a basic journey could function with simpler end states initially.

**Independent Test**: Can be fully tested by adding Processing and Reward steps, configuring their options (rotating messages, share options), and verifying preview displays correctly.

**Acceptance Scenarios**:

1. **Given** I add a Processing step, **When** I configure it, **Then** I can set rotating messages and estimated duration
2. **Given** I add a Reward step, **When** I configure sharing, **Then** I can toggle download, system share, email, and select social platforms
3. **Given** I view a Reward step preview, **Then** I see the title, media placeholder, and configured share buttons

---

### Edge Cases

- What happens when a journey has no steps? Display empty state with prompt to add first step
- What happens when the selected step is deleted? Automatically select the next step, or previous if last step was deleted
- What happens when dragging and dropping fails? Revert to original order and show error notification
- What happens when a step references a deleted experience? Show warning indicator on the step and in configuration
- What happens when the event has no experiences? Experience Picker and Capture steps show warning that experiences are needed
- What happens on page refresh with unsaved changes? Auto-save ensures no data loss; local changes sync with server

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a 3-panel layout with step list (left, 256px), preview (middle, flex), and configuration form (right, 320px)
- **FR-002**: System MUST allow adding steps from 4 categories: Navigation (info, experience-picker), Capture (capture), Input (short_text, long_text, multiple_choice, yes_no, opinion_scale, email), Completion (processing, reward)
- **FR-003**: System MUST support drag-and-drop reordering of steps in the step list
- **FR-004**: System MUST display a phone mockup (9:16 aspect ratio) preview of the selected step
- **FR-005**: System MUST apply the event's theme settings to the preview (background color/image, overlay opacity, text color/alignment, button color/radius, font family, logo)
- **FR-006**: System MUST sync selected step with URL query parameter (`?stepId={id}`) for deep linking
- **FR-007**: System MUST auto-select the first step when no step is specified, or handle empty state appropriately
- **FR-008**: System MUST provide type-specific configuration forms for each step type with their required fields
- **FR-009**: System MUST update the preview in real-time as configuration values change
- **FR-010**: System MUST persist step changes to Firestore (steps are subcollection of events: `/events/{eventId}/steps/{stepId}`)
- **FR-011**: Experience Picker step MUST allow selecting from event's linked experiences and configuring display layout
- **FR-012**: Capture step MUST reference experience configuration via source variable with optional fallback experience

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: On mobile (sm breakpoint), panels MUST stack vertically with step list, then preview, then configuration
- **MFR-002**: On tablet (md breakpoint), right panel MUST stack below middle panel while left panel remains side-by-side
- **MFR-003**: Step list items and add step button MUST meet minimum touch target size (44x44px)
- **MFR-004**: Configuration form inputs MUST be readable and usable on mobile (≥14px, appropriate spacing)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All step data MUST be validated with Zod schemas before persisting to Firestore
- **TSR-002**: Step type discriminated unions MUST enforce correct config shape per step type
- **TSR-003**: URL query parameters (stepId) MUST be validated before use
- **TSR-004**: Experience references in steps MUST be validated against existing event experiences

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Step create/update/delete operations MUST use Admin SDK via Server Actions
- **FAR-002**: Real-time step list updates MUST use Client SDK subscription for live sync
- **FAR-003**: Step schemas MUST be located in `web/src/lib/schemas/` or feature-specific schema files
- **FAR-004**: Media URLs in steps (mediaUrl field) MUST be stored as full public URLs
- **FAR-005**: Steps collection MUST be structured as `/events/{eventId}/steps/{stepId}` subcollection

### Key Entities

- **Journey**: A named sequence of steps belonging to an event. Contains step order array and metadata (name, status, tags). Located at `/events/{eventId}/journeys/{journeyId}`
- **Step**: Individual screen configuration within a journey. Has a type (11 types), base fields (title, description, mediaUrl, ctaLabel), and type-specific config. Located at `/events/{eventId}/steps/{stepId}`
- **Experience**: AI experience configuration referenced by Experience Picker and Capture steps. Contains capture and AI generation settings. Located at `/experiences/{experienceId}`
- **EventTheme**: Theme configuration nested in Event document. Controls visual styling of step previews and guest experience (colors, fonts, backgrounds, button styles)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event creators can create a complete journey with 5+ steps of various types in under 10 minutes
- **SC-002**: Step preview accurately reflects event theme settings within 500ms of configuration changes
- **SC-003**: 95% of drag-and-drop reorder operations complete successfully without data loss
- **SC-004**: Page load time for journey editor with 20 steps is under 3 seconds
- **SC-005**: Step selection and preview update occurs within 200ms of user interaction
- **SC-006**: All 11 step types are fully configurable with no dead-end states requiring external tools
- **SC-007**: URL deep links correctly restore editor state (selected journey and step) on page load

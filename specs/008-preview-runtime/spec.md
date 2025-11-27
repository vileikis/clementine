# Feature Specification: Unified Preview Runtime

**Feature Branch**: `008-preview-runtime`
**Created**: 2025-11-27
**Status**: Draft
**Input**: PRD #1 — Unified Preview Runtime (Mobile + Desktop) for Clementine Journey Editor

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preview Step in Mobile Mode (Priority: P1)

As an event creator editing a journey in the Journey Editor, I want to preview how my current step looks on a mobile phone so that I can ensure guests will have a good experience on their devices.

**Why this priority**: Mobile is the primary device for guests using the photobooth experience. Creators must see an accurate mobile preview to validate their content.

**Independent Test**: Can be fully tested by opening any step in the Journey Editor and seeing a phone-sized preview (375px width) with the step rendered using the event's theme.

**Acceptance Scenarios**:

1. **Given** a creator is in the Journey Editor with a step selected, **When** the preview panel loads, **Then** the step renders in a mobile phone frame (375px width) using the event's theme
2. **Given** a creator is viewing an Info step preview, **When** the preview renders, **Then** the title, description, and CTA button display with the correct theme colors, fonts, and background
3. **Given** a creator is viewing any step with content that exceeds the phone frame, **When** the content overflows, **Then** the preview container becomes scrollable

---

### User Story 2 - Switch Between Mobile and Desktop Views (Priority: P1)

As an event creator, I want to toggle between mobile and desktop preview modes so that I can verify my journey looks correct on both device types.

**Why this priority**: Events may have guests on both mobile and desktop. Creators need to validate both experiences without leaving the editor.

**Independent Test**: Can be fully tested by clicking a toggle button and seeing the preview immediately re-render in the new viewport size.

**Acceptance Scenarios**:

1. **Given** a creator is viewing a step preview in mobile mode, **When** they click the "Desktop" toggle, **Then** the preview re-renders in desktop width (900px frame) instantly
2. **Given** a creator is viewing a step preview in desktop mode, **When** they click the "Mobile" toggle, **Then** the preview re-renders in mobile width (375px frame) instantly
3. **Given** a creator toggles between modes, **When** switching, **Then** all theme styling, content, and layout adapt appropriately to the new viewport

---

### User Story 3 - Preview All Step Types Accurately (Priority: P1)

As an event creator, I want every step type to render correctly in the preview so that I can trust the preview matches what guests will see.

**Why this priority**: The preview is worthless if it doesn't accurately represent the guest experience. All step types must render properly.

**Independent Test**: Can be fully tested by creating steps of each type and verifying they display with appropriate mock content and theming.

**Acceptance Scenarios**:

1. **Given** an Info step, **When** previewed, **Then** it shows title, description, and CTA button with theme styling
2. **Given** an Experience Picker step, **When** previewed, **Then** it shows selectable experience cards in the configured layout (grid/list/carousel)
3. **Given** a Capture step, **When** previewed, **Then** it shows a mocked camera placeholder (static image) with capture UI elements
4. **Given** a Short Text step, **When** previewed, **Then** it shows a single-line input field with placeholder text and validation indicators
5. **Given** a Long Text step, **When** previewed, **Then** it shows a multi-line textarea with placeholder and character limit indicator
6. **Given** a Multiple Choice step, **When** previewed, **Then** it shows selectable options in the configured format
7. **Given** a Yes/No step, **When** previewed, **Then** it shows two buttons with the configured labels
8. **Given** an Opinion Scale step, **When** previewed, **Then** it shows the numeric scale with min/max labels
9. **Given** an Email step, **When** previewed, **Then** it shows an email input field with validation indicators
10. **Given** a Processing step, **When** previewed, **Then** it shows a loading animation with rotating messages
11. **Given** a Reward step, **When** previewed, **Then** it shows a placeholder result image with share/download buttons

---

### User Story 4 - Theme Application in Preview (Priority: P2)

As an event creator, I want the preview to use my event's actual theme settings so that I see exactly how my branded experience will appear to guests.

**Why this priority**: Branding consistency is crucial for event creators. The preview must faithfully represent theme choices.

**Independent Test**: Can be fully tested by modifying theme settings (colors, fonts, logo) and verifying the preview updates to reflect those changes.

**Acceptance Scenarios**:

1. **Given** an event has custom brand colors set, **When** a step is previewed, **Then** backgrounds, buttons, and text use those exact colors
2. **Given** an event has a custom logo configured, **When** a step is previewed, **Then** the logo appears in the correct position with proper sizing
3. **Given** an event has custom typography settings, **When** a step is previewed, **Then** text renders with the specified fonts and sizes

---

### Edge Cases

- What happens when theme settings are partially configured (e.g., only some colors set)? The preview should gracefully fall back to default values for missing settings.
- How does the preview handle very long text content that exceeds typical bounds? Content should wrap appropriately and the container should scroll if needed.
- What happens when preview is accessed for a step that has incomplete configuration? The preview should render with placeholder content indicating missing fields.
- How does the preview behave when switching between step types rapidly? Each step type should render correctly without artifacts from the previous step.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a preview of the currently selected step in the Journey Editor
- **FR-002**: System MUST provide a toggle to switch between Mobile (375px) and Desktop (900px) preview modes
- **FR-003**: Preview MUST apply the event's complete theme configuration (colors, fonts, logo, backgrounds)
- **FR-004**: System MUST support preview rendering for all 11 step types: Info, Experience Picker, Capture, Short Text, Long Text, Multiple Choice, Yes/No, Opinion Scale, Email, Processing, and Reward
- **FR-005**: Capture step preview MUST display a static placeholder image instead of actual camera feed
- **FR-006**: Processing step preview MUST display a loading animation with rotating messages
- **FR-007**: Preview MUST re-render instantly when the user toggles between mobile and desktop modes
- **FR-008**: Preview MUST update in real-time when the user edits step configuration
- **FR-009**: System MUST inject mock session data (e.g., placeholder selfie, sample name) for realistic preview
- **FR-010**: Preview container MUST be scrollable when content exceeds the visible frame height

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: The preview switcher controls MUST be accessible and usable on mobile editor viewports
- **MFR-002**: Interactive toggle elements MUST meet minimum touch target size (44x44px)
- **MFR-003**: The mobile preview frame (375px) MUST accurately represent the mobile guest experience

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Step configuration passed to preview renderers MUST be validated with Zod schemas
- **TSR-002**: Theme configuration MUST be validated before applying to preview
- **TSR-003**: Mock session data MUST conform to the session data schema used in guest runtime

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Preview runtime MUST read step and theme data from Firestore using Client SDK for real-time updates
- **FAR-002**: Preview MUST NOT perform any write operations (read-only context)
- **FAR-003**: Zod schemas for step types MUST be defined in `features/steps/schemas/`

### Key Entities

- **Step**: A single screen configuration within a journey, containing type, title, description, media, and type-specific settings
- **Theme**: Event-level styling configuration including colors, fonts, logo, and background settings
- **Mock Session**: Simulated guest session data containing placeholder images and sample user inputs for preview purposes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can toggle between mobile and desktop preview in under 500ms with no visible flicker or delay
- **SC-002**: All 11 step types (Info, Experience Picker, Capture, Short Text, Long Text, Multiple Choice, Yes/No, Opinion Scale, Email, Processing, Reward) render correctly in both preview modes
- **SC-003**: Theme changes made in the editor reflect in the preview within 1 second
- **SC-004**: 100% of step configuration changes display immediately in the preview without page refresh
- **SC-005**: Preview layout matches the final guest experience within a 5% margin of error for element positioning and sizing

## Assumptions

- The existing Journey Editor infrastructure will be reused; this feature enhances the preview panel
- Existing step preview components in `features/steps/components/preview/steps/` will be reused and enhanced
- Mock session data will use static placeholder images bundled with the application
- The desktop preview width of 900px was chosen as a reasonable representation of desktop experience
- Theme configuration follows the existing Event schema's theme object structure
- This preview runtime will serve as the foundation for the future guest runtime (PRD #3), so architecture should be designed for reuse

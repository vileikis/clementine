# Feature Specification: Themed Component Polish

**Feature Branch**: `087-themed-component-polish`
**Created**: 2026-03-02
**Status**: Draft
**Input**: PRD P9 — Themed Component Polish

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visible Controls on Camera Capture Steps (Priority: P1)

A guest opens an experience link and reaches a photo capture step. The experience creator configured a light theme (e.g., white background, dark text). On the capture step, the camera viewfinder produces a dark/black background. All themed controls — buttons, text labels, progress bar, and top bar — must remain clearly visible against this dark camera background, regardless of the creator's theme choices.

**Why this priority**: Invisible controls on the camera screen directly prevent guests from completing the core action (taking a photo). This is the most critical usability failure.

**Independent Test**: Can be tested by creating an experience with a light theme, navigating to the capture step, and verifying all controls (buttons, text, progress bar, top bar) are legible against the dark camera background.

**Acceptance Scenarios**:

1. **Given** a guest is on a capture step with any user-configured theme, **When** the camera viewfinder displays, **Then** all buttons, text labels, the progress bar, and the top bar are clearly visible against the dark background.
2. **Given** a guest is on a capture step with a dark-themed experience, **When** the camera viewfinder displays, **Then** controls remain visible (dark surface styling applied consistently regardless of theme darkness).
3. **Given** a guest is on a non-capture step (e.g., welcome screen), **When** the step renders, **Then** controls use the creator's configured theme colors as they do today (no visual regression).

---

### User Story 2 - Readable Secondary (Outline) Buttons Everywhere (Priority: P1)

A guest encounters secondary/outline buttons throughout the experience flow — on welcome screens, capture steps, and the share page. Currently, the semi-transparent outline variant can be unreadable against certain backgrounds. The secondary button must always have a solid, readable appearance regardless of surface.

**Why this priority**: Unreadable buttons prevent guest interaction across multiple surfaces, not just capture. This is equally critical to Story 1.

**Independent Test**: Can be tested by creating experiences with various theme color combinations and verifying secondary buttons are readable on every step type (welcome, capture, share).

**Acceptance Scenarios**:

1. **Given** a secondary button on a themed background (auto surface), **When** the button renders, **Then** it displays with a solid background derived from the theme's button text color (with subtle brand tint) and the theme's button background color as text color — no transparency, no border.
2. **Given** a secondary button on a dark camera surface, **When** the button renders, **Then** it displays with a dark semi-transparent background and white text, like native camera controls.
3. **Given** any themed icon button using the secondary variant, **When** it renders on any surface, **Then** the same solid styling rules apply as regular secondary buttons.

---

### User Story 3 - Top Bar Adapts Across Surfaces (Priority: P2)

The top bar (with title, progress bar, back button, and close button) floats above all step content. It must adapt its colors based on whether the current step has a dark surface (camera) or an auto/themed surface (welcome, content steps).

**Why this priority**: The top bar is present on every step. If it's unreadable on capture steps, guests lose navigation and progress context. Slightly lower priority than controls because guests can still complete the capture even if the top bar is hard to see.

**Independent Test**: Can be tested by navigating through an experience with mixed step types and verifying the top bar is legible on each.

**Acceptance Scenarios**:

1. **Given** a guest is on a capture step (dark surface), **When** the top bar renders, **Then** its text, progress bar, and icon buttons use dark-surface styling (white-based colors).
2. **Given** a guest is on a welcome/content step (auto surface), **When** the top bar renders, **Then** its text, progress bar, and icon buttons use the creator's themed colors.
3. **Given** a guest navigates from a welcome step to a capture step, **When** the transition occurs, **Then** the top bar smoothly switches from themed to dark-surface styling.

---

### User Story 4 - Top Bar Decoupled for Reuse (Priority: P2)

The top bar component currently depends on runtime store internals, preventing its use on pages without a runtime (e.g., the share page). It must accept props instead, enabling any page to render it with appropriate configuration.

**Why this priority**: Decoupling the top bar is required for Story 5 (share page navigation) and establishes a cleaner component boundary.

**Independent Test**: Can be tested by rendering the top bar component in isolation with various prop combinations and verifying correct output.

**Acceptance Scenarios**:

1. **Given** the top bar is rendered with title and progress props, **When** it displays, **Then** it shows the title, progress bar, and navigation controls.
2. **Given** the top bar is rendered with only title and close handler (no progress, no back), **When** it displays, **Then** it shows only the title and close/home button — no progress bar, no back button.
3. **Given** the top bar is rendered without a back handler, **When** the user looks at the top bar, **Then** no back button is visible.

---

### User Story 5 - Share Page Navigation (Priority: P3)

After receiving their AI-processed result on the share page, a guest can navigate back to the welcome screen to start over. The share page displays a top bar with the experience title and a close/home button.

**Why this priority**: Improves the guest experience loop but is not blocking core functionality.

**Independent Test**: Can be tested by completing an experience, reaching the share page, and verifying a top bar with home navigation is present.

**Acceptance Scenarios**:

1. **Given** a guest is on the share page, **When** the page renders, **Then** a top bar displays with the experience title and a close/home button.
2. **Given** a guest is on the share page, **When** they tap the close/home button, **Then** they are navigated back to the welcome screen.
3. **Given** a guest is on the share page, **When** they view the top bar, **Then** no progress bar or back button is shown.

---

### User Story 6 - Themed Exit Confirmation Dialog (Priority: P3)

When a guest taps the close/home button during an experience, a confirmation dialog appears. This dialog must match the experience's theme rather than using default system/library styling.

**Why this priority**: Visual consistency matters but the dialog is functional with default styling.

**Independent Test**: Can be tested by triggering the exit dialog on an experience with a distinctive theme and verifying colors match.

**Acceptance Scenarios**:

1. **Given** a guest triggers the exit confirmation dialog, **When** the dialog renders, **Then** its background uses the theme's background color and text uses the theme's text color.
2. **Given** a guest triggers the exit confirmation dialog, **When** the dialog renders, **Then** the confirm button uses the primary themed button style and the cancel button uses the secondary themed button style.
3. **Given** a guest triggers the exit confirmation dialog on any device width, **When** the dialog renders, **Then** it has a narrower max width (384px) for a more focused appearance.

---

### User Story 7 - Full-Width List Layout Cards in Run Mode (Priority: P3)

When an experience uses list layout for its welcome screen, the experience cards should stretch to full container width in both edit mode and run (guest) mode. Currently, cards may not fill the width in run mode.

**Why this priority**: Minor visual inconsistency that doesn't block functionality.

**Independent Test**: Can be tested by creating a list-layout experience, previewing in run mode, and verifying cards span full width.

**Acceptance Scenarios**:

1. **Given** an experience uses list layout, **When** a guest views the welcome screen in run mode, **Then** experience cards occupy full container width.
2. **Given** an experience uses list layout, **When** a creator views the welcome screen in edit mode, **Then** experience cards occupy full container width (existing behavior preserved).

---

### Edge Cases

- What happens when a theme has very similar button background and text colors (low contrast)? The system uses the creator's chosen colors as-is; contrast enforcement is out of scope.
- What happens when the capture step's camera permission is denied and a fallback UI shows? The dark surface styling still applies since the step type determines the surface, not the camera state.
- What happens when the share page has no title configured? The top bar falls back to a default title ("Your Result").
- What happens when a step type not listed in the traits map is encountered? It receives default traits (scroll layout, auto surface, default navigation).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support a declarative step render traits mechanism that maps step types to layout, surface, and navigation properties.
- **FR-002**: Each step MUST resolve its render traits by merging step-specific overrides with default traits (scroll layout, auto surface, default navigation).
- **FR-003**: The secondary button variant MUST render with a solid background on auto surfaces — using the theme's button text color as background base (with subtle brand tint) and the theme's button background color as text color. No border, no transparency.
- **FR-004**: The secondary button variant MUST render with a dark semi-transparent background and white text on dark surfaces.
- **FR-005**: Primary button variants MUST remain unchanged on both auto and dark surfaces.
- **FR-006**: Themed text components MUST support a surface property — using the theme's text color on auto surfaces and white on dark surfaces.
- **FR-007**: Themed progress bar components MUST support a surface property — using the theme's text color on auto surfaces and white on dark surfaces.
- **FR-008**: Capture step components (camera active, photo preview) MUST pass dark surface styling to all their themed child components.
- **FR-009**: The top bar MUST accept a surface property and forward it to all themed children (icon buttons, text, progress bar).
- **FR-010**: The top bar MUST be refactored to accept props (title, surface, progress, back handler, close handler) instead of reading from the runtime store directly.
- **FR-011**: The top bar MUST hide the back button when no back handler is provided.
- **FR-012**: The top bar MUST hide the progress bar when no progress data is provided.
- **FR-013**: The share page MUST display the top bar with the experience title and a close/home action that navigates to the welcome screen.
- **FR-014**: The exit confirmation dialog MUST use the theme's background color, text color, and themed buttons (primary for confirm, secondary for cancel).
- **FR-015**: The exit confirmation dialog MUST use a narrower maximum width (384px).
- **FR-016**: List layout experience cards MUST occupy full container width in both edit and run modes.
- **FR-017**: The top bar component MUST be renamed from RuntimeTopBar to ExperienceTopBar to reflect its decoupled, reusable nature.

### Key Entities

- **StepRenderTraits**: Describes per-step rendering characteristics — layout mode (scroll vs full-height), surface type (auto vs dark), and navigation mode (default vs custom).
- **Surface**: A rendering context indicator ("auto" or "dark") that themed components use to select appropriate color strategies.
- **ExperienceTopBar**: A reusable, props-driven top bar component showing title, optional progress, optional back navigation, and close/home action.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All themed controls (buttons, text, progress bar, top bar) are visually legible on capture steps for any user-configured theme — verified by testing with at least 3 distinct themes including a light theme, a dark theme, and a high-saturation theme.
- **SC-002**: Secondary buttons have a contrast ratio sufficient for readability on every surface type (auto and dark) — no transparent or semi-transparent backgrounds remain on secondary variants.
- **SC-003**: The top bar renders correctly with themed styling on content steps and dark-surface styling on capture steps — zero instances of dark-on-dark or light-on-light unreadable text.
- **SC-004**: The top bar can be instantiated on the share page without any runtime store dependency — confirmed by the share page rendering a top bar with title and close action.
- **SC-005**: 100% of existing themed component call sites outside capture steps continue to render identically (no visual regression) since the default surface value is "auto".
- **SC-006**: Guests on the share page can navigate back to the welcome screen via the top bar close/home button.
- **SC-007**: The exit confirmation dialog visually matches the experience's configured theme colors.
- **SC-008**: List layout experience cards span full container width in run mode, matching edit mode behavior.

## Assumptions

- The existing theme schema provides sufficient color properties (background color, text color, button background color, button text color, primary color) to derive all needed surface-aware variants.
- Only the photo capture step type currently requires dark surface treatment. Additional step types can be added to the traits map later without architectural changes.
- The "auto" surface default ensures zero changes to existing component call sites that don't pass a surface prop.
- The share page already has access to the experience title and can determine a "start over" navigation target.
- The top bar's exit confirmation dialog remains co-located with the top bar component after the refactor.

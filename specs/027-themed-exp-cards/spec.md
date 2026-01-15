# Feature Specification: Themed Experience Cards

**Feature Branch**: `027-themed-exp-cards`
**Created**: 2026-01-15
**Status**: Draft
**Input**: User description: "WelcomePreview experience cards must use themed components (primary color, theme tokens) and display only experience media and experience name - no profile or metadata"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Experience Creator Previews Themed Cards (Priority: P1)

As an experience creator editing the welcome screen, I want the experience cards in the preview to visually match my configured theme colors so that I can see exactly how my guests will experience the branded welcome screen.

**Why this priority**: This is the core value proposition - ensuring visual consistency between the editor preview and the guest-facing experience. Without this, creators cannot accurately preview their branded experience.

**Independent Test**: Can be fully tested by configuring a custom theme (non-default colors) in the event editor and verifying experience cards reflect those colors in the WelcomePreview component.

**Acceptance Scenarios**:

1. **Given** an event with a custom primary color (e.g., `#FF5733`), **When** viewing the WelcomePreview with attached experiences, **Then** the experience cards display with styling derived from the theme's primary color and text color tokens.

2. **Given** an event theme with custom text color and background settings, **When** viewing experience cards in WelcomePreview, **Then** the card text uses the theme's text color and the card background adapts to the theme context.

3. **Given** a default theme (no customization), **When** viewing experience cards in WelcomePreview, **Then** the cards display correctly using default theme values.

---

### User Story 2 - Simplified Card Content Display (Priority: P1)

As an experience creator, I want experience cards to show only the essential information (media thumbnail and experience name) so that the welcome screen remains clean, focused, and visually appealing without distracting metadata.

**Why this priority**: Equally critical as P1 - the current cards show profile badges and metadata that clutters the guest-facing welcome screen. Removing this creates a cleaner user experience.

**Independent Test**: Can be fully tested by adding experiences to an event and verifying the WelcomePreview cards show only media and name - no profile badge, no additional metadata.

**Acceptance Scenarios**:

1. **Given** an experience with a name and thumbnail media, **When** displayed in WelcomePreview, **Then** only the experience name and media thumbnail are visible - no profile badge or other metadata.

2. **Given** an experience without a thumbnail image, **When** displayed in WelcomePreview, **Then** a themed placeholder is shown instead of the media, along with the experience name only.

3. **Given** an experience with a long name, **When** displayed in WelcomePreview, **Then** the name is truncated appropriately to maintain card layout integrity.

---

### User Story 3 - Consistent Theming Across Layouts (Priority: P2)

As an experience creator, I want experience cards to maintain themed styling whether displayed in list or grid layout so that my brand consistency is preserved regardless of layout choice.

**Why this priority**: Important for brand consistency but secondary since the primary theming and content simplification must work first before layout variations matter.

**Independent Test**: Can be tested by toggling between list and grid layouts in the welcome screen editor and verifying themed styling persists in both.

**Acceptance Scenarios**:

1. **Given** experiences displayed in list layout, **When** theme colors are applied, **Then** cards show themed styling with horizontal layout (thumbnail left, name right).

2. **Given** experiences displayed in grid layout, **When** theme colors are applied, **Then** cards show themed styling with vertical layout (thumbnail top, name bottom).

---

### Edge Cases

- What happens when an experience has no media and no name (empty state)? Cards display themed placeholder with fallback text "Untitled Experience".
- How does the system handle extremely long experience names? Names are truncated with ellipsis after one line.
- What happens when the theme has very low contrast (similar text and background colors)? The system renders as configured - contrast validation is handled separately in the theme editor.
- How do cards appear when theme is still loading or unavailable? Cards use default theme values as fallback.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: ExperienceCard component MUST apply theme-derived styling for background, border, and text colors when used within WelcomePreview.
- **FR-002**: ExperienceCard component MUST display only the experience media thumbnail and experience name - no profile badge, no metadata.
- **FR-003**: ExperienceCard MUST use the shared theming primitives (ThemedText, theme context) to source color values.
- **FR-004**: ExperienceCard MUST support both list and grid layouts while maintaining themed styling.
- **FR-005**: ExperienceCard MUST handle missing media gracefully by showing a themed placeholder.
- **FR-006**: ExperienceCard MUST handle missing or empty experience names by showing "Untitled Experience" as fallback text.
- **FR-007**: ExperienceCard styling MUST adapt when theme changes (via ThemeProvider context updates).
- **FR-008**: ExperienceCard MUST maintain accessibility standards (sufficient touch targets, keyboard interaction in run mode).

### Key Entities

- **Experience**: The experience being displayed (has id, name, media properties).
- **Theme**: The visual theme configuration sourced from event/project settings (primaryColor, text.color, background.color, fontFamily, button styles).
- **WelcomeConfig**: Parent configuration that determines layout (list/grid) and which experiences to display.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of experience cards in WelcomePreview display with theme-derived colors (no hardcoded color values in rendered output).
- **SC-002**: Experience cards display exactly 2 content elements: media thumbnail and experience name - no additional elements visible.
- **SC-003**: Users can switch between list and grid layouts with cards maintaining themed appearance in both configurations.
- **SC-004**: Card styling updates immediately when theme configuration changes without requiring page refresh or re-navigation.
- **SC-005**: Cards render correctly with default fallback values when optional data (media, custom theme colors) is not provided.

## Assumptions

- The existing theming infrastructure (`useThemeWithOverride`, `ThemeProvider`, `ThemedText`, etc.) provides all necessary theme values and will be used as the foundation.
- The `ExperienceCard` component will be refactored in place rather than creating a separate "themed" variant.
- The `mode` prop (edit/run) behavior remains unchanged - only visual styling and content displayed are modified.
- Theme values are always available via context when cards are rendered in WelcomePreview (WelcomePreview is always wrapped in ThemeProvider).

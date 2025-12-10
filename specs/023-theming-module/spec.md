# Feature Specification: Theming Module

**Feature Branch**: `023-theming-module`
**Created**: 2025-12-10
**Status**: Draft
**Input**: User description: "Create centralized theming feature module for brand styling"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use Unified Theme Type Across Features (Priority: P1)

As a developer working on Projects or Events, I need a single, unified Theme type that I can import from one location, so that I don't have to maintain duplicate theme type definitions across different feature modules.

**Why this priority**: This is the foundation - without unified types, all other theming functionality would continue to be fragmented.

**Independent Test**: Can be tested by importing the Theme type in a Project or Event file and verifying TypeScript compilation succeeds with the unified structure.

**Acceptance Scenarios**:

1. **Given** a developer is working on a Project feature, **When** they need theme typing, **Then** they can import `Theme` from the theming module and use it in their Project interface.
2. **Given** a developer is working on an Event feature, **When** they need theme typing, **Then** they can import `Theme` from the theming module and use it in their Event interface.
3. **Given** theme types exist in both Projects and Events, **When** the theming module is introduced, **Then** existing types can be replaced without breaking any consuming code.

---

### User Story 2 - Provide Theme Context to Components (Priority: P2)

As a UI developer building themed components, I need access to theme values and computed conveniences through a context provider, so that I can style components consistently without passing theme props through every component level.

**Why this priority**: Context-based theming enables component reuse and eliminates prop drilling for theme values.

**Independent Test**: Can be tested by wrapping a component tree in the theme provider and verifying child components can access theme values via the hook.

**Acceptance Scenarios**:

1. **Given** a component tree wrapped in the theme provider, **When** a child component uses the theme hook, **Then** it receives the theme object and computed values (resolved button background, button radius CSS value).
2. **Given** no theme provider wraps a component, **When** the theme hook is used, **Then** a clear error message indicates the provider is missing.
3. **Given** a theme with no explicit button background color, **When** components access the button background, **Then** it falls back to the primary color.

---

### User Story 3 - Render Themed Backgrounds Consistently (Priority: P3)

As a UI developer, I need a reusable background component that handles color, image, and overlay rendering, so that I don't have to duplicate background styling logic across different editors and preview components.

**Why this priority**: Background rendering is currently duplicated in multiple places. Consolidating it reduces maintenance burden and ensures consistency.

**Independent Test**: Can be tested by rendering the background component with various configurations (color only, with image, with overlay) and verifying visual output.

**Acceptance Scenarios**:

1. **Given** a background configuration with only a color, **When** the component renders, **Then** the background displays the specified color.
2. **Given** a background configuration with an image URL, **When** the component renders, **Then** the background displays the image covering the full area.
3. **Given** a background with an image and overlay opacity > 0, **When** the component renders, **Then** a semi-transparent overlay appears over the image.
4. **Given** a font family is specified, **When** the component renders, **Then** the container applies that font family to all content.

---

### User Story 4 - Compute Inline Styles from Theme (Priority: P4)

As a UI developer, I need a utility that computes inline style objects from theme values, so that I can apply theme-based styling to components without manually mapping each property.

**Why this priority**: This is a convenience feature that simplifies theme application but is not required for basic functionality.

**Independent Test**: Can be tested by calling the styles hook and verifying returned CSS property objects match expected theme mappings.

**Acceptance Scenarios**:

1. **Given** a theme with specific text color and alignment, **When** the styles hook is used, **Then** the text style object contains matching CSS properties.
2. **Given** a theme with button configuration, **When** the styles hook is used, **Then** the button style object contains background color, text color, and border radius.
3. **Given** a theme with background configuration including an image, **When** the styles hook is used, **Then** the background style object contains the image URL formatted as CSS background-image.

---

### Edge Cases

- What happens when theme values contain invalid hex colors? (Validation should occur at data entry, not in the theming module)
- How does the system handle a theme with partial data (missing optional fields)? (Falls back to sensible defaults)
- What happens when a background image URL is broken? (The background color remains visible as fallback)
- How does button radius "full" render for different button sizes? (Uses a large pixel value like 9999px to ensure pill shape)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a unified `Theme` type that defines primary color, font family, text styling, button styling, and background styling
- **FR-002**: System MUST provide a `ThemeText` type with color (hex) and alignment (left/center/right) properties
- **FR-003**: System MUST provide a `ThemeButton` type with optional background color, text color, and radius (none/sm/md/full) properties
- **FR-004**: System MUST provide a `ThemeBackground` type with color, optional image URL, and overlay opacity properties
- **FR-005**: System MUST provide a theme context provider that makes theme values available to descendant components
- **FR-006**: System MUST provide a theme hook that returns theme values and throws a clear error when used outside the provider
- **FR-007**: System MUST compute a resolved button background color (falling back to primary color when not specified)
- **FR-008**: System MUST map button radius values to CSS-compatible values (none=0, sm=0.25rem, md=0.5rem, full=9999px)
- **FR-009**: System MUST provide a themed background component that renders color, optional image, and optional overlay
- **FR-010**: System MUST ensure the background component layers content above any background image and overlay
- **FR-011**: System MUST provide a styles hook that computes inline CSS style objects from theme values
- **FR-012**: System MUST NOT include logo handling in the Theme type (logo is an identity concern, not a styling concern)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Themed backgrounds MUST render correctly on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Background images MUST use cover sizing and center positioning to work across all screen sizes
- **MFR-003**: Overlay opacity MUST be visually appropriate on both mobile and desktop displays

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All theme types MUST be exported with full TypeScript definitions
- **TSR-002**: The button radius type MUST be a union of allowed string literals, not a generic string
- **TSR-003**: Color values MUST be typed as strings with documentation indicating hex format expectation

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: The theming module is client-side only and does not directly interact with Firebase
- **FAR-002**: Theme data storage and retrieval remains the responsibility of Projects and Events features
- **FAR-003**: Background image URLs stored in themes MUST be full public URLs (not relative paths)

### Key Entities

- **Theme**: The core styling configuration containing primary color, optional font family, and nested text/button/background configurations
- **ThemeText**: Text styling with color and alignment properties
- **ThemeButton**: Button styling with background color, text color, and border radius
- **ThemeBackground**: Background styling with color, optional image, and overlay opacity
- **ThemeContextValue**: Runtime context containing the theme plus computed convenience values (resolved button background, button radius CSS value)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can import all theme types from a single module location (100% of theme imports come from theming module after migration)
- **SC-002**: Zero duplicate theme type definitions exist in Projects or Events features after migration
- **SC-003**: All existing themed previews render identically before and after migration (zero visual regressions)
- **SC-004**: Background rendering code is consolidated from 3+ locations to 1 reusable component
- **SC-005**: Theme context errors clearly indicate the missing provider, reducing debugging time for developers

## Dependencies & Assumptions

### Dependencies

- Projects feature (will consume the unified Theme type)
- Events feature (will consume the unified Theme type)
- Step primitives (will use the theme provider and hook)

### Assumptions

- Hex color format (#RRGGBB) is the standard for all color values
- Button radius options (none/sm/md/full) cover all current and foreseeable design needs
- Logo handling will remain separate from theming (identity vs styling separation)
- CSS variable injection is a future enhancement, not required for initial implementation
- Color utilities (contrast calculation, brightness adjustment) are future enhancements

## Out of Scope

- Dark/light mode switching (handled separately by admin UI theming)
- Logo handling (identity concern, not styling)
- Complete CSS variable migration
- Color utility functions (contrast calculation, brightness adjustment)
- Font loading utilities
- Server-side theme rendering

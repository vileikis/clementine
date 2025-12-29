# Feature Specification: Theming Module Migration

**Feature Branch**: `006-theming-migration`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "Migrate the theming module from the Next.js app (web/src/features/theming/) to the TanStack Start app (apps/clementine-app/src/shared/theming/) to provide centralized theming infrastructure for guest-facing experiences"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developers Can Use Theme Context in Components (Priority: P1)

As a developer building guest-facing experiences, I need to access theme values (colors, fonts, button styles, backgrounds) through a React Context so that my components automatically reflect the event creator's branding choices.

**Why this priority**: This is the core functionality - without a working ThemeProvider and useEventTheme hook, no themed experiences can be built. This is the foundation that all other theming features depend on.

**Independent Test**: Can be fully tested by wrapping a component with ThemeProvider, passing theme data, calling useEventTheme() inside the component, and verifying the returned theme values match the input. Delivers immediate value by enabling themed component development.

**Acceptance Scenarios**:

1. **Given** a component wrapped in ThemeProvider with theme data, **When** the component calls useEventTheme(), **Then** it receives the complete theme object with all configured values
2. **Given** a component NOT wrapped in ThemeProvider, **When** the component calls useEventTheme(), **Then** it throws a clear error message indicating the provider is missing
3. **Given** a ThemeProvider with partial theme data (e.g., no button.backgroundColor), **When** a component accesses the theme, **Then** it receives computed fallback values (e.g., primaryColor used for button background)
4. **Given** a theme with button radius preset "md", **When** a component accesses buttonBorderRadius, **Then** it receives the mapped CSS value for medium radius

---

### User Story 2 - Developers Can Apply Theme Styles to Components (Priority: P2)

As a developer, I need to convert theme data into CSS styles through hooks and components so that I can easily apply consistent branding to text, buttons, and backgrounds without manually mapping theme properties.

**Why this priority**: This builds on P1 by providing convenient utilities. While developers could manually convert theme data to styles using useEventTheme(), these utilities significantly improve developer experience and ensure consistency.

**Independent Test**: Can be tested by calling useThemedStyles() with theme data and verifying it returns valid CSS properties objects for text, buttons, and backgrounds. Can also test ThemedBackground component by rendering it with theme data and verifying the correct styles are applied.

**Acceptance Scenarios**:

1. **Given** a theme with text color and alignment, **When** useThemedStyles() is called, **Then** it returns a text styles object with correct color and textAlign CSS properties
2. **Given** a theme with button colors and radius, **When** useThemedStyles() is called, **Then** it returns a button styles object with backgroundColor, color, and borderRadius
3. **Given** a theme with background color, image, and overlay opacity, **When** ThemedBackground is rendered, **Then** it displays a full-height container with the themed background and optional overlay
4. **Given** a ThemedBackground with custom contentClassName prop, **When** the component renders, **Then** the content wrapper applies both default and custom classes

---

### User Story 3 - System Validates Theme Data at Runtime (Priority: P3)

As a developer or system administrator, I need theme data to be validated against schemas so that invalid theme configurations are caught early and prevent runtime errors in guest-facing experiences.

**Why this priority**: While validation is important for data integrity, the system can function with unvalidated data in development. This is more about preventing bugs than enabling core functionality. It's essential for production but can be added after basic theming works.

**Independent Test**: Can be tested by passing valid and invalid theme objects to themeSchema.parse() and verifying that valid data passes and invalid data throws descriptive errors. Doesn't require any UI or component rendering.

**Acceptance Scenarios**:

1. **Given** a complete valid theme object, **When** themeSchema.parse() is called, **Then** it returns the validated theme without errors
2. **Given** a theme with invalid hex color (e.g., "red" instead of "#FF0000"), **When** themeSchema.parse() is called, **Then** it throws a validation error indicating the invalid color format
3. **Given** a partial theme object for updates, **When** updateThemeSchema.parse() is called, **Then** it validates only the provided fields and allows missing optional fields
4. **Given** a theme with overlayOpacity outside 0-1 range, **When** themeSchema.parse() is called, **Then** it throws a validation error indicating the invalid range

---

### Edge Cases

- What happens when theme background image URL is provided but fails to load? (ThemedBackground should fallback to background color)
- How does the system handle missing or null values in theme data? (Provider should apply fallback values using primaryColor as default)
- What happens when a component uses theme hooks multiple times with different values? (Each should use React memoization to avoid unnecessary recalculations)
- How does the system handle very long font family names or invalid CSS values? (Validation schema should catch these before they reach components)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a ThemeProvider component that wraps descendant components with theme context and makes theme data accessible throughout the component tree
- **FR-002**: System MUST provide a useEventTheme() hook that returns theme context values and throws a descriptive error when used outside ThemeProvider
- **FR-003**: System MUST compute derived theme values with fallbacks (e.g., if button.backgroundColor is null, use primaryColor)
- **FR-004**: System MUST map button radius presets ("none", "sm", "md", "full") to CSS border-radius values
- **FR-005**: System MUST provide a useThemedStyles() hook that converts theme data into CSS-in-JS style objects for text, buttons, and backgrounds
- **FR-006**: System MUST provide a ThemedBackground component that renders a full-height container with themed background color, image, and overlay opacity
- **FR-007**: System MUST validate theme data using Zod schemas that enforce hex color format, valid alignment values, valid radius presets, and opacity range (0-1)
- **FR-008**: System MUST support partial theme updates through updateThemeSchema that validates only provided fields
- **FR-009**: System MUST use React useMemo for performance optimization in ThemeProvider and useThemedStyles to prevent unnecessary recalculations
- **FR-010**: ThemedBackground MUST include an optional content wrapper with max-width 768px and centered layout
- **FR-011**: ThemedBackground MUST allow customization of content wrapper styling through contentClassName prop
- **FR-012**: System MUST export all types (Theme, ThemeText, ThemeButton, ThemeBackground, ButtonRadius, ThemeContextValue) for TypeScript consumers
- **FR-013**: System MUST export all schemas (themeSchema, updateThemeSchema, themeTextSchema, themeButtonSchema, themeBackgroundSchema, COLOR_REGEX) for validation in other modules
- **FR-014**: System MUST export constants (BUTTON_RADIUS_MAP) for reuse in other modules
- **FR-015**: System MUST be compatible with Zod v4.1.12 without using deprecated APIs

### Key Entities

- **Theme**: Represents the complete theming configuration for an event, containing primaryColor, optional fontFamily, and nested objects for text, button, and background styling. This is the root data structure passed to ThemeProvider.
- **ThemeText**: Represents text styling configuration with color (hex) and alignment (left/center/right). Used for rendering text content in themed experiences.
- **ThemeButton**: Represents button styling configuration with backgroundColor (hex, nullable), textColor (hex), and radius preset (none/sm/md/full). The nullable backgroundColor enables fallback to primaryColor.
- **ThemeBackground**: Represents background styling configuration with color (hex), optional image URL, and overlayOpacity (0-1 range). Used by ThemedBackground component to render full-page backgrounds.
- **ThemeContextValue**: Represents the computed theme values provided by ThemeProvider, including all original theme fields plus computed values like buttonBorderRadius (CSS string mapped from radius preset).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can wrap components with ThemeProvider and access theme values through useEventTheme() without any TypeScript errors
- **SC-002**: All theme validation schemas successfully validate valid theme data and reject invalid data with descriptive error messages
- **SC-003**: ThemedBackground component renders full-height backgrounds with theme styles in under 16ms (one frame at 60fps)
- **SC-004**: Module passes all TypeScript strict mode checks with zero errors
- **SC-005**: Module passes all linting and formatting checks (pnpm check) with zero errors
- **SC-006**: All exported types, components, hooks, and schemas are accessible through barrel exports from the module root
- **SC-007**: useThemedStyles() hook returns valid CSS properties that can be directly applied to React components via style prop
- **SC-008**: Theme validation catches all invalid color formats, alignment values, radius presets, and opacity ranges before reaching components

## Dependencies *(include if relevant)*

### Existing Infrastructure

- **React 19.2**: Required for hooks (createContext, useContext, useMemo) and component patterns
- **Zod v4.1.12**: Required for runtime schema validation
- **@/shared/utils (cn utility)**: Required for combining CSS classes in ThemedBackground component (uses clsx + tailwind-merge)
- **Tailwind CSS**: Required for utility classes in ThemedBackground component

### Migration Constraints

- Files have already been copied from web/src/features/theming/ to apps/clementine-app/src/shared/theming/
- Import paths must be updated from @/lib/utils to @/shared/utils
- "use client" directives must be evaluated and only kept if React hooks require client-side rendering in TanStack Start

## Assumptions *(include if relevant)*

- **Assumption**: TanStack Start's client-side component handling is compatible with React Context patterns used in Next.js
- **Assumption**: Existing module structure (types/, schemas/, components/, hooks/, context/, constants/) will be preserved
- **Assumption**: All consumers of this module will use TypeScript and benefit from exported types
- **Assumption**: Theme data originates from Firestore but validation happens client-side before use in components
- **Assumption**: Theme updates are handled by domain features, not by this shared module (this module only provides the theming infrastructure)
- **Assumption**: Color values will always be in hex format (#RRGGBB), not rgb(), hsl(), or named colors
- **Assumption**: Font families will be web-safe fonts or fonts loaded via separate font loading mechanism
- **Assumption**: Background images will be hosted URLs (Firebase Storage or external CDN), not local files or data URLs

## Out of Scope *(include if relevant)*

- Creating new theme variants or presets beyond existing types
- Adding theme editing UI (handled by domain features in events/projects modules)
- Real-time theme updates or synchronization between users
- Theme versioning or history tracking
- Server-side theme rendering (module is client-only for now)
- Theme persistence to Firestore (handled by domain features)
- Caching or memoization of theme data at application level
- Integration with design system components (that's a separate concern)
- Migration or update of existing theme data in Firestore
- Automated testing setup (that's a separate planning decision)

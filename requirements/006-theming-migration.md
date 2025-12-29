# Feature Requirements: Theming Module Migration

## Goal

Migrate the **theming module** from the Next.js app (`web/src/features/theming/`) to the TanStack Start app (`apps/clementine-app/src/shared/theming/`) to provide centralized theming infrastructure for guest-facing experiences.

**Status**: Files have already been copied to the target location. This migration focuses on updating imports, ensuring compatibility, and validating functionality.

---

## Overview

The theming module is **shared UI/utility infrastructure** that provides:

- Unified `Theme` interface for visual customization
- React Context-based theming system (`ThemeProvider`)
- Type-safe runtime validation with Zod schemas
- Convenience hooks and components for consuming theme values
- Consistent styling across admin previews and guest experiences

**Migration Target:** `/apps/clementine-app/src/shared/theming/`

---

## Functional Requirements

### Module Structure

The migrated module MUST maintain the following exports:

**Types:**

- `Theme` - Main theme interface (primaryColor, fontFamily, text, button, background)
- `ThemeText` - Text styling (color, alignment)
- `ThemeButton` - Button styling (backgroundColor, textColor, radius)
- `ThemeBackground` - Background styling (color, image, overlayOpacity)
- `ButtonRadius` - Radius preset union type
- `ThemeContextValue` - Context value shape

**Components:**

- `ThemeProvider` - Context provider with computed values and fallbacks
- `ThemedBackground` - Themed background container with content wrapper

**Hooks:**

- `useEventTheme()` - Access theme context values
- `useThemedStyles()` - Compute inline CSS styles from theme

**Schemas:**

- `COLOR_REGEX` - Hex color validation pattern
- `themeSchema` - Full Theme validation
- `updateThemeSchema` - Partial Theme validation
- `themeTextSchema`, `themeButtonSchema`, `themeBackgroundSchema` - Sub-schemas

**Constants:**

- `BUTTON_RADIUS_MAP` - Radius preset → CSS value mapping

### Core Functionality

**ThemeProvider Requirements:**

- MUST wrap descendant components with theme context
- MUST compute derived values with fallbacks (e.g., buttonBgColor → primaryColor)
- MUST use `useMemo` for performance optimization
- MUST map button radius presets to CSS values

**ThemedBackground Requirements:**

- MUST render full-height container with themed background
- MUST support background color, image, and overlay opacity
- MUST include optional content wrapper (max-width 768px, centered)
- MUST allow customization via `contentClassName` prop

**useEventTheme Requirements:**

- MUST access theme context values
- MUST throw error if used outside `ThemeProvider`
- MUST return computed `ThemeContextValue`

**useThemedStyles Requirements:**

- MUST compute inline CSS style objects from theme
- MUST return `.text`, `.button`, and `.background` CSSProperties
- MUST use `useMemo` for performance

### Validation Schemas

**Theme Validation:**

- `primaryColor` - Hex color (required)
- `fontFamily` - String (optional)
- `text.color` - Hex color (required)
- `text.alignment` - "left" | "center" | "right" (required)
- `button.backgroundColor` - Hex color (nullable)
- `button.textColor` - Hex color (required)
- `button.radius` - "none" | "sm" | "md" | "full" (required)
- `background.color` - Hex color (required)
- `background.image` - URL string (nullable)
- `background.overlayOpacity` - 0-1 number (required)

**Zod v4 Compatibility:**

- MUST verify all schemas work with Zod v4.1.12
- MUST update any deprecated Zod APIs if needed

---

## Technical Requirements

### Import Path Updates

The following import paths MUST be updated:

- `@/lib/utils` → `@/shared/utils`

### Client Component Handling

- MUST verify "use client" directives are handled correctly in TanStack Start
- MUST remove directives if not needed (TanStack Start handles client/server differently)
- MUST add directives only if React hooks require client-side rendering

### Barrel Exports

- MUST maintain barrel export pattern (`index.ts` re-exports)
- MUST export module from `/shared/index.ts` for top-level access

---

## Validation Gates

Before marking migration complete:

**Technical Validation (Automated):**

- ✅ `pnpm check` (format + lint + auto-fix)
- ✅ `pnpm type-check` (zero TypeScript errors)
- ✅ Module builds without errors
- ✅ No console warnings in dev server

**Standards Compliance (Manual):**

- ✅ Review `standards/global/project-structure.md` (barrel exports, file naming)
- ✅ Review `standards/global/code-quality.md` (clean code, simplicity)
- ✅ Review `standards/frontend/design-system.md` (theme integration patterns)

**Functional Verification:**

- ✅ ThemeProvider wraps components successfully
- ✅ useEventTheme() returns correct values
- ✅ useThemedStyles() generates valid CSS
- ✅ ThemedBackground renders with theme styles
- ✅ Zod validation passes for valid/invalid themes

---

## Acceptance Criteria

### Module Migration

- [x] All files copied to `/apps/clementine-app/src/shared/theming/`
- [ ] Import paths updated to TanStack Start conventions
- [ ] All barrel exports maintain public API surface
- [ ] Module structure preserved (types/, schemas/, components/, hooks/, context/, constants/)

### Component Functionality

- [ ] `ThemeProvider` wraps components and provides context
- [ ] `ThemedBackground` renders themed backgrounds correctly
- [ ] `useEventTheme()` throws error outside provider
- [ ] `useThemedStyles()` computes valid CSS styles
- [ ] Button radius mapping works correctly

### Schema Validation

- [ ] Zod v4 compatibility verified
- [ ] All schemas validate correctly (valid + invalid cases)
- [ ] COLOR_REGEX validates hex colors
- [ ] updateThemeSchema allows partial updates

### Build & Type Safety

- [ ] TypeScript strict mode passes (zero errors)
- [ ] ESLint passes (zero errors)
- [ ] Prettier formatting applied
- [ ] No runtime errors in dev server
- [ ] Module can be imported from other domains

---

## Dependencies

### Available

- ✅ React 19.2 (hooks: createContext, useContext, useMemo)
- ✅ Zod v4.1.12 (schema validation)
- ✅ `cn` utility (`@/shared/utils`)
- ✅ clsx + tailwind-merge

### Not Required

- No external dependencies needed beyond existing packages

---

## Migration Priority

**Priority:** 2 (Second)

**Rationale:**

- No external feature dependencies
- Simplest migration (no external packages, minimal path updates)
- Foundation for all themed experiences
- Used by consumers of preview-shell (not by preview-shell itself)

---

## Explicit Non-Goals (Out of Scope)

- Creating new theme variants or presets
- Adding theme editing UI (handled by domain features)
- Real-time theme updates or synchronization
- Theme versioning or history
- Server-side theme rendering (client-only for now)
- Theme persistence to Firestore (handled by domain features)

---

## References

### Source Module

- **Location:** `/web/src/features/theming/`
- **Files:** ~10 files (types, schemas, components, hooks, context, constants)
- **Used by:** 38+ files across projects, events, steps, guest flows, admin features

### Target Module

- **Location:** `/apps/clementine-app/src/shared/theming/`
- **Classification:** Shared UI/utility infrastructure
- **Exports:** Public API preserved via barrel exports

---

## Success Metrics

- ✅ Module migrated with zero TypeScript errors
- ✅ All validation gates passed
- ✅ Module can be imported and used by other features
- ✅ No breaking changes to public API
- ✅ Zod v4 validation working correctly

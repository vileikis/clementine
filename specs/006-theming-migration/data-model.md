# Data Model: Theming Module

**Feature**: 006-theming-migration
**Date**: 2025-12-29
**Status**: Complete

## Overview

This document defines the data structures and types used by the theming module. The module provides type-safe theme configuration with runtime validation for guest-facing experiences.

**Key Principle**: This module provides **infrastructure only**. It does NOT manage theme data persistence, fetching, or mutations. Theme data originates from Firestore (managed by domain features like events, projects) and is passed as props to theming components.

---

## Core Entities

### 1. Theme

**Purpose**: Root data structure representing complete theming configuration for an event or project.

**TypeScript Definition**:
```typescript
interface Theme {
  /** Anchor color in hex format (#RRGGBB) */
  primaryColor: string;
  /** CSS font-family string */
  fontFamily?: string | null;
  /** Text styling configuration */
  text: ThemeText;
  /** Button styling configuration */
  button: ThemeButton;
  /** Background styling configuration */
  background: ThemeBackground;
}
```

**Fields**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `primaryColor` | `string` | Yes | Hex color regex (`/^#[0-9A-Fa-f]{6}$/`) | Anchor color used throughout the experience. Falls back for button background if not specified. |
| `fontFamily` | `string \| null` | No | None (accepts any CSS font-family) | CSS font-family string. Applied to entire experience. |
| `text` | `ThemeText` | Yes | Nested validation | Text styling configuration (color, alignment) |
| `button` | `ThemeButton` | Yes | Nested validation | Button styling configuration (colors, radius) |
| `background` | `ThemeBackground` | Yes | Nested validation | Background styling configuration (color, image, overlay) |

**Relationships**:
- Contains nested entities: `ThemeText`, `ThemeButton`, `ThemeBackground`
- Used by `ThemeProvider` component (passed as `theme` prop)
- Source: Domain features (e.g., `Event.theme`, `Project.theme` from Firestore)

**Validation Rules**:
- `primaryColor` MUST match hex color format
- All nested entities MUST pass their respective validations
- Schema: `themeSchema` (Zod)

**Intentional Exclusions**:
- **No `logoUrl`**: Logo is an identity concern handled separately by domain features (e.g., `Event.logoUrl`, `Project.logoUrl`), not part of theming infrastructure

---

### 2. ThemeText

**Purpose**: Text styling configuration for theme-aware text components.

**TypeScript Definition**:
```typescript
interface ThemeText {
  /** Text color in hex format (#RRGGBB) */
  color: string;
  /** Text alignment */
  alignment: "left" | "center" | "right";
}
```

**Fields**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `color` | `string` | Yes | Hex color regex | Text color in hex format |
| `alignment` | `"left" \| "center" \| "right"` | Yes | Enum validation | Text alignment for themed content |

**Used By**:
- `Theme.text` (nested field)
- `useThemedStyles()` hook (generates CSS `color` and `textAlign`)

**Validation Rules**:
- `color` MUST match hex color format
- `alignment` MUST be one of: "left", "center", "right"
- Schema: `themeTextSchema` (Zod)

---

### 3. ThemeButton

**Purpose**: Button styling configuration for theme-aware button components.

**TypeScript Definition**:
```typescript
type ButtonRadius = "none" | "sm" | "md" | "full";

interface ThemeButton {
  /** Button background color in hex; falls back to primaryColor if null */
  backgroundColor?: string | null;
  /** Button text color in hex format (#RRGGBB) */
  textColor: string;
  /** Border radius preset */
  radius: ButtonRadius;
}
```

**Fields**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `backgroundColor` | `string \| null` | No | Hex color regex (if provided) | Button background color. Nullable to enable fallback to `primaryColor`. |
| `textColor` | `string` | Yes | Hex color regex | Button text color in hex format |
| `radius` | `ButtonRadius` | Yes | Enum validation | Border radius preset mapped to CSS value |

**Relationships**:
- `radius` maps to CSS value via `BUTTON_RADIUS_MAP` constant
- `backgroundColor` falls back to `Theme.primaryColor` when `null` (computed by `ThemeProvider`)

**Validation Rules**:
- `backgroundColor` MUST match hex color format if provided (nullable allowed)
- `textColor` MUST match hex color format
- `radius` MUST be one of: "none", "sm", "md", "full"
- Schema: `themeButtonSchema` (Zod)

**State Transitions**:
- `backgroundColor: null` → Computed to `primaryColor` by `ThemeProvider`
- `radius: "md"` → Mapped to `"0.375rem"` by `BUTTON_RADIUS_MAP`

---

### 4. ThemeBackground

**Purpose**: Background styling configuration for full-page themed backgrounds.

**TypeScript Definition**:
```typescript
interface ThemeBackground {
  /** Background color in hex format (#RRGGBB) */
  color: string;
  /** Full public URL to background image */
  image?: string | null;
  /** Overlay opacity from 0 to 1 */
  overlayOpacity: number;
}
```

**Fields**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `color` | `string` | Yes | Hex color regex | Background color (always visible, used when no image or as fallback) |
| `image` | `string \| null` | No | URL format (if provided) | Full public URL to background image (Firebase Storage or external CDN) |
| `overlayOpacity` | `number` | Yes | Range: 0-1 | Overlay opacity for readability when image is present (0 = no overlay, 1 = fully opaque) |

**Relationships**:
- Used by `ThemedBackground` component (renders full-page background)
- `image` should be Firebase Storage public URL or external CDN URL

**Validation Rules**:
- `color` MUST match hex color format
- `image` MUST be valid URL if provided (nullable allowed)
- `overlayOpacity` MUST be in range [0, 1]
- Schema: `themeBackgroundSchema` (Zod)

**Edge Cases**:
- `image: null` → Only background color is rendered
- `image` fails to load → Browser fallback to `color` (no app-level handling needed)
- `overlayOpacity: 0` → No overlay rendered (even if image present)

---

### 5. ThemeContextValue

**Purpose**: Computed theme values provided by `ThemeProvider` to all descendant components.

**TypeScript Definition**:
```typescript
interface ThemeContextValue {
  /** The raw theme object */
  theme: Theme;
  /** Resolved button background (falls back to primaryColor if button.backgroundColor is null) */
  buttonBgColor: string;
  /** Button text color from theme */
  buttonTextColor: string;
  /** CSS border-radius value mapped from theme.button.radius */
  buttonRadius: string;
}
```

**Fields**:

| Field | Type | Computed? | Description |
|-------|------|-----------|-------------|
| `theme` | `Theme` | No | Raw theme object passed to `ThemeProvider` |
| `buttonBgColor` | `string` | Yes | `theme.button.backgroundColor ?? theme.primaryColor` |
| `buttonTextColor` | `string` | No | `theme.button.textColor` |
| `buttonRadius` | `string` | Yes | `BUTTON_RADIUS_MAP[theme.button.radius]` |

**Computed Values**:
- `buttonBgColor`: Fallback logic for button background color
- `buttonRadius`: Preset-to-CSS mapping for border radius

**Performance**:
- All values computed once and memoized using `useMemo` in `ThemeProvider`
- Recomputes only when `theme` prop changes

**Used By**:
- `useEventTheme()` hook (returns this context value)
- `useThemedStyles()` hook (consumes computed values)

---

## Supporting Types

### ButtonRadius

**Purpose**: Type-safe button radius preset values.

**TypeScript Definition**:
```typescript
type ButtonRadius = "none" | "sm" | "md" | "full";
```

**Mapping to CSS** (via `BUTTON_RADIUS_MAP`):
| Preset | CSS Value | Visual |
|--------|-----------|--------|
| `"none"` | `"0"` | Square corners |
| `"sm"` | `"0.25rem"` | Slightly rounded |
| `"md"` | `"0.375rem"` | Medium rounded |
| `"full"` | `"9999px"` | Fully rounded (pill shape) |

---

## Constants

### BUTTON_RADIUS_MAP

**Purpose**: Maps button radius presets to CSS border-radius values.

**TypeScript Definition**:
```typescript
const BUTTON_RADIUS_MAP: Record<ButtonRadius, string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.375rem",
  full: "9999px",
};
```

**Location**: `constants/theme-defaults.ts`

**Usage**: Used by `ThemeProvider` to compute `buttonRadius` CSS value.

---

## Validation Schemas (Zod)

### themeSchema

**Purpose**: Runtime validation for complete Theme objects.

**Usage**:
```typescript
import { themeSchema } from '@/shared/theming';

// Validate theme data from Firestore
const validatedTheme = themeSchema.parse(firestoreThemeData);
```

**Validation Rules**:
- All required fields present
- All hex colors valid
- All enums valid
- All ranges valid

---

### updateThemeSchema

**Purpose**: Runtime validation for partial Theme updates (all fields optional).

**Usage**:
```typescript
import { updateThemeSchema } from '@/shared/theming';

// Validate partial theme updates
const validatedUpdate = updateThemeSchema.parse({ text: { color: '#000000' } });
```

**Validation Rules**:
- Only provided fields are validated
- Missing fields are allowed (all optional)

---

## Data Flow

```
1. Domain Feature (Firestore) → Theme data
   ↓
2. themeSchema.parse() → Runtime validation
   ↓
3. ThemeProvider (theme prop) → Computes derived values
   ↓
4. ThemeContext → Provides to descendants
   ↓
5. useEventTheme() / useThemedStyles() → Consume theme values
   ↓
6. Components → Render themed UI
```

**Key Boundaries**:
- **Firestore → Domain Feature**: Domain features fetch and manage theme data
- **Domain Feature → Theming Module**: Theme data passed as props (validated)
- **Theming Module → Components**: Theme values consumed via hooks

---

## Design Decisions

### Why Separate Text/Button/Background Types?

**Rationale**: Each subdomain has distinct validation rules and concerns:
- **Text**: Color + alignment (simple styling)
- **Button**: Colors + radius preset + fallback logic (interactive elements)
- **Background**: Color + image + overlay (full-page styling)

Separation improves type safety, validation clarity, and makes schemas easier to understand.

### Why Nullable backgroundColor?

**Rationale**: Enables fallback to `primaryColor` without requiring redundant data. Event creators can set button background to "use primary color" by setting to `null`, reducing configuration complexity.

### Why Presets for Button Radius?

**Rationale**: Simplifies UX for event creators (no need to understand CSS units). Provides consistency across experiences. Maps cleanly to common design patterns (square, rounded, pill).

### Why No Logo URL in Theme?

**Rationale**: Logo is an **identity concern**, not a **styling concern**. Different experiences may use different logos even with the same theme. Separation of concerns keeps theming module focused on visual styling only.

### Why Client-Only Module?

**Rationale**: React Context requires client-side rendering (cannot be serialized for SSR). Theme values are visual/stylistic, not SEO-critical, so client-side rendering is appropriate. Keeps architecture simple.

---

## Constraints

- **No Persistence**: Module does NOT save theme data to Firestore (domain features handle this)
- **No Fetching**: Module does NOT fetch theme data (domain features handle this)
- **No Mutations**: Module does NOT provide mutation functions (domain features handle this)
- **Client-Only**: Module requires "use client" directive (React Context limitation)
- **Immutable Theme**: Theme object is read-only during component lifecycle (updates require new theme prop)

---

## Future Considerations

**Out of Scope** (per spec):
- Theme versioning or history tracking
- Real-time theme updates or synchronization
- Server-side theme rendering
- Theme editing UI (handled by domain features)
- Design system component integration (separate concern)

**Potential Extensions** (not planned):
- Additional color fields (accent colors, semantic colors)
- Additional typography fields (font sizes, weights)
- Animation presets (transitions, durations)
- Accessibility presets (contrast modes, font scaling)

---

## References

- Feature Specification: `specs/006-theming-migration/spec.md`
- Type Definitions: `apps/clementine-app/src/shared/theming/types/theme.types.ts`
- Validation Schemas: `apps/clementine-app/src/shared/theming/schemas/theme.schemas.ts`
- Constitution: `.specify/memory/constitution.md`

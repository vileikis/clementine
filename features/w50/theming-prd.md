# PRD: Theming Feature Module

## Overview

Create a centralized **theming** feature module that consolidates all theme-related types, components, and utilities. This module becomes the single source of truth for brand styling across the application.

## Problem Statement

Currently, theme-related code is scattered and duplicated:

1. **Duplicate types**: `ProjectTheme` in projects, `EventTheme` in events (identical structures)
2. **Provider in shared**: `EventThemeProvider` in `components/providers/` (should be feature module)
3. **Multiple providers**: `EventThemeProvider` (context-based) vs `BrandThemeProvider` (CSS variable)
4. **No centralized utilities**: Button radius mapping duplicated in provider and editors

## Goals

1. **Single source of truth**: One `Theme` type used by projects, events, and UI components
2. **Consolidate providers**: Unified `ThemeProvider` with optional CSS variable injection
3. **Reusable components**: `ThemedBackground` for consistent background rendering
4. **Extensibility**: Foundation for future utilities (color contrast, font loading)

## Non-Goals

- Dark/light mode switching (handled by `next-themes` for admin UI)
- Logo handling (identity concern, separate from styling)
- Complete CSS variable migration (future consideration)

---

## Types

### Core Theme Interface

```tsx
// features/theming/types/theme.types.ts

/**
 * Text styling configuration
 */
export interface ThemeText {
  color: string; // Hex color (#RRGGBB)
  alignment: "left" | "center" | "right";
}

/**
 * Button styling configuration
 */
export interface ThemeButton {
  backgroundColor?: string | null; // Inherits primaryColor if null
  textColor: string; // Hex color (#RRGGBB)
  radius: "none" | "sm" | "md" | "full";
}

/**
 * Background styling configuration
 */
export interface ThemeBackground {
  color: string; // Hex color (#RRGGBB)
  image?: string | null; // Full public URL
  overlayOpacity: number; // 0-1
}

/**
 * Core theme interface for visual styling.
 * Used by Projects, Events, and preview components.
 *
 * Note: logoUrl is intentionally excluded - it's an "identity" concern,
 * not a "styling" concern. Handle separately in consuming features.
 */
export interface Theme {
  primaryColor: string; // Hex color - anchor color
  fontFamily?: string | null; // CSS font-family string
  text: ThemeText;
  button: ThemeButton;
  background: ThemeBackground;
}

/**
 * Button radius mapping for CSS values
 */
export type ButtonRadius = Theme["button"]["radius"];

export const BUTTON_RADIUS_MAP: Record<ButtonRadius, string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  full: "9999px",
};
```

### Theme Context Value

```tsx
/**
 * Context value with computed conveniences
 */
export interface ThemeContextValue {
  theme: Theme;
  // Computed values for convenience
  buttonBgColor: string; // Resolved button background (falls back to primaryColor)
  buttonTextColor: string;
  buttonRadius: string; // CSS value from BUTTON_RADIUS_MAP
}
```

---

## Components

### 1. ThemeProvider

Provides theme context to descendants. Replaces `EventThemeProvider`.

```tsx
// features/theming/components/ThemeProvider.tsx

interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    buttonBgColor: theme.button.backgroundColor ?? theme.primaryColor,
    buttonTextColor: theme.button.textColor,
    buttonRadius: BUTTON_RADIUS_MAP[theme.button.radius],
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
```

### 2. ThemedBackground

Renders background with color, optional image, and overlay. Extracted from duplicate code in theme editors.

```tsx
// features/theming/components/ThemedBackground.tsx

interface ThemedBackgroundProps {
  children: ReactNode;
  background?: Partial<ThemeBackground>;
  fontFamily?: string | null;
  className?: string;
}

export function ThemedBackground({
  children,
  background,
  fontFamily,
  className,
}: ThemedBackgroundProps) {
  const bgColor = background?.color ?? "#FFFFFF";
  const bgImage = background?.image;
  const overlayOpacity = background?.overlayOpacity ?? 0;

  return (
    <div
      className={cn("relative h-full w-full", className)}
      style={{
        backgroundColor: bgColor,
        fontFamily: fontFamily ?? undefined,
      }}
    >
      {/* Background Image */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* Overlay */}
      {bgImage && overlayOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
```

### 3. useThemedStyles (Hook)

Optional utility hook for computing inline styles from theme.

```tsx
// features/theming/hooks/useThemedStyles.ts

interface ThemedStyles {
  text: React.CSSProperties;
  button: React.CSSProperties;
  background: React.CSSProperties;
}

export function useThemedStyles(): ThemedStyles {
  const { theme, buttonBgColor, buttonRadius } = useTheme();

  return useMemo(() => ({
    text: {
      color: theme.text.color,
      textAlign: theme.text.alignment,
    },
    button: {
      backgroundColor: buttonBgColor,
      color: theme.button.textColor,
      borderRadius: buttonRadius,
    },
    background: {
      backgroundColor: theme.background.color,
      backgroundImage: theme.background.image
        ? `url(${theme.background.image})`
        : undefined,
      fontFamily: theme.fontFamily ?? undefined,
    },
  }), [theme, buttonBgColor, buttonRadius]);
}
```

---

## File Structure

```
web/src/features/theming/
├── index.ts                        # Public exports
├── types/
│   ├── index.ts
│   └── theme.types.ts              # Theme, ThemeText, ThemeButton, ThemeBackground
├── constants/
│   ├── index.ts
│   └── theme-defaults.ts           # Default theme values, BUTTON_RADIUS_MAP
├── components/
│   ├── index.ts
│   ├── ThemeProvider.tsx           # Context provider
│   └── ThemedBackground.tsx        # Background with image/overlay
├── hooks/
│   ├── index.ts
│   ├── useTheme.ts                 # Context hook
│   └── useThemedStyles.ts          # Computed styles hook
└── context/
    └── ThemeContext.tsx            # React context definition
```

---

## Migration Plan

### Phase 1: Create Module Structure
1. Create `features/theming/` directory structure
2. Define `Theme` and related types
3. Export from `index.ts`

### Phase 2: Create Components
1. Implement `ThemeProvider` (based on EventThemeProvider)
2. Implement `ThemedBackground` (extract from editors)
3. Implement `useTheme` hook
4. Add `useThemedStyles` utility hook

### Phase 3: Migrate Types in Features
1. Update `features/projects/types/project.types.ts`:
   - Import `Theme` from theming
   - Remove `ProjectTheme*` types
   - Use `Theme` in `Project` interface
   - Keep `logoUrl` as separate field

2. Update `features/events/types/event.types.ts`:
   - Import `Theme` from theming
   - Remove `EventTheme*` types
   - Use `Theme` in `Event` interface
   - Keep `logoUrl` as separate field

### Phase 4: Migrate Provider Usage
1. Update imports from `@/components/providers/EventThemeProvider` to `@/features/theming`
2. Rename `useEventTheme` → `useTheme` in consuming components
3. Deprecate/remove `EventThemeProvider` from `components/providers/`

### Phase 5: Migrate ThemedBackground Usage
1. Update `ThemeEditor` (projects) to use `ThemedBackground`
2. Update `EventThemeEditor` (events) to use `ThemedBackground`
3. Update `DeviceFrame` (steps) to use `ThemedBackground` or remove background logic

### Phase 6: Cleanup
1. Remove deprecated `EventThemeProvider`
2. Remove duplicate theme types from projects/events
3. Update any remaining type imports

---

## Integration with Existing Code

### Before (Current)

```tsx
// Importing from multiple places
import type { ProjectTheme } from "@/features/projects/types";
import type { EventTheme } from "@/features/events/types";
import { EventThemeProvider, useEventTheme } from "@/components/providers/EventThemeProvider";

// Duplicate background rendering in multiple editors
<div
  style={{
    backgroundColor: theme.background.color,
    backgroundImage: theme.background.image ? `url(...)` : undefined,
  }}
>
  {theme.background.image && <div className="overlay" style={{ opacity: ... }} />}
  {children}
</div>
```

### After (With Theming Module)

```tsx
// Single import source
import { Theme, ThemeProvider, useTheme, ThemedBackground } from "@/features/theming";

// Clean, reusable components
<ThemeProvider theme={theme}>
  <ThemedBackground background={theme.background} fontFamily={theme.fontFamily}>
    {children}
  </ThemedBackground>
</ThemeProvider>
```

---

## Impact on Other Features

### Projects Feature

```tsx
// features/projects/types/project.types.ts
import type { Theme } from "@/features/theming";

export interface Project {
  id: string;
  name: string;
  // ...
  theme: Theme;           // Uses unified type
  logoUrl?: string | null; // Identity, not in Theme
  // ...
}
```

### Events Feature

```tsx
// features/events/types/event.types.ts
import type { Theme } from "@/features/theming";

export interface Event {
  id: string;
  name: string;
  // ...
  theme: Theme;           // Uses unified type
  logoUrl?: string | null; // Identity, not in Theme
  // ...
}
```

### Step Primitives

```tsx
// components/step-primitives/ActionButton.tsx
// Before
import { useEventTheme } from "@/components/providers/EventThemeProvider";

// After
import { useTheme } from "@/features/theming";
```

---

## Future Considerations

### CSS Variables (Optional Enhancement)

Could add CSS variable injection to ThemeProvider:

```tsx
export function ThemeProvider({ theme, injectCssVariables = false, children }) {
  useEffect(() => {
    if (injectCssVariables) {
      const root = document.documentElement;
      root.style.setProperty("--theme-primary", theme.primaryColor);
      root.style.setProperty("--theme-text", theme.text.color);
      // ... etc
    }
  }, [theme, injectCssVariables]);
  // ...
}
```

### Color Utilities

```tsx
// Future: features/theming/utils/color.ts
export function getContrastColor(hex: string): string { ... }
export function hexToRgb(hex: string): { r: number; g: number; b: number } { ... }
export function adjustBrightness(hex: string, percent: number): string { ... }
```

### Font Loading

```tsx
// Future: features/theming/utils/fonts.ts
export function loadGoogleFont(fontFamily: string): Promise<void> { ... }
```

---

## Success Criteria

1. Single `Theme` type used across projects, events, and UI components
2. `ThemeProvider` replaces `EventThemeProvider` with same functionality
3. `ThemedBackground` eliminates duplicate background rendering code
4. All existing functionality preserved (no regressions)
5. Clean migration path with deprecation notices

---

## Relationship to Other PRDs

| PRD | Relationship |
|-----|--------------|
| `preview-shell-prd.md` | Depends on theming. Uses `ThemedBackground` component. |
| `welcome-screen-prd.md` | Will use theming for welcome screen preview. |

**Implementation Order:**
1. **theming** (this PRD) - Create types, provider, components
2. **preview-shell** - Uses theming components for themed previews

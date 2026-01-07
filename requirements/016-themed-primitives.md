# 016 - Themed Primitives

## Overview

Create a set of reusable primitive components that apply event theme styles. These components will be used across admin preview panels (Theme Editor, Welcome Editor, etc.) and guest-facing flows, ensuring consistent theming throughout the platform.

This requirement establishes the foundation for all themed UI by extracting common patterns into composable primitives.

## Goals

1. Create reusable `ThemedText` and `ThemedButton` components that consume theme from context
2. Refactor `ThemePreview.tsx` to use these primitives (validation + reference implementation)
3. Reorganize `shared/theming/` structure with `providers/` and `components/primitives/`
4. Establish patterns for future themed components (inputs, cards, etc.)

## Technical Context

### Theme System

The theme system is defined in `@/shared/theming/`:
- **Context**: `ThemeContext` provides theme to descendants
- **Provider**: `ThemeProvider` wraps components needing theme access
- **Hook**: `useEventTheme()` accesses theme from context

### Theme Structure

```typescript
interface Theme {
  fontFamily: string | null
  primaryColor: string // hex color
  text: {
    color: string // hex color
    alignment: 'left' | 'center' | 'right'
  }
  button: {
    backgroundColor: string | null // hex color, falls back to primaryColor
    textColor: string // hex color
    radius: 'none' | 'sm' | 'md' | 'full'
  }
  background: {
    color: string // hex color
    image: string | null // URL
    overlayOpacity: number // 0-1 decimal
  }
}
```

### Current State

- `ThemeProvider` and `ThemedBackground` exist in `shared/theming/components/`
- `ThemePreview` in `domains/event/theme/components/` uses inline styles directly
- No reusable themed primitives exist

## Architecture

### Directory Structure Changes

**Before:**
```
shared/theming/
├── components/
│   ├── ThemeProvider.tsx
│   ├── ThemedBackground.tsx
│   └── index.ts
├── context/
├── hooks/
├── schemas/
├── types/
└── index.ts
```

**After:**
```
shared/theming/
├── providers/                   # NEW - Provider components
│   ├── ThemeProvider.tsx        # MOVED from components/
│   └── index.ts
├── components/
│   ├── primitives/              # NEW - Themed primitive components
│   │   ├── ThemedText.tsx
│   │   ├── ThemedButton.tsx
│   │   └── index.ts
│   ├── inputs/                  # NEW - Placeholder for future inputs
│   │   └── index.ts
│   ├── ThemedBackground.tsx     # Existing
│   └── index.ts
├── context/                     # Existing
├── hooks/                       # Existing
├── schemas/                     # Existing
├── types/                       # Existing
├── constants/                   # Existing
└── index.ts
```

### Design Principles

1. **Context-First**: Primitives consume theme from `ThemeContext` by default
2. **Override Support**: Allow theme prop override for flexibility (e.g., previews without full provider)
3. **Composition**: Components are simple and composable
4. **No Design Tokens**: Themed primitives use event theme colors, NOT design system tokens

## Component Specifications

### 1. ThemedText

Typography component that applies theme text styles.

```tsx
interface ThemedTextProps {
  /** Content to render */
  children: React.ReactNode
  /** Text variant */
  variant?: 'heading' | 'body' | 'small'
  /** HTML element to render */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'
  /** Override text alignment (default: from theme) */
  align?: 'left' | 'center' | 'right' | 'inherit'
  /** Additional CSS classes */
  className?: string
  /** Override theme (for use without provider) */
  theme?: Theme
}
```

**Variant Styles:**

| Variant | Default Element | Font Size | Font Weight |
|---------|-----------------|-----------|-------------|
| `heading` | `h1` | `text-3xl` | `font-bold` |
| `body` | `p` | `text-lg` | `font-normal` |
| `small` | `span` | `text-sm` | `font-normal` |

**Behavior:**
- Gets `color` from `theme.text.color`
- Gets `textAlign` from `theme.text.alignment` (unless `align` prop overrides)
- Gets `fontFamily` from `theme.fontFamily`
- Falls back to context theme, then to prop theme
- Throws error if no theme available

**Example Usage:**
```tsx
// Within ThemeProvider - uses context
<ThemedText variant="heading">Welcome to Our Event</ThemedText>
<ThemedText variant="body">This is body text.</ThemedText>

// Override alignment
<ThemedText variant="body" align="center">Centered text</ThemedText>

// Custom element
<ThemedText variant="heading" as="h2">Subheading</ThemedText>

// Without provider - pass theme directly
<ThemedText variant="body" theme={previewTheme}>Preview text</ThemedText>
```

### 2. ThemedButton

Button component that applies theme button styles.

```tsx
interface ThemedButtonProps {
  /** Button content */
  children: React.ReactNode
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Click handler */
  onClick?: () => void
  /** Disabled state */
  disabled?: boolean
  /** Button type */
  type?: 'button' | 'submit'
  /** Additional CSS classes */
  className?: string
  /** Override theme (for use without provider) */
  theme?: Theme
}
```

**Size Styles:**

| Size | Padding | Font Size |
|------|---------|-----------|
| `sm` | `px-4 py-2` | `text-sm` |
| `md` | `px-6 py-2.5` | `text-base` |
| `lg` | `px-8 py-3` | `text-lg` |

**Behavior:**
- Gets `backgroundColor` from `theme.button.backgroundColor` (falls back to `theme.primaryColor`)
- Gets `color` from `theme.button.textColor`
- Gets `borderRadius` from `theme.button.radius` mapped to CSS value
- Applies hover state: `opacity: 0.9`
- Applies disabled state: `opacity: 0.5`, `cursor: not-allowed`

**Radius Mapping:**
```typescript
const BUTTON_RADIUS_MAP = {
  none: '0',
  sm: '4px',
  md: '8px',
  full: '9999px',
}
```

**Example Usage:**
```tsx
// Within ThemeProvider
<ThemedButton onClick={handleClick}>Get Started</ThemedButton>
<ThemedButton size="lg">Large Button</ThemedButton>

// Disabled state
<ThemedButton disabled>Coming Soon</ThemedButton>

// Without provider
<ThemedButton theme={previewTheme}>Preview Button</ThemedButton>
```

### 3. Utility: useThemeWithOverride

Internal hook used by primitives to get theme from context or props.

```typescript
function useThemeWithOverride(themeOverride?: Theme): Theme {
  const contextTheme = useEventTheme()

  if (themeOverride) {
    return themeOverride
  }

  if (contextTheme) {
    return contextTheme.theme
  }

  throw new Error(
    'Themed components require either a ThemeProvider ancestor or a theme prop'
  )
}
```

## ThemePreview Refactor

### Current Implementation

`ThemePreview` in `domains/event/theme/components/` uses inline styles directly:

```tsx
// Current - inline styles everywhere
<h1 style={{ color: theme.text.color, textAlign: theme.text.alignment }}>
  Event Title
</h1>
<button style={{
  backgroundColor: theme.button.backgroundColor ?? theme.primaryColor,
  color: theme.button.textColor,
  borderRadius: getButtonRadius(theme.button.radius)
}}>
  Sample Button
</button>
```

### Refactored Implementation

Use themed primitives with theme prop (no provider needed for preview):

```tsx
import { ThemedText, ThemedButton } from '@/shared/theming'

export function ThemePreview({ theme }: ThemePreviewProps) {
  return (
    <div className="..." style={{ backgroundColor: theme.background.color }}>
      {/* Background image layer - unchanged */}

      {/* Content layer */}
      <div className="relative flex h-full flex-col items-center justify-center gap-8 p-8">
        <div className="w-full space-y-4">
          <ThemedText variant="heading" theme={theme}>
            Event Title
          </ThemedText>
          <ThemedText variant="body" theme={theme} className="opacity-90">
            Sample text preview showing how your content will appear to guests
          </ThemedText>
        </div>

        <ThemedButton theme={theme}>
          Sample Button
        </ThemedButton>

        {/* Primary color accent - keep inline for specific preview element */}
        <div className="flex items-center gap-2">
          <div
            className="size-4 rounded-full"
            style={{ backgroundColor: theme.primaryColor }}
          />
          <ThemedText variant="small" theme={theme} className="opacity-75">
            Primary accent color
          </ThemedText>
        </div>
      </div>
    </div>
  )
}
```

**Benefits:**
- Reduced code duplication
- Consistent styling logic
- Easier maintenance
- Validates primitive components work correctly

## Implementation Notes

### Theme Access Pattern

```tsx
// CORRECT - primitives handle theme resolution internally
function ThemedText({ children, theme: themeOverride, ...props }) {
  const theme = useThemeWithOverride(themeOverride)
  // Apply theme styles...
}

// USAGE 1: Within provider (most common in guest flows)
<ThemeProvider theme={event.theme}>
  <ThemedText variant="heading">Welcome</ThemedText>
</ThemeProvider>

// USAGE 2: With prop override (common in admin previews)
<ThemedText variant="heading" theme={previewTheme}>Welcome</ThemedText>
```

### CSS-in-JS vs Inline Styles

Use **inline styles** for theme-derived values:
- `color`, `backgroundColor`, `borderRadius`, `fontFamily`, `textAlign`

Use **Tailwind classes** for non-theme styles:
- Spacing, sizing, font-size, font-weight, flexbox, etc.

```tsx
// CORRECT
<button
  className="px-6 py-2.5 text-base font-medium transition-opacity hover:opacity-90"
  style={{
    backgroundColor: buttonBgColor,
    color: theme.button.textColor,
    borderRadius: BUTTON_RADIUS_MAP[theme.button.radius],
  }}
>
```

### Error Handling

Primitives should fail fast if no theme is available:

```tsx
function useThemeWithOverride(themeOverride?: Theme): Theme {
  const context = useContext(ThemeContext)

  if (themeOverride) return themeOverride
  if (context?.theme) return context.theme

  throw new Error(
    'ThemedText/ThemedButton requires either a ThemeProvider ancestor or a theme prop. ' +
    'Wrap your component tree with <ThemeProvider theme={...}> or pass theme directly.'
  )
}
```

## File Structure Summary

### New Files

```
apps/clementine-app/src/shared/theming/
├── providers/
│   ├── ThemeProvider.tsx        # MOVED from components/
│   └── index.ts
├── components/
│   ├── primitives/
│   │   ├── ThemedText.tsx       # NEW
│   │   ├── ThemedButton.tsx     # NEW
│   │   └── index.ts             # NEW
│   ├── inputs/
│   │   └── index.ts             # NEW (placeholder)
│   └── index.ts                 # UPDATE exports
└── index.ts                     # UPDATE exports
```

### Modified Files

```
apps/clementine-app/src/
├── shared/theming/
│   ├── index.ts                 # Update barrel exports
│   └── components/index.ts      # Update exports, remove ThemeProvider
├── domains/event/theme/
│   └── components/
│       └── ThemePreview.tsx     # Refactor to use primitives
```

### Import Updates

Any file importing `ThemeProvider` from `@/shared/theming` will continue to work (barrel export updated).

## Testing Considerations

1. **ThemedText**: Test all variants, alignments, and theme override
2. **ThemedButton**: Test sizes, states (disabled, hover), and radius mapping
3. **useThemeWithOverride**: Test context vs prop priority, error on missing theme
4. **ThemePreview**: Visual regression test after refactor

## Out of Scope

- Themed input components (future PRD)
- ThemedCard or other container primitives
- Animation/transition customization
- Dark mode support (themes are user-defined)

## Success Criteria

1. `ThemedText` and `ThemedButton` components are implemented and exported
2. Components work both with ThemeProvider context and direct theme prop
3. `ThemePreview` is refactored to use primitives with no visual changes
4. `shared/theming/` directory is reorganized with `providers/` folder
5. All existing imports continue to work (barrel exports updated)
6. Theme editor preview looks identical before and after refactor

## Dependencies

- Existing: `@/shared/theming/` module
- Existing: `ThemeContext`, `useEventTheme` hook

## Future Enhancements

After this foundation is established:
- `ThemedInput`, `ThemedTextArea` for guest form inputs
- `OpinionScale`, `YesNo` specialized input components
- `ThemedCard` for content containers
- Additional text variants as needed

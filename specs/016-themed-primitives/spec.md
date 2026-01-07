# 016 - Themed Primitives

## Overview

Create a set of reusable primitive components that apply event theme styles. These components will be used across admin preview panels (Theme Editor, Welcome Editor, etc.) and guest-facing flows, ensuring consistent theming throughout the platform.

This requirement establishes the foundation for all themed UI by extracting common patterns into composable primitives.

## Goals

1. Create reusable `ThemedText` and `ThemedButton` components that consume theme from context
2. Define `MediaReference` schema as a shared type for all media asset references
3. Update theme background schema to use `MediaReference` instead of plain URL string
4. Refactor `ThemePreview.tsx` and `ThemedBackground.tsx` to use new primitives and schema
5. Reorganize `shared/theming/` structure with `providers/` and `components/primitives/`
6. Establish patterns for future themed components (inputs, cards, etc.)

## Technical Context

### Theme System

The theme system is defined in `@/shared/theming/`:
- **Context**: `ThemeContext` provides theme to descendants
- **Provider**: `ThemeProvider` wraps components needing theme access
- **Hook**: `useEventTheme()` accesses theme from context

### Theme Structure (Current)

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
    radius: 'square' | 'rounded' | 'pill'
  }
  background: {
    color: string // hex color
    image: string | null // URL ← CHANGING TO MediaReference
    overlayOpacity: number // 0-1 decimal
  }
}
```

### Theme Structure (After This PRD)

```typescript
interface MediaReference {
  mediaAssetId: string // MediaAsset document ID
  url: string // Firebase Storage download URL
}

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
    radius: 'square' | 'rounded' | 'pill'
  }
  background: {
    color: string // hex color
    image: MediaReference | null // NOW includes mediaAssetId for tracking
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
│   ├── ThemedBackground.tsx     # UPDATED - access image.url
│   └── index.ts
├── context/                     # Existing
├── hooks/                       # Existing
├── schemas/
│   ├── media-reference.schema.ts  # NEW - Shared MediaReference schema
│   ├── theme.schemas.ts           # UPDATED - use MediaReference
│   └── index.ts
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
// Matches BUTTON_RADIUS_OPTIONS from theme.schemas.ts: 'square' | 'rounded' | 'pill'
const BUTTON_RADIUS_MAP = {
  square: '0',
  rounded: '8px',
  pill: '9999px',
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

## Schema Changes

### MediaReference Schema

Create `@/shared/theming/schemas/media-reference.schema.ts`:

```typescript
import { z } from 'zod'

/**
 * Media Reference Schema
 *
 * Reusable schema for referencing MediaAsset documents.
 * Stores both ID (for tracking/management) and URL (for fast rendering).
 *
 * Used by:
 * - theme.background.image
 * - overlays (1:1, 9:16)
 * - welcome.media
 * - Future media references
 */
export const mediaReferenceSchema = z.object({
  /** MediaAsset document ID (workspaces/{workspaceId}/mediaAssets/{id}) */
  mediaAssetId: z.string(),
  /** Firebase Storage download URL for fast rendering */
  url: z.string().url(),
})

export type MediaReference = z.infer<typeof mediaReferenceSchema>
```

### Theme Background Schema Update

Update `@/shared/theming/schemas/theme.schemas.ts`:

```typescript
import { mediaReferenceSchema } from './media-reference.schema'

// BEFORE:
export const themeBackgroundSchema = z.object({
  color: z.string().regex(COLOR_REGEX),
  image: z.string().url().nullable().default(null), // Plain URL
  overlayOpacity: z.number().min(0).max(1).default(0),
})

// AFTER:
export const themeBackgroundSchema = z.object({
  color: z.string().regex(COLOR_REGEX),
  image: mediaReferenceSchema.nullable().default(null), // MediaReference
  overlayOpacity: z.number().min(0).max(1).default(0),
})
```

### Update Schema for Theme Updates

The `updateThemeSchema` needs to handle the new structure:

```typescript
// BEFORE:
background: z.object({
  color: z.string().regex(COLOR_REGEX).optional(),
  image: z.string().url().nullable().optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
}).optional(),

// AFTER:
background: z.object({
  color: z.string().regex(COLOR_REGEX).optional(),
  image: mediaReferenceSchema.nullable().optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
}).optional(),
```

## ThemedBackground Update

Update `@/shared/theming/components/ThemedBackground.tsx` to access the URL from MediaReference:

```tsx
// BEFORE:
const bgImage = background?.image

// AFTER:
const bgImage = background?.image?.url

// Full context:
export function ThemedBackground({
  children,
  background,
  fontFamily,
  className,
  style,
  contentClassName,
}: ThemedBackgroundProps) {
  const bgColor = background?.color ?? '#FFFFFF'
  const bgImage = background?.image?.url  // ← Access .url from MediaReference
  const overlayOpacity = background?.overlayOpacity ?? 0

  // ... rest unchanged
}
```

### Type Update

Update `@/shared/theming/types/theme.types.ts`:

```typescript
import type { MediaReference } from '../schemas/media-reference.schema'

// BEFORE:
export interface ThemeBackground {
  color: string
  image: string | null
  overlayOpacity: number
}

// AFTER:
export interface ThemeBackground {
  color: string
  image: MediaReference | null
  overlayOpacity: number
}
```

## Theme Editor Hook Update

Update `@/domains/event/theme/hooks/useUploadAndUpdateBackground.ts`:

The hook already returns `{ mediaAssetId, url }` from upload - now it should store both:

```typescript
// BEFORE:
await updateTheme.mutateAsync({
  background: { image: url },  // Only URL
})

// AFTER:
await updateTheme.mutateAsync({
  background: { image: { mediaAssetId, url } },  // Full MediaReference
})
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

Use all themed primitives - `ThemedBackground`, `ThemedText`, and `ThemedButton`:

```tsx
import { ThemedText, ThemedButton, ThemedBackground } from '@/shared/theming'

export function ThemePreview({ theme }: ThemePreviewProps) {
  return (
    <ThemedBackground
      background={theme.background}
      fontFamily={theme.fontFamily}
      className="h-full"
      contentClassName=""  // Disable default content wrapper for custom layout
    >
      {/* Content layer - ThemedBackground handles bg color, image, and overlay */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8 p-8">
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
    </ThemedBackground>
  )
}
```

**Note:** `ThemedBackground` already handles:
- Background color (`theme.background.color`)
- Background image (`theme.background.image?.url`) - updated to access MediaReference
- Overlay opacity (`theme.background.overlayOpacity`)
- Font family (`theme.fontFamily`)

**Benefits:**
- Uses all three themed primitives (`ThemedBackground`, `ThemedText`, `ThemedButton`)
- Reduced code duplication - no manual background/image/overlay handling
- Consistent styling logic across all themed components
- Easier maintenance
- Validates that all primitive components work correctly together

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
├── schemas/
│   ├── media-reference.schema.ts  # NEW
│   └── index.ts                   # UPDATE exports
└── index.ts                     # UPDATE exports
```

### Modified Files

```
apps/clementine-app/src/
├── shared/theming/
│   ├── index.ts                 # Update barrel exports
│   ├── components/
│   │   ├── index.ts             # Update exports, remove ThemeProvider
│   │   └── ThemedBackground.tsx # Update to access image.url
│   ├── schemas/
│   │   └── theme.schemas.ts     # Use MediaReference for background.image
│   └── types/
│       └── theme.types.ts       # Update ThemeBackground interface
├── domains/event/theme/
│   ├── components/
│   │   └── ThemePreview.tsx     # Refactor to use primitives + image.url
│   └── hooks/
│       └── useUploadAndUpdateBackground.ts  # Store full MediaReference
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
3. `MediaReference` schema is defined and exported from `@/shared/theming`
4. Theme background schema uses `MediaReference` instead of plain URL string
5. `ThemedBackground` correctly accesses `image.url` from MediaReference
6. `ThemePreview` is refactored to use all three primitives (`ThemedBackground`, `ThemedText`, `ThemedButton`)
7. Theme editor upload hook stores full `{ mediaAssetId, url }` object
8. `shared/theming/` directory is reorganized with `providers/` folder
9. All existing imports continue to work (barrel exports updated)
10. Theme editor preview looks identical before and after refactor
11. Button radius uses correct values: `'square' | 'rounded' | 'pill'` (matching existing schema)

## Dependencies

- Existing: `@/shared/theming/` module
- Existing: `ThemeContext`, `useEventTheme` hook

## Future Enhancements

After this foundation is established:
- `ThemedInput`, `ThemedTextArea` for guest form inputs
- `OpinionScale`, `YesNo` specialized input components
- `ThemedCard` for content containers
- Additional text variants as needed

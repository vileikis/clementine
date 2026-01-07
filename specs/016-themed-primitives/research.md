# Research: Themed Primitives

**Feature**: 016-themed-primitives | **Date**: 2026-01-07

## 1. React 19 Context Best Practices

### Decision
Use standard `useContext` with throw-on-missing-provider pattern, matching existing `useEventTheme` implementation.

### Rationale
The codebase already follows React 19 best practices with the existing hook pattern:

```typescript
// From useEventTheme.ts
export function useEventTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useEventTheme must be used within a ThemeProvider')
  }
  return context
}
```

### Relevant React 19 Features
1. **Simplified Provider Syntax**: React 19 allows `<SomeContext>` instead of `<SomeContext.Provider>`
2. **New `use()` API**: Can conditionally read context after early returns (unlike `useContext`)
3. **Performance**: Context updates trigger re-renders only for components that actually use the context value

### Alternatives Considered
- **CSS Variables Only**: Would avoid React context but lose type safety - rejected
- **Zustand**: Overkill for read-only theme distribution - rejected

---

## 2. Zod Schema Composition

### Decision
Use nested schema composition with `.nullable().default(null)` pattern.

### Rationale
The existing codebase demonstrates this pattern in `project-event-config.schema.ts`:

```typescript
// Nullable nested object with defaults
export const overlayReferenceSchema = z
  .object({
    mediaAssetId: z.string(),
    url: z.string().url(),
  })
  .nullable()

// Composed into parent schema
export const overlaysConfigSchema = z
  .object({
    '1:1': overlayReferenceSchema.default(null),
    '9:16': overlayReferenceSchema.default(null),
  })
  .nullable()
  .default(null)
```

### Implementation Pattern for MediaReference

```typescript
export const mediaReferenceSchema = z.object({
  mediaAssetId: z.string(),
  url: z.string().url(),
})

export const themeBackgroundSchema = z.object({
  color: z.string().regex(COLOR_REGEX).default('#FFFFFF'),
  image: mediaReferenceSchema.nullable().default(null),  // Changed from z.url().nullable()
  overlayOpacity: z.number().min(0).max(1).default(0.3),
})
```

### Order of Modifiers
Use: validations first, then `.nullable()`, then `.default()`

### Alternatives Considered
- **Union type**: `z.union([z.string().url(), mediaReferenceSchema])` - more complex, harder to migrate - rejected
- **Separate field**: `imageRef` alongside `image` - redundant - rejected

---

## 3. CSS-in-JS vs Inline Styles for Theming

### Decision
Use inline styles via `CSSProperties` for user-defined theme colors.

### Rationale
The existing `ThemedBackground` and `ThemePreview` components already use this pattern:

```typescript
// From ThemedBackground.tsx
<div
  className={cn('relative flex flex-1 flex-col overflow-hidden', className)}
  style={{
    backgroundColor: bgColor,
    fontFamily: fontFamily ?? undefined,
    ...style,
  }}
>
```

### Why Inline Styles for User Themes
1. **Dynamic values**: User-defined hex colors cannot be known at build time
2. **Isolation**: Guest-facing themes are separate from admin UI design system
3. **Simplicity**: No need for CSS-in-JS runtime overhead

### When to Use CSS Variables
The design system uses CSS custom properties for admin UI theming (light/dark mode). This is correct because:
- Admin theme values are **static/predefined**
- CSS variables avoid re-renders when theme changes

### Performance Considerations
- Inline styles are acceptable for isolated guest UI components
- CSS variables trigger only browser paint, not React re-renders

### Alternatives Considered
- **Runtime CSS Variables**: Set `--theme-primary` via inline style on container - adds complexity - rejected
- **CSS-in-JS (Emotion)**: Moving away from this in React ecosystem - rejected

---

## 4. Component API Design: Context + Prop Override

### Decision
Use "context with optional override" pattern via internal `useThemeWithOverride` hook.

### Recommended Pattern

```typescript
function useThemeWithOverride(themeOverride?: Theme): Theme {
  const context = useContext(ThemeContext)

  if (themeOverride) {
    return themeOverride
  }

  if (context?.theme) {
    return context.theme
  }

  throw new Error(
    'Themed components require either a ThemeProvider ancestor or a theme prop'
  )
}
```

### Component Implementation

```typescript
interface ThemedButtonProps {
  /** Override theme (for use without provider) */
  theme?: Theme
  // ...other props
}

export function ThemedButton({ theme: themeOverride, ...props }: ThemedButtonProps) {
  const theme = useThemeWithOverride(themeOverride)

  const bgColor = theme.button.backgroundColor ?? theme.primaryColor
  // ...
}
```

### Benefits
1. **Flexible usage**: Components work with or without `ThemeProvider`
2. **Storybook-friendly**: Override in stories without wrapping in provider
3. **Preview-friendly**: Theme editor can pass theme prop directly to preview components

### Alternatives Considered
- **Always require provider**: Simpler but less flexible for previews/stories - rejected
- **Props-only**: No context - requires prop drilling - rejected
- **Separate components**: `ThemedButton` vs `Button` - unnecessary duplication - rejected

---

## 5. Data Migration: String to MediaReference Object

### Decision
Use read-time normalization with Zod `preprocess` for transparent conversion. Add batch migration script for cleanup.

### Strategy

The codebase already uses `schemaVersion` in `projectEventConfigSchema`:

```typescript
export const CURRENT_CONFIG_VERSION = 1

export const projectEventConfigSchema = z.looseObject({
  schemaVersion: z.number().default(CURRENT_CONFIG_VERSION),
  // ...
})
```

### Implementation Approach

1. **Add normalize function** (read-time migration):

```typescript
function normalizeBackgroundImage(
  image: string | MediaReference | null | undefined
): MediaReference | null {
  if (image === null || image === undefined) return null
  if (typeof image === 'string') {
    // Legacy string URL - convert to MediaReference
    // Empty mediaAssetId indicates legacy data
    return { mediaAssetId: '', url: image }
  }
  return image
}
```

2. **Use Zod preprocess** for transparent conversion:

```typescript
export const themeBackgroundSchema = z.object({
  color: z.string().regex(COLOR_REGEX).default('#FFFFFF'),
  image: z.preprocess(
    normalizeBackgroundImage,
    mediaReferenceSchema.nullable()
  ).default(null),
  overlayOpacity: z.number().min(0).max(1).default(0.3),
})
```

3. **Batch migration script** (optional, for cleanup):
Following the pattern in `scripts/migrate-events-to-projects.ts`:
- Dry-run mode
- Batch writes (500 doc limit)
- Verification after migration

### Key Considerations
- **Firestore doesn't support undefined**: Use `.nullable().default(null)` pattern
- **z.looseObject()**: Already used for forward compatibility with unknown fields
- **Read-time normalization**: Handles legacy data without migration script

### Alternatives Considered
- **Create new field**: `imageRef` alongside `image` - redundant, requires UI changes - rejected
- **Require full migration**: Would need downtime or complex rollout - rejected
- **No migration**: Break existing data - unacceptable - rejected

---

## Summary Table

| Topic | Decision | Reference |
|-------|----------|-----------|
| React 19 Context | Standard `useContext` + throw pattern | `useEventTheme.ts` |
| Zod Composition | Nested schemas with `.nullable().default(null)` | `project-event-config.schema.ts` |
| Theming Approach | Inline styles for user themes | `ThemedBackground.tsx` |
| Component API | Context with optional prop override | New `useThemeWithOverride` hook |
| Data Migration | Read-time normalization via Zod preprocess | `migrate-events-to-projects.ts` |

---

## Sources

### React 19 Context
- [useContext - React](https://react.dev/reference/react/useContext)
- [React v19 - React](https://react.dev/blog/2024/12/05/react-19)
- [React Context with the New Use API](https://www.telerik.com/blogs/react-context-new-use-api)

### Zod Schema Composition
- [Defining schemas | Zod](https://zod.dev/api)
- [Zod Object Schema: Error Handling, Refine & Nested](https://tecktol.com/zod-object/)

### CSS Theming Performance
- [How to use CSS variables with React | Josh W. Comeau](https://www.joshwcomeau.com/css/css-variables-for-react-devs/)
- [CSS-in-JS vs CSS Performance - Bejamas](https://bejamas.io/blog/css-performance/)

### Component API Design
- [Compound Components In React - Smashing Magazine](https://www.smashingmagazine.com/2021/08/compound-components-react/)
- [Advanced React Component Composition](https://frontendmastery.com/posts/advanced-react-component-composition-guide/)

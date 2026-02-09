# Contract: useGoogleFontLoader Hook

**Feature**: 066-google-fonts
**Location**: `apps/clementine-app/src/shared/theming/hooks/useGoogleFontLoader.ts`

## Hook Interface

```typescript
/**
 * Loads a Google Font by injecting a <link> stylesheet into <head>.
 * Handles caching (won't re-inject for same font), cleanup on font change,
 * and preconnect hints.
 *
 * No-op when fontFamily is null or fontSource is not "google".
 */
function useGoogleFontLoader(options: {
  /** Font family name (e.g., "Inter") */
  fontFamily: string | null
  /** Font source - only loads when "google" */
  fontSource: 'google' | 'system'
  /** Weights to load (e.g., [400, 700]) */
  fontVariants?: number[]
}): void
```

## Behavior

1. **When `fontFamily` is null or `fontSource` is `"system"`**: No-op. Does not inject any elements.
2. **When `fontSource` is `"google"` and `fontFamily` is set**:
   - Constructs Google Fonts CSS URL: `https://fonts.googleapis.com/css2?family={name}:wght@{weights}&display=swap`
   - Checks if a `<link>` with matching `id` already exists in `<head>` (prevents duplicates)
   - If not present, creates and appends `<link rel="stylesheet">` to `<head>`
   - On cleanup (font change or unmount), removes the `<link>` element
3. **Stable ID**: Each injected link gets `id="gfont-{family-slug}"` for dedup
4. **Dependencies**: Re-runs when `fontFamily`, `fontSource`, or `fontVariants` change

## URL Construction

```typescript
function buildGoogleFontsUrl(family: string, weights: number[]): string {
  const encoded = family.replace(/ /g, '+')
  const sorted = [...weights].sort((a, b) => a - b)
  const weightStr = sorted.join(';')
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@${weightStr}&display=swap`
}
```

Example: `buildGoogleFontsUrl("Playfair Display", [400, 700])`
→ `https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap`

## Integration Points

### In ThemeProvider (or ThemedBackground)

Called once per theme to ensure the Google Font is loaded before themed components render:

```typescript
// In ThemeProvider.tsx
export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  useGoogleFontLoader({
    fontFamily: theme.fontFamily,
    fontSource: theme.fontSource,
    fontVariants: theme.fontVariants,
  })

  // ... rest of provider
}
```

### In Theme Editor Preview

Same hook reused — when the creator selects a font in the editor, the preview ThemeProvider triggers font loading.

## Preconnect Hints

Separate from this hook. Static `<link rel="preconnect">` tags are added to the root document:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

**Location**: `apps/clementine-app/src/app/__root.tsx` in the `head()` configuration.

# Contract: Font CSS Utilities

**Feature**: 066-google-fonts
**Location**: `apps/clementine-app/src/shared/theming/lib/font-css.ts`

## Utility Functions

### buildFontFamilyValue

Constructs the full CSS `font-family` value from theme font fields.

```typescript
/**
 * Builds the CSS font-family value from theme font configuration.
 *
 * @returns CSS font-family string or undefined (for system default)
 *
 * @example
 * buildFontFamilyValue("Inter", "google", "system-ui, sans-serif")
 * // → '"Inter", system-ui, sans-serif'
 *
 * buildFontFamilyValue(null, "system", "system-ui, sans-serif")
 * // → undefined (let browser use default)
 */
function buildFontFamilyValue(
  fontFamily: string | null,
  fontSource: 'google' | 'system',
  fallbackStack: string,
): string | undefined
```

### buildGoogleFontsUrl

Constructs the Google Fonts CSS API v2 URL.

```typescript
/**
 * Constructs the Google Fonts CSS API v2 stylesheet URL.
 *
 * @example
 * buildGoogleFontsUrl("Playfair Display", [400, 700])
 * // → "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap"
 */
function buildGoogleFontsUrl(
  family: string,
  weights: number[],
): string
```

### buildGoogleFontsPreviewUrl

Constructs a Google Fonts URL optimized for preview (using `text=` parameter for minimal download).

```typescript
/**
 * Constructs a Google Fonts URL loading only glyphs needed for preview text.
 *
 * @example
 * buildGoogleFontsPreviewUrl("Inter", "Clementine makes sharing magical.")
 * // → "https://fonts.googleapis.com/css2?family=Inter&text=Clementine%20makes%20sharing%20magical.&display=swap"
 */
function buildGoogleFontsPreviewUrl(
  family: string,
  previewText: string,
): string
```

## Integration Points

- `buildFontFamilyValue` → used by `ThemedBackground`, `ThemedText`, `ThemedButton` etc. to construct the inline `fontFamily` style value (replaces current `theme.fontFamily ?? undefined`)
- `buildGoogleFontsUrl` → used by `useGoogleFontLoader` hook
- `buildGoogleFontsPreviewUrl` → used by `GoogleFontPicker` component for lazy font preview loading

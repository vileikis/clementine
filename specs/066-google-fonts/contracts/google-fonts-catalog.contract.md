# Contract: useGoogleFontsCatalog Hook

**Feature**: 066-google-fonts
**Location**: `apps/clementine-app/src/domains/project-config/theme/hooks/useGoogleFontsCatalog.ts`

## Hook Interface

```typescript
interface GoogleFontEntry {
  /** Font family name (e.g., "Inter") */
  family: string
  /** Font category */
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace'
  /** Available variant strings from API (e.g., ["regular", "700", "700italic"]) */
  variants: string[]
  /** Numeric weights derived from variants (e.g., [400, 700]) */
  weights: number[]
}

interface UseGoogleFontsCatalogResult {
  /** List of available Google Fonts, sorted by popularity */
  fonts: GoogleFontEntry[]
  /** Whether the catalog is currently being fetched */
  isLoading: boolean
  /** Error if the API request failed */
  error: Error | null
  /** Retry function for failed requests */
  refetch: () => void
}

/**
 * Fetches the Google Fonts catalog via the Developer API.
 * Cached aggressively — fetched once per session (staleTime: 24h).
 *
 * Only used in the Theme Editor (admin dashboard).
 * Not called in guest experience.
 */
function useGoogleFontsCatalog(): UseGoogleFontsCatalogResult
```

## Behavior

1. **Fetch**: Calls `GET https://www.googleapis.com/webfonts/v1/webfonts?key={VITE_GOOGLE_FONTS_API_KEY}&sort=popularity`
2. **Transform**: Maps API response items to `GoogleFontEntry[]`, deriving `weights` from `variants`
3. **Cache**: TanStack Query with `staleTime: 24 * 60 * 60 * 1000` (24 hours), `gcTime: Infinity`
4. **Error handling**: Returns `error` object if API fails. Consumers show error UI with retry.

## Variant-to-Weight Mapping

```typescript
function variantToWeight(variant: string): number | null {
  if (variant === 'regular') return 400
  if (variant === 'italic') return null  // skip italic-only
  const num = parseInt(variant, 10)
  if (!isNaN(num) && num >= 100 && num <= 900) return num
  return null  // skip italic variants like "700italic"
}
```

## Environment Variable

```
VITE_GOOGLE_FONTS_API_KEY=<your-api-key>
```

Free key from Google Cloud Console. Enable "Google Fonts Developer API". Not a secret — designed for client-side use.

## Query Key

```typescript
['google-fonts-catalog']
```

## Integration Point

Consumed by `GoogleFontPicker` component to populate the font list.

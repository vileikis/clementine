# Research: Google Fonts Integration

**Feature**: 066-google-fonts
**Date**: 2026-02-09

## Decision 1: Font Catalog Data Source

**Decision**: Google Fonts Developer API fetched at runtime via TanStack Query

**Rationale**: Fetch the font catalog from the Google Fonts API (`https://www.googleapis.com/webfonts/v1/webfonts?key=API_KEY&sort=popularity`) at runtime using TanStack Query with aggressive caching (`staleTime: 24h`). This ensures the catalog is always up-to-date, adds zero bundle size, and requires only a free public API key stored as an environment variable. The font picker is only used by creators in the admin dashboard — a single API call per session is negligible overhead.

**API key**: Google Fonts API keys are free, public (designed for client-side use), and not secret. Stored as `VITE_GOOGLE_FONTS_API_KEY` environment variable.

**Caching strategy**: TanStack Query with `staleTime: 24 * 60 * 60 * 1000` (24 hours). The catalog is fetched once per session and cached in memory. On subsequent visits within the same session, no network request is made. If the API fails, the picker shows an error state — existing font selections continue working.

**Response handling**: The API returns ~200KB of JSON with all font metadata. We extract only `family`, `category`, and `variants` fields, discarding subsets, file URLs, and other metadata.

**Alternatives considered**:
- **Bundled static JSON catalog**: No API key needed, instant load. Rejected because it gets stale (~20-50 new fonts/year), adds ~50-100KB to the bundle, and requires a build script to regenerate. Simpler to just fetch fresh data.
- **Full `@fontsource` / `google-font-metadata` package**: Comprehensive but heavy (~400KB+ with all metadata). Rejected because we only need family name, category, and weights.

---

## Decision 2: Font Loading Strategy (Guest Runtime)

**Decision**: Dynamic `<link>` stylesheet injection via a React hook with `display=swap`

**Rationale**: Injecting a `<link rel="stylesheet">` pointing to `https://fonts.googleapis.com/css2?family=...&display=swap` is the simplest, most reliable approach. The browser handles caching, unicode range optimization, and format negotiation automatically. `display=swap` ensures text is visible immediately using the fallback stack and swaps to the Google Font once loaded.

**Alternatives considered**:
- **`next/font/google` (build-time)**: Not applicable — fonts are dynamic per project at runtime, not known at build time. TanStack Start doesn't have an equivalent.
- **FontFace API (`new FontFace()`)**: More control but requires manually fetching the CSS to extract font URLs, loses Google's automatic unicode-range splitting and format negotiation. Overkill for runtime loading.
- **CSS `@import`**: Blocks CSS parsing, slower than `<link>`. Rejected.

**URL format** (Google Fonts CSS API v2):
```
https://fonts.googleapis.com/css2?family=Font+Name:wght@400;700&display=swap
```

**Caching strategy**: The hook assigns a stable `id` attribute to each injected `<link>` tag (e.g., `gfont-inter`). Before injecting, it checks if the element already exists, preventing duplicate stylesheets on route changes. Cleanup removes the element on font change or unmount.

---

## Decision 3: Font Picker Preview Strategy

**Decision**: Virtualized list with lazy font loading using the `text=` parameter

**Rationale**: The font picker needs to display ~1600 fonts, each rendered in its own typeface. Loading all fonts upfront would be ~50MB+. Instead:
1. **Virtualization** (`react-window` or equivalent) renders only ~10-15 visible rows at a time
2. **`text=` parameter** loads only the characters needed for the preview sentence, reducing each font download to ~1-3KB
3. **Intersection Observer** triggers font loading only when a row becomes visible

This keeps the initial picker load instant and total network usage under 100KB even after scrolling through 50+ fonts.

**Alternatives considered**:
- **Pre-rendered SVG/image previews**: Libraries like `react-fontpicker` pre-render font names as images. Eliminates runtime font loading but adds ~8MB to the bundle (full catalog) or ~180KB (lite). Rejected for bundle size concerns and because authentic font rendering is preferred.
- **Load all fonts upfront**: Not viable — 1600+ fonts would be ~50MB+.
- **Load font name only (not preview sentence)**: Could use even smaller subsets but the spec requires "Clementine makes sharing magical." as preview text.

**Preview text optimization**: The preview sentence "Clementine makes sharing magical." has 36 unique characters. Using `text=Clementine%20makes%20sharing%20magical.` in the Google Fonts URL loads only those glyphs — typically under 3KB per font.

---

## Decision 4: Theme Schema Approach

**Decision**: Add flat fields to existing theme schema (not a nested `font` object)

**Rationale**: The existing schema has `fontFamily: string | null`. Adding `fontSource`, `fontVariants`, and `fallbackStack` as sibling fields maintains backward compatibility — existing themes with only `fontFamily` continue to work because all new fields have defaults. A nested `font` object would be cleaner but requires migrating existing data and breaking the current `fontFamily` field contract.

**Fields to add**:
- `fontSource: z.enum(['google', 'system']).default('system')` — distinguishes loading strategy
- `fontVariants: z.array(z.number()).default([400, 700])` — weights to load
- `fallbackStack: z.string().default('system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif')` — CSS fallback

**Backward compatibility**: Existing themes with `fontFamily: null` get `fontSource: 'system'` by default. Existing themes with a system font string (e.g., `'Arial, sans-serif'`) would need the fontFamily field cleared when migrating to the new model, since individual system fonts are no longer offered.

**Alternatives considered**:
- **Nested `font` object**: Cleaner data modeling but requires data migration for all existing projects. Rejected for V1 to minimize blast radius.

---

## Decision 5: Preconnect Strategy

**Decision**: Static preconnect hints in the root HTML document

**Rationale**: Adding `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` to the root document shaves ~100ms off the first font load by establishing the TCP/TLS connection early. These are cheap (no data transferred) and always beneficial since both the editor and guest flows use Google Fonts.

**Location**: In the TanStack Start root route head configuration (`__root.tsx`), alongside the existing app CSS stylesheet link.

---

## Decision 6: Font Application in Guest Experience

**Decision**: Keep existing inline style approach, add font loader hook to ThemeProvider

**Rationale**: The current architecture applies `fontFamily` via inline styles on ThemedBackground, ThemedText, ThemedButton, etc. This works correctly — the font just needs to be loaded first. Adding a `useGoogleFontLoader` call inside ThemeProvider (or ThemedBackground) ensures the Google Font stylesheet is injected whenever the theme specifies a Google font. The existing inline styles then render with the loaded font.

**No CSS variable migration needed**: The current inline style approach is sufficient. CSS variables would be cleaner but would require refactoring all themed components — out of scope for this feature.

---

## Decision 7: Font Picker UI Component

**Decision**: Custom font picker using shadcn/ui Popover + Command pattern with virtualized list

**Rationale**: The existing `SelectField` (shadcn Select/Radix) doesn't support search, custom rendering per option, or virtualization. A font picker needs all three. Using the shadcn `Popover` + `Command` (cmdk) pattern provides a searchable dropdown that's consistent with the design system, and `react-window` inside the command list provides virtualization.

**Component location**: New `GoogleFontPicker` component in `domains/project-config/theme/components/`, replacing the current `SelectField` for font selection in `ThemeConfigPanel`.

**Data source**: Font list comes from `useGoogleFontsCatalog` hook (TanStack Query wrapper around the Google Fonts API). Loading/error states handled in the picker UI.

**Alternatives considered**:
- **Third-party font picker library** (`react-fontpicker`, `font-picker-react`): Adds external dependencies, styling conflicts with shadcn/ui, limited customization. Rejected.
- **Extend existing SelectField**: Would require significant modifications to support search, custom rendering, and virtualization. Cleaner to build a dedicated component.

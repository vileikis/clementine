# Data Model: Google Fonts Integration

**Feature**: 066-google-fonts
**Date**: 2026-02-09

## Entity: Theme (Extended)

The existing `Theme` entity is extended with three new fields for Google Fonts support. All new fields have defaults, maintaining full backward compatibility with existing theme data.

### Schema Changes

**Current fields** (unchanged):
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fontFamily` | `string \| null` | `null` | Font family name (e.g., `"Inter"`, `"Roboto"`) |
| `primaryColor` | `string` | `"#3B82F6"` | Primary accent color (hex) |
| `text` | `ThemeText` | `{...}` | Text color and alignment |
| `button` | `ThemeButton` | `{...}` | Button styling |
| `background` | `ThemeBackground` | `{...}` | Background color, image, overlay |

**New fields**:
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fontSource` | `"google" \| "system"` | `"system"` | Where the font comes from — determines loading strategy |
| `fontVariants` | `number[]` | `[400, 700]` | Font weights to load (auto-determined, clamped to available) |
| `fallbackStack` | `string` | `"system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"` | CSS fallback font stack |

### Field Semantics

**`fontFamily`** (existing, reused):
- When `fontSource` is `"google"`: stores the Google Font family name exactly as it appears in the catalog (e.g., `"Playfair Display"`, `"Inter"`)
- When `fontSource` is `"system"`: stored as `null` (system default)
- Used directly in CSS `font-family` property

**`fontSource`**:
- `"system"`: No external font loaded. Uses fallback stack only.
- `"google"`: Loads font from Google Fonts CDN at runtime via stylesheet injection.
- Defaults to `"system"` — existing themes without this field behave exactly as before.

**`fontVariants`**:
- Array of numeric font weights (e.g., `[400, 700]`)
- Auto-determined: defaults to `[400, 700]`, clamped to what the font actually supports
- Used to construct the Google Fonts CSS URL (e.g., `wght@400;700`)
- Not user-editable in V1 — always auto-set when a font is selected

**`fallbackStack`**:
- CSS font-family fallback string used when Google Font hasn't loaded or fails to load
- Defaults to a cross-platform stack: `"system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"`
- Applied as part of the `font-family` CSS value: `font-family: "Inter", system-ui, -apple-system, ...`

### State Transitions

```
System Default (initial state)
  fontFamily: null
  fontSource: "system"
  fontVariants: [400, 700]
  fallbackStack: "system-ui, ..."

    ↓ Creator selects Google Font "Inter"

Google Font Selected
  fontFamily: "Inter"
  fontSource: "google"
  fontVariants: [400, 700]  (auto-clamped to Inter's available weights)
  fallbackStack: "system-ui, ..."

    ↓ Creator selects different Google Font "Playfair Display"

Google Font Changed
  fontFamily: "Playfair Display"
  fontSource: "google"
  fontVariants: [400, 700]  (re-clamped to Playfair Display's weights)
  fallbackStack: "system-ui, ..."

    ↓ Creator selects "System Default"

Reverted to System Default
  fontFamily: null
  fontSource: "system"
  fontVariants: [400, 700]
  fallbackStack: "system-ui, ..."
```

### Validation Rules

- `fontFamily`: Any non-empty string or `null`. When `fontSource` is `"google"`, must match a family name in the Google Fonts catalog.
- `fontSource`: Must be exactly `"google"` or `"system"`.
- `fontVariants`: Array of integers. Each value must be one of: 100, 200, 300, 400, 500, 600, 700, 800, 900. Array must not be empty.
- `fallbackStack`: Non-empty string. Must be a valid CSS font-family value.

### Backward Compatibility

Existing themes in Firestore will not have `fontSource`, `fontVariants`, or `fallbackStack` fields. Because all new fields have Zod defaults:
- Missing `fontSource` → defaults to `"system"` (correct — existing themes use system fonts)
- Missing `fontVariants` → defaults to `[400, 700]` (harmless — not used when source is "system")
- Missing `fallbackStack` → defaults to the cross-platform stack (correct behavior)

**No data migration required.** Zod schema defaults handle all existing data.

---

## Entity: Google Font Catalog Entry (API Response, Client-Side Only)

This entity is fetched at runtime from the Google Fonts Developer API — it is **not stored in Firestore**. Cached in memory via TanStack Query (`staleTime: 24h`).

### API Endpoint

```
GET https://www.googleapis.com/webfonts/v1/webfonts?key={API_KEY}&sort=popularity
```

### Response Fields (extracted per font)

| Field | Type | Description |
|-------|------|-------------|
| `family` | `string` | Font family name (e.g., `"Inter"`, `"Roboto"`) |
| `category` | `string` | Font category: `"serif"`, `"sans-serif"`, `"display"`, `"handwriting"`, `"monospace"` |
| `variants` | `string[]` | Available variant strings (e.g., `["100", "300", "regular", "700", "900"]`) |

### Derived Fields (computed client-side)

| Field | Type | Description |
|-------|------|-------------|
| `weights` | `number[]` | Available numeric weights — derived from `variants` by mapping `"regular"` → `400`, `"100italic"` → excluded, numeric strings → parsed |

### Usage

- Populates the font picker search and list
- `weights` array used to clamp `fontVariants` when a font is selected (e.g., if font only has [400], fontVariants becomes [400])
- `category` used for optional filtering in the picker (serif, sans-serif, etc.)
- `family` used as the display name and stored in `theme.fontFamily`
- Sorted by popularity (API `sort=popularity` parameter)

---

## Relationship: Theme ↔ Project Config

```
ProjectConfig (Firestore: projects/{projectId})
├── draftConfig
│   ├── theme: Theme | null          ← Extended with fontSource, fontVariants, fallbackStack
│   ├── experiences: ...
│   ├── welcome: ...
│   └── ...
└── publishedConfig
    ├── theme: Theme | null          ← Same schema, published snapshot
    └── ...
```

Theme is stored as a nullable sub-object of project configuration. The entire theme object is replaced atomically via `updateProjectConfigField(projectId, { theme: fullThemeObject })`.

---

## Constructed Artifacts (Not Stored)

These values are derived at runtime from the stored theme fields — they are **not persisted**:

**Google Fonts CSS URL** (guest runtime):
```
https://fonts.googleapis.com/css2?family={fontFamily}:wght@{fontVariants.join(';')}&display=swap
```
Example: `https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap`

**CSS font-family value** (applied to elements):
```
"{fontFamily}", {fallbackStack}
```
Example: `"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`

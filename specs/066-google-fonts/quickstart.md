# Quickstart: Google Fonts Integration

**Feature**: 066-google-fonts
**Branch**: `066-google-fonts`

## What This Feature Does

Adds Google Fonts support to the Clementine Theme Editor. Creators can search and select from ~1600 Google Fonts with live preview. Selected fonts load at runtime for guests via Google Fonts CDN with graceful fallback.

## Key Files to Modify

### Shared Package (Schema)

| File | Change |
|------|--------|
| `packages/shared/src/schemas/theme/theme.constants.ts` | Add `DEFAULT_FONT_SOURCE`, `DEFAULT_FONT_VARIANTS`, `DEFAULT_FALLBACK_STACK` |
| `packages/shared/src/schemas/theme/theme.schema.ts` | Add `fontSource`, `fontVariants`, `fallbackStack` fields to `themeSchema` |
| `packages/shared/src/schemas/theme/index.ts` | Export new constants and types |

### App — Theming Shared Module

| File | Change |
|------|--------|
| `apps/clementine-app/src/shared/theming/schemas/theme.schemas.ts` | Re-export new constants/types from shared |
| `apps/clementine-app/src/shared/theming/hooks/useGoogleFontLoader.ts` | **NEW** — Hook to inject Google Fonts `<link>` stylesheet |
| `apps/clementine-app/src/shared/theming/lib/font-css.ts` | **NEW** — URL builders and CSS font-family constructors |
| `apps/clementine-app/src/shared/theming/providers/ThemeProvider.tsx` | Add `useGoogleFontLoader` call |
| `apps/clementine-app/src/shared/theming/components/ThemedBackground.tsx` | Use `buildFontFamilyValue` for font-family with fallback stack |

### App — Theme Editor Domain

| File | Change |
|------|--------|
| `apps/clementine-app/src/domains/project-config/theme/components/GoogleFontPicker.tsx` | **NEW** — Searchable font picker with preview |
| `apps/clementine-app/src/domains/project-config/theme/components/ThemeConfigPanel.tsx` | Replace `SelectField` with `GoogleFontPicker` |
| `apps/clementine-app/src/domains/project-config/theme/constants/fonts.ts` | Remove `FONT_OPTIONS`, update `getFontLabel` |
| `apps/clementine-app/src/domains/project-config/theme/containers/ThemeEditorPage.tsx` | Add new fields to `THEME_FIELDS_TO_COMPARE` |
| `apps/clementine-app/src/domains/project-config/theme/hooks/useGoogleFontsCatalog.ts` | **NEW** — TanStack Query hook for Google Fonts API |

### App — Root Layout

| File | Change |
|------|--------|
| `apps/clementine-app/src/app/__root.tsx` | Add preconnect `<link>` tags for Google Fonts domains |

### Environment

| File | Change |
|------|--------|
| `apps/clementine-app/.env` | Add `VITE_GOOGLE_FONTS_API_KEY` (free, public Google Fonts API key) |

## Implementation Order

1. **Schema** — Extend `themeSchema` with new fields (shared package)
2. **Font utilities** — `buildGoogleFontsUrl`, `buildFontFamilyValue` (shared theming lib)
3. **Font loader hook** — `useGoogleFontLoader` (shared theming hooks)
4. **ThemeProvider integration** — Call font loader, update font-family construction
5. **Font catalog hook** — `useGoogleFontsCatalog` (TanStack Query + Google Fonts API)
6. **Font picker** — Build `GoogleFontPicker` component
7. **Editor integration** — Wire picker into `ThemeConfigPanel`
8. **Preconnect hints** — Add to root layout
9. **Cleanup** — Remove old `FONT_OPTIONS` system fonts constant

## How to Verify

### Theme Editor
1. Open Theme Editor for any project
2. Font picker shows search field and scrollable Google Fonts list
3. Each font previews in its own typeface
4. Selecting a font updates live preview immediately
5. Auto-save persists selection after 2s debounce

### Guest Experience
1. Set a project theme to use a Google Font
2. Open guest URL in a new browser tab
3. All text (headings, body, buttons, labels) renders in the selected font
4. Font is consistent across welcome, experience, and share screens

### Fallback
1. Set a Google Font on a project
2. Open guest URL with Google Fonts blocked (DevTools → Network → Block `fonts.googleapis.com`)
3. Text renders in system fallback font — no broken layout, no invisible text

## Dependencies

- **New npm package**: `react-window` (for virtualized font picker list) — install with `pnpm add react-window --filter clementine-app` and `pnpm add -D @types/react-window --filter clementine-app`
- **Google Fonts API key**: Free, public key — add as `VITE_GOOGLE_FONTS_API_KEY` to `.env`. Get one at https://console.cloud.google.com/apis/credentials (enable "Google Fonts Developer API")
- **No Firestore rule changes**: Theme is already a nullable sub-object of project config

# Implementation Plan: Google Fonts Integration

**Branch**: `066-google-fonts` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/066-google-fonts/spec.md`

## Summary

Add Google Fonts support to the Clementine Theme Editor and guest experience. Creators search and select from ~1600 Google Fonts in a new font picker with live preview. Selected fonts load at runtime via Google Fonts CDN (`<link>` stylesheet injection with `display=swap`). Fallback to a cross-platform system font stack when fonts fail to load. The theme schema is extended with `fontSource`, `fontVariants`, and `fallbackStack` fields — all backward compatible with existing themes.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: React 19, TanStack Start 1.132, TanStack Query 5.66, Zod 4.1, shadcn/ui, Radix UI, react-hook-form
**New Dependencies**: `react-window` (virtualized list for font picker)
**Storage**: Firebase Firestore (existing project config document — no schema migration needed)
**Testing**: Vitest
**Target Platform**: Web (mobile-first guest experience, desktop creator dashboard)
**Project Type**: Monorepo — shared package (`@clementine/shared`) + TanStack Start app (`clementine-app`)
**Performance Goals**: Font picker opens instantly, preview loads <500ms per font, guest font load <2s on broadband
**Constraints**: Google Fonts API key (free, public) for font catalog, no build-time font optimization (fonts are dynamic per project)
**Scale/Scope**: ~1600 Google Fonts in catalog, ~10 files modified, ~5 new files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | Font picker needs mobile-friendly touch targets. Guest font loading uses `display=swap` — no FOIT on mobile. |
| II. Clean Code & Simplicity | PASS | Flat schema extension (not nested object) — minimal change. Single hook for font loading. No premature abstractions. |
| III. Type-Safe Development | PASS | Schema extension via Zod with full TypeScript inference. API response typed with Zod schema. |
| IV. Minimal Testing Strategy | PASS | Unit tests for URL builders and schema validation. No E2E required for V1. |
| V. Validation Gates | PASS | `pnpm app:check` + `pnpm app:type-check` before commit. Standards compliance review for design system. |
| VI. Frontend Architecture | PASS | Client-first — font catalog fetched via Google Fonts API, fonts loaded from CDN client-side. No server functions needed. |
| VII. Backend & Firebase | PASS | No Firestore rule changes needed — theme is already a nullable sub-object of project config. |
| VIII. Project Structure | PASS | New files follow existing vertical slice structure in `domains/project-config/theme/` and `shared/theming/`. |

**Post-Design Re-check**: All gates still pass. New `react-window` dependency is justified for virtualization of 1600+ items — no simpler alternative for this scale.

## Project Structure

### Documentation (this feature)

```text
specs/066-google-fonts/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: schema extension design
├── quickstart.md        # Phase 1: implementation quick reference
├── contracts/           # Phase 1: component/hook contracts
│   ├── theme-schema.contract.md
│   ├── google-font-picker.contract.md
│   ├── google-font-loader.contract.md
│   ├── google-fonts-catalog.contract.md
│   └── font-css-builder.contract.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/theme/
├── theme.schema.ts          # MODIFY — add fontSource, fontVariants, fallbackStack
├── theme.constants.ts       # MODIFY — add DEFAULT_FONT_SOURCE, DEFAULT_FONT_VARIANTS, DEFAULT_FALLBACK_STACK
└── index.ts                 # MODIFY — export new constants/types

apps/clementine-app/src/
├── app/
│   └── __root.tsx           # MODIFY — add preconnect <link> tags
├── shared/theming/
│   ├── schemas/
│   │   └── theme.schemas.ts # MODIFY — re-export new constants/types
│   ├── hooks/
│   │   ├── useGoogleFontLoader.ts  # NEW — inject Google Fonts stylesheet
│   │   └── index.ts         # MODIFY — export new hook
│   ├── lib/
│   │   └── font-css.ts      # NEW — URL builders, CSS font-family constructor
│   ├── providers/
│   │   └── ThemeProvider.tsx # MODIFY — call useGoogleFontLoader
│   ├── components/
│   │   └── ThemedBackground.tsx  # MODIFY — use buildFontFamilyValue
│   └── index.ts             # MODIFY — export new utilities
└── domains/project-config/theme/
    ├── components/
    │   ├── GoogleFontPicker.tsx   # NEW — searchable font picker with preview
    │   ├── ThemeConfigPanel.tsx   # MODIFY — replace SelectField with GoogleFontPicker
    │   └── index.ts              # MODIFY — export GoogleFontPicker
    ├── constants/
    │   └── fonts.ts              # MODIFY — remove FONT_OPTIONS, keep getFontLabel (updated)
    ├── containers/
    │   └── ThemeEditorPage.tsx   # MODIFY — add new fields to THEME_FIELDS_TO_COMPARE
    └── hooks/
        └── useGoogleFontsCatalog.ts  # NEW — TanStack Query hook for Google Fonts API
```

**Structure Decision**: Follows existing monorepo structure. Schema changes in shared package, font loading in shared theming module, font picker in project-config theme domain. No new domains or modules created.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `react-window` dependency | Font picker must render ~1600 items performantly | Native scrolling with 1600+ DOM nodes would degrade performance below acceptable threshold |
| Google Fonts API key | Font catalog must be always up-to-date | Bundled static catalog gets stale, adds bundle size, requires regeneration scripts |

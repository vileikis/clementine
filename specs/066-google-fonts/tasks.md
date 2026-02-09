# Tasks: Google Fonts Integration

**Input**: Design documents from `/specs/066-google-fonts/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in spec. No test tasks included.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Install dependencies and configure environment

- [x] T001 Install `react-window` and `@types/react-window` — run `pnpm add react-window --filter clementine-app && pnpm add -D @types/react-window --filter clementine-app`
- [x] T002 Add `VITE_GOOGLE_FONTS_API_KEY` environment variable to `apps/clementine-app/.env` (obtain free key from Google Cloud Console, enable "Google Fonts Developer API")

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend theme schema and create shared utilities that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add new font constants (`DEFAULT_FONT_SOURCE`, `DEFAULT_FONT_VARIANTS`, `DEFAULT_FALLBACK_STACK`, `FONT_SOURCE_OPTIONS`) to `packages/shared/src/schemas/theme/theme.constants.ts` — per theme-schema.contract.md
- [x] T004 Add `fontSource`, `fontVariants`, `fallbackStack` fields to `themeSchema` in `packages/shared/src/schemas/theme/theme.schema.ts` — using new constants from T003, export `FontSource` type. Per theme-schema.contract.md
- [x] T005 Export new constants and `FontSource` type from `packages/shared/src/schemas/theme/index.ts`
- [x] T006 Build shared package — run `pnpm --filter @clementine/shared build` to generate updated type definitions
- [x] T007 Re-export new constants and types (`DEFAULT_FONT_SOURCE`, `DEFAULT_FONT_VARIANTS`, `DEFAULT_FALLBACK_STACK`, `FONT_SOURCE_OPTIONS`, `FontSource`) from `apps/clementine-app/src/shared/theming/schemas/theme.schemas.ts`
- [x] T008 [P] Create font CSS utility functions (`buildGoogleFontsUrl`, `buildFontFamilyValue`, `buildGoogleFontsPreviewUrl`) in `apps/clementine-app/src/shared/theming/lib/font-css.ts` — per font-css-builder.contract.md
- [x] T009 [P] Create `useGoogleFontLoader` hook in `apps/clementine-app/src/shared/theming/hooks/useGoogleFontLoader.ts` — injects `<link>` stylesheet into `<head>` for Google Fonts, no-op for system fonts, handles dedup via stable element ID and cleanup on unmount. Per google-font-loader.contract.md. Uses `buildGoogleFontsUrl` from T008
- [x] T010 Export `useGoogleFontLoader` from `apps/clementine-app/src/shared/theming/hooks/index.ts` and export font-css utilities from `apps/clementine-app/src/shared/theming/index.ts`
- [x] T011 Integrate `useGoogleFontLoader` into `ThemeProvider` in `apps/clementine-app/src/shared/theming/providers/ThemeProvider.tsx` — call with `theme.fontFamily`, `theme.fontSource`, `theme.fontVariants`. Per google-font-loader.contract.md integration section
- [x] T012 Update `ThemedBackground` in `apps/clementine-app/src/shared/theming/components/ThemedBackground.tsx` — replace `theme.fontFamily ?? undefined` with `buildFontFamilyValue(theme.fontFamily, theme.fontSource, theme.fallbackStack)` for the inline `fontFamily` style
- [x] T013 Add preconnect `<link>` tags for `fonts.googleapis.com` and `fonts.gstatic.com` (with crossorigin) to the root document head configuration in `apps/clementine-app/src/app/__root.tsx`

**Checkpoint**: Theme schema extended, font loading infrastructure ready. Google Fonts can now be loaded by setting theme fields manually. All existing themes continue to work unchanged.

---

## Phase 3: User Story 1 — Select a Google Font in Theme Editor (Priority: P1) MVP

**Goal**: Creator can search, preview, and select Google Fonts in the Theme Editor with live preview

**Independent Test**: Open Theme Editor, search for a font, select it, verify preview updates immediately and selection auto-saves

### Implementation for User Story 1

- [x] T014 [US1] Create `useGoogleFontsCatalog` TanStack Query hook in `apps/clementine-app/src/domains/project-config/theme/hooks/useGoogleFontsCatalog.ts` — fetches from Google Fonts API (`/webfonts/v1/webfonts?key=...&sort=popularity`), transforms response to `GoogleFontEntry[]` with derived `weights` field, caches with `staleTime: 24h`. Per google-fonts-catalog.contract.md
- [x] T015 [US1] Export `useGoogleFontsCatalog` and `GoogleFontEntry` type from `apps/clementine-app/src/domains/project-config/theme/hooks/index.ts`
- [x] T016a [US1] Create reusable `Searchable` ui-kit component in `apps/clementine-app/src/ui-kit/ui/searchable.tsx` — composable Popover-based searchable list with keyboard navigation (ArrowUp/Down, Enter, Home/End), unified index space across pinned items and virtualized rows, react-window v2 integration via `SearchableVirtualList`. Exports: `Searchable`, `SearchableTrigger`, `SearchableContent`, `SearchableInput`, `SearchableItem`, `SearchableVirtualList`, `SearchableEmpty`, `useSearchableHighlight`
- [x] T016b [US1] Build `GoogleFontPicker` component folder at `apps/clementine-app/src/domains/project-config/theme/components/google-font-picker/` — uses `Searchable` (not cmdk) with search input, "System Default" pinned at top, virtualized list via react-window v2 for ~1600 fonts. Each row renders font name in its own typeface + preview sentence loaded lazily via `buildGoogleFontsPreviewUrl` with `text=` parameter. Full keyboard navigation across all rows. Organized as: `GoogleFontPicker.tsx` (main), `FontRow.tsx` (row components with named interfaces), `useLazyFontPreview.ts` (hook), `constants.ts`, `index.ts` (barrel)
- [x] T016c [US1] Remove `cmdk` dependency and delete `apps/clementine-app/src/ui-kit/ui/command.tsx` — replaced by the custom `Searchable` component which provides proper keyboard navigation through virtualized rows (cmdk's `Command` did not support this)
- [x] T017 [US1] Export `GoogleFontPicker` from `apps/clementine-app/src/domains/project-config/theme/components/index.ts`
- [x] T018 [US1] Replace `SelectField` with `GoogleFontPicker` in `apps/clementine-app/src/domains/project-config/theme/components/ThemeConfigPanel.tsx` — on selection, call `onUpdate` with `fontFamily`, `fontSource`, and `fontVariants` (clamped to available weights, default [400, 700]). On "System Default", set `fontFamily: null`, `fontSource: 'system'`, `fontVariants: [400, 700]`. Per google-font-picker.contract.md integration section
- [x] T019 [US1] Add `fontSource`, `fontVariants`, `fallbackStack` to `THEME_FIELDS_TO_COMPARE` array in `apps/clementine-app/src/domains/project-config/theme/containers/ThemeEditorPage.tsx` — ensures auto-save detects changes to new fields
- [x] T020 [US1] Update `getFontLabel` and remove old `FONT_OPTIONS` array in `apps/clementine-app/src/domains/project-config/theme/constants/fonts.ts` — `getFontLabel` should return font family name directly or "System Default" for null

**Checkpoint**: Theme Editor has a fully functional Google Font picker. Creators can search, preview, select, and auto-save. Live preview shows the selected font immediately.

---

## Phase 4: User Story 2 — Guest Sees the Selected Font (Priority: P1)

**Goal**: Guests see the selected Google Font on all text across the entire experience

**Independent Test**: Set a project theme to a Google Font, visit guest URL, verify all text renders in the selected font across all screens

### Implementation for User Story 2

- [ ] T021 [US2] Verify `ThemedText` in `apps/clementine-app/src/shared/theming/components/primitives/ThemedText.tsx` uses `buildFontFamilyValue` (or theme.fontFamily with fallback) for its inline `fontFamily` style — update if it still uses `theme.fontFamily ?? undefined` directly
- [ ] T022 [P] [US2] Verify `ThemedButton` in `apps/clementine-app/src/shared/theming/components/primitives/ThemedButton.tsx` uses `buildFontFamilyValue` for its inline `fontFamily` style — update if it still uses `theme.fontFamily ?? undefined` directly
- [ ] T023 [P] [US2] Verify all themed input components (`ThemedInput`, `ThemedTextarea`, `ThemedCheckbox`, `ThemedRadio`) in `apps/clementine-app/src/shared/theming/components/inputs/` use `buildFontFamilyValue` — update any that still use `theme.fontFamily ?? undefined`
- [ ] T024 [US2] Verify guest pages in `apps/clementine-app/src/domains/guest/containers/` pass the full theme (with new `fontSource`, `fontVariants`, `fallbackStack` fields) through to `ThemeProvider` — the schema defaults should handle this automatically, but confirm no partial theme spreads strip the new fields

**Checkpoint**: Guest experience renders all text in the selected Google Font. Font loads on first visit and is consistent across welcome, experience, and share screens.

---

## Phase 5: User Story 3 — Graceful Fallback When Font Fails to Load (Priority: P2)

**Goal**: If Google Fonts is unreachable, guest sees readable text in the fallback font stack

**Independent Test**: Block `fonts.googleapis.com` in browser DevTools, load a guest experience with a Google Font, verify text is readable with no broken layout

### Implementation for User Story 3

- [ ] T025 [US3] Verify `useGoogleFontLoader` in `apps/clementine-app/src/shared/theming/hooks/useGoogleFontLoader.ts` uses `display=swap` in the constructed URL — already specified in contract, confirm implementation matches
- [ ] T026 [US3] Verify `buildFontFamilyValue` in `apps/clementine-app/src/shared/theming/lib/font-css.ts` always includes the fallback stack after the Google Font name — so CSS falls back automatically when font doesn't load

**Checkpoint**: Fallback is automatic via `display=swap` + CSS fallback stack. No additional implementation needed beyond verifying T008/T009 were implemented correctly. Text is always visible.

---

## Phase 6: User Story 4 — Clear Font Selection (Priority: P3)

**Goal**: Creator can revert to "System Default" and no Google Font is loaded for guests

**Independent Test**: Select a Google Font, then select "System Default", verify preview and guest experience revert to native platform font

### Implementation for User Story 4

- [ ] T027 [US4] Verify "System Default" option in `GoogleFontPicker` (`apps/clementine-app/src/domains/project-config/theme/components/google-font-picker/GoogleFontPicker.tsx`) correctly calls `onChange(null)` — and that `ThemeConfigPanel` maps this to `{ fontFamily: null, fontSource: 'system', fontVariants: [400, 700] }`
- [ ] T028 [US4] Verify `useGoogleFontLoader` is a no-op when `fontSource` is `'system'` — no `<link>` tag injected, and any previously injected `<link>` tag for a prior Google Font is cleaned up

**Checkpoint**: System Default works as a clean "reset" — no Google Font loaded, text uses native platform fonts via fallback stack.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T029 Run `pnpm --filter @clementine/shared build` to ensure shared package compiles with new schema fields
- [ ] T030 Run `pnpm app:type-check` from monorepo root to verify no TypeScript errors across the app
- [ ] T031 Run `pnpm app:check` from monorepo root to fix any lint/format issues
- [ ] T032 Manual verification: Open Theme Editor, search for "Inter", select it, confirm live preview updates and auto-saves within 2 seconds
- [ ] T033 Manual verification: Visit a guest URL for a project with a Google Font set, confirm all text (headings, body, buttons, labels) uses the selected font
- [ ] T034 Manual verification: Block `fonts.googleapis.com` in DevTools, reload guest page, confirm text is readable in fallback font

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — can start after Phase 2
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) — can run in parallel with US1
- **US3 (Phase 5)**: Depends on Foundational (Phase 2) — verification of existing implementation
- **US4 (Phase 6)**: Depends on US1 (Phase 3) — verifies picker "System Default" behavior
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only — builds the font picker
- **US2 (P1)**: Depends on Foundational only — verifies guest-side font application. Can run in parallel with US1 since it validates infrastructure built in Phase 2
- **US3 (P2)**: Depends on Foundational only — verifies fallback behavior built into T008/T009
- **US4 (P3)**: Depends on US1 — verifies "System Default" option in the picker built in T016

### Within Each User Story

- Hooks/utilities before components
- Components before integration into existing containers
- All tasks within a phase follow sequential order unless marked [P]

### Parallel Opportunities

- T008 and T009 can run in parallel (different files, both in shared/theming)
- T021, T022, T023 can run in parallel (different component files)
- US2 and US3 can run in parallel with US1 (after Phase 2)

---

## Parallel Example: Phase 2 Foundational

```bash
# After T007 completes, launch these in parallel:
Task: "T008 [P] Create font CSS utilities in shared/theming/lib/font-css.ts"
Task: "T009 [P] Create useGoogleFontLoader hook in shared/theming/hooks/useGoogleFontLoader.ts"
```

## Parallel Example: User Story 2

```bash
# After T021 completes, launch these in parallel:
Task: "T022 [P] [US2] Verify ThemedButton uses buildFontFamilyValue"
Task: "T023 [P] [US2] Verify themed input components use buildFontFamilyValue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T013)
3. Complete Phase 3: User Story 1 (T014-T020)
4. **STOP and VALIDATE**: Open Theme Editor, search for a font, select it, confirm preview updates
5. Deploy/demo if ready — creators can already select Google Fonts

### Incremental Delivery

1. Setup + Foundational → Font loading infrastructure ready
2. Add US1 → Font picker works → **Deploy (MVP!)**
3. Add US2 → Guest experience verified → Deploy
4. Add US3 → Fallback verified → Deploy
5. Add US4 → System Default verified → Deploy
6. Polish → Full validation → Final deploy

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 and US3 are primarily verification tasks — most implementation happens in Phase 2 (Foundational) and US1
- The font picker (T016a-c) was the most complex work — replaced cmdk with a custom reusable `Searchable` ui-kit component (`searchable.tsx`) that provides composable Popover + keyboard navigation + react-window v2 virtualization. The `GoogleFontPicker` was then refactored into a component folder with separated concerns (FontRow, useLazyFontPreview, constants)
- No Firestore rule changes needed — schema extension is backward compatible via Zod defaults
- Commit after each phase or logical group

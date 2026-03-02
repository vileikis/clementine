# Tasks: Themed Component Polish

**Input**: Design documents from `/specs/087-themed-component-polish/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational — Surface Type & Themed Primitives

**Purpose**: Add the `Surface` type and `surface` prop to all themed primitives. Redesign the outline variant with solid colors. These changes are backward-compatible (default `surface='auto'`) and block all user stories.

**Why foundational**: Every user story depends on themed primitives accepting a `surface` prop. The outline variant redesign (US2) is inherently delivered by these primitive changes.

- [x] T001 Add `Surface` type (`'auto' | 'dark'`) to `apps/clementine-app/src/shared/theming/types/theme.types.ts` and export it
- [x] T002 [P] Add `surface` prop to ThemedButton and redesign outline variant: auto surface uses inverted solid colors (`color-mix(in srgb, ${buttonTextColor} 92%, ${buttonBgColor})` bg, `buttonBgColor` text, no border); dark surface uses `rgba(0,0,0,0.4)` bg, `#FFFFFF` text, no border. Primary variant unchanged on both surfaces. File: `apps/clementine-app/src/shared/theming/components/primitives/ThemedButton.tsx`
- [x] T003 [P] Add `surface` prop to ThemedIconButton with same outline variant logic as T002. File: `apps/clementine-app/src/shared/theming/components/primitives/ThemedIconButton.tsx`
- [x] T004 [P] Add `surface` prop to ThemedText: auto surface uses `theme.text.color` (unchanged); dark surface uses `#FFFFFF`. File: `apps/clementine-app/src/shared/theming/components/primitives/ThemedText.tsx`
- [x] T005 [P] Add `surface` prop to ThemedProgressBar: auto surface unchanged; dark surface uses `rgba(255,255,255,0.2)` track bg and `#FFFFFF` indicator. File: `apps/clementine-app/src/shared/theming/components/primitives/ThemedProgressBar.tsx`
- [x] T006 Export `Surface` type from barrel files: `apps/clementine-app/src/shared/theming/components/primitives/index.ts` and `apps/clementine-app/src/shared/theming/index.ts`

**Checkpoint**: `pnpm type-check` passes. All existing callsites render identically (default `surface='auto'`). Outline buttons now show solid backgrounds on themed surfaces.

---

## Phase 2: US1 + US2 — Visible Capture Controls & Readable Buttons (Priority: P1) 🎯 MVP

**Goal**: All themed controls on camera capture steps are clearly visible against the dark background, regardless of theme. Secondary buttons are solid and readable everywhere.

**Independent Test**: Create a light-themed experience with a capture step. Navigate to capture — verify buttons, text, and progress bar are legible on the dark camera feed. Verify secondary buttons on welcome screen are solid (no transparency).

### Implementation for US1 + US2

- [x] T007 [P] [US1] Pass `surface="dark"` to all ThemedIconButton instances and replace hardcoded `text-white/70` labels with `<ThemedText surface="dark" variant="small">` in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/CameraActive.tsx`
- [x] T008 [P] [US1] Pass `surface="dark"` to both ThemedButton instances (retake outline + continue primary) in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/PhotoPreview.tsx`
- [x] T009 [P] [US1] Pass `surface="dark"` to ThemedText in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/UploadProgress.tsx`

**Checkpoint**: Capture step controls visible with any theme. Secondary buttons on all surfaces have solid backgrounds. No visual regression on welcome/content steps.

---

## Phase 3: US3 + US4 — Top Bar Surface Adaptation & Decoupling (Priority: P2)

**Goal**: Top bar adapts colors between themed (auto) and dark surfaces. Top bar accepts props instead of reading from runtime store, enabling reuse on non-runtime pages.

**Independent Test**: Navigate an experience from welcome → capture → next step. Verify top bar text/buttons/progress switch from themed colors to white-based on capture step. Render ExperienceTopBar with only title + onClose props — verify it shows title and home button without progress bar or back button.

### Implementation for US3 + US4

- [x] T010 [US3] Rename `RuntimeTopBar.tsx` → `ExperienceTopBar.tsx` and `RuntimeTopBar.test.tsx` → `ExperienceTopBar.test.tsx` in `apps/clementine-app/src/domains/experience/runtime/components/`. Update all internal references.
- [x] T011 [US4] Refactor ExperienceTopBar to accept props-driven API: replace `useRuntime()` with `ExperienceTopBarProps` (`title`, `surface`, `progress: { current, total }`, `onBack`, `onClose`, `className`). Hide back button when `onBack` is undefined. Hide progress bar when `progress` is undefined. File: `apps/clementine-app/src/domains/experience/runtime/components/ExperienceTopBar.tsx`
- [x] T012 [US3] Forward `surface` prop to all themed children in ExperienceTopBar: pass to ThemedIconButton (back, home buttons), ThemedText (title), and ThemedProgressBar. File: `apps/clementine-app/src/domains/experience/runtime/components/ExperienceTopBar.tsx`
- [x] T013 [US3] Define `StepRenderTraits` type and `STEP_RENDER_TRAITS` map in ExperienceRuntime. Replace `STEPS_WITH_CUSTOM_NAVIGATION` Set with traits-based logic for layout, surface, and navigation. Derive ExperienceTopBar props from runtime state (title from `experienceName`, progress from `currentStepIndex`/`totalSteps`, onBack from `canGoBack`/`back`, onClose passed through). Pass `traits.surface` to ExperienceTopBar. File: `apps/clementine-app/src/domains/experience/runtime/containers/ExperienceRuntime.tsx`
- [x] T014 [US4] Update barrel exports: rename `RuntimeTopBar` → `ExperienceTopBar` and `RuntimeTopBarProps` → `ExperienceTopBarProps` in `apps/clementine-app/src/domains/experience/runtime/components/index.ts`. Update any import references across the codebase.
- [x] T015 [US4] Update ExperienceTopBar tests to pass props instead of mocking `useRuntime()`. Test: title renders, progress bar shows/hides based on `progress` prop, back button shows/hides based on `onBack` prop, close triggers dialog. File: `apps/clementine-app/src/domains/experience/runtime/components/ExperienceTopBar.test.tsx`

**Checkpoint**: Top bar switches between themed and dark-surface styling as guest navigates. ExperienceTopBar works with any prop combination. Tests pass. `pnpm type-check` passes.

---

## Phase 4: US5 — Share Page Navigation (Priority: P3)

**Goal**: Share page displays a top bar with experience title and home navigation. Guest can return to welcome screen.

**Independent Test**: Complete an experience, reach share page. Verify top bar shows with title and home button. Tap home — verify navigation to welcome screen. No progress bar or back button visible.

**Depends on**: US4 (ExperienceTopBar must be decoupled)

### Implementation for US5

- [x] T016 [US5] Add `ExperienceTopBar` to SharePage with `title={shareReady.title ?? 'Your Result'}` and `onClose={handleStartOver}`. No `progress` or `onBack` props. File: `apps/clementine-app/src/domains/guest/containers/SharePage.tsx`

**Checkpoint**: Share page has top bar. Guest can navigate home. No progress bar or back button shown.

---

## Phase 5: US6 — Themed Exit Confirmation Dialog (Priority: P3)

**Goal**: Exit confirmation dialog matches the experience's theme colors instead of default library styling.

**Independent Test**: Create an experience with a distinctive theme (e.g., dark background, colored buttons). Trigger exit dialog — verify background, text, and buttons match theme. Verify dialog is narrower (max-w-sm / 384px).

### Implementation for US6

- [x] T017 [US6] Theme the exit dialog in ExperienceTopBar: use `useThemeWithOverride()` to access theme. Apply `theme.background.color` as AlertDialogContent background, `theme.text.color` for title and description text via inline styles. Replace AlertDialogCancel and AlertDialogAction with `ThemedButton` (primary for confirm/exit, outline for cancel). Set max width to `max-w-sm` (384px) on AlertDialogContent. File: `apps/clementine-app/src/domains/experience/runtime/components/ExperienceTopBar.tsx`

**Checkpoint**: Exit dialog background, text, and buttons match theme. Dialog width is 384px max.

---

## Phase 6: US7 — Full-Width List Layout Cards (Priority: P3)

**Goal**: List layout experience cards stretch to full container width in run mode, matching edit mode.

**Independent Test**: Create a list-layout experience. View welcome screen in run mode — verify cards span full width. Check edit mode still works.

### Implementation for US7

- [x] T018 [US7] Fix list layout card width in WelcomeRenderer: ensure the card container div and ScrollableView inner wrapper don't constrain width in run mode. Cards should be full container width when `layout === 'list'`. File: `apps/clementine-app/src/domains/project-config/welcome/components/WelcomeRenderer.tsx`

**Checkpoint**: List layout cards full-width in both edit and run mode. Grid layout unaffected.

---

## Phase 7: Polish & Validation

**Purpose**: Final validation across all stories

- [x] T019 Run `pnpm app:check` (format + lint) from monorepo root and fix any issues
- [x] T020 Run `pnpm app:type-check` and verify zero errors
- [x] T021 Run `pnpm app:test` and verify all tests pass (including updated ExperienceTopBar tests)
- [ ] T022 Visual verification: test with 3 distinct themes (light, dark, high-saturation) across the full guest flow — welcome → capture → share. Confirm SC-001 through SC-008 from spec.md success criteria

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately. BLOCKS all user stories.
- **US1+US2 (Phase 2)**: Depends on Phase 1 completion.
- **US3+US4 (Phase 3)**: Depends on Phase 1 completion. Can run in parallel with Phase 2.
- **US5 (Phase 4)**: Depends on Phase 3 (needs ExperienceTopBar decoupled).
- **US6 (Phase 5)**: Depends on Phase 3 (modifies ExperienceTopBar). Can run in parallel with Phase 4.
- **US7 (Phase 6)**: Depends only on Phase 1. Can run in parallel with Phases 2–5.
- **Polish (Phase 7)**: Depends on all previous phases.

### User Story Dependencies

- **US1+US2 (P1)**: Depends on foundational primitives only. No dependency on other stories.
- **US3+US4 (P2)**: Depends on foundational primitives only. No dependency on US1/US2.
- **US5 (P3)**: Depends on US4 (ExperienceTopBar must be decoupled to use on SharePage).
- **US6 (P3)**: Depends on US4 (modifies ExperienceTopBar which is refactored in US4).
- **US7 (P3)**: Independent — no dependency on any other story.

### Parallel Opportunities

Within Phase 1 (Foundational):
- T002, T003, T004, T005 can all run in parallel (different files)

Within Phase 2 (US1+US2):
- T007, T008, T009 can all run in parallel (different files)

Cross-phase parallelism:
- Phase 2 (US1+US2) and Phase 3 (US3+US4) can run in parallel after Phase 1
- Phase 6 (US7) can run in parallel with Phases 2–5

---

## Parallel Example: Phase 1 (Foundational)

```
# After T001 (Surface type defined), launch these in parallel:
Task T002: ThemedButton surface + outline redesign
Task T003: ThemedIconButton surface + outline redesign
Task T004: ThemedText surface prop
Task T005: ThemedProgressBar surface prop

# Then T006 (barrel exports) after all complete
```

## Parallel Example: Phase 2 (US1+US2)

```
# All capture components can be updated in parallel:
Task T007: CameraActive surface="dark"
Task T008: PhotoPreview surface="dark"
Task T009: UploadProgress surface="dark"
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Foundational primitives
2. Complete Phase 2: US1+US2 capture step controls
3. **STOP and VALIDATE**: Test with light theme on capture step
4. Deploy/demo — core usability fix delivered

### Incremental Delivery

1. Phase 1 (Foundational) → Primitives ready
2. Phase 2 (US1+US2) → Capture controls visible → **Deploy (MVP!)**
3. Phase 3 (US3+US4) → Top bar adapts + decoupled → Deploy
4. Phases 4+5+6 (US5+US6+US7) → Share nav + themed dialog + list fix → Deploy
5. Phase 7 (Polish) → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 and US2 are merged into one phase because they share the same foundational changes and the same capture-step test surface
- US3 and US4 are merged because US4 (decoupling) is a prerequisite for US3 (surface adaptation) and they modify the same component
- Stop at any checkpoint to validate story independently
- Commit after each phase completion

# Tasks: Experience Layout Polish

**Input**: Design documents from `/specs/exp-layout-polish/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No automated tests requested. Manual testing is appropriate for layout changes per constitution (Principle IV).

**Organization**: Tasks are grouped by implementation phase from the specification. Each phase builds on the previous and can be tested independently.

## Format: `[ID] [P?] [Phase] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Phase]**: Which implementation phase this task belongs to (PH1-PH5)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `apps/clementine-app/src/`:
- `shared/theming/components/` - Shared theming components
- `domains/experience/runtime/` - Runtime components and containers
- `domains/experience/steps/renderers/` - Step layout components
- `domains/project-config/welcome/` - Welcome screen components
- `domains/project-config/share/` - Share screen components
- `domains/guest/containers/` - Guest page containers

---

## Phase 1: Setup

**Purpose**: No setup required - this is a refactoring of existing components

**Note**: All affected files already exist. No new dependencies or project structure changes needed.

- [ ] T001 Verify dev server runs with `pnpm app:dev`
- [ ] T002 Verify type-check passes with `pnpm app:type-check`

**Checkpoint**: Development environment ready

---

## Phase 2: Core Layout Fix (Foundational)

**Purpose**: Fix the root cause - move scroll handling out of ThemedBackground into ExperienceRuntime

**Goal**: TopBar stays static while content scrolls on experience pages

**Independent Test**:
1. Navigate to any experience page (e.g., /g/{projectId}/e/{experienceId})
2. Scroll content - TopBar should NOT scroll
3. Background should NOT scroll

### Implementation

- [ ] T003 [PH2] Remove `overflow-auto`, `px-4 py-8`, `my-auto` from ThemedBackground inner wrapper in `shared/theming/components/ThemedBackground.tsx`
- [ ] T004 [PH2] Add flex wrapper with `flex h-full flex-col` and scroll container with `flex-1 overflow-y-auto` around children in `domains/experience/runtime/containers/ExperienceRuntime.tsx`
- [ ] T005 [PH2] Add `shrink-0` class to RuntimeTopBar root div in `domains/experience/runtime/components/RuntimeTopBar.tsx`

**Checkpoint**: Core layout fix complete - TopBar should stay static on experience pages

---

## Phase 3: Step Renderers

**Purpose**: Ensure step content displays correctly after ThemedBackground changes

**Goal**: Step content has proper padding and centering

**Independent Test**:
1. Navigate through experience steps
2. Content should be centered with proper horizontal padding
3. Mobile: bottom buttons should be fixed at bottom
4. Desktop: buttons should be in document flow

### Implementation

- [ ] T006 [PH3] Add `px-4` horizontal padding to StepLayout content area in `domains/experience/steps/renderers/StepLayout.tsx`
- [ ] T007 [PH3] Verify InfoStepRenderer displays correctly (visual check)
- [ ] T008 [PH3] Verify InputShortTextRenderer and InputLongTextRenderer display correctly with keyboard (visual check)
- [ ] T009 [PH3] Verify InputScaleRenderer, InputYesNoRenderer, InputMultiSelectRenderer display correctly (visual check)
- [ ] T010 [PH3] Verify CapturePhotoRenderer displays correctly (visual check)

**Checkpoint**: All step types render correctly with new layout

---

## Phase 4: Guest Pages Alignment

**Purpose**: Align WelcomeScreen with other guest pages (container owns ThemedBackground)

**Goal**: Consistent layout pattern across all guest pages

**Independent Test**:
1. Navigate to welcome page (e.g., /g/{projectId})
2. Page should display with themed background
3. Content should scroll if overflow
4. Navigate to experience, pregate, preshare pages - all should work

### Implementation

- [ ] T011 [P] [PH4] Remove ThemedBackground wrapper and add scroll wrapper with `h-full overflow-y-auto` in `domains/project-config/welcome/components/WelcomeRenderer.tsx`
- [ ] T012 [P] [PH4] Add ThemedBackground wrapper around WelcomeRenderer in `domains/guest/containers/WelcomeScreen.tsx`
- [ ] T013 [P] [PH4] Remove `pt-20` from content div inside ExperienceRuntime in `domains/guest/containers/ExperiencePage.tsx`
- [ ] T014 [P] [PH4] Remove `pt-20` from content div inside ExperienceRuntime in `domains/guest/containers/PregatePage.tsx`
- [ ] T015 [P] [PH4] Remove `pt-20` from content div inside ExperienceRuntime in `domains/guest/containers/PresharePage.tsx`
- [ ] T016 [PH4] Verify WelcomeScreen displays correctly (visual check)
- [ ] T017 [PH4] Verify ExperiencePage, PregatePage, PresharePage display correctly (visual check)

**Checkpoint**: All guest pages follow consistent layout pattern

---

## Phase 5: Share Renderers

**Purpose**: Ensure share renderers handle their own scroll consistently

**Goal**: Share pages scroll correctly in all states

**Independent Test**:
1. Complete an experience to reach share page
2. Loading state should display centered content
3. Ready state should allow scrolling if content overflows

### Implementation

- [ ] T018 [PH5] Add scroll wrapper with `h-full w-full overflow-y-auto` and `min-h-full` inner container in `domains/project-config/share/components/ShareLoadingRenderer.tsx`
- [ ] T019 [PH5] Verify ShareReadyRenderer scroll zone works correctly (already has scroll - visual check)
- [ ] T020 [PH5] Verify SharePage loading state displays correctly (visual check)
- [ ] T021 [PH5] Verify SharePage ready state displays correctly (visual check)

**Checkpoint**: Share pages scroll correctly in all states

---

## Phase 6: Editor Pages

**Purpose**: Ensure editor preview matches runtime experience

**Goal**: Editor previews display with themed background

**Independent Test**:
1. Open welcome editor page
2. Preview should display with themed background
3. Open share editor page - should also work

### Implementation

- [ ] T022 [PH6] Add ThemedBackground wrapper around WelcomeRenderer in `domains/project-config/welcome/containers/WelcomeEditorPage.tsx`
- [ ] T023 [PH6] Verify WelcomeEditorPage preview displays correctly (visual check)
- [ ] T024 [PH6] Verify ShareEditorPage preview displays correctly (visual check)
- [ ] T025 [PH6] Verify experience designer step preview displays correctly (visual check)
- [ ] T026 [PH6] Verify experience preview modal (full runtime) displays correctly (visual check)

**Checkpoint**: All editor previews match runtime experience

---

## Phase 7: Polish & Validation

**Purpose**: Final validation and code quality checks

### Implementation

- [ ] T027 Run `pnpm app:check` to verify linting and formatting
- [ ] T028 Run `pnpm app:type-check` to verify TypeScript types
- [ ] T029 Complete mobile testing checklist (viewport < 768px)
- [ ] T030 Complete desktop testing checklist (viewport >= 768px)
- [ ] T031 Review standards compliance: `frontend/design-system.md`
- [ ] T032 Review standards compliance: `frontend/responsive.md`

**Checkpoint**: Feature complete and validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - verify environment
- **Phase 2 (Core Layout)**: Depends on Phase 1 - BLOCKS all other phases
- **Phase 3 (Step Renderers)**: Depends on Phase 2 completion
- **Phase 4 (Guest Pages)**: Depends on Phase 2 completion, can run in parallel with Phase 3
- **Phase 5 (Share Renderers)**: Depends on Phase 2 completion, can run in parallel with Phase 3-4
- **Phase 6 (Editor Pages)**: Depends on Phase 4 (WelcomeRenderer changes)
- **Phase 7 (Polish)**: Depends on all previous phases

### Task Dependencies Within Phases

**Phase 2 (Sequential)**:
```
T003 (ThemedBackground) → T004 (ExperienceRuntime) → T005 (RuntimeTopBar)
```
These must be done together as they form the core fix.

**Phase 4 (Parallel)**:
```
T011 (WelcomeRenderer) ─┬─→ T016 (Verify WelcomeScreen)
T012 (WelcomeScreen)   ─┘
T013 (ExperiencePage)  ─┐
T014 (PregatePage)     ─┼─→ T017 (Verify experience pages)
T015 (PresharePage)    ─┘
```

### Parallel Opportunities

- Phase 3-5 can run in parallel after Phase 2 completes
- Within Phase 4: T011-T015 can all run in parallel (different files)
- Within Phase 6: T023-T026 are all visual checks that can run in parallel

---

## Parallel Example: Phase 4

```bash
# Launch all guest page changes together:
Task: "Remove ThemedBackground from WelcomeRenderer in domains/project-config/welcome/components/WelcomeRenderer.tsx"
Task: "Add ThemedBackground to WelcomeScreen in domains/guest/containers/WelcomeScreen.tsx"
Task: "Remove pt-20 from ExperiencePage in domains/guest/containers/ExperiencePage.tsx"
Task: "Remove pt-20 from PregatePage in domains/guest/containers/PregatePage.tsx"
Task: "Remove pt-20 from PresharePage in domains/guest/containers/PresharePage.tsx"
```

---

## Implementation Strategy

### MVP First (Phase 1-2 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Core Layout Fix
3. **STOP and VALIDATE**: Test experience pages - TopBar should stay static
4. This alone fixes the primary bug

### Incremental Delivery

1. Phase 2 → Core bug fixed for experience pages
2. Phase 3 → Step content displays correctly
3. Phase 4 → Welcome page aligned with pattern
4. Phase 5 → Share pages consistent
5. Phase 6 → Editor previews match runtime
6. Phase 7 → Validation complete

### Suggested Approach

Work through phases sequentially. Phase 2 is the critical fix. Phases 3-5 can be done quickly as they are mostly verification. Phase 6 ensures editor parity. Phase 7 ensures quality.

---

## Notes

- [P] tasks = different files, no dependencies
- [Phase] label maps task to implementation phase for traceability
- Visual verification tasks (T007-T010, T016-T017, T019-T026, T029-T030) are manual checks
- No automated tests per constitution (manual testing appropriate for layout)
- Commit after each phase or logical group
- Stop at any checkpoint to validate independently

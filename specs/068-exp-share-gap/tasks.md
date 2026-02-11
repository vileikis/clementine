# Tasks: Experience-to-Share Transition Gap

**Input**: Design documents from `/specs/068-exp-share-gap/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — manual testing per quickstart.md.

**Organization**: Single user story (US1: Completing State) with foundational prerequisites. All changes serve one goal: eliminate the blank screen during experience completion.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Store & Hook)

**Purpose**: Update runtime store to hold full Experience reference and expose experience name via hook. BLOCKS all subsequent work.

- [X] T001 Replace `experienceId` with `experience: Experience | null` in store state, update `initFromSession` signature to accept `Experience`, update `reset()`, and derive `experienceId` as `state.experience?.id` in `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`
- [X] T002 Add `experienceName: string` to `RuntimeAPI` interface and derive from `store.experience?.name ?? 'Experience'` in `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts`

**Checkpoint**: Store accepts full Experience, hook exposes experienceName. Components can now migrate to store.

---

## Phase 2: US1 — Completing State & Runtime Refactor (Priority: P1)

**Goal**: Show a completing indicator (spinner + "Completing your experience...") when the experience completes, eliminating the blank screen. Refactor RuntimeTopBar and RuntimeNavigation to read from store, simplify ExperienceRuntime's render, remove dead code, and update all consumers.

**Independent Test**: Complete last step of any experience → see spinner + text instead of blank screen. TopBar shows X icon, no progress bar. X triggers confirmation dialog. Spinner persists until navigation or parent swap.

### Runtime Components (consume store)

- [X] T003 [P] [US1] Refactor RuntimeTopBar to use `useRuntime()` for all state (`experienceName`, `currentStepIndex`, `totalSteps`, `isComplete`, `canGoBack`, `back`), reduce props to `onClose?: () => void` + `className?: string`, compute `isCloseMode = isComplete || totalSteps === 1 || currentStepIndex === 0`, hide progress bar when `isComplete`, simplify `handleGoBack` to use `back()` from hook in `apps/clementine-app/src/domains/experience/runtime/components/RuntimeTopBar.tsx`
- [X] T004 [P] [US1] Refactor RuntimeNavigation to use `useRuntime()` for `next` and `canProceed`, keep only optional `buttonLabel` prop in `apps/clementine-app/src/domains/experience/runtime/components/RuntimeNavigation.tsx`

### ExperienceRuntime Container

- [X] T005 [US1] Update ExperienceRuntime: replace `experienceId` + `experienceName` props with `experience: Experience`, rename `onHomeClick` to `onClose`, pass `experience` to `store.initFromSession`, simplify RuntimeTopBar render to `<RuntimeTopBar onClose={onClose} />`, simplify RuntimeNavigation render to `<RuntimeNavigation />`, add completing state (Loader2 + ThemedText) when `store.isComplete` replacing children + navigation in `apps/clementine-app/src/domains/experience/runtime/containers/ExperienceRuntime.tsx`

### Dead Code Removal & Consumer Updates

- [X] T006 [P] [US1] Remove `isComplete` from `useRuntime()` destructure, remove `if (isComplete) return null` block (lines 59-63), remove stale completion comments in `apps/clementine-app/src/domains/guest/components/GuestRuntimeContent.tsx`
- [X] T007 [P] [US1] Remove `isComplete` from `useRuntime()` destructure, remove entire `if (isComplete)` checkmark block (lines 38-65), update completion comment in `apps/clementine-app/src/domains/experience/preview/components/PreviewRuntimeContent.tsx`
- [X] T008 [P] [US1] Update ExperienceRuntime props: replace `experienceId`/`experienceName` with `experience={experience}`, rename `onHomeClick` to `onClose={navigateToWelcome}` in `apps/clementine-app/src/domains/guest/containers/ExperiencePage.tsx`
- [X] T009 [P] [US1] Update ExperienceRuntime props: replace `experienceId`/`experienceName` with `experience={pregateExperience}`, rename `onHomeClick` to `onClose={navigateToWelcome}` in `apps/clementine-app/src/domains/guest/containers/PregatePage.tsx`
- [X] T010 [P] [US1] Update ExperienceRuntime props: replace `experienceId`/`experienceName` with `experience={preshareExperience}`, rename `onHomeClick` to `onClose={navigateToWelcome}` in `apps/clementine-app/src/domains/guest/containers/PresharePage.tsx`
- [X] T011 [P] [US1] Update ExperienceRuntime props: replace `experienceId`/`experienceName` with `experience={experience}`, rename `onHomeClick` to `onClose={undefined}` in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`

**Checkpoint**: All four consumers compile, completing state visible in all contexts, no blank screen.

---

## Phase 3: Validation

**Purpose**: Verify all changes compile, lint, and work correctly.

- [X] T012 Run `pnpm app:check` (format + lint) and `pnpm app:type-check` (TypeScript) from monorepo root — fix any issues
- [X] T013 Run quickstart.md manual testing: verify completing state in ExperiencePage, PreviewModal, PregatePage, PresharePage; verify TopBar X icon + no progress bar during completing; verify X button triggers confirmation dialog; verify back navigation works in non-completing states

---

## Phase 4: Completion Error Handling (US2)

**Goal**: When any step of the completion flow fails (sync, session complete, or parent `onComplete` callback like transform pipeline), show an error state with the actual error message and a retry button instead of an infinite completing spinner.

**Independent Test**: Simulate transform pipeline failure (e.g. via `useStartTransformPipeline` artificial error) → see error message + "Try Again" button instead of infinite spinner. Click "Try Again" → re-attempts completion. On success → navigates away.

### Store & Hook (foundation)

- [ ] T014 [P] [US2] Add `completionError: string | null` to `ExperienceRuntimeState` (initial: `null`), add `setCompletionError: (error: string | null) => void` to `ExperienceRuntimeActions`, clear in `initFromSession` and `reset()` in `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`
- [ ] T015 [P] [US2] Add `completionError: string | null` to `RuntimeAPI` interface, derive from `store.completionError` in `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts`

### ExperienceRuntime (core change)

- [ ] T016 [US2] Update ExperienceRuntime completion flow and render: (1) change `onComplete` prop type to `() => void | Promise<void>`, (2) extract `runCompletion` into a stable callback callable from both the completion effect and a retry handler, (3) in `runCompletion`: clear `completionError` at start, catch errors at each step (sync, completeSession, `await onComplete?.()`) and call `store.setCompletionError(error.message)` on failure, (4) add retry handler that calls `runCompletion`, (5) render four-way: `isComplete && completionError` → error state (ThemedText heading "Something went wrong" + ThemedText body with error message + ThemedButton "Try Again"), `isComplete` → ThemedLoading spinner, else existing layout in `apps/clementine-app/src/domains/experience/runtime/containers/ExperienceRuntime.tsx`

### Consumer updates (propagate errors)

- [ ] T017 [P] [US2] Update `handleExperienceComplete` in ExperiencePage: remove toast on transform failure, throw `new Error('Failed to start processing. Please try again.')` when `startTransformPipeline` returns false; change `onComplete` prop from `() => void handleExperienceComplete()` to `handleExperienceComplete` (remove void wrapper so runtime can await) in `apps/clementine-app/src/domains/guest/containers/ExperiencePage.tsx`
- [ ] T018 [P] [US2] Update `handleComplete` in ExperiencePreviewModal: remove toast on transform failure, throw `new Error('Failed to start processing. Please try again.')` when `startTransformPipeline` returns false; remove `setShowJobStatus(true)` before pipeline call (move after success, before navigation/status switch) in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`

### Validation

- [ ] T019 Run `pnpm app:check` and `pnpm app:type-check` from monorepo root — fix any issues
- [ ] T020 Manual testing: (1) simulate transform pipeline error → verify error state with message + retry button appears, (2) click retry → verify re-attempt, (3) verify close (X) still works during error state, (4) verify happy path (no error) still navigates correctly, (5) test in both ExperiencePage (guest) and PreviewModal (admin)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Phase 1 completion
- **Validation (Phase 3)**: Depends on Phase 2 completion
- **Completion Error Handling (Phase 4)**: Depends on Phase 3 completion (builds on completing state)

### Task Dependencies Within Phase 2

```
T003 (RuntimeTopBar)  ──┐
                        ├──→ T005 (ExperienceRuntime) ──→ T006, T007, T008, T009, T010, T011
T004 (RuntimeNavigation)┘
```

- T003 and T004 can run in **parallel** (different files, both just read from store)
- T005 depends on T003 + T004 (ExperienceRuntime renders both components with new API)
- T006-T011 can ALL run in **parallel** after T005 (different files, no cross-dependencies)

### Task Dependencies Within Phase 4

```
T014 (Store) ──┐
               ├──→ T016 (ExperienceRuntime) ──→ T017, T018
T015 (Hook)  ──┘
```

- T014 and T015 can run in **parallel** (different files)
- T016 depends on T014 + T015 (ExperienceRuntime reads completionError from store)
- T017 and T018 can run in **parallel** after T016 (different files, both just change how errors propagate)
- T019-T020 depend on all above

### Parallel Opportunities

```bash
# After T002 completes, launch T003 + T004 in parallel:
T003: "Refactor RuntimeTopBar to use store"
T004: "Refactor RuntimeNavigation to use store"

# After T005 completes, launch T006-T011 in parallel:
T006: "Remove dead isComplete from GuestRuntimeContent"
T007: "Remove dead isComplete from PreviewRuntimeContent"
T008: "Update ExperiencePage props"
T009: "Update PregatePage props"
T010: "Update PresharePage props"
T011: "Update ExperiencePreviewModal props"

# Phase 4: After T013 completes, launch T014 + T015 in parallel:
T014: "Add completionError to store"
T015: "Expose completionError in useRuntime"

# After T016 completes, launch T017 + T018 in parallel:
T017: "Propagate errors in ExperiencePage"
T018: "Propagate errors in ExperiencePreviewModal"
```

---

## Implementation Strategy

### MVP (Minimum Viable)

1. Complete Phase 1: Foundational (T001, T002) ✅
2. Complete Phase 2: US1 (T003 → T011) ✅
3. Complete Phase 3: Validation (T012, T013) ✅
4. Complete Phase 4: Completion Error Handling (T014 → T020)
5. **DONE** — single feature, single PR

### Incremental Delivery (if needed)

Phase 1-3 are complete. Phase 4 adds error handling on top — it can be delivered as a follow-up commit on the same branch/PR.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- No test tasks — manual testing per quickstart.md (spec does not request automated tests)
- Consumer updates (T008-T011) are required for compilation — not optional
- All changes must land together for type safety (ExperienceRuntime prop changes propagate to all consumers)
- Commit after each logical group (Phase 1, then Phase 2 components, then Phase 2 consumers+cleanup, then validation, then Phase 4)
- Phase 4 changes the `onComplete` contract from fire-and-forget to async-aware — consumers that do async work in `onComplete` should throw on failure instead of swallowing errors

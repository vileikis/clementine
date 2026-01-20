# Tasks: Experience Preview Controls

**Input**: Design documents from `/specs/033-exp-preview-controls/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not required (per constitution: minimal testing for UI refactor)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Includes exact file paths in descriptions

## Path Conventions

**Target File**: `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`

**Shared Module (reuse only)**: `apps/clementine-app/src/shared/preview-shell/`

---

## Phase 1: Setup

**Purpose**: Verify prerequisites and understand current implementation

- [X] T001 Review current ExperiencePreviewModal.tsx implementation in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`
- [X] T002 Verify preview-shell exports are available by checking `apps/clementine-app/src/shared/preview-shell/index.ts`

---

## Phase 2: User Story 1 - Preview Experience in Fullscreen Mode (Priority: P1) 🎯 MVP

**Goal**: Refactor ExperiencePreviewModal to use FullscreenOverlay for fullscreen display with proper header and close functionality

**Independent Test**: Open experience preview → verify fullscreen overlay with "Preview Mode" title → verify close button works → verify Escape key closes overlay

### Implementation for User Story 1

- [X] T003 [US1] Update imports: remove Dialog/DialogContent/DialogTitle, add FullscreenOverlay/DeviceFrame/ViewportProvider from `@/shared/preview-shell` in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`
- [X] T004 [US1] Remove custom header div (absolute positioned with close button) in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`
- [X] T005 [US1] Replace Dialog wrapper with FullscreenOverlay: set `isOpen={open}`, `onClose={handleClose}`, `title="Preview Mode"` in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`
- [X] T006 [US1] Remove pt-14 padding from content wrapper (no longer needed without absolute header) in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`
- [X] T007 [US1] Wrap content states (loading/error/empty/runtime) in DeviceFrame component in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`
- [X] T008 [US1] Remove unused imports (X icon, cn utility if no longer needed) in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`

**Checkpoint**: Preview opens in fullscreen overlay with close button - basic functionality working

---

## Phase 3: User Story 2 - Switch Between Mobile and Desktop Viewport (Priority: P1)

**Goal**: Add viewport switching capability with persistent state

**Independent Test**: Open preview → verify viewport switcher in header → switch mobile/desktop → verify content resizes → close and reopen → verify mode persists

### Implementation for User Story 2

- [X] T009 [US2] Add useViewportStore import from `@/shared/preview-shell` in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`
- [X] T010 [US2] Add viewport state hook: `const { mode, setMode } = useViewportStore()` in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`
- [X] T011 [US2] Wrap FullscreenOverlay with ViewportProvider: `<ViewportProvider mode={mode}>` in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`
- [X] T012 [US2] Enable viewport switcher: add `showViewportSwitcher` and `onModeChange={setMode}` props to FullscreenOverlay in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`

**Checkpoint**: Viewport switching works and persists across preview sessions

---

## Phase 4: User Story 3 - Consistent Preview Experience Across Editors (Priority: P2)

**Goal**: Verify implementation matches other editor previews (Welcome, Theme, Share)

**Independent Test**: Compare ExperiencePreviewModal with ShareEditorPage fullscreen - verify same FullscreenOverlay component used, identical header layout and viewport switcher behavior

### Verification for User Story 3

- [X] T013 [US3] Verify FullscreenOverlay usage matches ShareEditorPage pattern by comparing with `apps/clementine-app/src/domains/event/share/containers/ShareEditorPage.tsx`
- [X] T014 [US3] Ensure viewport switcher has same size="sm" prop for consistency in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`

**Checkpoint**: Preview UI is consistent with other editor previews

---

## Phase 5: Polish & Validation

**Purpose**: Final validation and cleanup

- [X] T015 Run `pnpm lint` from `apps/clementine-app/` to verify no linting errors
- [X] T016 Run `pnpm type-check` from `apps/clementine-app/` to verify TypeScript compiles
- [X] T017 Run `pnpm check` from `apps/clementine-app/` to auto-fix format and lint issues
- [ ] T018 Manual testing: execute all quickstart.md test scenarios (open preview, viewport switch, escape key, edge cases)
- [ ] T019 Verify against spec.md acceptance scenarios for all user stories

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - review existing code
- **User Story 1 (Phase 2)**: Depends on Setup - core refactoring
- **User Story 2 (Phase 3)**: Depends on User Story 1 - adds viewport to FullscreenOverlay wrapper
- **User Story 3 (Phase 4)**: Depends on User Story 2 - verification only
- **Polish (Phase 5)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - can complete and test on its own (basic fullscreen)
- **User Story 2 (P1)**: Builds on US1 - adds viewport switching to existing FullscreenOverlay
- **User Story 3 (P2)**: Verification only - no code changes, just pattern comparison

### Task Sequence Within File

Since all tasks modify the same file (`ExperiencePreviewModal.tsx`), they should be executed sequentially:

```
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014
```

### Parallel Opportunities

- T001 and T002 can run in parallel (read-only verification)
- T015, T016, T017 can run in parallel after all code changes
- Within US1: T003 must be first (imports), then T004-T008 in sequence
- Within US2: T009-T012 must be sequential (building on US1 changes)

---

## Parallel Example: Validation Phase

```bash
# Launch all validation tasks together after implementation:
pnpm lint        # T015
pnpm type-check  # T016
pnpm check       # T017 (may modify files)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: User Story 1 (T003-T008)
3. **STOP and VALIDATE**: Test basic fullscreen preview works
4. Preview can be used with fullscreen overlay (no viewport switching yet)

### Full Feature Delivery

1. Complete MVP (US1) → Basic fullscreen works
2. Add User Story 2 (T009-T012) → Viewport switching added
3. Verify User Story 3 (T013-T014) → Consistency confirmed
4. Run validation (T015-T019) → Feature complete

### Single Developer Timeline

All tasks in same file = sequential execution:
- Phase 1: ~5 minutes (review)
- Phase 2: ~15 minutes (core refactor)
- Phase 3: ~10 minutes (viewport integration)
- Phase 4: ~5 minutes (verification)
- Phase 5: ~10 minutes (validation)

**Estimated Total**: ~45 minutes

---

## Notes

- All tasks modify single file: `ExperiencePreviewModal.tsx`
- No new files created - only reusing existing preview-shell components
- Keep all existing session logic (useCreateSession, useSubscribeSession, etc.) unchanged
- ThemeProvider wrapper for runtime content should remain in place
- Edge case handling (loading, error, empty states) preserved in DeviceFrame

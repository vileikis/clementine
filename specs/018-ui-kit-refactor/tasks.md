# Tasks: UI Kit Refactor

**Input**: Design documents from `/specs/018-ui-kit-refactor/`
**Prerequisites**: plan.md, research.md, quickstart.md

**Tests**: Not required - validation via type-check and build (per plan.md)

**Organization**: This is a single-goal refactoring task. Tasks are organized by implementation phase rather than user stories.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **App root**: `apps/clementine-app/`
- **UI Kit**: `apps/clementine-app/src/ui-kit/`
- **Components (current)**: `apps/clementine-app/src/ui-kit/components/`
- **Components (target)**: `apps/clementine-app/src/ui-kit/ui/`

---

## Phase 1: File Consolidation

**Purpose**: Merge unique files and remove duplicates from `components/ui/`

- [ ] T001 [P] Move `apps/clementine-app/src/ui-kit/components/ui/breadcrumb.tsx` to `apps/clementine-app/src/ui-kit/components/breadcrumb.tsx`
- [ ] T002 [P] Move `apps/clementine-app/src/ui-kit/components/ui/progress.tsx` to `apps/clementine-app/src/ui-kit/components/progress.tsx`
- [ ] T003 [P] Move `apps/clementine-app/src/ui-kit/components/ui/textarea.tsx` to `apps/clementine-app/src/ui-kit/components/textarea.tsx`
- [ ] T004 [P] Delete duplicate `apps/clementine-app/src/ui-kit/components/ui/button.tsx`
- [ ] T005 [P] Delete duplicate `apps/clementine-app/src/ui-kit/components/ui/card.tsx`
- [ ] T006 [P] Delete duplicate `apps/clementine-app/src/ui-kit/components/ui/dropdown-menu.tsx`
- [ ] T007 Delete empty folder `apps/clementine-app/src/ui-kit/components/ui/`

**Checkpoint**: No `components/ui/` folder exists, all components in `components/`

---

## Phase 2: Directory Rename

**Purpose**: Rename `components/` to `ui/` for cleaner imports

- [ ] T008 Rename directory `apps/clementine-app/src/ui-kit/components/` to `apps/clementine-app/src/ui-kit/ui/`

**Checkpoint**: Components now live in `ui-kit/ui/`

---

## Phase 3: Barrel Export

**Purpose**: Create unified barrel export for all UI components

- [ ] T009 Create barrel export file `apps/clementine-app/src/ui-kit/ui/index.ts` with exports for all 23 components

**Checkpoint**: All components exportable via `@/ui-kit/ui`

---

## Phase 4: Import Updates

**Purpose**: Update all imports across the codebase to use new paths

### Legacy `components/ui/` imports (4 files)

- [ ] T010 [P] Update imports in `apps/clementine-app/src/shared/editor-controls/components/TextareaField.tsx` from `@/ui-kit/components/ui/textarea` to `@/ui-kit/ui/textarea`
- [ ] T011 [P] Update imports in `apps/clementine-app/src/domains/event/settings/components/OverlayFrame.tsx` from `@/ui-kit/components/ui/progress` to `@/ui-kit/ui/progress`
- [ ] T012 [P] Update imports in `apps/clementine-app/src/domains/navigation/components/TopNavBreadcrumb.tsx` from `@/ui-kit/components/ui/breadcrumb` to `@/ui-kit/ui/breadcrumb`
- [ ] T013 [P] Update imports in `apps/clementine-app/src/domains/project/events/components/ProjectEventItem.tsx` from `@/ui-kit/components/ui/dropdown-menu` to `@/ui-kit/ui/dropdown-menu`

### Standard `components/` imports (~38 files)

- [ ] T014 Update all imports matching `@/ui-kit/components/` to `@/ui-kit/ui/` across the codebase using find-and-replace

**Checkpoint**: All imports use `@/ui-kit/ui/` pattern

---

## Phase 5: Configuration Updates

**Purpose**: Update shadcn/ui configuration and documentation

- [ ] T015 [P] Update `apps/clementine-app/components.json` aliases from `"components": "@/ui-kit/components"` to `"components": "@/ui-kit/ui"` and add `"ui": "@/ui-kit/ui"`
- [ ] T016 [P] Update `apps/clementine-app/src/ui-kit/README.md` to reflect new structure

**Checkpoint**: shadcn CLI will install to correct location

---

## Phase 6: Validation

**Purpose**: Verify refactoring is complete and correct

- [ ] T017 Run `pnpm type-check` in `apps/clementine-app/` to verify all imports resolve
- [ ] T018 Run `pnpm build` in `apps/clementine-app/` to verify production build succeeds
- [ ] T019 Run `pnpm lint` in `apps/clementine-app/` to verify no linting errors

**Checkpoint**: All validation passes - refactoring complete

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (File Consolidation)
    ↓
Phase 2 (Directory Rename)
    ↓
Phase 3 (Barrel Export)
    ↓
Phase 4 (Import Updates)
    ↓
Phase 5 (Configuration Updates)
    ↓
Phase 6 (Validation)
```

### Within Each Phase

- **Phase 1**: T001-T006 can run in parallel, T007 must wait for all deletions
- **Phase 2**: Single task, must complete before Phase 3
- **Phase 3**: Single task, must complete before Phase 4
- **Phase 4**: T010-T013 can run in parallel, T014 is the bulk update
- **Phase 5**: T015-T016 can run in parallel
- **Phase 6**: T017-T019 should run sequentially (fix issues as found)

---

## Parallel Opportunities

```bash
# Phase 1: Move unique files (parallel)
T001: Move breadcrumb.tsx
T002: Move progress.tsx
T003: Move textarea.tsx

# Phase 1: Delete duplicates (parallel)
T004: Delete ui/button.tsx
T005: Delete ui/card.tsx
T006: Delete ui/dropdown-menu.tsx

# Phase 4: Update legacy imports (parallel)
T010: Update TextareaField.tsx
T011: Update OverlayFrame.tsx
T012: Update TopNavBreadcrumb.tsx
T013: Update ProjectEventItem.tsx

# Phase 5: Update config (parallel)
T015: Update components.json
T016: Update README.md
```

---

## Implementation Strategy

### Sequential Execution (Recommended)

1. Complete Phase 1 → All files in `components/`
2. Complete Phase 2 → Directory renamed to `ui/`
3. Complete Phase 3 → Barrel export created
4. Complete Phase 4 → All imports updated
5. Complete Phase 5 → Config updated
6. Complete Phase 6 → **STOP and VALIDATE**

### Quick Validation After Each Phase

```bash
cd apps/clementine-app
pnpm type-check  # Run after Phase 4 to catch import issues early
```

---

## Summary

| Phase | Tasks | Parallelizable |
|-------|-------|----------------|
| Phase 1: File Consolidation | 7 | 6 |
| Phase 2: Directory Rename | 1 | 0 |
| Phase 3: Barrel Export | 1 | 0 |
| Phase 4: Import Updates | 5 | 4 |
| Phase 5: Configuration | 2 | 2 |
| Phase 6: Validation | 3 | 0 |
| **Total** | **19** | **12** |

---

## Notes

- [P] tasks = different files, no dependencies
- This is a pure refactoring - no new functionality added
- Commit after each phase for easy rollback
- If validation fails, check import paths first
- shadcn CLI verification: `pnpm dlx shadcn@latest add button --dry-run` (should show correct path)

# Tasks: Preview Shell Module Migration

**Input**: Design documents from `/specs/005-preview-shell-migration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Manual testing only (no automated tests per minimal testing strategy in plan.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo workspace**: `apps/clementine-app/`
- **Shared module**: `apps/clementine-app/src/shared/preview-shell/`
- **Dev-tools domain**: `apps/clementine-app/src/domains/dev-tools/preview-shell/`
- **Routes**: `apps/clementine-app/app/admin/dev-tools/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and prepare directory structure

- [ ] T001 Install zustand dependency via `pnpm add zustand --filter @clementine/app`
- [ ] T002 Create target directory structure at apps/clementine-app/src/shared/preview-shell/
- [ ] T003 [P] Create dev-tools directory structure at apps/clementine-app/src/domains/dev-tools/preview-shell/
- [ ] T004 [P] Create route directory at apps/clementine-app/app/admin/dev-tools/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migrate core preview-shell module files to enable dev-tools implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Module Migration

- [ ] T005 [P] Copy types/preview-shell.types.ts from web/src/features/preview-shell/ to apps/clementine-app/src/shared/preview-shell/types/
- [ ] T006 [P] Copy constants/viewport.constants.ts from web/src/features/preview-shell/ to apps/clementine-app/src/shared/preview-shell/constants/
- [ ] T007 [P] Copy store/viewportStore.ts from web/src/features/preview-shell/ to apps/clementine-app/src/shared/preview-shell/store/
- [ ] T008 [P] Copy context/ViewportContext.tsx from web/src/features/preview-shell/ to apps/clementine-app/src/shared/preview-shell/context/
- [ ] T009 [P] Copy hooks/useViewport.ts from web/src/features/preview-shell/ to apps/clementine-app/src/shared/preview-shell/hooks/
- [ ] T010 [P] Copy hooks/useFullscreen.ts from web/src/features/preview-shell/ to apps/clementine-app/src/shared/preview-shell/hooks/

### Component Migration

- [ ] T011 [P] Copy components/DeviceFrame.tsx from web/src/features/preview-shell/ to apps/clementine-app/src/shared/preview-shell/components/
- [ ] T012 [P] Copy components/ViewportSwitcher.tsx from web/src/features/preview-shell/ to apps/clementine-app/src/shared/preview-shell/components/
- [ ] T013 [P] Copy components/FullscreenTrigger.tsx from web/src/features/preview-shell/ to apps/clementine-app/src/shared/preview-shell/components/
- [ ] T014 [P] Copy components/FullscreenOverlay.tsx from web/src/features/preview-shell/ to apps/clementine-app/src/shared/preview-shell/components/
- [ ] T015 Copy components/PreviewShell.tsx from web/src/features/preview-shell/ to apps/clementine-app/src/shared/preview-shell/components/

### Import Path Updates

- [ ] T016 Update import paths in apps/clementine-app/src/shared/preview-shell/components/DeviceFrame.tsx: replace @/lib/utils with @/shared/utils
- [ ] T017 Update import paths in apps/clementine-app/src/shared/preview-shell/components/ViewportSwitcher.tsx: replace @/lib/utils with @/shared/utils
- [ ] T018 Update import paths in apps/clementine-app/src/shared/preview-shell/components/FullscreenTrigger.tsx: replace @/lib/utils with @/shared/utils and @/components/ui/button with @/ui-kit/components/button
- [ ] T019 Update import paths in apps/clementine-app/src/shared/preview-shell/components/FullscreenOverlay.tsx: replace @/lib/utils with @/shared/utils and @/components/ui/button with @/ui-kit/components/button
- [ ] T020 Update import paths in apps/clementine-app/src/shared/preview-shell/components/PreviewShell.tsx: replace @/lib/utils with @/shared/utils

### Barrel Exports

- [ ] T021 [P] Create apps/clementine-app/src/shared/preview-shell/types/index.ts with type exports
- [ ] T022 [P] Create apps/clementine-app/src/shared/preview-shell/constants/index.ts with constant exports
- [ ] T023 [P] Create apps/clementine-app/src/shared/preview-shell/store/index.ts with store exports
- [ ] T024 [P] Create apps/clementine-app/src/shared/preview-shell/context/index.ts with context exports
- [ ] T025 [P] Create apps/clementine-app/src/shared/preview-shell/hooks/index.ts with hook exports
- [ ] T026 [P] Create apps/clementine-app/src/shared/preview-shell/components/index.ts with component exports
- [ ] T027 Create apps/clementine-app/src/shared/preview-shell/index.ts with main barrel export (all subdirectories)
- [ ] T028 Update apps/clementine-app/src/shared/index.ts to export preview-shell module

**Checkpoint**: Foundation ready - preview-shell module is fully migrated and importable

---

## Phase 3: User Story 1 - Admin Tests Device Preview Infrastructure (Priority: P1) 🎯 MVP

**Goal**: Create functional dev-tools testing interface with viewport switching, fullscreen, and prop controls

**Independent Test**: Navigate to `/admin/dev-tools/preview-shell`, see two-column layout, toggle viewport modes (mobile ↔ desktop), toggle fullscreen, and verify all controls work visually

### Dev-Tools Components

- [ ] T029 [P] [US1] Create PropControlsPanel component in apps/clementine-app/src/domains/dev-tools/preview-shell/components/PropControlsPanel.tsx with Switch/Select controls
- [ ] T030 [P] [US1] Create PreviewArea component in apps/clementine-app/src/domains/dev-tools/preview-shell/components/PreviewArea.tsx with sample content
- [ ] T031 [US1] Create DevToolsPreviewShell container in apps/clementine-app/src/domains/dev-tools/preview-shell/DevToolsPreviewShell.tsx with state management

### Barrel Exports (Dev-Tools)

- [ ] T032 [P] [US1] Create apps/clementine-app/src/domains/dev-tools/preview-shell/components/index.ts with component exports
- [ ] T033 [US1] Create apps/clementine-app/src/domains/dev-tools/preview-shell/index.ts exporting DevToolsPreviewShell

### Route Integration

- [ ] T034 [US1] Create route file at apps/clementine-app/app/admin/dev-tools/preview-shell.tsx importing DevToolsPreviewShell

### Manual Testing & Validation

- [ ] T035 [US1] Start dev server via `cd apps/clementine-app && pnpm dev`
- [ ] T036 [US1] Verify dev-tools page loads at http://localhost:3000/admin/dev-tools/preview-shell within 2 seconds
- [ ] T037 [US1] Verify two-column layout renders correctly (25% controls, 75% preview)
- [ ] T038 [US1] Test viewport switching: toggle between mobile (375x667px) and desktop (900x600px) modes
- [ ] T039 [US1] Test viewport switcher toggle: enable/disable viewport switcher buttons in preview
- [ ] T040 [US1] Test fullscreen toggle: enable/disable fullscreen trigger button in preview
- [ ] T041 [US1] Test defaultViewport selector: change between mobile and desktop, verify preview updates
- [ ] T042 [US1] Test Reset & Remount button: verify component state clears and remounts with default props

**Checkpoint**: User Story 1 complete - dev-tools interface fully functional with all interactive controls working

---

## Phase 4: User Story 2 - Admin Verifies Fullscreen Mode (Priority: P2)

**Goal**: Verify fullscreen overlay works with header, close button, Escape key, and viewport switcher integration

**Independent Test**: Enable fullscreen in dev-tools, click fullscreen trigger, verify overlay covers viewport with header, test close button and Escape key

### Manual Testing

- [ ] T043 [US2] Enable fullscreen in prop controls panel
- [ ] T044 [US2] Click fullscreen trigger button in preview area
- [ ] T045 [US2] Verify overlay activates covering entire viewport with header showing title and close button
- [ ] T046 [US2] Test close button: click X in fullscreen header, verify overlay closes and returns to normal preview
- [ ] T047 [US2] Test Escape key: press Escape while fullscreen is active, verify overlay closes immediately
- [ ] T048 [US2] Test body scroll prevention: attempt to scroll while fullscreen is active, verify background content does not scroll
- [ ] T049 [US2] Test viewport switcher in fullscreen: enable viewport switcher, enter fullscreen, toggle viewport in header, verify device frame updates without closing overlay

**Checkpoint**: User Story 2 complete - fullscreen mode works correctly with all interactions

---

## Phase 5: User Story 3 - Admin Verifies State Persistence (Priority: P3)

**Goal**: Verify viewport mode persists across page refreshes using localStorage

**Independent Test**: Change viewport mode, refresh page, verify selected mode is restored

### Manual Testing

- [ ] T050 [US3] Select mobile viewport in dev-tools
- [ ] T051 [US3] Refresh page (Cmd+R or F5)
- [ ] T052 [US3] Verify mobile viewport is restored on page load
- [ ] T053 [US3] Select desktop viewport in dev-tools
- [ ] T054 [US3] Refresh page (Cmd+R or F5)
- [ ] T055 [US3] Verify desktop viewport is restored on page load
- [ ] T056 [US3] Change viewport multiple times (mobile → desktop → mobile)
- [ ] T057 [US3] Navigate away from dev-tools page and return
- [ ] T058 [US3] Verify last selected viewport is preserved
- [ ] T059 [US3] Clear localStorage (browser dev tools → Application → localStorage → delete "preview-viewport" key)
- [ ] T060 [US3] Load dev-tools page, verify default viewport from prop controls is used

**Checkpoint**: User Story 3 complete - state persistence works correctly via localStorage

---

## Phase 6: Polish & Validation

**Purpose**: Final validation and quality checks

### Validation Gates

- [ ] T061 Run `cd apps/clementine-app && pnpm check` to auto-fix format and lint issues
- [ ] T062 Run `cd apps/clementine-app && pnpm type-check` and verify zero TypeScript errors
- [ ] T063 Verify dev server runs without errors or warnings

### Standards Compliance Review

- [ ] T064 Review frontend/design-system.md: verify no hard-coded colors (use theme tokens like bg-background, text-foreground)
- [ ] T065 Review frontend/component-libraries.md: verify shadcn Button, Switch, Select components used correctly
- [ ] T066 Review global/project-structure.md: verify barrel exports at all levels (index.ts files)
- [ ] T067 Review global/code-quality.md: verify clean code (no dead code, clear naming, small functions)
- [ ] T068 Review frontend/accessibility.md: verify touch targets ≥ 44x44px and ARIA labels present

### Edge Case Verification

- [ ] T069 Test edge case: enable both viewport switcher and fullscreen simultaneously, verify both work together
- [ ] T070 Test edge case: remount component while fullscreen is active, verify fullscreen closes and state resets
- [ ] T071 Test edge case: disable viewport switcher while in fullscreen, verify switcher disappears from header
- [ ] T072 Test edge case: rapidly toggle viewport mode, verify UI handles transitions smoothly without glitches

### Success Criteria Validation

- [ ] T073 Verify SC-001: Dev-tools page loads within 2 seconds without errors
- [ ] T074 Verify SC-002: Viewport toggles respond within 100ms with visual confirmation
- [ ] T075 Verify SC-003: Fullscreen activates/deactivates within 100ms
- [ ] T076 Verify SC-004: All interactive controls respond within 100ms
- [ ] T077 Verify SC-005: Viewport preference persists 100% across page refreshes
- [ ] T078 Verify SC-006: Module passes TypeScript strict mode with zero errors
- [ ] T079 Verify SC-007: All validation gates pass without manual fixes
- [ ] T080 Verify SC-008: Reset & Remount clears state within 100ms
- [ ] T081 Verify SC-009: All state changes visible in preview without dev tools
- [ ] T082 Verify SC-010: Module can be imported from other domains via `import { PreviewShell } from "@/shared"`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories CAN proceed in parallel (if staffed) since they test different aspects
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Creates dev-tools interface
- **User Story 2 (P2)**: Can start after US1 (needs dev-tools page) - Tests fullscreen functionality
- **User Story 3 (P3)**: Can start after US1 (needs dev-tools page) - Tests state persistence

### Within Each Phase

**Setup (Phase 1)**:
- T001 must complete first (zustand dependency)
- T002-T004 can run in parallel (directory creation)

**Foundational (Phase 2)**:
- Module Migration (T005-T010): All can run in parallel (different files)
- Component Migration (T011-T015): All can run in parallel (different files)
- Import Path Updates (T016-T020): Must wait for T011-T015, then can run in parallel
- Barrel Exports (T021-T027): Can run in parallel after files are migrated
- T028 must be last (depends on T027)

**User Story 1 (Phase 3)**:
- Dev-Tools Components (T029-T031): T029-T030 can run in parallel, T031 depends on both
- Barrel Exports (T032-T033): Can run after T029-T031
- Route Integration (T034): Depends on T033
- Manual Testing (T035-T042): Sequential (T035 must be first, others follow)

**User Story 2 (Phase 4)**:
- All testing tasks (T043-T049) are sequential

**User Story 3 (Phase 5)**:
- All testing tasks (T050-T060) are sequential

**Polish (Phase 6)**:
- Validation Gates (T061-T063): Sequential
- Standards Review (T064-T068): Can run in parallel
- Edge Cases (T069-T072): Can run in parallel
- Success Criteria (T073-T082): Can run in parallel

### Parallel Opportunities

**Setup Phase**:
```bash
# Can run together:
Task T002: Create shared/preview-shell directory
Task T003: Create domains/dev-tools/preview-shell directory
Task T004: Create app/admin/dev-tools directory
```

**Foundational Phase - Module Migration**:
```bash
# Can run together:
Task T005: Copy types/preview-shell.types.ts
Task T006: Copy constants/viewport.constants.ts
Task T007: Copy store/viewportStore.ts
Task T008: Copy context/ViewportContext.tsx
Task T009: Copy hooks/useViewport.ts
Task T010: Copy hooks/useFullscreen.ts
```

**Foundational Phase - Component Migration**:
```bash
# Can run together:
Task T011: Copy components/DeviceFrame.tsx
Task T012: Copy components/ViewportSwitcher.tsx
Task T013: Copy components/FullscreenTrigger.tsx
Task T014: Copy components/FullscreenOverlay.tsx
```

**Foundational Phase - Import Updates**:
```bash
# Can run together (after components copied):
Task T016: Update DeviceFrame imports
Task T017: Update ViewportSwitcher imports
Task T018: Update FullscreenTrigger imports
Task T019: Update FullscreenOverlay imports
Task T020: Update PreviewShell imports
```

**Foundational Phase - Barrel Exports**:
```bash
# Can run together:
Task T021: Create types/index.ts
Task T022: Create constants/index.ts
Task T023: Create store/index.ts
Task T024: Create context/index.ts
Task T025: Create hooks/index.ts
Task T026: Create components/index.ts
```

**User Story 1 - Dev-Tools Components**:
```bash
# Can run together:
Task T029: Create PropControlsPanel.tsx
Task T030: Create PreviewArea.tsx
```

**Polish - Standards Review**:
```bash
# Can run together:
Task T064: Review design-system.md compliance
Task T065: Review component-libraries.md compliance
Task T066: Review project-structure.md compliance
Task T067: Review code-quality.md compliance
Task T068: Review accessibility.md compliance
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T028) - CRITICAL
3. Complete Phase 3: User Story 1 (T029-T042)
4. **STOP and VALIDATE**: Test dev-tools interface works
5. Deploy/demo if ready

**Result**: Working dev-tools interface for testing device preview functionality

### Incremental Delivery

1. Setup + Foundational → Preview-shell module migrated and importable
2. Add User Story 1 → Dev-tools interface functional (MVP!)
3. Add User Story 2 → Fullscreen mode verified
4. Add User Story 3 → State persistence verified
5. Each story adds validation without breaking previous stories

### Sequential Strategy (Recommended)

Since all user stories depend on the dev-tools interface created in US1:

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (BLOCKS all stories)
3. Complete Phase 3: User Story 1 (creates dev-tools)
4. Complete Phase 4: User Story 2 (uses dev-tools)
5. Complete Phase 5: User Story 3 (uses dev-tools)
6. Complete Phase 6: Polish & Validation

**Total Estimated Time**: ~2-3 hours
- Setup: 5 min
- Foundational: 20 min
- US1: 45 min
- US2: 20 min
- US3: 15 min
- Polish: 20 min

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] labels**: Maps task to specific user story (US1, US2, US3)
- **Manual testing only**: No automated tests per minimal testing strategy
- **Dev-tools is the test harness**: All validation happens via interactive testing in dev-tools interface
- **Commit after logical groups**: Foundational phase, each user story, polish
- **Stop at checkpoints**: Validate each story independently before proceeding
- **Validation gates must pass**: Run format/lint/type-check before marking complete

**IMPORTANT**: This migration has no automated tests. All verification is manual through the dev-tools testing interface created in User Story 1.

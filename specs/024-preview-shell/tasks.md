# Tasks: Preview Shell

**Input**: Design documents from `/specs/024-preview-shell/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Tests not explicitly requested - following Minimal Testing Strategy (Constitution IV)

**Organization**: Tasks grouped by user story for independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/features/preview-shell/`
- Feature module follows vertical slice architecture (Constitution Principle VII)

---

## Phase 1: Setup (Module Structure)

**Purpose**: Create feature module directory structure and foundational files

- [X] T001 Create feature module directory structure at `web/src/features/preview-shell/`
- [X] T002 [P] Create types barrel file at `web/src/features/preview-shell/types/index.ts`
- [X] T003 [P] Create constants barrel file at `web/src/features/preview-shell/constants/index.ts`
- [X] T004 [P] Create components barrel file at `web/src/features/preview-shell/components/index.ts`
- [X] T005 [P] Create context barrel file at `web/src/features/preview-shell/context/index.ts`
- [X] T006 [P] Create hooks barrel file at `web/src/features/preview-shell/hooks/index.ts`

---

## Phase 2: Foundational (Types & Constants)

**Purpose**: Core types and constants that ALL user stories depend on

**⚠️ CRITICAL**: No component work can begin until this phase is complete

- [X] T007 Define ViewportMode and ViewportDimensions types in `web/src/features/preview-shell/types/preview-shell.types.ts`
- [X] T008 Define ViewportContextValue interface in `web/src/features/preview-shell/types/preview-shell.types.ts`
- [X] T009 Define all component props interfaces (PreviewShellProps, DeviceFrameProps, ViewportSwitcherProps, FullscreenOverlayProps, FullscreenTriggerProps) in `web/src/features/preview-shell/types/preview-shell.types.ts`
- [X] T010 Define hook return types (UseViewportReturn, UseFullscreenReturn) in `web/src/features/preview-shell/types/preview-shell.types.ts`
- [X] T011 Create VIEWPORT_DIMENSIONS constant in `web/src/features/preview-shell/constants/viewport.constants.ts`
- [X] T012 Export all types from `web/src/features/preview-shell/types/index.ts`
- [X] T013 Export constants from `web/src/features/preview-shell/constants/index.ts`

**Checkpoint**: Foundation ready - types and constants available for component implementation

---

## Phase 3: User Story 1 - Basic Device Preview (Priority: P1) 🎯 MVP

**Goal**: Content creators can see content inside a device frame with proper mobile dimensions (375x667px)

**Independent Test**: Render any content inside PreviewShell and verify it appears within mobile device frame with rounded corners

### Implementation for User Story 1

- [X] T014 [US1] Create ViewportContext with provider and hook in `web/src/features/preview-shell/context/ViewportContext.tsx`
- [X] T015 [US1] Export ViewportProvider and useViewportContext from `web/src/features/preview-shell/context/index.ts`
- [X] T016 [US1] Create useViewport hook (uncontrolled mode only) in `web/src/features/preview-shell/hooks/useViewport.ts`
- [X] T017 [US1] Export useViewport from `web/src/features/preview-shell/hooks/index.ts`
- [X] T018 [US1] Extract and create DeviceFrame component (pure container, no theming) in `web/src/features/preview-shell/components/DeviceFrame.tsx`
- [X] T019 [US1] Create basic PreviewShell component (device frame only, no switcher/fullscreen) in `web/src/features/preview-shell/components/PreviewShell.tsx`
- [X] T020 [US1] Export DeviceFrame and PreviewShell from `web/src/features/preview-shell/components/index.ts`
- [X] T021 [US1] Create public API exports in `web/src/features/preview-shell/index.ts`

**Checkpoint**: PreviewShell renders content in mobile device frame - MVP complete

---

## Phase 4: User Story 2 - Viewport Switching (Priority: P2)

**Goal**: Content creators can toggle between mobile (375x667px) and desktop (900x600px) preview modes

**Independent Test**: Click viewport toggle buttons and verify device frame dimensions change accordingly

### Implementation for User Story 2

- [X] T022 [US2] Extract and create ViewportSwitcher component with size variants in `web/src/features/preview-shell/components/ViewportSwitcher.tsx`
- [X] T023 [US2] Extend useViewport hook to support controlled mode (viewportMode + onViewportChange props) in `web/src/features/preview-shell/hooks/useViewport.ts`
- [X] T024 [US2] Update PreviewShell to integrate ViewportSwitcher with enableViewportSwitcher prop in `web/src/features/preview-shell/components/PreviewShell.tsx`
- [X] T025 [US2] Export ViewportSwitcher from `web/src/features/preview-shell/components/index.ts`
- [X] T026 [US2] Update public API exports with ViewportSwitcher in `web/src/features/preview-shell/index.ts`

**Checkpoint**: Viewport switching works - users can toggle mobile/desktop views

---

## Phase 5: User Story 3 - Fullscreen Preview Mode (Priority: P3)

**Goal**: Content creators can enter fullscreen CSS overlay with device frame centered, exit via button or Escape key

**Independent Test**: Click fullscreen button, verify overlay covers viewport with centered device frame, exit via X or Escape

### Implementation for User Story 3

- [X] T027 [US3] Create useFullscreen hook with Escape key handling in `web/src/features/preview-shell/hooks/useFullscreen.ts`
- [X] T028 [US3] Export useFullscreen from `web/src/features/preview-shell/hooks/index.ts`
- [X] T029 [US3] Create FullscreenOverlay component (CSS overlay, header with close button, viewport switcher support) in `web/src/features/preview-shell/components/FullscreenOverlay.tsx`
- [X] T030 [US3] Create FullscreenTrigger button component in `web/src/features/preview-shell/components/FullscreenTrigger.tsx`
- [X] T031 [US3] Update PreviewShell to integrate fullscreen mode with enableFullscreen prop in `web/src/features/preview-shell/components/PreviewShell.tsx`
- [X] T032 [US3] Export FullscreenOverlay and FullscreenTrigger from `web/src/features/preview-shell/components/index.ts`
- [X] T033 [US3] Update public API exports with fullscreen components and hook in `web/src/features/preview-shell/index.ts`

**Checkpoint**: Fullscreen mode works with keyboard accessibility

---

## Phase 6: User Story 4 - Theme Editor Integration (Priority: P4)

**Goal**: Event Theme Editor and Project Theme Editor use PreviewShell with viewport switching and fullscreen mode

**Independent Test**: Open theme editors and verify viewport switching and fullscreen work with themed content

### Implementation for User Story 4

- [X] T034 [US4] Update steps feature to re-export DeviceFrame and ViewSwitcher from preview-shell with deprecation comments in `web/src/features/steps/components/preview/index.ts`
- [X] T035 [US4] Update EventThemeEditor to use PreviewShell + ThemedBackground replacing PreviewPanel in `web/src/features/events/components/designer/EventThemeEditor.tsx`
- [X] T036 [US4] Update ThemeEditor (projects) to use PreviewShell + ThemedBackground replacing PreviewPanel in `web/src/features/projects/components/designer/ThemeEditor.tsx`
- [X] T037 [US4] Deprecate PreviewPanel component with comment (do not delete yet) in `web/src/features/projects/components/designer/PreviewPanel.tsx`

**Checkpoint**: Theme editors have viewport switching and fullscreen - full feature complete

---

## Phase 7: Polish & Validation

**Purpose**: Cleanup, documentation, and validation loop

- [X] T038 [P] Remove any remaining unused imports in preview-shell components
- [X] T039 [P] Verify touch target sizes (44x44px) on ViewportSwitcher and FullscreenTrigger buttons
- [X] T040 [P] Test keyboard navigation (Tab) and Escape key in fullscreen mode

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T041 Run `pnpm lint` and fix all errors/warnings
- [X] T042 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T043 Verify feature in local dev server (`pnpm dev`) - test all 4 user stories
- [ ] T044 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T006) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T007-T013)
- **User Story 2 (Phase 4)**: Depends on US1 completion (T014-T021)
- **User Story 3 (Phase 5)**: Depends on US2 completion (T022-T026)
- **User Story 4 (Phase 6)**: Depends on US3 completion (T027-T033)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: MVP - basic device preview, no dependencies on other stories
- **User Story 2 (P2)**: Builds on US1 (extends PreviewShell with viewport switcher)
- **User Story 3 (P3)**: Builds on US2 (adds fullscreen with viewport switcher in overlay)
- **User Story 4 (P4)**: Depends on US1-US3 (integrates complete preview-shell into theme editors)

### Within Each User Story

- Hooks before components that use them
- Lower-level components before higher-level orchestrators
- Barrel exports after implementations

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T002, T003, T004, T005, T006 can run in parallel after T001
```

**Phase 7 (Polish)**:
```
T038, T039, T040 can run in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T013)
3. Complete Phase 3: User Story 1 (T014-T021)
4. **STOP and VALIDATE**: Test PreviewShell with basic content
5. Can deploy MVP - basic device preview working

### Incremental Delivery

1. Setup + Foundational → Types and constants ready
2. User Story 1 → Basic device preview → Deploy/Demo (MVP!)
3. User Story 2 → Add viewport switching → Deploy/Demo
4. User Story 3 → Add fullscreen mode → Deploy/Demo
5. User Story 4 → Theme editor integration → Full feature complete!

### Sequential Flow (Recommended)

This feature has natural sequential dependencies - each story builds on previous:

```
Phase 1 → Phase 2 → US1 → US2 → US3 → US4 → Polish
```

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- No tests generated (not explicitly requested per Minimal Testing Strategy)
- DeviceFrame is pure container - theming handled by consumers with ThemedBackground
- Fullscreen uses CSS overlay (fixed inset-0 z-50), not native Fullscreen API
- Touch targets must be ≥44x44px (Constitution Principle I)
- All types in single file for cohesion (preview-shell.types.ts)

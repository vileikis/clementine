# Tasks: Event Theme Editor

**Input**: Design documents from `/specs/015-event-theme-editor/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Tests marked as optional in plan.md.

**Organization**: Tasks are grouped by goals from spec.md to enable incremental implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which goal/story this task belongs to (G1=Controls, G2=Preview, G3=Integration)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure (TanStack Start web app):
- **Shared module**: `apps/clementine-app/src/shared/editor-controls/`
- **Theme domain**: `apps/clementine-app/src/domains/event/theme/`
- **Routes**: `apps/clementine-app/src/app/routes/`

---

## Phase 1: Setup (Module Structure)

**Purpose**: Create directory structure and barrel exports for new modules

- [ ] T001 Create editor-controls module directories at `apps/clementine-app/src/shared/editor-controls/{components,types}/`
- [ ] T002 Create theme domain module directories at `apps/clementine-app/src/domains/event/theme/{components,containers,hooks,constants}/`
- [ ] T003 [P] Create barrel export file at `apps/clementine-app/src/shared/editor-controls/index.ts`
- [ ] T004 [P] Create barrel export file at `apps/clementine-app/src/domains/event/theme/index.ts`

---

## Phase 2: Foundational (Shared Editor Controls)

**Purpose**: Build reusable editor control components that the theme editor depends on

**CRITICAL**: Theme editor implementation cannot begin until this phase is complete

### Layout Components

- [ ] T005 [P] Create EditorSection component with collapsible functionality using shadcn Collapsible at `apps/clementine-app/src/shared/editor-controls/components/EditorSection.tsx`
- [ ] T006 [P] Create EditorRow component with label+control grid layout at `apps/clementine-app/src/shared/editor-controls/components/EditorRow.tsx`

### Field Components

- [ ] T007 [P] Create ColorPickerField component with native color picker and hex input in shadcn Popover at `apps/clementine-app/src/shared/editor-controls/components/ColorPickerField.tsx`
- [ ] T008 [P] Create SelectField component wrapping shadcn Select at `apps/clementine-app/src/shared/editor-controls/components/SelectField.tsx`
- [ ] T009 [P] Create ToggleGroupField component wrapping shadcn ToggleGroup at `apps/clementine-app/src/shared/editor-controls/components/ToggleGroupField.tsx`
- [ ] T010 [P] Create SliderField component wrapping shadcn Slider with value display at `apps/clementine-app/src/shared/editor-controls/components/SliderField.tsx`
- [ ] T011 [P] Create MediaPickerField component with upload and preview functionality at `apps/clementine-app/src/shared/editor-controls/components/MediaPickerField.tsx`

### Types and Exports

- [ ] T012 [P] Create shared types for all editor control props at `apps/clementine-app/src/shared/editor-controls/types/index.ts`
- [ ] T013 Create components barrel export at `apps/clementine-app/src/shared/editor-controls/components/index.ts` (depends on T005-T011)

**Checkpoint**: Editor controls module complete - can be used by theme editor and future editors

---

## Phase 3: Goal 1 - Theme Controls (Priority: P1)

**Goal**: Enable visual customization of event themes through intuitive controls

**Independent Test**: User can modify all theme properties (font, colors, buttons, background) via control panel

### Constants

- [ ] T014 [P] [G1] Create font options constant array at `apps/clementine-app/src/domains/event/theme/constants/fonts.ts`
- [ ] T015 [P] [G1] Create constants barrel export at `apps/clementine-app/src/domains/event/theme/constants/index.ts`

### Theme Controls Component

- [ ] T016 [G1] Create ThemeControls component with all four sections (Text, Colors, Buttons, Background) using editor controls at `apps/clementine-app/src/domains/event/theme/components/ThemeControls.tsx` (depends on T013, T014)
- [ ] T017 [G1] Create components barrel export at `apps/clementine-app/src/domains/event/theme/components/index.ts` (depends on T016)

**Checkpoint**: Theme controls render and accept user input - can be tested standalone with mock data

---

## Phase 4: Goal 2 - Theme Preview (Priority: P2)

**Goal**: Provide real-time preview of theme changes

**Independent Test**: Preview shows correct visual representation of theme settings (background, text, button styling)

### Preview Component

- [ ] T018 [G2] Create ThemePreview display-only component showing background, text samples, and button with theme applied at `apps/clementine-app/src/domains/event/theme/components/ThemePreview.tsx`
- [ ] T019 [G2] Update components barrel export to include ThemePreview at `apps/clementine-app/src/domains/event/theme/components/index.ts` (depends on T018)

**Checkpoint**: ThemePreview renders correctly with theme data passed as props

---

## Phase 5: Goal 3 - Auto-Save Integration (Priority: P3)

**Goal**: Implement auto-saving with tracked mutations for save indicator integration

**Independent Test**: Changes auto-save with 300ms debounce, save indicator shows pending/saved state

### Hooks

- [ ] T020 [P] [G3] Create useUpdateTheme hook with TanStack Query mutation and tracked mutation wrapper at `apps/clementine-app/src/domains/event/theme/hooks/useUpdateTheme.ts`
- [ ] T021 [P] [G3] Create useUploadAndUpdateBackground composite hook combining upload and theme update at `apps/clementine-app/src/domains/event/theme/hooks/useUploadAndUpdateBackground.ts`
- [ ] T022 [G3] Create hooks barrel export at `apps/clementine-app/src/domains/event/theme/hooks/index.ts` (depends on T020, T021)

**Checkpoint**: Hooks can be tested in isolation with mock API calls

---

## Phase 6: Goal 4 - Full Integration (Priority: P4)

**Goal**: Complete 2-column theme editor page with preview, controls, and persistence

**Independent Test**: Full editor flow - navigate to theme tab, modify properties, see preview update, auto-save works

### Container

- [ ] T023 [G4] Create ThemeEditorPage container with 2-column layout (PreviewShell + ThemeControls), React Hook Form setup, and useAutoSave integration at `apps/clementine-app/src/domains/event/theme/containers/ThemeEditorPage.tsx` (depends on T016, T018, T022)
- [ ] T024 [G4] Create containers barrel export at `apps/clementine-app/src/domains/event/theme/containers/index.ts` (depends on T023)

### Route Integration

- [ ] T025 [G4] Create theme route file importing ThemeEditorPage at `apps/clementine-app/src/app/routes/workspace.$workspaceSlug.projects.$projectId.events.$eventId.theme.tsx` (depends on T024)

**Checkpoint**: Theme editor fully functional - all success criteria met

---

## Phase 7: Polish & Validation

**Purpose**: Final validation and cleanup

- [ ] T026 Run `pnpm check` (format + lint) in `apps/clementine-app/`
- [ ] T027 Run `pnpm type-check` in `apps/clementine-app/`
- [ ] T028 Manual verification: Test all theme properties update correctly
- [ ] T029 Manual verification: Test real-time preview updates
- [ ] T030 Manual verification: Test auto-save with 300ms debounce
- [ ] T031 Manual verification: Test save indicator shows correct state
- [ ] T032 Manual verification: Test background image upload flow
- [ ] T033 Verify all code uses design system tokens (no hard-coded colors in admin UI)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (directories) - BLOCKS theme editor phases
- **Goal 1 (Phase 3)**: Depends on Phase 2 (editor controls)
- **Goal 2 (Phase 4)**: Depends on Phase 2 (editor controls for consistency, though ThemePreview is independent)
- **Goal 3 (Phase 5)**: Can start after Phase 2 (independent hooks)
- **Goal 4 (Phase 6)**: Depends on Phases 3, 4, 5 (all components and hooks)
- **Polish (Phase 7)**: Depends on Phase 6 completion

### Goal Dependencies

- **Goal 1 (Controls)**: Can start after Phase 2 - Standalone controls with mock data
- **Goal 2 (Preview)**: Can start after Phase 2 - Standalone preview with mock data
- **Goal 3 (Hooks)**: Can start after Phase 2 - Standalone hooks with mock API
- **Goal 4 (Integration)**: Requires Goals 1-3 complete - Combines all pieces

### Within Each Phase

- Tasks marked [P] can run in parallel
- Components should be built before barrel exports
- Layout components (EditorSection, EditorRow) before field components
- Constants before components that use them

### Parallel Opportunities

**Phase 1 Parallel**:
```
T003 (editor-controls/index.ts) || T004 (theme/index.ts)
```

**Phase 2 Parallel (after directories)**:
```
T005 (EditorSection) || T006 (EditorRow) || T007 (ColorPickerField) ||
T008 (SelectField) || T009 (ToggleGroupField) || T010 (SliderField) ||
T011 (MediaPickerField) || T012 (types)
```

**Phases 3-5 Parallel (after Phase 2)**:
```
[Goal 1: T014, T015] || [Goal 2: T018] || [Goal 3: T020, T021]
```

---

## Implementation Strategy

### MVP First (Editor Controls + Basic Theme Editor)

1. Complete Phase 1: Setup (5 min)
2. Complete Phase 2: Foundational (2-3 hours)
3. Complete Phase 3: Goal 1 - Theme Controls (1 hour)
4. Complete Phase 4: Goal 2 - Theme Preview (1 hour)
5. **STOP and VALIDATE**: Test controls and preview with mock data

### Incremental Delivery

1. Setup + Foundational → Reusable editor controls ready for other features
2. Add Goals 1-2 → Visual components testable standalone
3. Add Goal 3 → Persistence hooks ready
4. Add Goal 4 → Full integration complete
5. Polish → Validation and cleanup

### Estimated Time

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Setup | T001-T004 | 15 min |
| Foundational | T005-T013 | 2-3 hours |
| Goal 1 | T014-T017 | 1 hour |
| Goal 2 | T018-T019 | 45 min |
| Goal 3 | T020-T022 | 1 hour |
| Goal 4 | T023-T025 | 1.5 hours |
| Polish | T026-T033 | 30 min |
| **Total** | **33 tasks** | **~7-8 hours** |

---

## Notes

- [P] tasks = different files, no dependencies within the phase
- [G#] label maps task to specific goal for traceability
- Phase 2 (Foundational) contains 9 tasks that can all run in parallel
- ThemePreview uses inline styles for theme colors (not design tokens) - this is intentional
- All admin UI must use design system tokens per `standards/frontend/design-system.md`
- Commit after each phase completion
- Run validation gates before final commit

---

## Task Count Summary

| Phase | Task Count |
|-------|------------|
| Phase 1: Setup | 4 |
| Phase 2: Foundational | 9 |
| Phase 3: Goal 1 (Controls) | 4 |
| Phase 4: Goal 2 (Preview) | 2 |
| Phase 5: Goal 3 (Hooks) | 3 |
| Phase 6: Goal 4 (Integration) | 3 |
| Phase 7: Polish | 8 |
| **Total** | **33** |

**Parallel Opportunities**: 11 tasks in Phase 2 can run simultaneously; 5+ tasks across Phases 3-5 can run in parallel after Phase 2.

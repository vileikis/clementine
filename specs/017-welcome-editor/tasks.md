# Tasks: Welcome Editor

**Input**: Design documents from `/specs/017-welcome-editor/`
**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md, contracts/firestore-operations.md

**Tests**: Not explicitly requested in feature specification. Focus on implementation.

**Organization**: Tasks are grouped by user story (Goals from spec.md) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `apps/clementine-app/src/`:
- **Domain module**: `domains/event/welcome/`
- **Shared schemas**: `domains/event/shared/schemas/`

---

## Phase 1: Setup (Module Structure)

**Purpose**: Create welcome module directory structure and barrel exports

- [X] T001 Create welcome module directory structure at `apps/clementine-app/src/domains/event/welcome/` with subdirectories: components/, containers/, hooks/, schemas/, constants/
- [X] T002 [P] Create barrel export file at `apps/clementine-app/src/domains/event/welcome/schemas/index.ts`
- [X] T003 [P] Create barrel export file at `apps/clementine-app/src/domains/event/welcome/constants/index.ts`
- [X] T004 [P] Create barrel export file at `apps/clementine-app/src/domains/event/welcome/hooks/index.ts`
- [X] T005 [P] Create barrel export file at `apps/clementine-app/src/domains/event/welcome/components/index.ts`
- [X] T006 [P] Create barrel export file at `apps/clementine-app/src/domains/event/welcome/containers/index.ts`
- [X] T007 Create module public API at `apps/clementine-app/src/domains/event/welcome/index.ts`

---

## Phase 2: Foundational (Schema Integration)

**Purpose**: Add welcome config schema to shared event config - MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Add welcomeConfigSchema to `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts` - import mediaReferenceSchema from @/shared/theming, define welcomeConfigSchema, add to projectEventConfigSchema, export WelcomeConfig type
- [X] T009 Create update schema at `apps/clementine-app/src/domains/event/welcome/schemas/welcome.schemas.ts` with updateWelcomeSchema and re-export WelcomeConfig type
- [X] T010 Create defaults constant at `apps/clementine-app/src/domains/event/welcome/constants/defaults.ts` with DEFAULT_WELCOME object

**Checkpoint**: Schema foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Enable Welcome Content Customization (Priority: P1) 🎯 MVP

**Goal**: Enable customization of welcome screen content (title, description, hero media, layout)

**Independent Test**: Navigate to welcome editor, modify title/description, verify form accepts input and stores values

### Implementation for User Story 1

- [X] T011 [US1] Create useUpdateWelcome hook at `apps/clementine-app/src/domains/event/welcome/hooks/useUpdateWelcome.ts` - follow useUpdateTheme pattern with welcomeConfigSchema validation, updateEventConfigField, Sentry error tracking, useTrackedMutation wrapper
- [X] T012 [US1] Create useUploadAndUpdateHeroMedia hook at `apps/clementine-app/src/domains/event/welcome/hooks/useUploadAndUpdateHeroMedia.ts` - composite hook using useUploadMediaAsset and useUpdateWelcome, handle progress callback
- [X] T013 [US1] Create WelcomeControls component at `apps/clementine-app/src/domains/event/welcome/components/WelcomeControls.tsx` - Content section (Input for title, Textarea for description), Media section (MediaPickerField), Layout section (ToggleGroupField for list/grid)
- [X] T014 [US1] Update hooks barrel export at `apps/clementine-app/src/domains/event/welcome/hooks/index.ts` to export useUpdateWelcome and useUploadAndUpdateHeroMedia
- [X] T015 [US1] Update components barrel export at `apps/clementine-app/src/domains/event/welcome/components/index.ts` to export WelcomeControls

**Checkpoint**: User can modify welcome content via controls panel - data saves to Firestore

---

## Phase 4: User Story 2 - Real-time Preview with Theme (Priority: P2)

**Goal**: Provide real-time preview of welcome changes with theme applied

**Independent Test**: Modify title in controls, see preview update instantly with current event theme styling

### Implementation for User Story 2

- [X] T016 [US2] Create WelcomePreview component at `apps/clementine-app/src/domains/event/welcome/components/WelcomePreview.tsx` - use ThemedBackground with theme.background, ThemedText for title (heading variant) and description (body variant), hero media img tag with max-h-48, dashed border placeholder for experiences
- [X] T017 [US2] Update components barrel export at `apps/clementine-app/src/domains/event/welcome/components/index.ts` to also export WelcomePreview

**Checkpoint**: Preview renders welcome content with theme styling, updates when props change

---

## Phase 5: User Story 3 - Auto-saving with Save Indicator (Priority: P3)

**Goal**: Implement auto-saving with tracked mutations for save indicator integration

**Independent Test**: Modify title, wait 300ms, verify save indicator shows saving/saved state

### Implementation for User Story 3

- [X] T018 [US3] Create WelcomeEditorPage container at `apps/clementine-app/src/domains/event/welcome/containers/WelcomeEditorPage.tsx` - 2-column layout (flex-1 preview left, w-80 controls right), useForm with values prop, useWatch for live preview, useAutoSave with 300ms debounce, upload state management, handleUpdate and handleUploadMedia callbacks
- [X] T019 [US3] Update containers barrel export at `apps/clementine-app/src/domains/event/welcome/containers/index.ts` to export WelcomeEditorPage

**Checkpoint**: Auto-save works with debouncing, save indicator reflects mutation state

---

## Phase 6: User Story 4 - Consistent Preview Styling (Priority: P4)

**Goal**: Leverage themed primitives for consistent preview styling

**Independent Test**: Change event theme colors, verify welcome preview reflects theme changes

### Implementation for User Story 4

- [X] T020 [US4] Update WelcomeEditorPage at `apps/clementine-app/src/domains/event/welcome/containers/WelcomeEditorPage.tsx` to wrap preview in PreviewShell with enableViewportSwitcher and enableFullscreen props, pass merged previewWelcome and previewTheme (with defaults) to WelcomePreview

**Checkpoint**: Preview shell provides viewport switching, theme applied consistently

---

## Phase 7: Integration & Route Connection

**Purpose**: Connect welcome module to route and finalize exports

- [X] T021 Update module public API at `apps/clementine-app/src/domains/event/welcome/index.ts` to export WelcomeEditorPage, WelcomePreview, WelcomeControls, useUpdateWelcome, useUploadAndUpdateHeroMedia, DEFAULT_WELCOME, and types
- [X] T022 Verify welcome route imports WelcomeEditorPage from @/domains/event/welcome at `apps/clementine-app/src/app/routes/` (check existing route file for welcome tab)

**Checkpoint**: Welcome editor accessible via event designer sidebar

---

## Phase 8: Polish & Validation

**Purpose**: Final validation and code quality checks

- [X] T023 Run `pnpm app:check` from apps/clementine-app/ to verify format and lint pass
- [X] T024 Run `pnpm type-check` from apps/clementine-app/ to verify TypeScript compilation
- [ ] T025 Manual test: Navigate to welcome editor, verify all controls work, preview updates in real-time, auto-save functions, theme styling applies
- [ ] T026 Run quickstart.md validation checklist - verify all 7 test scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3-6 (User Stories)**: All depend on Phase 2 completion
  - US1 (P3) → US2 (P4) → US3 (P5) → US4 (P6) - sequential due to component dependencies
- **Phase 7 (Integration)**: Depends on all user stories complete
- **Phase 8 (Polish)**: Depends on Phase 7

### User Story Dependencies

- **User Story 1 (P3)**: Depends on Phase 2 - creates hooks and controls
- **User Story 2 (P4)**: Depends on Phase 2 - creates preview component
- **User Story 3 (P5)**: Depends on US1 and US2 - creates container that uses both
- **User Story 4 (P6)**: Depends on US3 - enhances container with preview shell

### Within Each Phase

- Barrel exports depend on component/hook implementation
- Container depends on components and hooks
- Module index depends on all exports being ready

### Parallel Opportunities

**Phase 1** - All barrel exports (T002-T006) can run in parallel after T001

**Phase 2** - T009 and T010 can run in parallel after T008

**Phase 3** - T011 and T012 can run in parallel (different hooks)

**Phase 4** - Independent of US1 implementation (just needs Phase 2 complete)

---

## Parallel Example: Phase 1 Setup

```bash
# After T001 completes, launch all barrel exports together:
Task: "Create barrel export at schemas/index.ts"
Task: "Create barrel export at constants/index.ts"
Task: "Create barrel export at hooks/index.ts"
Task: "Create barrel export at components/index.ts"
Task: "Create barrel export at containers/index.ts"
```

## Parallel Example: Phase 3 Hooks

```bash
# Launch both hooks in parallel:
Task: "Create useUpdateWelcome hook"
Task: "Create useUploadAndUpdateHeroMedia hook"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 + 3)

1. Complete Phase 1: Setup (module structure)
2. Complete Phase 2: Foundational (schema integration)
3. Complete Phase 3: User Story 1 (controls and hooks)
4. Complete Phase 4: User Story 2 (preview component)
5. Complete Phase 5: User Story 3 (container with auto-save)
6. **STOP and VALIDATE**: Test welcome editor end-to-end
7. Deploy/demo if ready

### Full Feature

1. Complete MVP (Phases 1-5)
2. Complete Phase 6: User Story 4 (preview shell enhancement)
3. Complete Phase 7: Integration & route verification
4. Complete Phase 8: Polish & validation
5. Ready for PR

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 26 |
| **Phase 1 (Setup)** | 7 tasks |
| **Phase 2 (Foundational)** | 3 tasks |
| **Phase 3 (US1)** | 5 tasks |
| **Phase 4 (US2)** | 2 tasks |
| **Phase 5 (US3)** | 2 tasks |
| **Phase 6 (US4)** | 1 task |
| **Phase 7 (Integration)** | 2 tasks |
| **Phase 8 (Polish)** | 4 tasks |
| **Parallelizable Tasks** | 9 (T002-T006, T009-T010, T011-T012) |
| **MVP Scope** | Phases 1-5 (19 tasks) |
| **New Files** | 13 files |
| **Modified Files** | 1 file (project-event-config.schema.ts) |

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [US#] label maps task to specific user story from Goals in spec.md
- Follow ThemeEditorPage.tsx pattern exactly for WelcomeEditorPage
- All components use existing shared infrastructure (editor-controls, preview-shell, theming)
- Auto-save uses 300ms debounce via useAutoSave hook
- Verify tests fail scenario N/A - no tests requested in spec

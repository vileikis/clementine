# Tasks: Transform Pipeline Editor

**Input**: Design documents from `/specs/052-transform-pipeline-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No explicit test requirements in specification. Testing deferred to Phase 1h per plan.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to repository root: `apps/clementine-app/src/domains/experience/generate/`

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Create domain structure and foundational files

- [X] T001 Create domain directory structure at apps/clementine-app/src/domains/experience/generate/ with subdirectories: components/, containers/, hooks/, stores/
- [X] T002 [P] Create barrel export files: apps/clementine-app/src/domains/experience/generate/components/index.ts
- [X] T003 [P] Create barrel export files: apps/clementine-app/src/domains/experience/generate/containers/index.ts
- [X] T004 [P] Create barrel export files: apps/clementine-app/src/domains/experience/generate/hooks/index.ts
- [X] T005 [P] Create barrel export files: apps/clementine-app/src/domains/experience/generate/stores/index.ts
- [X] T006 Create domain public API: apps/clementine-app/src/domains/experience/generate/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

**Purpose**: Core state management and Firebase integration that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Implement Zustand editor store in apps/clementine-app/src/domains/experience/generate/stores/useGenerateEditorStore.ts with selectedNodeId state and save tracking (using createEditorStore mixin)
- [X] T008 Implement Firestore update hook in apps/clementine-app/src/domains/experience/generate/hooks/useUpdateTransformConfig.ts with transaction, draftVersion increment, and cache invalidation
- [X] T009 Export store from apps/clementine-app/src/domains/experience/generate/stores/index.ts
- [X] T010 Export useUpdateTransformConfig from apps/clementine-app/src/domains/experience/generate/hooks/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel ✅

---

## Phase 3: User Story 1 - Manage AI Image Nodes (Priority: P1) 🎯 MVP ✅ COMPLETE

**Goal**: Enable adding, viewing, and deleting AI Image nodes in the transform pipeline

**Independent Test**: Create new experience → navigate to transform pipeline editor → add AI Image node → view node card with summary → delete node. All CRUD operations work independently.

### Implementation for User Story 1

**Hooks**:
- [X] T011 [P] [US1] Implement useAddNode hook in apps/clementine-app/src/domains/experience/generate/hooks/useAddNode.ts (creates node with nanoid, default config, updates local state, calls useUpdateTransformConfig)
- [X] T012 [P] [US1] Implement useDeleteNode hook in apps/clementine-app/src/domains/experience/generate/hooks/useDeleteNode.ts (filters node from array, updates local state, calls useUpdateTransformConfig)

**Components**:
- [X] T013 [P] [US1] Create AddNodeButton component in apps/clementine-app/src/domains/experience/generate/components/AddNodeButton.tsx with 44px min-height, Plus icon, loading state
- [X] T014 [P] [US1] Create AIImageNodeCard component in apps/clementine-app/src/domains/experience/generate/components/AIImageNodeCard.tsx showing Badge, model, aspect ratio, prompt preview (50 chars), hover delete button
- [X] T015 [P] [US1] Create DeleteNodeDialog component in apps/clementine-app/src/domains/experience/generate/components/DeleteNodeDialog.tsx using AlertDialog with confirmation text, 44px buttons, isPending state
- [X] T016 [P] [US1] Create EmptyState component in apps/clementine-app/src/domains/experience/generate/components/EmptyState.tsx with centered layout, message, AddNodeButton

**Barrel Exports**:
- [X] T017 [US1] Export useAddNode and useDeleteNode from apps/clementine-app/src/domains/experience/generate/hooks/index.ts
- [X] T018 [US1] Export AddNodeButton, AIImageNodeCard, DeleteNodeDialog, EmptyState from apps/clementine-app/src/domains/experience/generate/components/index.ts

**Container Integration**:
- [X] T019 [US1] Create TransformPipelineEditor container in apps/clementine-app/src/domains/experience/generate/containers/TransformPipelineEditor.tsx integrating add/delete logic, node list display, empty state, delete dialog state management
- [X] T020 [US1] Export TransformPipelineEditor from apps/clementine-app/src/domains/experience/generate/containers/index.ts
- [X] T021 [US1] Export TransformPipelineEditor and types from domain public API: apps/clementine-app/src/domains/experience/generate/index.ts

**Checkpoint**: User Story 1 complete - can add, view, delete nodes independently. Empty state works. All operations persist to Firestore. ✅

---

## Phase 4: User Story 2 - Configure Node Settings (Priority: P2)

**Goal**: Enable selecting nodes to open editor panel with placeholder sections for configuration

**Independent Test**: Add node → click node card → editor panel opens with placeholder sections → close panel. Navigation between node list and editor works.

### Implementation for User Story 2

**Components**:
- [ ] T022 [US2] Create NodeEditorPanel component in apps/clementine-app/src/domains/experience/generate/components/NodeEditorPanel.tsx using Sheet with placeholder sections (Model Settings, Prompt, RefMedia, Test Run), close button, responsive width

**Container Integration**:
- [ ] T023 [US2] Update TransformPipelineEditor container in apps/clementine-app/src/domains/experience/generate/containers/TransformPipelineEditor.tsx to add node selection logic, integrate NodeEditorPanel, handle open/close state from store
- [ ] T024 [US2] Update AIImageNodeCard in apps/clementine-app/src/domains/experience/generate/components/AIImageNodeCard.tsx to add onClick handler for selection, isSelected visual state
- [ ] T025 [US2] Export NodeEditorPanel from apps/clementine-app/src/domains/experience/generate/components/index.ts

**Checkpoint**: User Stories 1 AND 2 both work - can add/delete nodes AND open/close editor panel. Panel shows placeholder sections for future configuration.

---

## Phase 5: User Story 3 - Persist Transform Configuration (Priority: P3)

**Goal**: Auto-save transform config changes with save status indicators

**Independent Test**: Add node → wait 2 seconds → verify Firestore updated. Make changes → see "Saving..." → see "Saved". Navigate away and return → nodes persist.

### Implementation for User Story 3

**Components**:
- [ ] T026 [US3] Integrate EditorSaveStatus component in apps/clementine-app/src/domains/experience/generate/containers/TransformPipelineEditor.tsx showing pendingSaves and lastCompletedAt from store

**Container Updates**:
- [ ] T027 [US3] Update TransformPipelineEditor in apps/clementine-app/src/domains/experience/generate/containers/TransformPipelineEditor.tsx to use useTrackedMutation wrapper for all save operations (add, delete hooks already save - verify tracking)
- [ ] T028 [US3] Verify useAddNode in apps/clementine-app/src/domains/experience/generate/hooks/useAddNode.ts uses useTrackedMutation for save status tracking
- [ ] T029 [US3] Verify useDeleteNode in apps/clementine-app/src/domains/experience/generate/hooks/useDeleteNode.ts uses useTrackedMutation for save status tracking

**Note**: Auto-save with 2000ms debounce is not needed in Phase 1b-2 because all operations (add, delete) are discrete actions that save immediately. Debounced auto-save will be added in future phases (1c-1e) when users edit node config fields.

**Checkpoint**: All user stories complete - full CRUD with auto-save and status indicators. All changes persist to Firestore with optimistic locking.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and improvements

- [ ] T030 [P] Run pnpm app:check (format + lint) from apps/clementine-app/
- [ ] T031 [P] Run pnpm app:type-check from apps/clementine-app/
- [ ] T032 Test on mobile device (320px-768px viewport) to verify 44px touch targets and responsive layout
- [ ] T033 Verify all barrel exports are correct and domain public API only exports components, hooks, types (not stores)
- [ ] T034 Test empty state → add node → delete node → empty state cycle
- [ ] T035 Test rapid clicking multiple node cards to verify only latest selection shows in editor panel
- [ ] T036 [P] Review code against standards/frontend/design-system.md for theme token usage
- [ ] T037 [P] Review code against standards/frontend/component-libraries.md for shadcn/ui patterns
- [ ] T038 [P] Review code against standards/global/project-structure.md for vertical slice compliance
- [ ] T039 Validate quickstart.md instructions match implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (but typically done after US1 for logical flow)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories (but requires US1 hooks for tracking)

### Within Each User Story

- Hooks before components (components use hooks)
- Components before container integration (container imports components)
- Barrel exports after component/hook implementation
- Container integration last (brings all pieces together)

### Parallel Opportunities

#### Phase 1 (Setup)
- T002, T003, T004, T005 can run in parallel (different files)

#### Phase 2 (Foundational)
- T009 and T010 can run in parallel after T007-T008 complete

#### User Story 1
- T011, T012 (hooks) can run in parallel
- T013, T014, T015, T016 (components) can run in parallel after hooks complete
- T017, T018 (exports) can run in parallel after components complete

#### User Story 2
- All tasks are sequential (each modifies existing files from US1)

#### User Story 3
- T028, T029 (verification tasks) can run in parallel

#### Phase 6 (Polish)
- T030, T031 can run in parallel
- T036, T037, T038 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all hooks for User Story 1 together:
Task: "Implement useAddNode hook in apps/clementine-app/src/domains/experience/generate/hooks/useAddNode.ts"
Task: "Implement useDeleteNode hook in apps/clementine-app/src/domains/experience/generate/hooks/useDeleteNode.ts"

# Launch all components for User Story 1 together:
Task: "Create AddNodeButton component in apps/clementine-app/src/domains/experience/generate/components/AddNodeButton.tsx"
Task: "Create AIImageNodeCard component in apps/clementine-app/src/domains/experience/generate/components/AIImageNodeCard.tsx"
Task: "Create DeleteNodeDialog component in apps/clementine-app/src/domains/experience/generate/components/DeleteNodeDialog.tsx"
Task: "Create EmptyState component in apps/clementine-app/src/domains/experience/generate/components/EmptyState.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T010) - CRITICAL
3. Complete Phase 3: User Story 1 (T011-T021)
4. **STOP and VALIDATE**: Test adding, viewing, deleting nodes independently
5. Deploy/demo if ready

This gives you a working transform pipeline editor with full CRUD operations.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (can now configure nodes via editor panel)
4. Add User Story 3 → Test independently → Deploy/Demo (auto-save with status indicators)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T010)
2. Once Foundational is done:
   - Developer A: User Story 1 (T011-T021) - Core CRUD
   - Developer B: User Story 2 (T022-T025) - Editor panel (can start in parallel)
   - Developer C: User Story 3 (T026-T029) - Save status (requires US1 complete)
3. Stories integrate independently

---

## Task Summary

**Total Tasks**: 39

**By Phase**:
- Phase 1 (Setup): 6 tasks
- Phase 2 (Foundational): 4 tasks
- Phase 3 (User Story 1): 11 tasks
- Phase 4 (User Story 2): 4 tasks
- Phase 5 (User Story 3): 4 tasks
- Phase 6 (Polish): 10 tasks

**By User Story**:
- User Story 1 (P1): 11 tasks - Core CRUD operations
- User Story 2 (P2): 4 tasks - Editor panel navigation
- User Story 3 (P3): 4 tasks - Auto-save and status

**Parallel Opportunities**:
- 18 tasks marked [P] can run in parallel (within their phase/story constraints)
- All 3 user stories can be worked on in parallel after Foundational phase

**MVP Scope** (Recommended First Delivery):
- Phase 1: Setup (6 tasks)
- Phase 2: Foundational (4 tasks)
- Phase 3: User Story 1 (11 tasks)
- **Total MVP**: 21 tasks

**Independent Test Criteria**:
- **User Story 1**: Add node → see in list → delete node → empty state
- **User Story 2**: Click node → panel opens with sections → close panel
- **User Story 3**: Make changes → see save status → verify Firestore persistence

---

## Notes

- [P] tasks = different files, no dependencies within same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No test tasks included per specification (testing deferred to Phase 1h)
- Future phases (1c-1e) will add: RefMedia management, Lexical prompt editor, model settings

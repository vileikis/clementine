# Tasks: Transform Pipeline Creator Config UI

**Input**: Design documents from `/specs/039-transform-config-ui/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md

**Tests**: Not explicitly requested in spec - tests omitted per constitution (minimal testing strategy).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Shared schemas**: `packages/shared/src/schemas/experience/`
- **App domain**: `apps/clementine-app/src/domains/experience/`
- **Transform subdomain**: `apps/clementine-app/src/domains/experience/transform/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema updates and module structure

- [ ] T001 Extend transform schema with detailed node types per data-model.md in `packages/shared/src/schemas/experience/transform.schema.ts`
- [ ] T002 Create transform subdomain folder structure in `apps/clementine-app/src/domains/experience/transform/`
- [ ] T003 [P] Create barrel export file in `apps/clementine-app/src/domains/experience/transform/index.ts`
- [ ] T004 [P] Create node registry with display names and icons in `apps/clementine-app/src/domains/experience/transform/registry/node-registry.ts`
- [ ] T005 Rebuild shared package and verify types with `pnpm --filter @clementine/shared build && pnpm app:type-check`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hooks and mutations that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create useUpdateTransform mutation hook in `apps/clementine-app/src/domains/experience/transform/hooks/useUpdateTransform.ts`
- [ ] T007 Create useTransformConfig state hook in `apps/clementine-app/src/domains/experience/transform/hooks/useTransformConfig.ts`
- [ ] T008 [P] Create useNodeSelection hook with URL sync in `apps/clementine-app/src/domains/experience/transform/hooks/useNodeSelection.ts`
- [ ] T009 Create hooks barrel export in `apps/clementine-app/src/domains/experience/transform/hooks/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Add Transform Tab (Priority: P1) 🎯 MVP

**Goal**: Display Transform tab alongside Steps tab in experience designer left panel

**Independent Test**: Open experience designer, verify Transform tab appears, click between tabs to switch content

### Implementation for User Story 1

- [ ] T010 [US1] Create DesignerLeftPanel component with Radix Tabs in `apps/clementine-app/src/domains/experience/designer/components/DesignerLeftPanel.tsx`
- [ ] T011 [US1] Create TransformPanel component (empty state) in `apps/clementine-app/src/domains/experience/transform/components/TransformPanel.tsx`
- [ ] T012 [US1] Modify ExperienceDesignerPage to use DesignerLeftPanel in `apps/clementine-app/src/domains/experience/designer/containers/ExperienceDesignerPage.tsx`
- [ ] T013 [US1] Add empty state UI with "Add your first node" guidance in TransformPanel
- [ ] T014 [US1] Update mobile sheet to show correct tab content in ExperienceDesignerPage

**Checkpoint**: User Story 1 complete - Transform tab visible and switchable

---

## Phase 4: User Story 2 - Manage Transform Nodes (Priority: P1)

**Goal**: Add, remove, and reorder transform nodes via drag-and-drop

**Independent Test**: Add nodes of each type, reorder via drag-and-drop, delete nodes, reload page to verify persistence

### Implementation for User Story 2

- [ ] T015 [P] [US2] Create TransformNodeItem component in `apps/clementine-app/src/domains/experience/transform/components/TransformNodeItem.tsx`
- [ ] T016 [P] [US2] Create AddNodeDialog component in `apps/clementine-app/src/domains/experience/transform/components/AddNodeDialog.tsx`
- [ ] T017 [US2] Create TransformNodeList with @dnd-kit in `apps/clementine-app/src/domains/experience/transform/components/TransformNodeList.tsx`
- [ ] T018 [US2] Integrate TransformNodeList into TransformPanel in `apps/clementine-app/src/domains/experience/transform/components/TransformPanel.tsx`
- [ ] T019 [US2] Implement node add handler with immediate save in TransformPanel
- [ ] T020 [US2] Implement node delete handler with immediate save in TransformPanel
- [ ] T021 [US2] Implement node reorder handler with immediate save in TransformPanel
- [ ] T022 [US2] Add keyboard navigation (arrow keys, delete) to TransformNodeList

**Checkpoint**: User Story 2 complete - full node CRUD with persistence

---

## Phase 5: User Story 3 - Configure Variable Mappings (Priority: P1)

**Goal**: Define variable mappings that connect step data to transform pipeline

**Independent Test**: Add variable mapping, select step and data type, save, reload to verify persistence

### Implementation for User Story 3

- [ ] T023 [P] [US3] Create VariableMappingItem component in `apps/clementine-app/src/domains/experience/transform/components/VariableMappingItem.tsx`
- [ ] T024 [P] [US3] Create AddVariableDialog component in `apps/clementine-app/src/domains/experience/transform/components/AddVariableDialog.tsx`
- [ ] T025 [US3] Create VariableMappingList component in `apps/clementine-app/src/domains/experience/transform/components/VariableMappingList.tsx`
- [ ] T026 [US3] Integrate VariableMappingList into TransformPanel as collapsible section
- [ ] T027 [US3] Implement step selector filtered to existing steps only in AddVariableDialog
- [ ] T028 [US3] Implement variable add/edit handler with immediate save in TransformPanel
- [ ] T029 [US3] Implement variable delete handler with immediate save in TransformPanel
- [ ] T030 [US3] Add visual warning indicator for invalid step references in VariableMappingItem

**Checkpoint**: User Story 3 complete - variable mappings fully functional

---

## Phase 6: User Story 4 - Configure Basic Node Settings (Priority: P2)

**Goal**: Display node-specific configuration in right panel when node selected

**Independent Test**: Select node, view config panel, change settings, verify changes persist

### Implementation for User Story 4

- [ ] T031 [P] [US4] Create NodeConfigRouter component in `apps/clementine-app/src/domains/experience/transform/config-panels/NodeConfigRouter.tsx`
- [ ] T032 [P] [US4] Create RemoveBackgroundConfig panel in `apps/clementine-app/src/domains/experience/transform/config-panels/RemoveBackgroundConfig.tsx`
- [ ] T033 [P] [US4] Create CompositeConfig panel (placeholder) in `apps/clementine-app/src/domains/experience/transform/config-panels/CompositeConfig.tsx`
- [ ] T034 [P] [US4] Create BackgroundSwapConfig panel in `apps/clementine-app/src/domains/experience/transform/config-panels/BackgroundSwapConfig.tsx`
- [ ] T035 [P] [US4] Create AiImageConfig panel (basic text input) in `apps/clementine-app/src/domains/experience/transform/config-panels/AiImageConfig.tsx`
- [ ] T036 [US4] Create InputSourceSelector shared component for node input selection in `apps/clementine-app/src/domains/experience/transform/components/InputSourceSelector.tsx`
- [ ] T037 [US4] Integrate NodeConfigRouter into StepConfigPanelContainer in `apps/clementine-app/src/domains/experience/designer/containers/StepConfigPanelContainer.tsx`
- [ ] T038 [US4] Implement debounced auto-save for node config changes using useAutoSave pattern
- [ ] T039 [US4] Create config-panels barrel export in `apps/clementine-app/src/domains/experience/transform/config-panels/index.ts`

**Checkpoint**: User Story 4 complete - node configuration panels functional

---

## Phase 7: User Story 5 - Visual Node List with Display Names (Priority: P2)

**Goal**: Show user-friendly display names and icons for each node type

**Independent Test**: Add each node type, verify correct display name and icon appears

### Implementation for User Story 5

- [ ] T040 [US5] Update TransformNodeItem to use node registry for display names in `apps/clementine-app/src/domains/experience/transform/components/TransformNodeItem.tsx`
- [ ] T041 [US5] Update AddNodeDialog to show display names and icons in `apps/clementine-app/src/domains/experience/transform/components/AddNodeDialog.tsx`
- [ ] T042 [US5] Update NodeConfigRouter header to show display name and icon
- [ ] T043 [US5] Verify all four node types display correctly: Cut Out (scissors), Combine (layers), Background Swap (image), AI Image (sparkles)

**Checkpoint**: User Story 5 complete - all nodes have proper visual representation

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, mobile responsiveness, validation

- [ ] T044 Update transform subdomain barrel export with all components in `apps/clementine-app/src/domains/experience/transform/index.ts`
- [ ] T045 Verify mobile responsive behavior (sheets work correctly for transform panel)
- [ ] T046 Verify tablet responsive behavior (config panel in sheet)
- [ ] T047 Run validation: `pnpm app:check` (format, lint, type-check)
- [ ] T048 Manual QA: Test complete workflow per quickstart.md checklist
- [ ] T049 Review against `standards/frontend/design-system.md` - no hard-coded colors
- [ ] T050 Review against `standards/frontend/component-libraries.md` - shadcn/ui usage

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T005) - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel
  - US3 can proceed in parallel with US1/US2
  - US4 depends on US2 (needs nodes to exist to configure)
  - US5 depends on US2 (needs node list to display)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Dependencies | Can Start After |
|-------|----------|--------------|-----------------|
| US1 - Transform Tab | P1 | Foundation only | Phase 2 |
| US2 - Node Management | P1 | Foundation only | Phase 2 |
| US3 - Variable Mappings | P1 | Foundation only | Phase 2 |
| US4 - Node Config | P2 | US2 (nodes must exist) | Phase 4 |
| US5 - Display Names | P2 | US2 (node list must exist) | Phase 4 |

### Within Each User Story

- Components before integration
- Core implementation before handlers
- Handlers before persistence
- Story complete before moving to dependent stories

### Parallel Opportunities

**Phase 1 (Setup)**:
- T003 and T004 can run in parallel

**Phase 2 (Foundational)**:
- T008 can run in parallel with T006/T007

**Phase 4 (US2)**:
- T015 and T016 can run in parallel

**Phase 5 (US3)**:
- T023 and T024 can run in parallel

**Phase 6 (US4)**:
- T031, T032, T033, T034, T035 can ALL run in parallel (different files)

---

## Parallel Example: User Story 4

```bash
# Launch all config panel components together (Phase 6):
Task: "Create NodeConfigRouter component"
Task: "Create RemoveBackgroundConfig panel"
Task: "Create CompositeConfig panel (placeholder)"
Task: "Create BackgroundSwapConfig panel"
Task: "Create AiImageConfig panel"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup (schema + structure)
2. Complete Phase 2: Foundational (hooks + mutations)
3. Complete Phase 3: User Story 1 (Transform Tab)
4. Complete Phase 4: User Story 2 (Node Management)
5. Complete Phase 5: User Story 3 (Variable Mappings)
6. **STOP and VALIDATE**: Test full workflow - can add nodes and variables
7. Deploy/demo if ready

### Full Implementation

1. Complete MVP (US1-3)
2. Add Phase 6: User Story 4 (Node Config)
3. Add Phase 7: User Story 5 (Display Names)
4. Complete Phase 8: Polish
5. Final QA per quickstart.md

### Incremental Delivery

Each phase delivers testable value:
- After US1: Transform tab visible
- After US2: Can build node pipeline
- After US3: Can map variables to steps
- After US4: Can configure node settings
- After US5: Polish with proper display names

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Tests not included (not requested in spec, per constitution minimal testing strategy)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Mobile responsive patterns already exist - follow existing sheet-based approach

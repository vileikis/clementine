# Tasks: Event-Experience Integration

**Input**: Design documents from `/specs/025-event-exp-integration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `apps/clementine-app/src/` for frontend application
- Feature files in `apps/clementine-app/src/domains/event/experiences/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and feature module structure

- [X] T001 Create experiences module directory structure at apps/clementine-app/src/domains/event/experiences/
- [X] T002 [P] Create barrel exports file at apps/clementine-app/src/domains/event/experiences/index.ts
- [X] T003 [P] Create constants file with SLOT_PROFILES mapping at apps/clementine-app/src/domains/event/experiences/constants.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema definitions and data layer that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create ExperienceReference and MainExperienceReference schemas at apps/clementine-app/src/domains/event/experiences/schemas/event-experiences.schema.ts
- [X] T005 Create ExperiencesConfig schema at apps/clementine-app/src/domains/event/experiences/schemas/event-experiences.schema.ts
- [X] T006 Export schema types (ExperienceReference, MainExperienceReference, ExperiencesConfig, SlotType, SlotMode) from schema file
- [X] T007 Update projectEventConfigSchema to add experiences field at apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts
- [X] T008 Create useExperiencesForSlot hook with Firestore real-time queries at apps/clementine-app/src/domains/event/experiences/hooks/useExperiencesForSlot.ts
- [X] T009 Create useUpdateEventExperiences hook with Firestore transactions at apps/clementine-app/src/domains/event/experiences/hooks/useUpdateEventExperiences.ts
- [X] T010 Update barrel exports to include hooks and schemas at apps/clementine-app/src/domains/event/experiences/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Connect Main Experiences to Event (Priority: P1) 🎯 MVP

**Goal**: Enable event admins to connect workspace experiences to the event's welcome screen so guests can choose which experience to participate in.

**Independent Test**: Create an event, open the Welcome tab, add experiences via the connect drawer, reorder via drag-and-drop, toggle enabled/overlay states, and verify they appear in the welcome preview.

### Implementation for User Story 1

- [X] T011 [P] [US1] Create ExperienceCard component for welcome preview at apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx
- [X] T012 [P] [US1] Create ConnectExperienceItem component for drawer list items at apps/clementine-app/src/domains/event/experiences/components/ConnectExperienceItem.tsx
- [X] T013 [P] [US1] Create ExperienceSlotEmpty component for empty state at apps/clementine-app/src/domains/event/experiences/components/ExperienceSlotEmpty.tsx
- [X] T014 [US1] Create ConnectExperienceDrawer component with search and selection at apps/clementine-app/src/domains/event/experiences/components/ConnectExperienceDrawer.tsx
- [X] T015 [US1] Create ExperienceSlotItem component with drag handle, toggles, and context menu at apps/clementine-app/src/domains/event/experiences/components/ExperienceSlotItem.tsx
- [X] T016 [US1] Create ExperienceSlotManager component with @dnd-kit drag-and-drop at apps/clementine-app/src/domains/event/experiences/components/ExperienceSlotManager.tsx
- [X] T017 [US1] Update barrel exports with all new components at apps/clementine-app/src/domains/event/experiences/index.ts
- [X] T018 [US1] Add Experiences section to WelcomeConfigPanel using ExperienceSlotManager (mode='list', slot='main') at apps/clementine-app/src/domains/event/welcome/components/WelcomeConfigPanel.tsx
- [X] T019 [US1] Update WelcomePreview to display connected experiences using ExperienceCard at apps/clementine-app/src/domains/event/welcome/components/WelcomePreview.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Admins can add, reorder, toggle, and remove main experiences.

---

## Phase 4: User Story 2 - Configure Pregate Experience (Priority: P2)

**Goal**: Enable event admins to configure a pregate experience that runs before guests see the welcome screen.

**Independent Test**: Open Settings tab, connect a pregate experience (survey or story profile), verify it appears in the Guest Flow section with enable toggle and remove action.

### Implementation for User Story 2

- [X] T020 [US2] Add Guest Flow section with pregate slot to EventSettingsPage using ExperienceSlotManager (mode='single', slot='pregate') at apps/clementine-app/src/domains/event/settings/containers/EventSettingsPage.tsx
- [X] T021 [US2] Add info callout in WelcomeConfigPanel when pregate is configured, linking to Settings tab at apps/clementine-app/src/domains/event/welcome/components/WelcomeConfigPanel.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Pregate slot accepts only survey/story profiles.

---

## Phase 5: User Story 3 - Configure Preshare Experience (Priority: P2)

**Goal**: Enable event admins to configure a preshare experience that runs after the main experience but before the share screen.

**Independent Test**: Open Settings tab, connect a preshare experience to the appropriate slot, verify configuration with enable toggle and remove action.

### Implementation for User Story 3

- [X] T022 [US3] Add preshare slot to Guest Flow section in EventSettingsPage using ExperienceSlotManager (mode='single', slot='preshare') at apps/clementine-app/src/domains/event/settings/containers/EventSettingsPage.tsx
- [X] T023 [US3] Update info callout in WelcomeConfigPanel to include preshare status at apps/clementine-app/src/domains/event/welcome/components/WelcomeConfigPanel.tsx

**Checkpoint**: All three experience slots (main, pregate, preshare) are now configurable.

---

## Phase 6: User Story 4 - Welcome Screen WYSIWYG Preview (Priority: P3)

**Goal**: Show a live preview of how experiences will appear on the welcome screen so admins can visualize the guest experience while configuring.

**Independent Test**: Connect experiences, verify the center preview column updates to show actual experience cards with thumbnails, names, and profile badges. Disabled experiences appear dimmed.

### Implementation for User Story 4

- [X] T024 [US4] Enhance ExperienceCard to support disabled state (dimmed appearance) at apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx
- [X] T025 [US4] Enhance WelcomePreview to show real-time updates when experiences are added, removed, reordered, or toggled at apps/clementine-app/src/domains/event/welcome/components/WelcomePreview.tsx

**Checkpoint**: Preview now shows actual experience cards that update in real-time with configuration changes.

---

## Phase 7: User Story 5 - Create New Experience from Connect Drawer (Priority: P3)

**Goal**: Allow admins to quickly create a new experience when connecting, without leaving the event designer.

**Independent Test**: Open the connect drawer and click "Create New Experience" to verify a new browser tab opens to the experience creation page.

### Implementation for User Story 5

- [X] T026 [US5] Add "Create New Experience" button to ConnectExperienceDrawer that opens /workspace/{workspaceSlug}/experiences/new in new tab at apps/clementine-app/src/domains/event/experiences/components/ConnectExperienceDrawer.tsx

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Handle edge cases and improvements that affect multiple user stories

- [X] T027 [P] Handle missing experience gracefully (deleted from workspace while assigned) - show "Missing Experience" placeholder in ExperienceSlotItem at apps/clementine-app/src/domains/event/experiences/components/ExperienceSlotItem.tsx
- [X] T028 [P] Add empty state message to ConnectExperienceDrawer when no compatible experiences exist at apps/clementine-app/src/domains/event/experiences/components/ConnectExperienceDrawer.tsx
- [X] T029 [P] Add "No experiences found" empty state for search results in ConnectExperienceDrawer at apps/clementine-app/src/domains/event/experiences/components/ConnectExperienceDrawer.tsx
- [X] T030 Run pnpm app:check to validate linting, formatting, and type checking
- [X] T031 Run pnpm app:test to verify no regressions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Reuses ExperienceSlotManager from US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Reuses ExperienceSlotManager from US1
- **User Story 4 (P3)**: Can start after US1 (builds on ExperienceCard and WelcomePreview)
- **User Story 5 (P3)**: Can start after US1 (builds on ConnectExperienceDrawer)

### Within Each User Story

- Components before containers
- Leaf components before composite components
- Hooks before components that use them
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003 can run in parallel (different files)
- T011, T012, T013 can run in parallel (leaf components, different files)
- T027, T028, T029 can run in parallel (edge case handling in different files)
- Different user stories can be worked on in parallel by different team members after Foundational

---

## Parallel Example: User Story 1 Leaf Components

```bash
# Launch all leaf components for User Story 1 together:
Task: "Create ExperienceCard component at apps/clementine-app/src/domains/event/experiences/components/ExperienceCard.tsx"
Task: "Create ConnectExperienceItem component at apps/clementine-app/src/domains/event/experiences/components/ConnectExperienceItem.tsx"
Task: "Create ExperienceSlotEmpty component at apps/clementine-app/src/domains/event/experiences/components/ExperienceSlotEmpty.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test main experience connection independently
5. Deploy/demo if ready - admins can now connect main experiences

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test pregate independently → Deploy/Demo
4. Add User Story 3 → Test preshare independently → Deploy/Demo
5. Add User Story 4 → Enhanced preview → Deploy/Demo
6. Add User Story 5 → Create experience shortcut → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (must complete first - provides reusable components)
   - After US1: Developer B on US2/US3, Developer A on US4/US5
3. Stories complete and integrate independently

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 31 |
| Phase 1 (Setup) | 3 tasks |
| Phase 2 (Foundational) | 7 tasks |
| Phase 3 (US1 - Main Experiences) | 9 tasks |
| Phase 4 (US2 - Pregate) | 2 tasks |
| Phase 5 (US3 - Preshare) | 2 tasks |
| Phase 6 (US4 - Preview) | 2 tasks |
| Phase 7 (US5 - Create New) | 1 task |
| Phase 8 (Polish) | 5 tasks |
| Parallel Opportunities | 10 tasks marked [P] |

**Suggested MVP Scope**: Complete Phases 1-3 (User Story 1 only) for a functional MVP where admins can connect main experiences to events.

**Format Validation**: All tasks follow the checklist format with checkbox, ID, optional [P] marker, story label where applicable, and file paths.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Uses existing patterns: Sheet (drawer), @dnd-kit (drag-and-drop), TanStack Query (data fetching)

# Tasks: Experience Data Layer & Library

**Input**: Design documents from `/specs/021-experience-data-library/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/experience-api.md

**Tests**: Not explicitly requested - test tasks omitted per spec.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Includes exact file paths in descriptions

## Path Conventions

- **Web monorepo**: `apps/clementine-app/src/` for application code
- **Firebase**: `firebase/` for security rules and indexes
- **Domains**: `domains/experience/` for experience feature code

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Update schemas and security rules that all user stories depend on

- [x] T001 Update experience schema with new profiles (freeform, survey, story) and media field in `apps/clementine-app/src/domains/experience/shared/schemas/experience.schema.ts`
- [x] T002 [P] Update profile validators with new profile definitions in `apps/clementine-app/src/domains/experience/shared/types/profile.types.ts`
- [x] T003 [P] Create input schemas (create, update, delete) in `apps/clementine-app/src/domains/experience/shared/schemas/experience.input.schemas.ts`
- [x] T004 [P] Add experience security rules to `firebase/firestore.rules`
- [x] T005 [P] Add composite indexes for experiences collection to `firebase/firestore.indexes.json`
- [x] T006 Update barrel exports in `apps/clementine-app/src/domains/experience/shared/schemas/index.ts`

---

## Phase 2: Foundational (Data Hooks)

**Purpose**: Core data hooks that MUST be complete before ANY user story UI can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create query options factories in `apps/clementine-app/src/domains/experience/shared/queries/experience.query.ts`
- [x] T008 Create barrel export in `apps/clementine-app/src/domains/experience/shared/queries/index.ts`
- [x] T009 Implement useWorkspaceExperiences hook with real-time listener in `apps/clementine-app/src/domains/experience/shared/hooks/useWorkspaceExperiences.ts`
- [x] T010 [P] Implement useWorkspaceExperience hook for single doc in `apps/clementine-app/src/domains/experience/shared/hooks/useWorkspaceExperience.ts`
- [x] T011 [P] Implement useCreateExperience mutation hook in `apps/clementine-app/src/domains/experience/shared/hooks/useCreateExperience.ts`
- [x] T012 [P] Implement useUpdateExperience mutation hook in `apps/clementine-app/src/domains/experience/shared/hooks/useUpdateExperience.ts`
- [x] T013 [P] Implement useDeleteExperience mutation hook in `apps/clementine-app/src/domains/experience/shared/hooks/useDeleteExperience.ts`
- [x] T014 Create barrel export for hooks in `apps/clementine-app/src/domains/experience/shared/hooks/index.ts`
- [x] T015 Update domain barrel export in `apps/clementine-app/src/domains/experience/shared/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin Views Experience Library (Priority: P1) 🎯 MVP

**Goal**: Admins can view all experiences in their workspace with profile filtering, loading states, and empty states.

**Independent Test**: Navigate to `/workspace/:slug/experiences` and verify list displays with proper filtering, loading skeleton, and empty state.

### Implementation for User Story 1

- [x] T016 [P] [US1] Create ProfileBadge component in `apps/clementine-app/src/domains/experience/library/components/ProfileBadge.tsx`
- [x] T017 [P] [US1] Create ExperienceListEmpty component with two variants in `apps/clementine-app/src/domains/experience/library/components/ExperienceListEmpty.tsx`
- [x] T018 [P] [US1] Create ExperienceListItem component with thumbnail, name, badge, status in `apps/clementine-app/src/domains/experience/library/components/ExperienceListItem.tsx`
- [x] T019 [US1] Create ExperiencesPage container with profile filter tabs in `apps/clementine-app/src/domains/experience/library/containers/ExperiencesPage.tsx`
- [x] T020 [US1] Create barrel exports for library components in `apps/clementine-app/src/domains/experience/library/components/index.ts`
- [x] T021 [US1] Create barrel exports for library containers in `apps/clementine-app/src/domains/experience/library/containers/index.ts`
- [x] T022 [US1] Create library subdomain barrel export in `apps/clementine-app/src/domains/experience/library/index.ts`
- [x] T023 [US1] Update experience domain barrel export in `apps/clementine-app/src/domains/experience/index.ts`
- [x] T024 [US1] Create experiences list route in `apps/clementine-app/src/app/workspace/$workspaceSlug.experiences/index.tsx`

**Checkpoint**: User Story 1 complete - admins can view and filter experience library

---

## Phase 4: User Story 2 - Admin Creates New Experience (Priority: P1)

**Goal**: Admins can create a new experience with name and profile selection, then navigate to editor.

**Independent Test**: Navigate to create page, fill form with name + profile, submit, verify experience appears in list and redirects to editor.

### Implementation for User Story 2

- [x] T025 [P] [US2] Create ProfileSelector component with radio/select and descriptions in `apps/clementine-app/src/domains/experience/library/components/ProfileSelector.tsx`
- [x] T026 [P] [US2] Create CreateExperienceForm component with validation in `apps/clementine-app/src/domains/experience/library/components/CreateExperienceForm.tsx`
- [x] T027 [US2] Create CreateExperiencePage container in `apps/clementine-app/src/domains/experience/library/containers/CreateExperiencePage.tsx`
- [x] T028 [US2] Update library components barrel export in `apps/clementine-app/src/domains/experience/library/components/index.ts`
- [x] T029 [US2] Update library containers barrel export in `apps/clementine-app/src/domains/experience/library/containers/index.ts`
- [x] T030 [US2] Create experience create route in `apps/clementine-app/src/app/workspace/$workspaceSlug.experiences/create.tsx`
- [x] T031 [US2] Add "Create Experience" button to ExperiencesPage linking to create route in `apps/clementine-app/src/domains/experience/library/containers/ExperiencesPage.tsx`

**Checkpoint**: User Stories 1 AND 2 complete - admins can view library and create new experiences

---

## Phase 5: User Story 3 - Admin Renames Experience (Priority: P2)

**Goal**: Admins can rename an existing experience via context menu dialog.

**Independent Test**: Open context menu on experience, select rename, change name, confirm, verify name updates.

### Implementation for User Story 3

- [x] T032 [US3] Create RenameExperienceDialog component in `apps/clementine-app/src/domains/experience/library/components/RenameExperienceDialog.tsx`
- [x] T033 [US3] Update library components barrel export in `apps/clementine-app/src/domains/experience/library/components/index.ts`
- [x] T034 [US3] Add context menu with rename action to ExperienceListItem in `apps/clementine-app/src/domains/experience/library/components/ExperienceListItem.tsx`
- [x] T035 [US3] Wire rename dialog to ExperiencesPage state in `apps/clementine-app/src/domains/experience/library/containers/ExperiencesPage.tsx`

**Checkpoint**: User Stories 1, 2, AND 3 complete - admins can view, create, and rename experiences

---

## Phase 6: User Story 4 - Admin Deletes Experience (Priority: P2)

**Goal**: Admins can soft-delete an experience via context menu confirmation dialog.

**Independent Test**: Open context menu on experience, select delete, confirm, verify experience removed from list.

### Implementation for User Story 4

- [x] T036 [US4] Create DeleteExperienceDialog component in `apps/clementine-app/src/domains/experience/library/components/DeleteExperienceDialog.tsx`
- [x] T037 [US4] Update library components barrel export in `apps/clementine-app/src/domains/experience/library/components/index.ts`
- [x] T038 [US4] Add delete action to ExperienceListItem context menu in `apps/clementine-app/src/domains/experience/library/components/ExperienceListItem.tsx`
- [x] T039 [US4] Wire delete dialog to ExperiencesPage state in `apps/clementine-app/src/domains/experience/library/containers/ExperiencesPage.tsx`

**Checkpoint**: User Stories 1-4 complete - full CRUD functionality for experiences

---

## Phase 7: User Story 5 - Admin Views Experience Editor Shell (Priority: P3)

**Goal**: Admins can navigate to editor page with breadcrumb and placeholder content.

**Independent Test**: Click experience in list, verify editor page loads with breadcrumb and placeholder message.

### Implementation for User Story 5

- [x] T040 [US5] Create ExperienceEditorPage container with breadcrumb and placeholder in `apps/clementine-app/src/domains/experience/library/containers/ExperienceEditorPage.tsx`
- [x] T041 [US5] Update library containers barrel export in `apps/clementine-app/src/domains/experience/library/containers/index.ts`
- [x] T042 [US5] Create experience editor route in `apps/clementine-app/src/app/workspace/$workspaceSlug.experiences/$experienceId.tsx`
- [x] T043 [US5] Wire ExperienceListItem click to navigate to editor in `apps/clementine-app/src/domains/experience/library/components/ExperienceListItem.tsx`

**Checkpoint**: All 5 user stories complete - full library experience with navigation to editor shell

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T044 Run `pnpm app:check` to verify linting and formatting
- [x] T045 Run `pnpm app:type-check` to verify TypeScript compilation
- [x] T046 Deploy Firestore rules with `pnpm fb:deploy:rules`
- [x] T047 Deploy Firestore indexes with `pnpm fb:deploy:indexes`
- [x] T048 Manual validation: Test all acceptance scenarios from spec.md
- [x] T049 Review code against standards/frontend/design-system.md for compliance

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (both P1)
  - US3 and US4 can proceed in parallel after US1 (both P2)
  - US5 depends on US1 for list navigation context
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 3 (P2)**: Depends on US1 for ExperienceListItem context menu integration
- **User Story 4 (P2)**: Depends on US1 for ExperienceListItem context menu integration
- **User Story 5 (P3)**: Depends on US1 for navigation from list items

### Within Each User Story

- Components before containers
- Containers before routes
- Routes depend on containers and components
- Barrel exports updated after new files created

### Parallel Opportunities

**Phase 1 (Setup)**:

- T002, T003, T004, T005 can run in parallel after T001

**Phase 2 (Foundational)**:

- T010, T011, T012, T013 can run in parallel after T009

**Phase 3-7 (User Stories)**:

- US1 and US2 can start in parallel
- Within US1: T016, T017, T018 can run in parallel
- Within US2: T025, T026 can run in parallel
- US3 and US4 can start in parallel after US1 completes

---

## Parallel Example: User Story 1

```bash
# Launch all presentational components for US1 together:
Task: T016 "Create ProfileBadge component"
Task: T017 "Create ExperienceListEmpty component"
Task: T018 "Create ExperienceListItem component"

# Then launch container (depends on components):
Task: T019 "Create ExperiencesPage container"

# Then barrel exports and routes:
Task: T020-T024 (sequential for correct exports)
```

---

## Parallel Example: Phase 2 Hooks

```bash
# Launch query factory first:
Task: T007 "Create query options factories"

# Then launch list hook:
Task: T009 "Implement useWorkspaceExperiences hook"

# Then launch remaining hooks in parallel:
Task: T010 "Implement useWorkspaceExperience hook"
Task: T011 "Implement useCreateExperience hook"
Task: T012 "Implement useUpdateExperience hook"
Task: T013 "Implement useDeleteExperience hook"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (schemas, security rules, indexes)
2. Complete Phase 2: Foundational (all data hooks)
3. Complete Phase 3: User Story 1 (view library)
4. Complete Phase 4: User Story 2 (create experience)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready - admins can view and create experiences

### Full Delivery

1. MVP delivery (above)
2. Add User Story 3 (rename) → Test independently
3. Add User Story 4 (delete) → Test independently
4. Add User Story 5 (editor shell) → Test independently
5. Complete Polish phase → Final validation
6. Full feature ready for E2 (step editing)

### Parallel Team Strategy

With multiple developers:

1. All complete Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (view library)
   - Developer B: User Story 2 (create experience)
3. After US1 completes:
   - Developer A: User Story 3 (rename)
   - Developer C: User Story 4 (delete)
4. After US1 completes:
   - Developer B: User Story 5 (editor shell)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Profile badge colors: freeform=blue, survey=green, story=purple
- All mutations use `runTransaction` with `serverTimestamp()`
- Real-time updates via `onSnapshot` with TanStack Query cache

# Tasks: Projects List & Basic Project Management

**Input**: Design documents from `/specs/008-projects-list/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Minimal testing per constitution (Principle IV) - critical hooks and key components only

**Organization**: Tasks grouped by user story to enable independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- App code: `apps/clementine-app/src/`
- Firebase config: `firebase/` (monorepo root)
- Reference pattern: `apps/clementine-app/src/domains/admin/workspace/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and domain module structure

- [ ] T001 Create domain module structure in apps/clementine-app/src/domains/workspace/projects/ with subdirectories (types, schemas, hooks, components, containers)
- [ ] T002 [P] Create barrel export files (index.ts) in each subdirectory and root projects/ folder
- [ ] T003 [P] Add Firestore composite index to firebase/firestore.indexes.json (workspaceId + status + createdAt)
- [ ] T004 [P] Add Firestore security rules for projects collection to firebase/firestore.rules
- [ ] T005 Deploy Firestore indexes and security rules via pnpm fb:deploy:indexes and pnpm fb:deploy:rules from monorepo root

**Checkpoint**: Domain structure ready, Firebase infrastructure deployed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, schemas, and data structures that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 [P] Define TypeScript types (Project, ProjectStatus, CreateProjectInput, DeleteProjectInput) in apps/clementine-app/src/domains/workspace/projects/types/project.types.ts
- [ ] T007 [P] Define Zod validation schemas (projectSchema, projectStatusSchema, createProjectInputSchema, deleteProjectInputSchema) in apps/clementine-app/src/domains/workspace/projects/schemas/project.schemas.ts
- [ ] T008 [P] Export types from apps/clementine-app/src/domains/workspace/projects/types/index.ts
- [ ] T009 [P] Export schemas from apps/clementine-app/src/domains/workspace/projects/schemas/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Projects List (Priority: P1) 🎯 MVP

**Goal**: Enable workspace admins to see all active projects in their workspace, ordered by creation date (newest first), with empty state support

**Independent Test**: Authenticate as workspace admin, navigate to /workspace/[workspaceSlug]/projects, verify all non-deleted projects displayed in correct order, verify empty state when no projects exist

### Implementation for User Story 1

- [ ] T010 [P] [US1] Implement useProjects hook with real-time Firestore listener (onSnapshot) in apps/clementine-app/src/domains/workspace/projects/hooks/useProjects.ts
- [ ] T011 [P] [US1] Create ProjectListEmpty component with "Create Project" CTA in apps/clementine-app/src/domains/workspace/projects/components/ProjectListEmpty.tsx
- [ ] T012 [P] [US1] Create ProjectListItem component displaying project name and status badge in apps/clementine-app/src/domains/workspace/projects/components/ProjectListItem.tsx
- [ ] T013 [US1] Create ProjectsPage container integrating useProjects hook, empty state, and list rendering in apps/clementine-app/src/domains/workspace/projects/containers/ProjectsPage.tsx
- [ ] T014 [US1] Update projects list route in apps/clementine-app/src/app/workspace/$workspaceSlug.projects.tsx to render ProjectsPage container
- [ ] T015 [P] [US1] Export components from apps/clementine-app/src/domains/workspace/projects/components/index.ts
- [ ] T016 [P] [US1] Export containers from apps/clementine-app/src/domains/workspace/projects/containers/index.ts
- [ ] T017 [P] [US1] Export hooks from apps/clementine-app/src/domains/workspace/projects/hooks/index.ts
- [ ] T018 [P] [US1] Export public API (components, containers, hooks, types) from apps/clementine-app/src/domains/workspace/projects/index.ts (exclude schemas)

### Tests for User Story 1 (Critical Hooks Only)

- [ ] T019 [US1] Write unit test for useProjects hook verifying real-time updates and filtering in apps/clementine-app/src/domains/workspace/projects/hooks/useProjects.test.ts

**Checkpoint**: User Story 1 complete - projects list displays correctly with real-time updates and empty state

---

## Phase 4: User Story 2 - Create New Project (Priority: P2)

**Goal**: Enable workspace admins to create new projects with default values (name: "Untitled project", status: "draft") and redirect to project details page

**Independent Test**: Click "Create Project" action, verify new project created with correct defaults, verify navigation to project details page, verify new project appears at top of list

### Implementation for User Story 2

- [ ] T020 [P] [US2] Implement useCreateProject hook with mutation, navigation, and error handling (Sentry) in apps/clementine-app/src/domains/workspace/projects/hooks/useCreateProject.ts
- [ ] T021 [US2] Integrate create project action into ProjectsPage container (button when list has projects, CTA in empty state)
- [ ] T022 [US2] Update hooks barrel export to include useCreateProject in apps/clementine-app/src/domains/workspace/projects/hooks/index.ts

### Tests for User Story 2 (Critical Hooks Only)

- [ ] T023 [US2] Write unit test for useCreateProject hook verifying creation with defaults and navigation in apps/clementine-app/src/domains/workspace/projects/hooks/useCreateProject.test.ts

**Checkpoint**: User Story 2 complete - admins can create projects and are redirected to details page

---

## Phase 5: User Story 4 - Access Project Details (Priority: P2)

**Goal**: Enable navigation to project details page with placeholder message for valid projects, 404 for deleted/non-existent projects

**Independent Test**: Navigate to /workspace/[workspaceSlug]/projects/[projectId] for valid project (verify placeholder), for deleted project (verify 404), for non-existent project (verify 404)

**Note**: Implementing US4 before US3 because project details route is needed for create project navigation (US2)

### Implementation for User Story 4

- [ ] T024 [P] [US4] Create ProjectDetailsPage container with placeholder message in apps/clementine-app/src/domains/workspace/projects/containers/ProjectDetailsPage.tsx
- [ ] T025 [US4] Create project details route with loader (getDoc, 404 for deleted/invalid) in apps/clementine-app/src/app/workspace/$workspaceSlug.projects.$projectId.tsx
- [ ] T026 [US4] Add workspace validation in route loader (verify project.workspaceId matches route param)
- [ ] T027 [US4] Update containers barrel export to include ProjectDetailsPage in apps/clementine-app/src/domains/workspace/projects/containers/index.ts

**Checkpoint**: User Story 4 complete - project details route accessible with proper 404 handling

---

## Phase 6: User Story 3 - Delete Project (Priority: P3)

**Goal**: Enable workspace admins to soft-delete projects with confirmation, immediate removal from list, and 404 on direct access

**Independent Test**: Click delete action, verify confirmation dialog appears, confirm deletion, verify project disappears from list immediately, attempt to access via direct URL (verify 404), cancel deletion (verify project remains)

### Implementation for User Story 3

- [ ] T028 [P] [US3] Implement useDeleteProject hook with soft delete mutation (status='deleted', deletedAt, updatedAt) and Sentry error tracking in apps/clementine-app/src/domains/workspace/projects/hooks/useDeleteProject.ts
- [ ] T029 [P] [US3] Create DeleteProjectDialog component with confirmation UI in apps/clementine-app/src/domains/workspace/projects/components/DeleteProjectDialog.tsx
- [ ] T030 [US3] Integrate DeleteProjectDialog into ProjectListItem component (delete button triggers dialog)
- [ ] T031 [US3] Update components barrel export to include DeleteProjectDialog in apps/clementine-app/src/domains/workspace/projects/components/index.ts
- [ ] T032 [US3] Update hooks barrel export to include useDeleteProject in apps/clementine-app/src/domains/workspace/projects/hooks/index.ts

### Tests for User Story 3 (Critical Hooks Only)

- [ ] T033 [US3] Write unit test for useDeleteProject hook verifying soft delete mutation in apps/clementine-app/src/domains/workspace/projects/hooks/useDeleteProject.test.ts

**Checkpoint**: User Story 3 complete - admins can soft-delete projects with confirmation, deleted projects return 404

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, testing, and quality assurance across all user stories

- [ ] T034 [P] Write component test for ProjectListItem verifying delete dialog trigger in apps/clementine-app/src/domains/workspace/projects/components/ProjectListItem.test.tsx
- [ ] T035 [P] Write component test for ProjectsPage verifying empty state and list rendering in apps/clementine-app/src/domains/workspace/projects/containers/ProjectsPage.test.tsx
- [ ] T036 Run validation loop (pnpm check, pnpm type-check) from apps/clementine-app directory
- [ ] T037 Manual testing per quickstart.md checklist (empty state, create, list, delete, navigation, 404 handling)
- [ ] T038 [P] Add loading skeleton states to ProjectsPage container for better UX
- [ ] T039 [P] Verify mobile responsiveness and touch targets (44x44px minimum) for all interactive elements
- [ ] T040 Performance testing (list load <2s with 100 projects, create <3s, delete <1s)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (View List) - Priority P1 - No dependencies on other stories
  - US2 (Create Project) - Priority P2 - Depends on US4 (details route for navigation)
  - US4 (Access Details) - Priority P2 - No dependencies on other stories (implement before US2)
  - US3 (Delete Project) - Priority P3 - No dependencies on other stories
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (**Implement before US2**)
- **User Story 2 (P2)**: Depends on US4 completion (needs project details route for navigation)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Hooks before components
- Components before containers
- Containers before routes
- Tests written during or after implementation (not TDD approach per constitution)
- Story complete and validated before moving to next priority

### Parallel Opportunities

- **Setup**: T002, T003, T004 can run in parallel (different files)
- **Foundational**: T006, T007, T008, T009 can run in parallel (different files)
- **US1 Implementation**: T010, T011, T012, T015, T016, T017, T018 can run in parallel (different files)
- **US2 Implementation**: T020, T022 can run in parallel (different files, T021 depends on T020)
- **US4 Implementation**: T024, T027 can run in parallel (different files, T025 depends on T024)
- **US3 Implementation**: T028, T029, T031, T032 can run in parallel (different files, T030 depends on T028 and T029)
- **Polish**: T034, T035, T038, T039 can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# Launch all parallelizable tasks for US1 together:
Task T010: "Implement useProjects hook in hooks/useProjects.ts"
Task T011: "Create ProjectListEmpty component in components/ProjectListEmpty.tsx"
Task T012: "Create ProjectListItem component in components/ProjectListItem.tsx"
Task T015: "Export components from components/index.ts"
Task T016: "Export containers from containers/index.ts"
Task T017: "Export hooks from hooks/index.ts"
Task T018: "Export public API from projects/index.ts"

# Then run sequentially:
Task T013: "Create ProjectsPage container" (depends on T010, T011, T012)
Task T014: "Update projects list route" (depends on T013)
Task T019: "Write useProjects test" (after implementation complete)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (View Projects List)
4. **STOP and VALIDATE**: Test US1 independently per acceptance scenarios
5. Optionally deploy/demo MVP if US1 meets requirements

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 4 (Details Page) → Test independently → Provides navigation target
3. Add User Story 1 (View List) → Test independently → Deploy/Demo (MVP!)
4. Add User Story 2 (Create Project) → Test independently → Deploy/Demo (requires US4 and US1)
5. Add User Story 3 (Delete Project) → Test independently → Deploy/Demo
6. Complete Polish phase → Final validation → Production deploy

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (View List)
   - Developer B: User Story 4 (Details Page)
   - Developer C: Wait for US4, then start User Story 2 (Create Project)
3. Once US1, US2, US4 complete:
   - Any developer: User Story 3 (Delete Project)
4. Team collaborates on Polish phase

---

## Task Count Summary

- **Total Tasks**: 40
- **Setup (Phase 1)**: 5 tasks
- **Foundational (Phase 2)**: 4 tasks
- **User Story 1 (Phase 3)**: 10 tasks (9 implementation + 1 test)
- **User Story 2 (Phase 4)**: 4 tasks (3 implementation + 1 test)
- **User Story 4 (Phase 5)**: 4 tasks (implementation only)
- **User Story 3 (Phase 6)**: 6 tasks (5 implementation + 1 test)
- **Polish (Phase 7)**: 7 tasks

**Parallel Opportunities**: 18 tasks marked [P] can run in parallel within their phases

**Independent Test Criteria**:
- US1: Navigate to projects list, verify all active projects displayed, verify empty state
- US2: Click create project, verify new project with defaults, verify navigation
- US4: Navigate to project details, verify placeholder, verify 404 for deleted/invalid
- US3: Delete project with confirmation, verify immediate removal, verify 404 on direct access

**Suggested MVP Scope**: User Story 1 only (10 tasks + foundational setup = 19 tasks total for MVP)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story delivers independent value and can be tested in isolation
- Constitution Principle IV: Minimal testing - focus on critical hooks only (useProjects, useCreateProject, useDeleteProject)
- Reference `domains/admin/workspace/` for implementation patterns (hooks structure, component patterns, mutation patterns)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths are absolute from repository root
- Firebase configuration at monorepo root (`firebase/`), not inside app directory

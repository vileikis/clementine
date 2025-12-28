# Tasks: Admin Workspace Management

**Input**: Design documents from `/specs/003-workspace-list/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in feature specification - focusing on implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **TanStack Start App**: `apps/clementine-app/src/`
- **Tests**: `apps/clementine-app/tests/`
- **Firebase**: `firebase/` at monorepo root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, Firestore configuration, and shared workspace entity

- [ ] T001 Create Firestore collection indexes in firebase/firestore.indexes.json (slug+status, status+createdAt compound indexes)
- [ ] T002 [P] Update Firestore security rules in firebase/firestore.rules (admin-only read/write with data validation helpers)
- [ ] T003 [P] Create Workspace entity types in apps/clementine-app/src/domains/workspace/types/workspace.types.ts
- [ ] T004 [P] Create Workspace Zod schemas in apps/clementine-app/src/domains/workspace/schemas/workspace.schemas.ts
- [ ] T005 [P] Create workspace constants in apps/clementine-app/src/domains/workspace/constants/workspace.constants.ts
- [ ] T006 [P] Create workspace barrel export in apps/clementine-app/src/domains/workspace/index.ts (types, schemas, constants only)

**Checkpoint**: Workspace entity defined, Firestore configured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Deploy Firestore indexes using pnpm fb:deploy:indexes
- [ ] T008 Deploy Firestore security rules using pnpm fb:deploy:rules
- [ ] T009 Verify admin authentication guard exists at apps/clementine-app/src/domains/auth/guards/guards.ts (requireAdmin function)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Active Workspaces (Priority: P1) 🎯 MVP

**Goal**: Enable admins to view a list of all active workspaces and navigate to them by clicking

**Independent Test**:
1. Log in as admin user
2. Navigate to /admin/workspaces
3. Verify all active workspaces are displayed in a list
4. Click a workspace and verify navigation to /workspace/[slug]
5. Create/delete workspaces and verify list updates in real-time

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create useWorkspaces hook in apps/clementine-app/src/domains/admin/workspace/hooks/useWorkspaces.ts (list all active workspaces with onSnapshot)
- [ ] T011 [P] [US1] Create WorkspaceList component in apps/clementine-app/src/domains/admin/workspace/components/WorkspaceList.tsx
- [ ] T012 [P] [US1] Create WorkspaceListItem component in apps/clementine-app/src/domains/admin/workspace/components/WorkspaceListItem.tsx
- [ ] T013 [P] [US1] Create WorkspaceListEmpty component in apps/clementine-app/src/domains/admin/workspace/components/WorkspaceListEmpty.tsx
- [ ] T014 [US1] Create WorkspacesPage container in apps/clementine-app/src/domains/admin/workspace/containers/WorkspacesPage.tsx (integrates WorkspaceList, data fetching)
- [ ] T015 [US1] Create /admin/workspaces route in apps/clementine-app/src/routes/admin/workspaces.tsx (with requireAdmin guard)
- [ ] T016 [US1] Add navigation link to workspace list in admin navigation (if admin nav exists)

**Checkpoint**: Admins can view active workspaces, click to navigate, see real-time updates

---

## Phase 4: User Story 2 - Create New Workspace (Priority: P2)

**Goal**: Enable admins to create new workspaces with unique slugs and auto-generated slug from name

**Independent Test**:
1. Log in as admin and navigate to /admin/workspaces
2. Click "Create workspace" button (from empty state or list)
3. Enter workspace name, verify slug auto-generates
4. Edit slug if desired
5. Submit and verify:
   - Workspace appears in list
   - Navigation to /workspace/[slug] works
   - Duplicate slug shows error
   - Deleted workspace slug shows error

### Implementation for User Story 2

- [ ] T017 [P] [US2] Create useCreateWorkspace hook in apps/clementine-app/src/domains/admin/workspace/hooks/useCreateWorkspace.ts (with runTransaction for slug uniqueness)
- [ ] T018 [US2] Create CreateWorkspaceSheet component in apps/clementine-app/src/domains/admin/workspace/components/CreateWorkspaceSheet.tsx (form with auto-slug generation)
- [ ] T019 [US2] Integrate CreateWorkspaceSheet into WorkspaceList component (add trigger button)
- [ ] T020 [US2] Update WorkspaceListEmpty component to show "Create workspace" button
- [ ] T021 [US2] Add success redirect to /workspace/[slug] after creation in useCreateWorkspace hook

**Checkpoint**: Admins can create workspaces, slugs are unique, creation flow works end-to-end

---

## Phase 5: User Story 3 - Access Workspace by Slug (Priority: P1)

**Goal**: Enable direct access to workspaces via /workspace/[slug] URLs with proper not-found handling

**Independent Test**:
1. Navigate directly to /workspace/[existing-slug]
2. Verify workspace loads correctly
3. Navigate to /workspace/nonexistent and verify "Workspace not found" message
4. Soft delete a workspace, navigate to its slug URL, verify "Workspace not found"
5. Test case-insensitive slug matching (acme vs ACME)

### Implementation for User Story 3

- [ ] T022 [P] [US3] Create workspace slug route in apps/clementine-app/src/routes/workspace/$workspaceSlug.tsx (dynamic route with requireAdmin guard)
- [ ] T023 [US3] Implement workspace resolution by slug query (where slug == param.toLowerCase() and status == 'active')
- [ ] T024 [US3] Add "Workspace not found" error handling for invalid/deleted workspace slugs
- [ ] T025 [US3] Create basic workspace page placeholder component (can be enhanced later with workspace editor)

**Checkpoint**: Slug-based URLs work, not-found handling correct, deleted workspaces inaccessible

---

## Phase 6: User Story 4 - Soft Delete Workspace (Priority: P3)

**Goal**: Enable admins to soft delete workspaces with confirmation, making them disappear from list and inaccessible

**Independent Test**:
1. Navigate to /admin/workspaces
2. Click delete on a workspace
3. Verify confirmation modal appears
4. Confirm deletion and verify:
   - Workspace removed from list immediately
   - Workspace slug URL shows "not found"
   - Slug cannot be reused for new workspace

### Implementation for User Story 4

- [ ] T026 [P] [US4] Create useDeleteWorkspace hook in apps/clementine-app/src/domains/admin/workspace/hooks/useDeleteWorkspace.ts (soft delete with updateDoc)
- [ ] T027 [US4] Create DeleteWorkspaceDialog component in apps/clementine-app/src/domains/admin/workspace/components/DeleteWorkspaceDialog.tsx (confirmation modal)
- [ ] T028 [US4] Integrate DeleteWorkspaceDialog into WorkspaceListItem component (add delete button)
- [ ] T029 [US4] Verify real-time list updates remove deleted workspace via onSnapshot listener

**Checkpoint**: Soft delete works, confirmation required, slug becomes unavailable, list updates

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T030 [P] Create admin/workspace barrel export in apps/clementine-app/src/domains/admin/workspace/index.ts (hooks, components, containers)
- [ ] T031 [P] Remove mock workspace data from apps/clementine-app/src/domains/navigation/mockWorkspaces.ts (if exists)
- [ ] T032 Update WorkspaceSelector component to use real useWorkspaces hook instead of mock data (if exists in navigation domain)
- [ ] T033 Run pnpm app:check (format, lint, type-check) and fix any issues
- [ ] T034 [P] Add loading states to WorkspaceList, CreateWorkspaceSheet, and DeleteWorkspaceDialog
- [ ] T035 [P] Add error handling UI for failed operations (create, delete, fetch)
- [ ] T036 Manual testing on mobile devices (320px-768px viewport) per constitution Principle I
- [ ] T037 Verify Firestore rules prevent unauthorized access (test with non-admin user)
- [ ] T038 Test concurrent workspace creation (slug uniqueness under load)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (View) and US3 (Access by slug) can proceed in parallel after Phase 2
  - US2 (Create) should start after US1 (needs list to show created workspace)
  - US4 (Delete) should start after US1 (needs list to show deletion)
- **Polish (Phase 7)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - View)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2 - Create)**: Depends on US1 for displaying created workspaces in list
- **User Story 3 (P1 - Access by slug)**: Can start after Foundational - No dependencies on other stories
- **User Story 4 (P3 - Delete)**: Depends on US1 for list integration

**Recommended Order**: Phase 1 → Phase 2 → US1 + US3 in parallel → US2 → US4 → Polish

### Within Each User Story

- Hooks before components
- Base components (List, Item, Empty) before containers (Page)
- Containers before routes
- Routes before navigation integration

### Parallel Opportunities

**Setup Phase (Phase 1)**:
- T002 (security rules), T003 (types), T004 (schemas), T005 (constants), T006 (barrel export) can all run in parallel
- T001 (indexes) should complete first since it defines the Firestore structure

**Foundational Phase (Phase 2)**:
- T007 (deploy indexes) and T008 (deploy rules) can run in parallel
- T009 (verify auth guard) can run in parallel with deployments

**User Story 1**:
- T010 (useWorkspaces hook), T011 (WorkspaceList), T012 (WorkspaceListItem), T013 (WorkspaceListEmpty) can all run in parallel
- T014 (WorkspacesPage) depends on T010, T011, T013 completing
- T015 (route) depends on T014 completing

**User Story 2**:
- T017 (useCreateWorkspace hook) and T018 (CreateWorkspaceSheet) can run in parallel
- T019, T020, T021 are sequential integration tasks

**User Story 3**:
- All tasks (T022-T025) are in the same route file, must be sequential

**User Story 4**:
- T026 (useDeleteWorkspace hook) and T027 (DeleteWorkspaceDialog) can run in parallel
- T028, T029 are sequential integration tasks

**Polish Phase**:
- T030 (barrel export), T031 (remove mocks), T033 (linting), T034 (loading states), T035 (error handling), T036 (mobile testing), T037 (security testing), T038 (concurrency testing) can all run in parallel
- T032 (update selector) depends on T030 (barrel export) completing

---

## Parallel Example: User Story 1

```bash
# Launch all base components for User Story 1 together:
Task T010: "Create useWorkspaces hook in apps/clementine-app/src/domains/admin/workspace/hooks/useWorkspaces.ts"
Task T011: "Create WorkspaceList component in apps/clementine-app/src/domains/admin/workspace/components/WorkspaceList.tsx"
Task T012: "Create WorkspaceListItem component in apps/clementine-app/src/domains/admin/workspace/components/WorkspaceListItem.tsx"
Task T013: "Create WorkspaceListEmpty component in apps/clementine-app/src/domains/admin/workspace/components/WorkspaceListEmpty.tsx"

# Then run these sequentially:
Task T014: "Create WorkspacesPage container" (depends on T010, T011, T013)
Task T015: "Create /admin/workspaces route" (depends on T014)
Task T016: "Add navigation link" (depends on T015)
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 3)

1. Complete Phase 1: Setup (Workspace entity + Firestore config)
2. Complete Phase 2: Foundational (Deploy indexes/rules, verify auth)
3. Complete Phase 3: User Story 1 (View workspaces list)
4. Complete Phase 5: User Story 3 (Access by slug)
5. **STOP and VALIDATE**: Test viewing workspace list and accessing workspaces by slug
6. Deploy/demo if ready

**Rationale**: US1 + US3 together provide the core read-only workspace browsing experience. Both are P1 priority and have no dependencies on workspace creation/deletion.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 + US3 → Test independently → Deploy/Demo (MVP - read-only workspace access!)
3. Add US2 (Create) → Test independently → Deploy/Demo (Workspace creation!)
4. Add US4 (Delete) → Test independently → Deploy/Demo (Full CRUD!)
5. Add Polish → Final refinement → Production ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - **Developer A**: US1 (View workspaces list)
   - **Developer B**: US3 (Access by slug)
3. After US1 completes:
   - **Developer A**: US2 (Create workspace - depends on US1 list)
   - **Developer B**: US4 (Delete workspace - can start after US1)
4. Both developers work on Polish phase together

---

## Notes

- **[P] tasks**: Different files, no dependencies - safe to parallelize
- **[Story] label**: Maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **Client-first architecture**: All CRUD operations via Firestore client SDK with TanStack Query hooks
- **Security**: Enforced via Firestore rules, not application code
- **Real-time updates**: onSnapshot listeners ensure UI reflects Firestore changes
- **Slug uniqueness**: Enforced via runTransaction on client (atomicity at database level)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Mobile-first testing**: Constitution requires manual testing on mobile devices (Principle I)

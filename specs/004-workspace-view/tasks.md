# Tasks: Workspace View & Settings (Admin)

**Input**: Design documents from `/specs/004-workspace-view/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/workspace-api.md

**Tests**: Tests are included (co-located with implementation files) as specified in the plan.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a TanStack Start web application with domain-driven design:
- **Workspace domain**: `apps/clementine-app/src/domains/workspace/`
- **Navigation domain**: `apps/clementine-app/src/domains/navigation/`
- **App routes**: `apps/clementine-app/src/app/`
- **Shared components**: `apps/clementine-app/src/shared/`
- **Firebase rules**: `firestore.rules` (repository root)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Update existing infrastructure and add new schemas/types for workspace feature

- [X] T001 [P] Update workspace schemas in apps/clementine-app/src/domains/workspace/schemas/workspace.schemas.ts (add updateWorkspaceSchema)
- [X] T002 [P] Update workspace types in apps/clementine-app/src/domains/workspace/types/workspace.types.ts (add UpdateWorkspaceInput)
- [X] T003 [P] Update Firestore security rules in firestore.rules (add admin-only workspace collection rules)
- [X] T004 Create store directory apps/clementine-app/src/domains/workspace/store/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Implement Zustand store with persist middleware in apps/clementine-app/src/domains/workspace/store/useWorkspaceStore.ts
- [X] T006 Write tests for useWorkspaceStore in apps/clementine-app/src/domains/workspace/store/useWorkspaceStore.test.ts
- [X] T007 [P] Implement useWorkspace hook (fetch by slug) in apps/clementine-app/src/domains/workspace/hooks/useWorkspace.ts
- [X] T008 [P] Write tests for useWorkspace hook in apps/clementine-app/src/domains/workspace/hooks/useWorkspace.test.ts
- [X] T009 [P] Implement updateWorkspace server action in apps/clementine-app/src/domains/workspace/actions/updateWorkspace.ts
- [X] T010 [P] Write tests for updateWorkspace action in apps/clementine-app/src/domains/workspace/actions/updateWorkspace.test.ts
- [X] T011 [P] Implement useUpdateWorkspace mutation hook in apps/clementine-app/src/domains/workspace/hooks/useUpdateWorkspace.ts
- [X] T012 [P] Write tests for useUpdateWorkspace hook in apps/clementine-app/src/domains/workspace/hooks/useUpdateWorkspace.test.ts
- [X] T013 Update workspace domain barrel exports in apps/clementine-app/src/domains/workspace/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Workspace Context (Priority: P1) 🎯 MVP

**Goal**: Enable admins to navigate to a workspace by slug and view its context (name and icon) in the sidebar

**Independent Test**: Navigate to `/workspace/acme-corp` as an admin, verify workspace selector shows correct name and icon. Navigate to `/workspace/nonexistent-slug`, verify friendly 404 is displayed.

### Navigation Domain Updates for User Story 1

- [X] T014 [P] [US1] Update getWorkspaceInitials in apps/clementine-app/src/domains/navigation/lib/getWorkspaceInitials.ts (fix to match spec: 1-2 letters)
- [X] T015 [P] [US1] Write tests for getWorkspaceInitials in apps/clementine-app/src/domains/navigation/lib/getWorkspaceInitials.test.ts
- [X] T016 [US1] Update WorkspaceSelector in apps/clementine-app/src/domains/navigation/components/WorkspaceSelector.tsx (fetch real workspace data by slug using useWorkspace hook)
- [X] T017 [US1] Update WorkspaceNav in apps/clementine-app/src/domains/navigation/components/WorkspaceNav.tsx (use real workspaceSlug from params instead of workspaceId)

### Routing for User Story 1

- [X] T018 [US1] Update workspace route loader in apps/clementine-app/src/app/workspace/$workspaceSlug.tsx (add beforeLoad with workspace resolution, store lastVisitedWorkspaceSlug)
- [X] T019 [P] [US1] Update NotFound component in apps/clementine-app/src/shared/components/NotFound.tsx (make generic with props for title, message, actionLabel, actionHref)

**Checkpoint**: At this point, User Story 1 should be fully functional - admins can view workspace context by slug with proper 404 handling

---

## Phase 4: User Story 2 - Edit Workspace Settings (Priority: P2)

**Goal**: Enable admins to edit workspace name and slug via settings page with validation and auto-redirect on slug change

**Independent Test**: Navigate to `/workspace/acme-corp/settings`, change name and slug, save, verify updates persist and redirect occurs. Try duplicate slug, verify error message.

### Implementation for User Story 2

- [X] T020 [P] [US2] Create WorkspaceSettingsForm component in apps/clementine-app/src/domains/workspace/components/WorkspaceSettingsForm.tsx (shadcn/ui Form with React Hook Form + Zod)
- [X] T021 [P] [US2] Write tests for WorkspaceSettingsForm in apps/clementine-app/src/domains/workspace/components/WorkspaceSettingsForm.test.tsx
- [X] T022 [US2] Create settings route in apps/clementine-app/src/app/workspace/$workspaceSlug.settings.tsx (render WorkspaceSettingsForm, handle slug redirect)
- [X] T023 [US2] Update workspace domain barrel exports in apps/clementine-app/src/domains/workspace/index.ts (export WorkspaceSettingsForm)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - admins can view workspace context AND edit settings

---

## Phase 5: User Story 3 - Remember Last Visited Workspace (Priority: P3)

**Goal**: Automatically redirect admins to their last visited workspace when accessing root or workspace routes, persisting across sessions

**Independent Test**: Visit `/workspace/acme-corp`, close browser, reopen and navigate to `/` or `/workspace`, verify redirect to last visited workspace. Clear localStorage, navigate to `/`, verify redirect to `/admin`.

### Routing for User Story 3

- [X] T024 [US3] Update root route in apps/clementine-app/src/app/index.tsx (add beforeLoad with redirect logic based on lastVisitedWorkspaceSlug)
- [X] T025 [US3] Create workspace index route in apps/clementine-app/src/app/workspace.tsx (redirect to lastVisitedWorkspaceSlug or /admin)

**Checkpoint**: All three user stories should now work independently - workspace context view, settings edit, and session persistence

---

## Phase 6: User Story 4 - View Projects Placeholder (Priority: P4)

**Goal**: Establish projects route with placeholder header for future project management features

**Independent Test**: Navigate to `/workspace/acme-corp/projects`, verify header "Projects" is displayed and workspace context is maintained.

### Implementation for User Story 4

- [X] T026 [US4] Verify projects route exists in apps/clementine-app/src/app/workspace/$workspaceSlug.projects.tsx (add "Projects" header if missing)

**Checkpoint**: All user stories complete - workspace view, settings, session persistence, and projects placeholder all functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T027 [P] Deploy Firestore security rules (pnpm fb:deploy:rules)
- [X] T028 [P] Create Firestore indexes if needed (slug + status compound index)
- [X] T029 Run validation loop (pnpm app:check - format, lint, type-check)
- [ ] T030 Run all tests (pnpm test)
- [ ] T031 Manual testing on mobile viewport (320px-768px)
- [ ] T032 Standards compliance review (check against frontend/design-system.md, global/security.md, backend/firestore-security.md)
- [ ] T033 Performance validation (workspace resolution <2s, updates <1s, localStorage write <100ms)
- [ ] T034 Update CLAUDE.md if needed (document any new patterns or conventions)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ INDEPENDENT
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on User Story 1 (uses same hooks) ✅ INDEPENDENT
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires workspace route from US1 but independently testable ⚠️ SOFT DEPENDENCY on US1 routing
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Uses same workspace resolution as US1 ⚠️ SOFT DEPENDENCY on US1 routing

**Recommended Order**: P1 (foundation) → P2 (settings) → P3 (session) → P4 (placeholder)

### Within Each User Story

- Tests MUST be co-located with implementation files
- Navigation domain updates before routing updates
- Components before routes
- Tests can run in parallel with implementation (TDD approach)
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1 (Setup)**: T001, T002, T003 can run in parallel (different files)
- **Phase 2 (Foundational)**: T007-T008, T009-T010, T011-T012 can run in parallel (different files)
- **Phase 3 (US1)**: T014-T015, T019 can run in parallel (different files)
- **Phase 4 (US2)**: T020-T021 can run in parallel (component + tests)
- **Phase 7 (Polish)**: T027, T028, T034 can run in parallel (different concerns)
- **Cross-story parallelism**: After Phase 2, US1, US2, US3, US4 can all start in parallel if team capacity allows

---

## Parallel Example: User Story 1

```bash
# Launch navigation updates together (Phase 3):
Task: "Update getWorkspaceInitials + write tests (T014-T015)"
Task: "Update NotFound component (T019)"

# Then proceed sequentially:
Task: "Update WorkspaceSelector (T016)" # depends on getWorkspaceInitials
Task: "Update WorkspaceNav (T017)"
Task: "Update workspace route loader (T018)"
```

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational components together (Phase 2):
Task: "Implement useWorkspace hook + tests (T007-T008)"
Task: "Implement updateWorkspace action + tests (T009-T010)"
Task: "Implement useUpdateWorkspace hook + tests (T011-T012)"

# Store must complete first:
Task: "Implement useWorkspaceStore + tests (T005-T006)"

# Then export everything:
Task: "Update barrel exports (T013)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T013) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T014-T019)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Navigate to `/workspace/acme-corp` → workspace loads
   - Navigate to `/workspace/nonexistent-slug` → 404 displays
   - Verify workspace selector shows name and icon
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational (Phases 1-2) → Foundation ready ✅
2. Add User Story 1 (Phase 3) → Test independently → Deploy/Demo (MVP!) 🎯
3. Add User Story 2 (Phase 4) → Test independently → Deploy/Demo 📝
4. Add User Story 3 (Phase 5) → Test independently → Deploy/Demo 💾
5. Add User Story 4 (Phase 6) → Test independently → Deploy/Demo 📂
6. Polish & Deploy (Phase 7) → Final release 🚀

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (Phases 1-2)
2. Once Foundational is done:
   - Developer A: User Story 1 (Phase 3) - Foundation
   - Developer B: User Story 2 (Phase 4) - Can start immediately after foundational
   - Developer C: User Story 3 (Phase 5) - Can start immediately after foundational
   - Developer D: User Story 4 (Phase 6) - Can start immediately after foundational
3. Stories complete and integrate independently

**Note**: US3 and US4 have soft dependencies on US1 routing, but can be developed in parallel with coordination.

---

## Task Count Summary

- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (Foundational)**: 9 tasks (CRITICAL - blocks all stories)
- **Phase 3 (US1)**: 6 tasks (MVP)
- **Phase 4 (US2)**: 4 tasks
- **Phase 5 (US3)**: 2 tasks
- **Phase 6 (US4)**: 1 task
- **Phase 7 (Polish)**: 8 tasks

**Total**: 34 tasks

**Parallel Opportunities**: 12 tasks marked [P] can run in parallel
**MVP Scope**: Phases 1-3 (19 tasks) delivers User Story 1 (workspace view with 404 handling)

---

## Critical Path

The shortest path to MVP (User Story 1 only):

1. T001-T004 (Setup) - 4 tasks
2. T005-T013 (Foundational) - 9 tasks (BLOCKS everything)
3. T014-T019 (US1) - 6 tasks

**Total**: 19 tasks for MVP

**Estimated Duration** (single developer, no parallelism):
- Setup: ~2 hours
- Foundational: ~8 hours (includes store, hooks, actions, tests)
- US1: ~6 hours (includes navigation updates, routing, tests)

**Total MVP Time**: ~16 hours (2 days)

With parallelism (2-3 developers):
- **Total MVP Time**: ~8-10 hours (1-1.5 days)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are co-located with implementation files (not in separate tests/ directory)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run `pnpm app:check` before committing to ensure format, lint, type-check pass
- Deploy Firestore rules (T027) before testing in production
- Verify mobile responsiveness (320px-768px viewport) in T031

---

## Validation Checklist (Before Marking Feature Complete)

### Technical Validation

- [ ] All TypeScript errors resolved (`pnpm type-check`)
- [ ] All ESLint errors resolved (`pnpm lint`)
- [ ] Code formatted (`pnpm format`)
- [ ] All tests passing (`pnpm test`)
- [ ] Firestore security rules deployed (`pnpm fb:deploy:rules`)
- [ ] Firestore indexes created if needed

### Functional Validation

- [ ] US1: Navigate to workspace by slug → workspace loads correctly
- [ ] US1: Navigate to non-existent slug → 404 state shows
- [ ] US1: Workspace selector shows correct name and icon (1-2 letters)
- [ ] US2: Update workspace name → name updates in sidebar
- [ ] US2: Update workspace slug → URL redirects to new slug
- [ ] US2: Try duplicate slug → error message displays
- [ ] US3: Visit workspace, then navigate to `/` → redirects to workspace
- [ ] US3: Clear localStorage, navigate to `/` → redirects to `/admin`
- [ ] US3: Session persistence survives browser restart
- [ ] US4: Navigate to projects → "Projects" header displays

### Performance Validation

- [ ] Workspace resolution < 2 seconds
- [ ] Workspace updates < 1 second
- [ ] localStorage write < 100ms
- [ ] Automatic redirect < 1 second

### Mobile Validation

- [ ] Test on 320px viewport (smallest mobile)
- [ ] Test on 768px viewport (tablet)
- [ ] All touch targets ≥ 44x44px
- [ ] No horizontal scrolling

### Security Validation

- [ ] Non-admin users cannot access `/workspace/**` routes
- [ ] Firestore rules enforce admin-only access
- [ ] Slug validation prevents XSS/injection
- [ ] No sensitive data in localStorage

### Standards Compliance

- [ ] Design system: Using theme tokens (no hard-coded colors)
- [ ] Component libraries: Using shadcn/ui for forms
- [ ] Project structure: Following vertical slice architecture
- [ ] Code quality: Clean, simple, well-named functions
- [ ] Security: Input validated, no XSS vulnerabilities
- [ ] Firestore: Using client SDK patterns correctly
- [ ] Firestore security: Rules enforce admin-only access

---

## Ready for Implementation

This task breakdown is immediately executable. Each task:
- ✅ Has a unique ID (T001-T034)
- ✅ Has clear parallelization markers [P]
- ✅ Has user story labels [US1-US4]
- ✅ Has exact file paths
- ✅ Is specific enough for LLM implementation
- ✅ Is organized by user story for independent delivery

**Start with**: Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (MVP - User Story 1)

**Test after each phase**: Verify each user story works independently before proceeding to the next.

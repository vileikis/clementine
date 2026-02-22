# Tasks: Fix SSR Firestore Offline Crash

**Input**: Design documents from `/specs/077-fix-ssr-offline/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story. Because all changes target a single file (`$projectId.tsx`), user stories are sequential (not parallelizable) but each builds incrementally on the previous.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo app**: `apps/clementine-app/src/`
- **Route file**: `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx`

---

## Phase 1: Setup

**Purpose**: No setup needed — this is a bug fix in an existing codebase with all infrastructure already in place.

*Skipped — no new dependencies, files, or configuration required.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational work needed — all required components exist (`useProject` hook, `NotFound` component, route structure).

*Skipped — existing infrastructure is sufficient.*

---

## Phase 3: User Story 1 + User Story 4 — Page Refresh Works & Client-Side Navigation Preserved (Priority: P1) 🎯 MVP

**Goal**: Eliminate the 500 error on page refresh by removing the broken server-side loader. Client-side navigation must continue working unchanged.

**Independent Test**: Navigate directly to `/workspace/:slug/projects/:id/designer/welcome` in a new browser tab — page should load without error. Then navigate between project sub-routes using in-app links — all transitions should work smoothly.

### Implementation

- [x] T001 [US1] Remove `loader` property and its contents (lines 21-42) from `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx`
- [x] T002 [US1] Remove unused imports (`doc`, `getDoc` from `firebase/firestore`; `projectSchema` from `@clementine/shared`; `firestore` from `@/integrations/firebase/client`; `convertFirestoreDoc` from `@/shared/utils/firestore-utils`; `notFound` from `@tanstack/react-router`) from `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx`

**Checkpoint**: The route no longer has a loader. SSR renders the component directly. The `useProject` hook fetches data client-side. Page refresh no longer produces a 500 error (shows blank/null briefly). Client-side navigation still works because `useProject` was already the data source for the component.

---

## Phase 4: User Story 2 — Loading Feedback During Data Fetch (Priority: P2)

**Goal**: Show a loading indicator while the client-side `useProject` hook fetches data after SSR, instead of rendering blank/null.

**Independent Test**: Refresh any project page — a "Loading project..." message should appear briefly before the project content renders.

### Implementation

- [x] T003 [US2] Destructure `isLoading` from the `useProject(projectId)` return value and add a loading state that renders a centered "Loading project..." message (matching the workspace route pattern in `$workspaceSlug.tsx` lines 43-49) in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx`

**Checkpoint**: Page refresh shows "Loading project..." text while data loads, then renders the project layout. No blank flash.

---

## Phase 5: User Story 3 — Not-Found and Deleted Project Handling (Priority: P2)

**Goal**: Display a not-found view when the project doesn't exist or has been deleted, handling these checks client-side instead of in the removed loader.

**Independent Test**: Navigate to a URL with a non-existent project ID — the "Project Not Found" view should appear. Navigate to a deleted project — same result.

### Implementation

- [x] T004 [US3] Replace the `if (!project) return null` guard with a check for `!project || project.status === 'deleted'` that renders `<ProjectNotFound />` in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx`

**Checkpoint**: Non-existent and deleted projects show the "Project Not Found" view with a link back to the projects list. Real-time updates also trigger the not-found view if a project is deleted while being viewed.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the fix passes all quality gates and works in production SSR.

- [x] T005 Run `pnpm app:check` (format + lint auto-fix) from monorepo root to ensure code quality
- [x] T006 Run `pnpm app:type-check` from monorepo root to verify TypeScript compilation
- [ ] T007 Verify fix in dev server (`pnpm app:dev`) — refresh project pages, test navigation, test not-found
- [ ] T008 Build production app (`pnpm app:build`) and verify SSR works (`pnpm app:start`) — refresh project pages confirm no 500 error

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 3 (US1+US4)**: No dependencies — start immediately. This is the MVP.
- **Phase 4 (US2)**: Depends on Phase 3 (loader must be removed before adding loading state logic)
- **Phase 5 (US3)**: Depends on Phase 4 (loading check must exist before not-found check for correct ordering)
- **Phase 6 (Polish)**: Depends on Phases 3-5 completion

### User Story Dependencies

- **US1 + US4 (P1)**: Independent — removing the loader fixes both stories simultaneously
- **US2 (P2)**: Depends on US1 (loader removal enables the loading state pattern)
- **US3 (P2)**: Depends on US2 (loading check must come before not-found check in render logic)

### Within Each User Story

All tasks within each phase are sequential (same file).

### Parallel Opportunities

- T001 and T002 can be done together as a single edit (remove loader + remove imports)
- T005 and T006 can run in parallel (lint/format vs type-check)

---

## Implementation Strategy

### MVP First (User Stories 1 + 4 Only)

1. Complete Phase 3: Remove loader (T001, T002)
2. **STOP and VALIDATE**: Refresh a project page — should load without 500 error
3. This alone fixes the production bug

### Incremental Delivery

1. Phase 3: Remove loader → Fixes 500 error (MVP!)
2. Phase 4: Add loading state → Better UX during data fetch
3. Phase 5: Add not-found handling → Complete parity with removed loader checks
4. Phase 6: Validate → Ensure quality gates pass and SSR works in production build

### Single Developer Strategy

All tasks target the same file, so execute sequentially:
T001 → T002 → T003 → T004 → T005/T006 (parallel) → T007 → T008

---

## Notes

- All implementation tasks (T001-T004) modify the same file: `$projectId.tsx`
- The reference pattern is `$workspaceSlug.tsx` (no loader, client-side hook, three-state rendering)
- US1 and US4 are combined because removing the loader fixes both simultaneously
- Total: 8 tasks across 4 phases, targeting 1 file

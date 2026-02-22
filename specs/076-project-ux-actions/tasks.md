# Tasks: Project UX & Actions

**Input**: Design documents from `/specs/076-project-ux-actions/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `apps/clementine-app/src/`.

---

## Phase 1: User Story 1 — Rename Project from Designer (Priority: P1) 🎯 MVP

**Goal**: Creators can rename a project directly from the designer TopNavBar by clicking the project name badge, without navigating back to the project list.

**Independent Test**: Open any project in the designer → hover over project name in top bar (pencil icon appears) → click to open rename dialog → enter new name → save → name updates in nav bar and persists after refresh.

### Implementation for User Story 1

- [x] T001 [P] [US1] Create `ProjectIdentityBadge` component in `domains/project/layout/components/ProjectIdentityBadge.tsx` — clickable `<button>` with project name (max-w-[200px] truncated) + Pencil icon visible on hover (`opacity-0 group-hover:opacity-100`). Follow `ExperienceIdentityBadge` pattern but without thumbnail. Props: `{ name: string; onClick: () => void }`. Classes: `group flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent`.
- [x] T002 [US1] Integrate `ProjectIdentityBadge` and `RenameProjectDialog` into `ProjectLayout` in `domains/project/layout/containers/ProjectLayout.tsx` — add `isRenameOpen` state, replace static `project.name` breadcrumb label with `<ProjectIdentityBadge name={project.name} onClick={() => setIsRenameOpen(true)} />`, render `<RenameProjectDialog>` (imported from `domains/workspace/projects/components/`) with `projectId`, `workspaceId`, `initialName`, `open`, `onOpenChange` props. Determine `workspaceId` from route params or project object.

**Checkpoint**: Rename from designer is fully functional. Test all 5 acceptance scenarios from spec.

---

## Phase 2: User Story 2 — Duplicate Project from Project List (Priority: P1)

**Goal**: Creators can duplicate a project from the project list context menu. The context menu is migrated to the shared `ContextDropdownMenu` component with Rename, Duplicate, and Delete actions.

**Independent Test**: Navigate to project list → open context menu on any project → see Rename/Duplicate/Delete → click Duplicate → new project "Original (Copy)" appears in list with success toast → open duplicated project → same configuration as original.

### Implementation for User Story 2

- [x] T003 [P] [US2] Add `duplicateProjectInputSchema` to `domains/workspace/projects/schemas/project.schemas.ts` — Zod schema validating `{ workspaceId: z.string().min(1), projectId: z.string().min(1) }`. Export the schema and inferred `DuplicateProjectInput` type.
- [x] T004 [US2] Create `useDuplicateProject` hook in `domains/workspace/projects/hooks/useDuplicateProject.ts` — follow `useDuplicateExperience` pattern: validate input with `duplicateProjectInputSchema` → Firestore `runTransaction` → `transaction.get(sourceRef)` from `projects` collection → verify exists and status !== 'deleted' → `generateDuplicateName(source.name)` (import from `domains/experience/shared/lib/generate-duplicate-name`) → `structuredClone(source.draftConfig)` → `transaction.set(newRef, { ...clonedProject })` with `status: 'draft'`, `publishedConfig: null`, `exports: null`, `draftVersion: 1`, `publishedVersion: null`, `publishedAt: null`, `deletedAt: null`, `createdAt: serverTimestamp()`, `updatedAt: serverTimestamp()` → `onSuccess`: invalidate `['projects', workspaceId]` → `onError`: report to Sentry. Returns `{ workspaceId, projectId, name }`.
- [x] T005 [US2] Export `useDuplicateProject` from `domains/workspace/projects/hooks/index.ts` barrel file.
- [x] T006 [US2] Refactor `ProjectListItem` in `domains/workspace/projects/components/ProjectListItem.tsx` — remove inline `DropdownMenu` imports and markup, remove internal `showDeleteDialog`/`showRenameDialog` state, remove `DeleteProjectDialog`/`RenameProjectDialog` renders. Replace props `onDelete`/`isDeleting` with `menuSections?: MenuSection[]`. Import `ContextDropdownMenu` from `@/shared/components/ContextDropdownMenu` and render with `sections={menuSections}`. Keep MoreVertical trigger button with `h-11 w-11` for 44px touch target.
- [x] T007 [US2] Update `ProjectsPage` in `domains/workspace/projects/containers/ProjectsPage.tsx` — import `useDuplicateProject`, `Copy`/`Pencil`/`Trash2` icons, `MenuSection` type. Add state for `renameProject` and `deleteProjectTarget` (like `ExperiencesPage` pattern). Build `getMenuSections(project): MenuSection[]` with Section 1: Rename + Duplicate (Duplicate disabled while `duplicateProject.isPending`), Section 2: Delete (destructive). Add `handleDuplicate(project)` with try/catch, success toast `Duplicated as "{name}"`, error toast. Pass `menuSections={getMenuSections(project)}` to `ProjectListItem`. Render `RenameProjectDialog` and `DeleteProjectDialog` at page level (controlled by state).

**Checkpoint**: Project duplication works end-to-end. Context menu uses shared component. Test all 5 acceptance scenarios from spec.

---

## Phase 3: User Story 3 — Fully Clickable Project Cards (Priority: P2)

**Goal**: The entire project card is a click target for navigation with visual hover feedback. Context menu remains independently clickable.

**Independent Test**: Hover over project card (visual hover effect appears) → click anywhere on card body (navigates to project designer) → click context menu button (menu opens, no navigation).

**Depends on**: US2 (T006 refactors `ProjectListItem` structure)

### Implementation for User Story 3

- [x] T008 [US3] Make `ProjectListItem` fully clickable with hover in `domains/workspace/projects/components/ProjectListItem.tsx` — wrap the Card in a `<Link to="/workspace/$workspaceSlug/projects/$projectId" params={...}>` (or make the Link the outermost element with card-like styles). Add `transition-colors hover:bg-accent/50 cursor-pointer` to the card/link. Remove the inner `<Link>` that currently wraps only content. Wrap the `ContextDropdownMenu` trigger area in a `<div onClick={(e) => e.stopPropagation()}>` to prevent navigation on menu click. The `<Link>` renders as `<a>` — natively focusable and Enter-activatable for keyboard accessibility.

**Checkpoint**: Project cards are fully clickable with hover. Context menu isolated. Keyboard navigation works.

---

## Phase 4: User Story 4 — Fully Clickable Experience Cards (Priority: P2)

**Goal**: Experience cards match the project card behavior — full-card click target with hover feedback.

**Independent Test**: Hover over experience card (hover effect matches project cards) → click anywhere on card body (navigates to experience designer) → click context menu (menu opens, no navigation).

### Implementation for User Story 4

- [x] T009 [P] [US4] Make `ExperienceListItem` fully clickable with hover in `domains/experience/library/components/ExperienceListItem.tsx` — same pattern as T008: wrap Card in `<Link>` with `transition-colors hover:bg-accent/50 cursor-pointer`, remove inner `<Link>` that wraps only content, wrap `ContextDropdownMenu` trigger in `<div onClick={(e) => e.stopPropagation()}>`. Ensure thumbnail area is now also clickable (currently outside the inner Link). Maintain 44px touch target on menu button.

**Checkpoint**: Experience cards behave identically to project cards. Test all 4 acceptance scenarios.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validation, consistency, and cleanup

- [x] T010 Run validation gates: `pnpm type-check` and `pnpm check` (format + lint) from `apps/clementine-app/`. Fix any TypeScript errors, lint issues, or formatting problems across all changed files.

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 (Phase 1)**: No dependencies — can start immediately
- **US2 (Phase 2)**: No dependencies on US1 — can start in parallel
- **US3 (Phase 3)**: Depends on US2 completion (T006 refactors the same file)
- **US4 (Phase 4)**: No dependencies on US1-US3 — can start in parallel with US1/US2
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — T001 and T002 are sequential (badge before integration)
- **US2 (P1)**: Independent — T003 → T004 → T005 sequential; T006 can parallel with T003-T005; T007 depends on T004-T006
- **US3 (P2)**: Depends on US2 T006 (same file: `ProjectListItem.tsx`)
- **US4 (P2)**: Independent of all other stories (different file: `ExperienceListItem.tsx`)

### Within-Story Task Order

**US1**: T001 → T002
**US2**: T003 → T004 → T005, and T006 (parallel with T003-T005) → T007 (after T005 + T006)
**US3**: T008 (after US2 T006)
**US4**: T009 (independent)

### Parallel Opportunities

```
Parallel group 1 (start immediately):
  T001 [US1] — ProjectIdentityBadge
  T003 [US2] — duplicateProjectInputSchema
  T006 [US2] — ProjectListItem refactor to ContextDropdownMenu
  T009 [US4] — ExperienceListItem clickable card

Sequential after T001:
  T002 [US1] — ProjectLayout integration

Sequential after T003:
  T004 [US2] → T005 [US2] — useDuplicateProject hook + barrel export

Sequential after T005 + T006:
  T007 [US2] — ProjectsPage menu construction

Sequential after T006:
  T008 [US3] — ProjectListItem clickable card

After all stories:
  T010 — Validation gates
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 → T002
2. **STOP and VALIDATE**: Test rename from designer independently
3. Deploy/demo if ready — creators can rename without leaving designer

### Incremental Delivery

1. US1 (rename badge) → test → deploy
2. US2 (duplicate + context menu migration) → test → deploy
3. US3 + US4 (clickable cards) → test → deploy
4. Each increment adds value without breaking previous work

### Optimal Parallel Execution

With capacity for parallel work:
1. Start T001, T003, T006, T009 simultaneously (4 different files)
2. T002 follows T001; T004 follows T003; T005 follows T004
3. T007 follows T005 + T006; T008 follows T006
4. T010 after everything

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- All new components follow existing codebase patterns (see research.md for reference files)
- `generateDuplicateName` is reused from experience domain — pure string utility, no domain coupling
- `RenameProjectDialog` is reused as-is — no modifications needed
- Card hover pattern: `transition-colors hover:bg-accent/50` consistent with existing sidebar/breadcrumb hover effects
- Context menu isolation via `e.stopPropagation()` on the menu trigger wrapper div

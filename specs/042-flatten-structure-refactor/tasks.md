# Tasks: Flatten Project/Event Structure

**Input**: Design documents from `/specs/042-flatten-structure-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested - focus on manual verification flows from quickstart.md

**Organization**: Tasks organized by implementation phase to enable incremental delivery while maintaining code integrity.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Shared schemas**: `packages/shared/src/schemas/`
- **Frontend app**: `apps/clementine-app/src/`
- **Backend functions**: `functions/src/`
- **Firebase config**: `firebase/`

---

## Phase 1: Schema Changes (packages/shared)

**Purpose**: Update Zod schemas to flatten event config into project. This phase MUST complete before any other changes.

**Goal**: Project schema contains config directly, event schemas deleted

### Schema Migration

- [X] T001 [P] Create `packages/shared/src/schemas/project/project-config.schema.ts` by copying content from `event/project-event-config.schema.ts` and renaming exports (`ProjectEventConfig` → `ProjectConfig`, `projectEventConfigSchema` → `projectConfigSchema`)
- [X] T002 [P] Create `packages/shared/src/schemas/project/experiences.schema.ts` by moving content from `event/experiences.schema.ts`
- [X] T003 Modify `packages/shared/src/schemas/project/project.schema.ts` to add config fields (`draftConfig`, `publishedConfig`, `draftVersion`, `publishedVersion`, `publishedAt`) and remove `activeEventId` field
- [X] T004 Update `packages/shared/src/schemas/project/index.ts` to export new schemas and add backward compatibility aliases (`projectEventConfigSchema`, `ProjectEventConfig`)
- [X] T005 Modify `packages/shared/src/schemas/session/session.schema.ts` to remove `eventId` field (keep as looseObject so existing docs still parse)
- [X] T006 Delete `packages/shared/src/schemas/event/` folder entirely (project-event.schema.ts, project-event-config.schema.ts, experiences.schema.ts, index.ts)
- [X] T007 Update `packages/shared/src/schemas/index.ts` to remove event folder exports and ensure project exports are correct
- [X] T008 Run `pnpm --filter @clementine/shared build` and fix any TypeScript errors

**Checkpoint**: Shared package builds successfully with new schema structure

---

## Phase 2: Backend Changes (functions/)

**Purpose**: Update Cloud Functions to work with flattened project structure

**Goal**: Backend reads config from project document, session creation works without eventId

### Repository Updates

- [X] T009 Modify `functions/src/repositories/session.ts` to remove eventId from session creation and any eventId handling
- [X] T010 Search `functions/src/` for any remaining `eventId` references and update accordingly
- [X] T011 Verify `functions/src/repositories/job.ts` has no eventId dependencies (jobs reference projectId and experienceId)

### Migration Script

- [X] T012 Create `functions/scripts/migrations/042-flatten-events.ts` migration script that: reads all projects with activeEventId, copies event config to project, removes activeEventId, marks event as migrated

### Build Verification

- [X] T013 Run `pnpm --filter functions build` and fix any TypeScript errors

**Checkpoint**: Functions build successfully, migration script ready

---

## Phase 3: Frontend Domain Rename (apps/clementine-app/domains)

**Purpose**: Rename `domains/event/` to `domains/project-config/` and update all internal naming

**Goal**: Event domain becomes project-config domain with proper naming conventions

### Domain Folder Rename

- [X] T014 Rename folder `apps/clementine-app/src/domains/event/` to `apps/clementine-app/src/domains/project-config/`

### Shared Hooks & Queries Rename

- [X] T015 Rename `domains/project-config/shared/hooks/useProjectEvent.ts` to `useProjectConfig.ts` and update hook name and remove eventId param
- [X] T016 Rename `domains/project-config/shared/queries/project-event.query.ts` to `project-config.query.ts` and update query function names
- [X] T017 Rename `domains/project-config/shared/lib/updateEventConfigField.ts` to `updateProjectConfigField.ts` and update function name

### Designer Components Rename

- [X] T018 Rename `domains/project-config/designer/containers/EventDesignerLayout.tsx` to `ProjectConfigDesignerLayout.tsx` and update component name
- [X] T019 Rename `domains/project-config/designer/components/EventDesignerSidebar.tsx` to `ProjectConfigDesignerSidebar.tsx` and update component name
- [X] T020 Rename `domains/project-config/designer/hooks/usePublishEvent.ts` to `usePublishProjectConfig.ts` and update hook name, remove eventId param

### Settings Components Rename

- [X] T021 Rename `domains/project-config/settings/containers/EventSettingsPage.tsx` to `ProjectConfigSettingsPage.tsx` and update component name

### Update Internal Imports

- [X] T022 Update all imports within `domains/project-config/` to use new file names and component names
- [X] T023 [P] Update `domains/project-config/theme/hooks/useUpdateTheme.ts` to remove eventId param
- [X] T024 [P] Update `domains/project-config/welcome/hooks/useUpdateWelcome.ts` to remove eventId param
- [X] T025 [P] Update `domains/project-config/share/hooks/useUpdateShare.ts` to remove eventId param
- [X] T026 [P] Update `domains/project-config/settings/hooks/useUpdateShareOptions.ts` to remove eventId param
- [X] T027 [P] Update `domains/project-config/settings/hooks/useUpdateOverlays.ts` to remove eventId param
- [X] T028 [P] Update `domains/project-config/experiences/hooks/useUpdateEventExperiences.ts` to `useUpdateProjectExperiences.ts` and remove eventId param

### Delete Event CRUD Hooks

- [X] T029 Delete `domains/project/events/` folder entirely (useProjectEvents, useCreateProjectEvent, useDeleteProjectEvent, useActivateProjectEvent, useRenameProjectEvent)

### Update Project Domain

- [X] T030 Modify `domains/project/shared/hooks/useProject.ts` to return full project with config fields (ensure schema imports updated)
- [X] T031 Modify `domains/project/shared/queries/project.query.ts` to use updated projectSchema with config

**Checkpoint**: Domain structure renamed, all hooks updated internally

---

## Phase 4: Frontend Route Restructure (apps/clementine-app/routes)

**Purpose**: Flatten routes from `/projects/$projectId/events/$eventId/*` to `/projects/$projectId/*`

**Goal**: Designer routes work directly under project without event nesting

### Create New Routes

- [ ] T032 Create `apps/clementine-app/src/app/routes/workspace/$workspaceSlug.projects/$projectId.welcome.tsx` based on `$projectId.events/$eventId.welcome.tsx` but using projectId only
- [ ] T033 Create `apps/clementine-app/src/app/routes/workspace/$workspaceSlug.projects/$projectId.theme.tsx` based on `$projectId.events/$eventId.theme.tsx` but using projectId only
- [ ] T034 Create `apps/clementine-app/src/app/routes/workspace/$workspaceSlug.projects/$projectId.share.tsx` based on `$projectId.events/$eventId.share.tsx` but using projectId only
- [ ] T035 Create `apps/clementine-app/src/app/routes/workspace/$workspaceSlug.projects/$projectId.settings.tsx` based on `$projectId.events/$eventId.settings.tsx` but using projectId only

### Update Project Layout Route

- [ ] T036 Modify `apps/clementine-app/src/app/routes/workspace/$workspaceSlug.projects/$projectId.tsx` to include designer layout (previously in $eventId.tsx)
- [ ] T037 Modify `apps/clementine-app/src/app/routes/workspace/$workspaceSlug.projects/$projectId.index.tsx` to redirect to welcome or show project overview

### Delete Old Event Routes

- [ ] T038 Delete entire `apps/clementine-app/src/app/routes/workspace/$workspaceSlug.projects/$projectId.events/` directory

**Checkpoint**: Routes work at project level without event nesting

---

## Phase 5: Update All External Imports

**Purpose**: Update all components and files that import from old event domain paths

**Goal**: All imports point to project-config domain, no broken imports

### Search and Replace Imports

- [ ] T039 Search all files in `apps/clementine-app/src/` for `@/domains/event/` imports and update to `@/domains/project-config/`
- [ ] T040 Search all files for `useProjectEvent` usage and update to use `useProject` from project domain (with config) or `useProjectConfig` from project-config domain
- [ ] T041 Search all files for `usePublishEvent` and update to `usePublishProjectConfig`
- [ ] T042 Search all files for `EventDesignerLayout` and update to `ProjectConfigDesignerLayout`
- [ ] T043 Search all files for `EventDesignerSidebar` and update to `ProjectConfigDesignerSidebar`
- [ ] T044 Search all files for `EventSettingsPage` and update to `ProjectConfigSettingsPage`
- [ ] T045 Search all files for `updateEventConfigField` and update to `updateProjectConfigField`

### Update Components Using eventId

- [ ] T046 Search all components for `eventId` in useParams() calls and remove
- [ ] T047 Update all navigation/Link components that include eventId in route params

### Type Import Updates

- [ ] T048 Search for `ProjectEventFull` type imports and update to use `Project` type
- [ ] T049 Search for `ProjectEventConfig` type imports and update to `ProjectConfig`
- [ ] T050 Search for `projectEventConfigSchema` imports and update to `projectConfigSchema`

**Checkpoint**: All imports updated, no references to old event domain

---

## Phase 6: Security Rules & Firebase Config

**Purpose**: Update Firestore security rules to remove events subcollection

**Goal**: Security rules work without events match block

### Security Rules

- [ ] T051 Modify `firebase/firestore.rules` to remove the `/projects/{projectId}/events/{eventId}` match block entirely

**Checkpoint**: Security rules updated, no event references

---

## Phase 7: Build & Type Check

**Purpose**: Ensure everything compiles and types are correct

**Goal**: Full build passes with no TypeScript errors

### Build Verification

- [ ] T052 Run `pnpm app:type-check` and fix any TypeScript errors in frontend
- [ ] T053 Run `pnpm app:lint` and fix any linting errors
- [ ] T054 Run `pnpm app:build` and verify production build succeeds

**Checkpoint**: Full build passes

---

## Phase 8: Manual Verification

**Purpose**: Verify all user flows work correctly per quickstart.md

**Goal**: All critical flows pass manual testing

### Admin Flow Verification

- [ ] T055 Test: Create new project → verify draftConfig created on project document
- [ ] T056 Test: Configure theme → verify saves to project.draftConfig.theme
- [ ] T057 Test: Configure welcome screen → verify saves to project.draftConfig.welcome
- [ ] T058 Test: Configure share screen → verify saves to project.draftConfig.share
- [ ] T059 Test: Publish project → verify publishedConfig populated, versions synced

### Guest Flow Verification

- [ ] T060 Test: Join via link → select experience → capture → share (full guest journey)
- [ ] T061 Test: Guest session created without eventId field

### Preview Flow Verification

- [ ] T062 Test: Admin preview uses draft config correctly (ghost project pattern)

### Real-time Updates Verification

- [ ] T063 Test: Config changes reflect immediately in preview pane

**Checkpoint**: All user flows verified working

---

## Phase 9: Polish & Cleanup

**Purpose**: Final cleanup and documentation

**Goal**: Clean codebase with no dead code

### Dead Code Removal

- [ ] T064 Search for any remaining `activeEventId` references and remove
- [ ] T065 Search for any remaining `ProjectEventFull` references and remove
- [ ] T066 Search for any remaining `/events/` route references in navigation and remove
- [ ] T067 Remove backward compatibility aliases from `packages/shared` if no longer needed

### Final Verification

- [ ] T068 Run `pnpm app:check` (format + lint) one final time
- [ ] T069 Verify dev server starts without errors: `pnpm app:dev`

**Checkpoint**: Refactor complete, codebase clean

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Schema)**: No dependencies - START HERE
- **Phase 2 (Backend)**: Depends on Phase 1
- **Phase 3 (Domain Rename)**: Depends on Phase 1
- **Phase 4 (Routes)**: Depends on Phase 3
- **Phase 5 (Imports)**: Depends on Phase 3 and Phase 4
- **Phase 6 (Security)**: Can run in parallel with Phase 3-5
- **Phase 7 (Build)**: Depends on Phase 1-6
- **Phase 8 (Verification)**: Depends on Phase 7
- **Phase 9 (Cleanup)**: Depends on Phase 8

### Parallel Opportunities

**Within Phase 1**:
- T001 and T002 can run in parallel (different files)

**Within Phase 3**:
- T023, T024, T025, T026, T027, T028 can run in parallel (different hook files)

**Between Phases**:
- Phase 2 and Phase 3 can start in parallel after Phase 1 completes
- Phase 6 can run anytime after Phase 1

---

## Implementation Strategy

### Recommended Order

1. **Complete Phase 1** (Schema) - This is the foundation
2. **Run Phase 2 and Phase 3 in parallel** - Backend and domain rename are independent
3. **Complete Phase 4** (Routes) after Phase 3
4. **Complete Phase 5** (Imports) - comprehensive search/replace
5. **Complete Phase 6** (Security) - quick update
6. **Complete Phase 7** (Build) - verify everything compiles
7. **Complete Phase 8** (Verification) - manual testing
8. **Complete Phase 9** (Cleanup) - final polish

### MVP Stopping Point

After Phase 7 (Build), the refactor is functionally complete. Phase 8 and 9 are verification and polish.

### Risk Mitigation

- Run `pnpm app:type-check` frequently during Phase 5 to catch import issues early
- Keep old event files until Phase 7 passes (delete in Phase 9 if needed for rollback)
- Test each user flow immediately after its related changes

---

## Notes

- TypeScript strict mode will catch most missed references
- Use `grep -r "eventId" apps/` to find remaining references
- Use `grep -r "@/domains/event" apps/` to find remaining imports
- Commit after each phase for easy rollback
- Total estimated effort: 15-22 hours per spec.md

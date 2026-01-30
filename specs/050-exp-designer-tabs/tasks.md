# Tasks: Experience Designer Tabs - Collect and Generate

**Input**: Design documents from `/specs/050-exp-designer-tabs/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/routes.md, quickstart.md

**Tests**: Tests are NOT explicitly requested in the feature specification. This task list focuses on implementation and manual testing.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a TanStack Start web application with monorepo structure:
- **Frontend**: `apps/clementine-app/src/`
- **Shared**: `packages/shared/src/`
- **Backend**: `functions/src/` (untouched in this feature)

---

## Phase 1: Setup & Frontend Cleanup

**Purpose**: Remove deprecated `transform.pipeline` step type from shared schemas and frontend step system before adding tabs

**⚠️ CRITICAL**: Complete this phase first to establish clean foundation for tab implementation

### Shared Package Schema Cleanup

- [ ] T001 [P] Delete transform pipeline step schema in `packages/shared/src/schemas/experience/steps/transform-pipeline.schema.ts`
- [ ] T002 Remove `transformPipelineStepSchema` from discriminated union and import statement in `packages/shared/src/schemas/experience/step.schema.ts`
- [ ] T003 Build shared package and verify no TypeScript errors: `pnpm --filter @clementine/shared build`

### Frontend Step System Cleanup

- [ ] T004 [P] Delete TransformPipelineConfigPanel component in `apps/clementine-app/src/domains/experience/steps/config-panels/TransformPipelineConfigPanel.tsx`
- [ ] T005 [P] Delete TransformPipelineRenderer component in `apps/clementine-app/src/domains/experience/steps/renderers/TransformPipelineRenderer.tsx`
- [ ] T006 [P] Remove TransformPipelineConfigPanel export from `apps/clementine-app/src/domains/experience/steps/config-panels/index.ts`
- [ ] T007 [P] Remove TransformPipelineRenderer export from `apps/clementine-app/src/domains/experience/steps/renderers/index.ts`
- [ ] T008 Remove `transform.pipeline` entry from step registry in `apps/clementine-app/src/domains/experience/steps/registry/step-registry.ts`
- [ ] T009 Remove `transform.pipeline` validation logic in `apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts`
- [ ] T010 Remove `createDefaultTransformPipelineConfig` factory function in `apps/clementine-app/src/domains/experience/steps/defaults.ts`
- [ ] T011 Remove `transform.pipeline` case from StepRendererRouter in `apps/clementine-app/src/domains/experience/steps/components/StepRendererRouter.tsx`

### Validation

- [ ] T012 Run frontend type check and verify no errors: `pnpm app:type-check`
- [ ] T013 Search for remaining transform.pipeline references: `grep -r "transform\.pipeline" apps/ packages/`
- [ ] T014 Search for remaining TransformPipeline imports: `grep -r "TransformPipeline" apps/`

**Checkpoint**: Transform pipeline step type completely removed from codebase. Clean foundation ready for tab implementation.

---

## Phase 2: User Story 1 - Navigate Between Collect and Generate Tabs (Priority: P1) 🎯

**Goal**: Core tab navigation structure allowing users to switch between Collect (step management) and Generate (transform pipeline placeholder) tabs with URL-based routing

**Independent Test**: Navigate to an experience and click between tabs. Verify URL updates correctly (`/collect` ↔ `/generate`), tab highlighting works, and step selection is preserved when returning to Collect tab. Test direct URL navigation and browser back/forward.

### Route Files

- [ ] T015 [P] [US1] Create Collect tab route in `apps/clementine-app/src/app/workspace/$workspaceSlug.experiences/$experienceId.collect.tsx` with search schema for `?step=` param and render ExperienceDesignerLayout + ExperienceCollectPage
- [ ] T016 [P] [US1] Create Generate tab route in `apps/clementine-app/src/app/workspace/$workspaceSlug.experiences/$experienceId.generate.tsx` with no search schema and render ExperienceDesignerLayout + ExperienceGeneratePage
- [ ] T017 [US1] Update parent route in `apps/clementine-app/src/app/workspace/$workspaceSlug.experiences/$experienceId.tsx` to add `beforeLoad` redirect to `/collect`

### Tab Configuration

- [ ] T018 [US1] Add `experienceDesignerTabs` array configuration to ExperienceDesignerLayout in `apps/clementine-app/src/domains/experience/designer/containers/ExperienceDesignerLayout.tsx` with Collect and Generate tab items
- [ ] T019 [US1] Pass `tabs` prop to TopNavBar component in ExperienceDesignerLayout in `apps/clementine-app/src/domains/experience/designer/containers/ExperienceDesignerLayout.tsx`

### Manual Testing Validation

- [ ] T020 [US1] Manual test: Start dev server and navigate to experience designer - verify redirect from `/experiences/{id}` to `/experiences/{id}/collect`
- [ ] T021 [US1] Manual test: Click Collect tab - verify URL updates and tab highlights as active
- [ ] T022 [US1] Manual test: Click Generate tab - verify URL updates and tab highlights as active
- [ ] T023 [US1] Manual test: Navigate with step param `/collect?step=abc` → Generate → back to Collect - verify step selection preserved
- [ ] T024 [US1] Manual test: Use browser back/forward buttons - verify tab navigation works correctly
- [ ] T025 [US1] Manual test: Refresh page on each tab - verify tab state preserved

**Checkpoint**: Tab navigation fully functional with URL routing, visual feedback, and query param preservation

---

## Phase 3: User Story 2 - Manage Steps in Collect Tab (Priority: P1)

**Goal**: Preserve 100% feature parity for step management in renamed Collect tab - all existing functionality (add, delete, reorder, rename, configure steps) continues working

**Independent Test**: Access Collect tab and perform all step operations: add new step, delete step, reorder via drag-and-drop, rename step, edit config. Verify URL updates with step selection, saves work (immediate for list operations, debounced for config edits), mobile sheets function correctly.

### Component Renaming

- [ ] T026 [US2] Rename `apps/clementine-app/src/domains/experience/designer/containers/ExperienceDesignerPage.tsx` to `ExperienceCollectPage.tsx` and update component name
- [ ] T027 [US2] Update barrel export in `apps/clementine-app/src/domains/experience/designer/containers/index.ts` to export ExperienceCollectPage
- [ ] T028 [US2] Update Collect route import in `apps/clementine-app/src/app/workspace/$workspaceSlug.experiences/$experienceId.collect.tsx` to use ExperienceCollectPage

### Manual Testing Validation

- [ ] T029 [US2] Manual test: Add new step in Collect tab - verify step appears in list and URL updates to `?step={newStepId}`
- [ ] T030 [US2] Manual test: Navigate to Collect tab with `?step={stepId}` and refresh - verify step remains selected
- [ ] T031 [US2] Manual test: Reorder steps via drag-and-drop - verify changes save immediately and order persists
- [ ] T032 [US2] Manual test: Edit step configuration - verify 2-second debounced save and save status indicators update
- [ ] T033 [US2] Manual test: Click different steps - verify URL updates with step ID query param
- [ ] T034 [US2] Manual test: Test on mobile viewport (320px) - verify mobile sheets work for step list and config panel

**Checkpoint**: All existing step management functionality works perfectly in renamed Collect tab. Zero regressions.

---

## Phase 4: User Story 3 - View Generate Tab Placeholder (Priority: P2)

**Goal**: Create new `generate` subdomain with placeholder page showing WIP message for future transform pipeline functionality

**Independent Test**: Navigate to Generate tab and verify placeholder page displays with centered "Coming soon" message, Sparkles icon, and descriptive text. Verify TopNavBar shows same breadcrumbs and actions as Collect tab.

### Generate Subdomain Structure

- [ ] T035 [P] [US3] Create generate subdomain directory structure: `apps/clementine-app/src/domains/experience/generate/containers/`
- [ ] T036 [P] [US3] Create ExperienceGeneratePage component in `apps/clementine-app/src/domains/experience/generate/containers/ExperienceGeneratePage.tsx` with centered placeholder (Sparkles icon, heading, description, "Coming soon" text)
- [ ] T037 [US3] Create barrel export in `apps/clementine-app/src/domains/experience/generate/containers/index.ts` exporting ExperienceGeneratePage
- [ ] T038 [US3] Create main barrel export in `apps/clementine-app/src/domains/experience/generate/index.ts` exporting from containers
- [ ] T039 [US3] Update Generate route import in `apps/clementine-app/src/app/workspace/$workspaceSlug.experiences/$experienceId.generate.tsx` to use ExperienceGeneratePage from new subdomain

### Manual Testing Validation

- [ ] T040 [US3] Manual test: Click Generate tab from Collect - verify placeholder page displays with WIP message
- [ ] T041 [US3] Manual test: Navigate directly to `/workspace/{slug}/experiences/{expId}/generate` - verify placeholder content loads
- [ ] T042 [US3] Manual test: Verify TopNavBar on Generate tab shows same breadcrumbs, save status, changes badge, preview and publish buttons
- [ ] T043 [US3] Manual test: Test placeholder on mobile viewport (320px) - verify centered content works on all screen sizes

**Checkpoint**: Generate subdomain created with placeholder page. Future transform pipeline work has dedicated domain.

---

## Phase 5: User Story 4 - Preserve Experience-Level Actions Across Tabs (Priority: P1)

**Goal**: Ensure experience-level actions (preview, publish, save status, experience details) work identically from both Collect and Generate tabs

**Independent Test**: Switch between tabs and verify all TopNavBar actions remain functional: Preview modal opens showing steps, Publish button publishes experience, Save status indicators reflect same state, Experience details dialog opens from identity badge.

### Verification Tasks

- [ ] T044 [US4] Verify ExperienceDesignerLayout shares same props (experience, workspaceSlug, workspaceId) with both Collect and Generate routes
- [ ] T045 [US4] Verify TopNavBar `right` slot contains Preview button, Publish button, save status, and changes badge in ExperienceDesignerLayout
- [ ] T046 [US4] Verify experience designer store (pendingSaves, lastCompletedAt) is accessed from ExperienceDesignerLayout (shared across tabs)

### Manual Testing Validation

- [ ] T047 [US4] Manual test: Click Preview button from Collect tab - verify experience preview modal opens showing all steps
- [ ] T048 [US4] Manual test: Click Preview button from Generate tab - verify same preview modal behavior
- [ ] T049 [US4] Manual test: Make changes in Collect tab, switch to Generate - verify save status indicators (pending saves, last saved timestamp) reflect same state
- [ ] T050 [US4] Manual test: Click Publish button from Collect tab - verify experience publishes and success toast appears
- [ ] T051 [US4] Manual test: Click Publish button from Generate tab - verify same publish behavior
- [ ] T052 [US4] Manual test: Click experience identity badge from Collect tab - verify experience details dialog opens
- [ ] T053 [US4] Manual test: Click experience identity badge from Generate tab - verify same dialog behavior

**Checkpoint**: Experience-level actions work consistently across both tabs. No functionality lost by tab separation.

---

## Phase 6: Final Validation & Polish

**Purpose**: Complete validation across all user stories and ensure quality standards

### Cross-Story Integration Testing

- [ ] T054 Manual test: Navigate to experience designer and test complete workflow: redirect → Collect tab → add/edit/reorder steps → Generate tab → back to Collect with step preserved → preview → publish
- [ ] T055 Manual test: Test all edge cases from spec: invalid step ID gracefully handled, bookmarked URLs work, unsaved changes reflected across tabs, browser back/forward navigation correct
- [ ] T056 Manual test: Test mobile responsive behavior on all tabs (320px, 768px viewports) - tabs render correctly, touch targets ≥ 44x44px, mobile sheets functional

### Code Quality & Validation

- [ ] T057 Run format and lint: `pnpm app:check` - verify all checks pass
- [ ] T058 Run TypeScript type check: `pnpm app:type-check` - verify no type errors
- [ ] T059 Build shared package: `pnpm --filter @clementine/shared build` - verify successful build
- [ ] T060 Run shared package tests: `pnpm --filter @clementine/shared test` - verify all tests pass

### Standards Compliance Review

- [ ] T061 Review code against `standards/frontend/design-system.md` - verify theme tokens used, no hard-coded colors
- [ ] T062 Review code against `standards/frontend/component-libraries.md` - verify shadcn/ui TopNavBar usage correct
- [ ] T063 Review code against `standards/frontend/routing.md` - verify TanStack Router patterns followed
- [ ] T064 Review code against `standards/global/project-structure.md` - verify domain-driven file organization
- [ ] T065 Review code against `standards/global/code-quality.md` - verify validation workflow followed

### Final Checks

- [ ] T066 Search for remaining transform.pipeline references: `grep -r "transform\.pipeline" apps/ packages/` - verify zero results
- [ ] T067 Search for remaining TransformPipeline references: `grep -r "TransformPipeline" apps/` - verify zero results
- [ ] T068 Verify all acceptance scenarios from spec.md pass for all 4 user stories
- [ ] T069 Update CLAUDE.md if any new patterns or conventions were established (check for active technologies)

**Checkpoint**: Feature complete, all standards met, ready for PR and deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup & Cleanup (Phase 1)**: No dependencies - MUST complete first (removes deprecated code)
- **User Story 1 (Phase 2)**: Depends on Phase 1 completion - Core tab navigation
- **User Story 2 (Phase 3)**: Depends on Phase 1 and US1 routes existing - Can start after T017 (routes created)
- **User Story 3 (Phase 4)**: Depends on Phase 1 and US1 tab config - Can start after T019 (tabs prop added)
- **User Story 4 (Phase 5)**: Depends on both US1 and US3 being complete - Verification tasks
- **Final Validation (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core dependency - MUST complete before US2, US3, US4 can function
  - Establishes routes, tab configuration, navigation structure
- **User Story 2 (P1)**: Can start after US1 routes exist (after T017)
  - Independent: Renames existing page, preserves step management
- **User Story 3 (P2)**: Can start after US1 tab config exists (after T019)
  - Independent: Creates new subdomain and placeholder
- **User Story 4 (P1)**: Verification only - depends on US1 and US3 being complete
  - Tests that experience-level actions work across both tabs

### Within Each User Story

**US1 (Tab Navigation)**:
1. Routes (T015, T016, T017) - can run in parallel
2. Tab config (T018, T019) - sequential after routes
3. Manual tests (T020-T025) - sequential after tab config

**US2 (Collect Tab)**:
1. Component rename (T026, T027, T028) - sequential
2. Manual tests (T029-T034) - sequential after rename

**US3 (Generate Placeholder)**:
1. Directory structure and components (T035-T039) - can run in parallel except T039 depends on T036
2. Manual tests (T040-T043) - sequential after components

**US4 (Cross-Tab Actions)**:
1. Verification tasks (T044-T046) - can run in parallel (just verification, no changes)
2. Manual tests (T047-T053) - sequential after verification

### Parallel Opportunities

**Phase 1 (Setup)** - High parallelism:
- T001 (delete schema) || T004 (delete config panel) || T005 (delete renderer) || T006 (remove export) || T007 (remove export)
- After T002 completes: T003 (build) must run alone
- T008-T011 can run in parallel (different files)
- T012-T014 sequential (validation)

**Phase 2 (US1)** - Moderate parallelism:
- T015, T016 can run in parallel (different route files)
- T017 sequential (parent route)
- T018, T019 sequential (same file)
- T020-T025 sequential (manual tests)

**Phase 3 (US2)** - Low parallelism:
- T026-T028 sequential (rename operation)
- T029-T034 sequential (manual tests)

**Phase 4 (US3)** - High parallelism:
- T035, T036, T037, T038 can run in parallel
- T039 depends on T036 completion
- T040-T043 sequential (manual tests)

**Phase 5 (US4)** - Moderate parallelism:
- T044-T046 can run in parallel (verification only)
- T047-T053 sequential (manual tests)

**Phase 6 (Final)** - Moderate parallelism:
- T054-T056 sequential (integration tests)
- T057-T060 can run in parallel (different commands)
- T061-T065 can run in parallel (reviews)
- T066-T069 sequential (final checks)

---

## Parallel Example: Phase 1 Cleanup

```bash
# Launch parallel cleanup tasks together:
Task: "Delete transform pipeline step schema in packages/shared/.../transform-pipeline.schema.ts"
Task: "Delete TransformPipelineConfigPanel component in apps/.../config-panels/TransformPipelineConfigPanel.tsx"
Task: "Delete TransformPipelineRenderer component in apps/.../renderers/TransformPipelineRenderer.tsx"
Task: "Remove TransformPipelineConfigPanel export from apps/.../config-panels/index.ts"
Task: "Remove TransformPipelineRenderer export from apps/.../renderers/index.ts"

# Then modify step schema (sequential):
Task: "Remove transformPipelineStepSchema from discriminated union in step.schema.ts"

# Then build (sequential):
Task: "Build shared package and verify: pnpm --filter @clementine/shared build"
```

---

## Parallel Example: Phase 2 Routes

```bash
# Launch route creation in parallel:
Task: "Create Collect tab route in $experienceId.collect.tsx"
Task: "Create Generate tab route in $experienceId.generate.tsx"

# After routes exist, update parent (sequential):
Task: "Update parent route redirect in $experienceId.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 4 Only)

**Minimum viable feature** - Core tab navigation with step management:

1. Complete Phase 1: Setup & Cleanup (removes deprecated code)
2. Complete Phase 2: User Story 1 (tab navigation structure)
3. Complete Phase 3: User Story 2 (Collect tab step management)
4. Complete Phase 5: User Story 4 (verify cross-tab actions)
5. **STOP and VALIDATE**: Test tab navigation and step management
6. Deploy/demo if ready

**Skipped for MVP**: User Story 3 (Generate placeholder) - can add later as P2

### Incremental Delivery (All User Stories)

Full feature with placeholder for future work:

1. Complete Phase 1: Setup → Deprecated code removed
2. Complete Phase 2: User Story 1 → Tab navigation works
3. Complete Phase 3: User Story 2 → Collect tab functional
4. Complete Phase 4: User Story 3 → Generate placeholder ready
5. Complete Phase 5: User Story 4 → Cross-tab verification
6. Complete Phase 6: Final Validation → Deploy

### Sequential Solo Developer Strategy

Recommended order for single developer:

1. Phase 1 (T001-T014): ~1-2 hours - Cleanup deprecated code
2. Phase 2 (T015-T025): ~2-3 hours - Core tab navigation
3. Phase 3 (T026-T034): ~1 hour - Rename and verify Collect tab
4. Phase 4 (T035-T043): ~1-2 hours - Generate placeholder
5. Phase 5 (T044-T053): ~1 hour - Cross-tab verification
6. Phase 6 (T054-T069): ~1-2 hours - Final validation
7. **Total: ~7-11 hours**

### Parallel Team Strategy

With 2-3 developers after Phase 1 cleanup:

**Developer A**: User Story 1 (Phase 2) - Tab navigation
**Developer B**: User Story 3 (Phase 4) - Generate placeholder (starts after T019)
**Developer C**: User Story 2 (Phase 3) - Collect tab (starts after T017)

Then converge on User Story 4 (Phase 5) and Final Validation (Phase 6)

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Manual tests verify behavior without writing automated tests
- Commit after each logical group of tasks (e.g., after each user story phase)
- Stop at any checkpoint to validate story independently
- This feature has zero backend changes (functions/ completely untouched)
- Transform pipeline step type removed in Phase 1 before tab implementation
- Generate subdomain (`domains/experience/generate/`) reserved for future transform pipeline work

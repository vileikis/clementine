# Tasks: Transform Cleanup & Guardrails

**Input**: Design documents from `/specs/063-transform-cleanup/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks grouped by user story priority. Schema cleanup is foundational (must complete before user stories).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

This is a **monorepo** with:
- `packages/shared/` - Shared Zod schemas and types
- `apps/clementine-app/` - TanStack Start frontend
- `functions/` - Firebase Cloud Functions

---

## Phase 1: Setup

**Purpose**: Verify branch and understand scope

- [x] T001 Verify on branch `063-transform-cleanup` and review quickstart.md
- [x] T002 Run `pnpm --filter @clementine/shared build` to confirm current shared package builds

---

## Phase 2: Foundational - Schema Cleanup (Blocks All User Stories)

**Purpose**: Remove deprecated schema fields. MUST complete before any user story work.

**⚠️ CRITICAL**: TypeScript types will change after this phase. All code referencing deprecated fields will show type errors until fixed.

### Session Schema Cleanup

- [x] T003 Remove `answers` field from sessionSchema in `packages/shared/src/schemas/session/session.schema.ts`
- [x] T004 Remove `capturedMedia` field from sessionSchema in `packages/shared/src/schemas/session/session.schema.ts`
- [x] T005 Remove `answerSchema` definition from `packages/shared/src/schemas/session/session.schema.ts`
- [x] T006 Remove `answerValueSchema` definition from `packages/shared/src/schemas/session/session.schema.ts`
- [x] T007 Remove `capturedMediaSchema` definition from `packages/shared/src/schemas/session/session.schema.ts`
- [x] T008 Remove `Answer`, `AnswerValue`, `CapturedMedia` type exports from `packages/shared/src/schemas/session/session.schema.ts`

### Experience Schema Cleanup

- [x] T009 Remove `transformNodes` field from experienceConfigSchema in `packages/shared/src/schemas/experience/experience.schema.ts`
- [x] T010 Remove `transformNodeSchema` import from `packages/shared/src/schemas/experience/experience.schema.ts`
- [x] T011 Evaluate `packages/shared/src/schemas/experience/transform.schema.ts` for removal (check if referenced elsewhere) - **REMOVED**
- [x] T012 Evaluate `packages/shared/src/schemas/experience/nodes/` directory for removal (check if referenced elsewhere) - **REMOVED**

### Verify Shared Package

- [x] T013 Run `pnpm --filter @clementine/shared build` to verify schema changes compile
- [x] T014 Run `pnpm --filter @clementine/shared test` to verify tests pass (update if needed) - **UPDATED TESTS**

**Checkpoint**: Schema cleanup complete. TypeScript types no longer include deprecated fields. Proceed to user stories.

---

## Phase 3: User Story 2 - Reliable Job Creation with Clear Errors (P1)

**Goal**: Add validation guardrails to job creation that fail fast with clear error messages.

**Independent Test**: Attempt job creation with invalid configurations and verify clear error messages.

### Implementation for User Story 2

- [x] T015 [US2] Add published experience check in `functions/src/callable/startTransformPipeline.ts` - throw if `experience.published` is null
- [x] T016 [US2] Add outcome configured check in `functions/src/callable/startTransformPipeline.ts` - throw if `outcome.type` is null
- [x] T017 [US2] Add session responses check in `functions/src/callable/startTransformPipeline.ts` - throw if `responses` is empty
- [x] T018 [US2] Add outcome type implemented check in `functions/src/callable/startTransformPipeline.ts` - throw if type is not 'image'
- [x] T019 [US2] Run `pnpm --filter functions build` to verify Cloud Functions compile

**Checkpoint**: Job creation now validates all requirements upfront with clear error messages.

---

## Phase 4: User Story 3 - Reliable Job Execution with Clear Errors (P1)

**Goal**: Add validation guardrails to image outcome executor that fail fast with clear error messages.

**Independent Test**: Create jobs with invalid outcome configurations and verify clear errors.

### Implementation for User Story 3

- [x] T020 [US3] Add empty prompt check in `functions/src/services/transform/outcomes/imageOutcome.ts` - throw if AI enabled but prompt is empty
- [x] T021 [US3] Convert capture step not found from warning to error in `functions/src/services/transform/outcomes/imageOutcome.ts`
- [x] T022 [US3] Convert empty capture media from return null to error in `functions/src/services/transform/outcomes/imageOutcome.ts`
- [x] T023 [US3] Run `pnpm --filter functions build` to verify Cloud Functions compile

**Checkpoint**: Image outcome executor now validates configuration and fails fast with clear errors.

---

## Phase 5: User Story 4 - No Silent Fallbacks (P2)

**Goal**: Remove all silent fallbacks to deprecated fields in frontend code.

**Independent Test**: Code audit confirms no fallback patterns (`??` to deprecated fields).

### Implementation for User Story 4

- [x] T024 [P] [US4] Remove `answers` fallback in `initFromSession()` in `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`
- [x] T025 [P] [US4] Remove `transformNodes` handling in `apps/clementine-app/src/domains/experience/designer/hooks/usePublishExperience.ts`
- [x] T026 [P] [US4] Remove `transformNodes: []` initialization in `apps/clementine-app/src/domains/experience/shared/hooks/useCreateExperience.ts`
- [x] T027 [P] [US4] Remove deprecated file `apps/clementine-app/src/domains/experience/shared/utils/hasTransformConfig.ts` - **KEPT hasOutcome, removed deprecated functions**
- [x] T028 [P] [US4] Clean up deprecated params in `apps/clementine-app/src/domains/session/shared/hooks/useUpdateSessionProgress.ts`
- [x] T029 [US4] Evaluate `apps/clementine-app/src/domains/experience/transform/` directory for removal (check if still used) - **REMOVED empty subdirectories**
- [x] T030 [US4] Run `pnpm --filter @clementine/app type-check` to verify frontend compiles
- [x] T031 [US4] Run `pnpm --filter @clementine/app check` to fix linting/formatting

**Checkpoint**: Frontend no longer has any silent fallbacks to deprecated fields.

---

## Phase 6: User Story 1 - Clean Experience Editor Navigation (P1)

**Goal**: Verify UI is clean and fix any remaining references to deprecated "Generate" tab.

**Independent Test**: Navigate experience editor and verify only "Collect" and "Create" tabs exist.

### Implementation for User Story 1

- [x] T032 [US1] Fix route comment in `apps/clementine-app/src/app/workspace/$workspaceSlug.experiences/$experienceId.tsx` - change "generate" to "create"
- [x] T033 [US1] Verify no "Generate" tab references in `apps/clementine-app/src/domains/experience/designer/`

**Checkpoint**: UI references are clean. No deprecated "Generate" tab terminology remains.

---

## Phase 7: User Story 6 - Documentation Updates (P3)

**Goal**: Ensure documentation reflects outcome-based architecture.

**Independent Test**: Review documentation files for accuracy.

### Implementation for User Story 6

- [x] T034 [P] [US6] Review `functions/README.md` for accuracy and update if needed - **No changes needed**
- [x] T035 [P] [US6] Verify no "transform node workflow" references in project documentation - **Only in specs/requirements (design docs)**

**Checkpoint**: Documentation accurately reflects current architecture.

---

## Phase 8: Polish & Final Verification

**Purpose**: Final verification and code audit

- [x] T036 Run code audit commands from quickstart.md to verify no deprecated field usage - **Also fixed seed-emulators.ts**
- [x] T037 Run `pnpm app:check` from monorepo root to verify frontend
- [x] T038 Run `pnpm functions:build` from monorepo root to verify Cloud Functions
- [ ] T039 Manual test: Create experience, publish, complete session, verify job succeeds
- [ ] T040 Manual test: Verify job creation fails with clear error for unpublished experience
- [ ] T041 Manual test: Verify job creation fails with clear error for missing outcome
- [ ] T042 Manual test: Verify job creation fails with clear error for empty responses

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - **BLOCKS ALL USER STORIES**
- **User Stories (Phase 3-7)**: All depend on Foundational completion
  - US2, US3: Can run in parallel (different files)
  - US4: Can run in parallel with US2/US3 (different packages)
  - US1, US6: Can run in parallel with others
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

| Story | Priority | Depends On | Can Parallel With |
|-------|----------|------------|-------------------|
| US2 - Job Creation Guardrails | P1 | Foundational | US3, US4, US1, US6 |
| US3 - Job Execution Guardrails | P1 | Foundational | US2, US4, US1, US6 |
| US4 - No Silent Fallbacks | P2 | Foundational | US2, US3, US1, US6 |
| US1 - Clean UI References | P1 | Foundational | US2, US3, US4, US6 |
| US6 - Documentation | P3 | Foundational | All |

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
- T003-T008 (session schema) can run sequentially in one file
- T009-T010 (experience schema) can run sequentially in one file
- Session and Experience schema work can be parallel

**Within Phase 5 (US4)**:
- T024, T025, T026, T027, T028 all marked [P] - different files

**Across User Stories**:
- All user story phases can run in parallel after Foundational completes

---

## Parallel Example: User Story 4 Tasks

```bash
# All these tasks modify different files and can run in parallel:
Task: "T024 Remove answers fallback in experienceRuntimeStore.ts"
Task: "T025 Remove transformNodes handling in usePublishExperience.ts"
Task: "T026 Remove transformNodes initialization in useCreateExperience.ts"
Task: "T027 Remove hasTransformConfig.ts file"
Task: "T028 Clean up useUpdateSessionProgress.ts"
```

---

## Implementation Strategy

### MVP First (Foundational + Core Guardrails)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (schema cleanup)
3. Complete Phase 3: US2 (job creation guardrails)
4. Complete Phase 4: US3 (job execution guardrails)
5. **STOP and VALIDATE**: Test job creation/execution with clear errors
6. Deploy/demo if ready

### Full Cleanup

1. Complete MVP (Phases 1-4)
2. Add Phase 5: US4 (frontend fallback removal)
3. Add Phase 6: US1 (verify UI clean)
4. Add Phase 7: US6 (documentation)
5. Complete Phase 8: Polish and verification

### Recommended Approach

Since all user stories depend on Foundational (Phase 2), complete that first, then work through user stories in priority order:

1. Foundational (Phase 2) - **Must be first**
2. US2 + US3 (P1) - **Can be parallel** - Core guardrails
3. US4 (P2) - Frontend cleanup
4. US1 + US6 (P1, P3) - Verification and documentation
5. Polish (Phase 8)

---

## Notes

- [P] tasks = different files, no dependencies within that phase
- [Story] label maps task to specific user story for traceability
- US5 (Dev Warnings) omitted - fields are removed entirely, warnings not needed
- Schema cleanup is critical path - all other work blocked until complete
- `z.looseObject()` ensures old Firestore documents still parse after schema field removal

# Tasks: Experience Create Outcome Configuration

**Input**: Design documents from `/specs/059-experience-create/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests included for validation logic per plan.md (Principle IV: Minimal Testing Strategy)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)
- Includes exact file paths in descriptions

## Path Conventions

- **Shared package**: `packages/shared/src/schemas/experience/`
- **App domain**: `apps/clementine-app/src/domains/experience/`

---

## Phase 1: Setup (Schema Integration)

**Purpose**: Add create field to experience config schema in shared package

- [ ] T001 [P] Add create field to experienceConfigSchema in `packages/shared/src/schemas/experience/experience.schema.ts`
- [ ] T002 [P] Export CreateOutcome types from `packages/shared/src/schemas/experience/index.ts`
- [ ] T003 Re-export CreateOutcome types in app schemas `apps/clementine-app/src/domains/experience/shared/schemas/index.ts`
- [ ] T004 Build shared package to verify schema compiles: `pnpm --filter @clementine/shared build`

**Checkpoint**: Schema changes complete, types available in app

---

## Phase 2: Foundational (Validation Infrastructure)

**Purpose**: Create validation function that all user stories depend on

**⚠️ CRITICAL**: User story implementation depends on this validation function

- [ ] T005 Create `validateCreateOutcome` function in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.ts`
- [ ] T006 [P] Create unit tests for validation function in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.test.ts`
- [ ] T007 Run validation tests to verify: `pnpm app:test create-outcome-validation`

**Checkpoint**: Foundation ready - validation function tested and available

---

## Phase 3: User Story 1 - Outcome Type Validation (Priority: P1) 🎯 MVP

**Goal**: Prevent publishing when no outcome type is selected

**Independent Test**: Create new experience, attempt publish without type → should fail with "Select an outcome type" error

### Implementation for User Story 1

- [ ] T008 [US1] Implement V1 validation rule (type null check) in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.ts`
- [ ] T009 [US1] Implement V7 validation rule (gif/video coming soon) in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.ts`
- [ ] T010 [US1] Integrate validateCreateOutcome into validateForPublish in `apps/clementine-app/src/domains/experience/designer/hooks/usePublishExperience.ts`
- [ ] T011 [US1] Update publish transaction to set transformNodes=[] in `apps/clementine-app/src/domains/experience/designer/hooks/usePublishExperience.ts`

**Checkpoint**: US1 complete - publishing blocked without valid outcome type

---

## Phase 4: User Story 2 - AI Generation Validation (Priority: P1)

**Goal**: Validate AI prompt and reference media configuration

**Independent Test**: Enable AI with empty prompt → publish fails with "Prompt is required"; add duplicate refMedia displayNames → publish fails listing duplicates

### Implementation for User Story 2

- [ ] T012 [US2] Implement V5 validation rule (prompt required when AI enabled) in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.ts`
- [ ] T013 [US2] Implement V6 validation rule (duplicate refMedia displayNames) in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.ts`
- [ ] T014 [P] [US2] Add unit tests for AI validation rules in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.test.ts`

**Checkpoint**: US2 complete - AI configuration properly validated

---

## Phase 5: User Story 3 - Passthrough Mode Validation (Priority: P2)

**Goal**: Validate passthrough mode requires capture step source

**Independent Test**: Disable AI without capture step → publish fails; select valid capture step → publish succeeds

### Implementation for User Story 3

- [ ] T015 [US3] Implement isCaptureStep helper function in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.ts`
- [ ] T016 [US3] Implement V2 validation rule (passthrough requires source) in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.ts`
- [ ] T017 [US3] Implement V3 validation rule (step not found) in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.ts`
- [ ] T018 [US3] Implement V4 validation rule (step not capture type) in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.ts`
- [ ] T019 [P] [US3] Add unit tests for passthrough validation in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.test.ts`

**Checkpoint**: US3 complete - passthrough mode properly validated

---

## Phase 6: User Story 4 - Options Kind Validation (Priority: P2)

**Goal**: Ensure options.kind matches outcome type

**Independent Test**: Set type=image but options.kind=gif → publish fails with mismatch error

### Implementation for User Story 4

- [ ] T020 [US4] Implement V8 validation rule (options kind mismatch) in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.ts`
- [ ] T021 [P] [US4] Add unit test for options kind validation in `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.test.ts`

**Checkpoint**: US4 complete - options consistency validated

---

## Phase 7: User Story 5 - New Experience Initialization (Priority: P3)

**Goal**: Initialize new experiences with default create configuration

**Independent Test**: Create new experience → verify draft.create has correct defaults (type: null, aiEnabled: true, etc.)

### Implementation for User Story 5

- [ ] T022 [US5] Update experience creation to include create defaults in `apps/clementine-app/src/domains/experience/shared/hooks/useCreateExperience.ts`
- [ ] T023 [P] [US5] Add integration test for new experience defaults in `apps/clementine-app/src/domains/experience/shared/hooks/useCreateExperience.test.ts`

**Checkpoint**: US5 complete - new experiences have proper defaults

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [ ] T024 Run full type check: `pnpm app:type-check`
- [ ] T025 Run all tests: `pnpm app:test`
- [ ] T026 Run lint and format: `pnpm app:check`
- [ ] T027 Manual verification per quickstart.md scenarios
- [ ] T028 Update shared package version if needed in `packages/shared/package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - schema work
- **Foundational (Phase 2)**: Depends on Setup - creates validation infrastructure
- **User Stories (Phase 3-7)**: All depend on Foundational phase
  - US1+US2 (both P1) can run in parallel after Foundation
  - US3+US4 (both P2) can run in parallel after Foundation
  - US5 (P3) can run in parallel with others
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Depends on T005 (validation function created)
- **US2 (P1)**: Depends on T005 - can run parallel with US1
- **US3 (P2)**: Depends on T005 - can run parallel with US1, US2
- **US4 (P2)**: Depends on T005 - can run parallel with others
- **US5 (P3)**: Independent of validation - only needs schema (Phase 1)

### Within Each User Story

- Validation rules → integration with publish hook
- All tests can run parallel with implementation

### Parallel Opportunities

```text
After Phase 1 (Setup):
  - T005, T006 can start (Foundational)

After Phase 2 (Foundational):
  - US1, US2, US3, US4, US5 can ALL start in parallel

Within US3:
  - T015, T016, T017, T018 are sequential (same file)
  - T019 (tests) can run parallel with implementation
```

---

## Parallel Example: P1 Stories (US1 + US2)

```bash
# After Foundational phase, launch both P1 stories:

# US1 tasks:
Task: "Implement V1 validation rule in create-outcome-validation.ts"
Task: "Implement V7 validation rule in create-outcome-validation.ts"

# US2 tasks (parallel with US1 - different validation rules):
Task: "Implement V5 validation rule in create-outcome-validation.ts"
Task: "Implement V6 validation rule in create-outcome-validation.ts"

# Note: These edit same file but different functions/rules
# Execute sequentially or coordinate to avoid conflicts
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (schema integration)
2. Complete Phase 2: Foundational (validation infrastructure)
3. Complete Phase 3: US1 (type validation)
4. **STOP and VALIDATE**: Test publishing blocked without type
5. This is deployable MVP - experiences must have type to publish

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 → Type validation (MVP deployable)
3. US2 → AI validation (adds prompt/refMedia checks)
4. US3 → Passthrough validation (adds capture step checks)
5. US4 → Options consistency (adds kind mismatch check)
6. US5 → Initialization (new experiences get defaults)

### Recommended Order

For single developer, execute in this order:
1. T001-T004 (Setup)
2. T005-T007 (Foundational)
3. T008-T011 (US1)
4. T012-T014 (US2)
5. T015-T019 (US3)
6. T020-T021 (US4)
7. T022-T023 (US5)
8. T024-T028 (Polish)

---

## Notes

- [P] tasks = different files or independent test files
- [Story] label maps task to specific user story
- All validation rules go in same file - coordinate edits
- US5 (initialization) is independent of validation rules
- Tests are included per plan.md constitution (Principle IV)
- Commit after each phase or logical group

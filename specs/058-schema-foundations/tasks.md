# Tasks: Schema Foundations (PRD 1A)

**Input**: Design documents from `/specs/058-schema-foundations/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/

**Tests**: Tests ARE included per Success Criteria SC-006 (100% branch coverage for validation logic).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

**Monorepo shared package**: `packages/shared/src/schemas/`

---

## Phase 1: Setup

**Purpose**: Verify shared package is ready for new schemas

- [ ] T001 Verify shared package builds cleanly: `pnpm --filter @clementine/shared build`
- [ ] T002 Verify existing tests pass: `pnpm --filter @clementine/shared test`

---

## Phase 2: Foundational

**Purpose**: No blocking prerequisites for this feature - all user stories can be implemented in parallel after Setup

**Note**: This feature has no foundational phase because each schema is independent. User Stories can begin immediately after Setup.

**Checkpoint**: Setup verified - user story implementation can begin

---

## Phase 3: User Story 1 - Create Outcome Schema (Priority: P1) 🎯 MVP

**Goal**: Implement `createOutcomeSchema` with all sub-schemas for outcome-based generation configuration

**Independent Test**: Run `pnpm --filter @clementine/shared test` and verify create-outcome.schema.test.ts passes

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T003 [US1] Create test file `packages/shared/src/schemas/experience/create-outcome.schema.test.ts` with test cases for:
  - Valid image outcome configuration passes validation
  - Invalid model value fails with descriptive error
  - Missing fields get defaults (aiEnabled=true, empty prompt, empty refMedia, default model/aspectRatio)
  - GIF options with fps/duration are accepted
  - Video options with videoPrompt/duration are accepted
  - Discriminated union correctly narrows by `kind` field
  - Null type is valid (not configured state)

### Implementation for User Story 1

- [ ] T004 [US1] Create `packages/shared/src/schemas/experience/create-outcome.schema.ts` with JSDoc header comment
- [ ] T005 [US1] Add `createOutcomeTypeSchema` enum: `'image' | 'gif' | 'video'` in create-outcome.schema.ts
- [ ] T006 [P] [US1] Add `aiImageModelSchema` enum (defined locally, NOT imported from nodes/) in create-outcome.schema.ts
- [ ] T007 [P] [US1] Add `aiImageAspectRatioSchema` enum (defined locally, NOT imported from nodes/) in create-outcome.schema.ts
- [ ] T008 [US1] Add `imageGenerationConfigSchema` with prompt, refMedia, model, aspectRatio defaults in create-outcome.schema.ts
- [ ] T009 [P] [US1] Add `imageOptionsSchema` with `kind: 'image'` literal in create-outcome.schema.ts
- [ ] T010 [P] [US1] Add `gifOptionsSchema` with `kind: 'gif'`, fps (1-60), duration (0.5-30) in create-outcome.schema.ts
- [ ] T011 [P] [US1] Add `videoOptionsSchema` with `kind: 'video'`, videoPrompt, duration (1-60) in create-outcome.schema.ts
- [ ] T012 [US1] Add `outcomeOptionsSchema` discriminated union by `kind` field in create-outcome.schema.ts
- [ ] T013 [US1] Add complete `createOutcomeSchema` with type, captureStepId, aiEnabled, imageGeneration, options in create-outcome.schema.ts
- [ ] T014 [US1] Export all types (CreateOutcomeType, AIImageModel, AIImageAspectRatio, ImageGenerationConfig, ImageOptions, GifOptions, VideoOptions, OutcomeOptions, CreateOutcome) from create-outcome.schema.ts
- [ ] T015 [US1] Add export for create-outcome.schema in `packages/shared/src/schemas/experience/index.ts`
- [ ] T016 [US1] Run tests and verify all pass: `pnpm --filter @clementine/shared test create-outcome`

**Checkpoint**: User Story 1 complete - createOutcomeSchema is functional and tested

---

## Phase 4: User Story 2 - Session Response Schema (Priority: P1)

**Goal**: Implement `sessionResponseSchema` for unified response format

**Independent Test**: Run `pnpm --filter @clementine/shared test` and verify session-response.schema.test.ts passes

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T017 [US2] Create test file `packages/shared/src/schemas/session/session-response.schema.test.ts` with test cases for:
  - Text input response with stepName, stepType, value passes validation
  - Capture response with MediaReference[] in context passes validation
  - Multi-select response with value array and context passes validation
  - Missing required stepName field fails validation
  - Missing required stepId field fails validation
  - Value defaults to null when not provided
  - Context defaults to null when not provided
  - Timestamps (createdAt, updatedAt) are required

### Implementation for User Story 2

- [ ] T018 [US2] Create `packages/shared/src/schemas/session/session-response.schema.ts` with JSDoc header comment
- [ ] T019 [US2] Add `sessionResponseSchema` with stepId, stepName, stepType, value, context, createdAt, updatedAt in session-response.schema.ts
- [ ] T020 [US2] Export `SessionResponse` type from session-response.schema.ts
- [ ] T021 [US2] Add export for session-response.schema in `packages/shared/src/schemas/session/index.ts`
- [ ] T022 [US2] Run tests and verify all pass: `pnpm --filter @clementine/shared test session-response`

**Checkpoint**: User Story 2 complete - sessionResponseSchema is functional and tested

---

## Phase 5: User Story 3 - Media Display Name Schema (Priority: P2)

**Goal**: Add mention-safe validation for media display names with backward compatibility

**Independent Test**: Run `pnpm --filter @clementine/shared test` and verify media-reference.schema.test.ts passes

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T023 [US3] Add test cases to `packages/shared/src/schemas/media/media-reference.schema.test.ts` for:
  - Display name "hero-shot" passes (alphanumeric with hyphen)
  - Display name "User Photo 1" passes (alphanumeric with space)
  - Display name "logo.v2" passes (alphanumeric with period)
  - Display name with `}` fails (mention-breaking character)
  - Display name with `:` fails (mention-breaking character)
  - Display name with `{` fails (mention-breaking character)
  - Empty display name falls back to "Untitled" (backward compatibility)
  - Display name over 100 chars falls back to "Untitled"
  - Whitespace-only display name falls back to "Untitled"
  - mediaReferenceSchema uses validated displayName

### Implementation for User Story 3

- [ ] T024 [US3] Add `mediaDisplayNameSchema` with trim, min(1), max(100), regex, catch('Untitled') in `packages/shared/src/schemas/media/media-reference.schema.ts`
- [ ] T025 [US3] Update `mediaReferenceSchema` to use `mediaDisplayNameSchema` for displayName field in media-reference.schema.ts
- [ ] T026 [US3] Export `mediaDisplayNameSchema` from media-reference.schema.ts
- [ ] T027 [US3] Add export for `mediaDisplayNameSchema` in `packages/shared/src/schemas/media/index.ts` (if not already re-exported via media-reference.schema)
- [ ] T028 [US3] Run tests and verify all pass: `pnpm --filter @clementine/shared test media-reference`

**Checkpoint**: User Story 3 complete - mediaDisplayNameSchema is functional with backward compatibility

---

## Phase 6: Polish & Validation Gates

**Purpose**: Final verification, build, and cross-cutting concerns

- [ ] T029 Run full test suite: `pnpm --filter @clementine/shared test`
- [ ] T030 Build shared package: `pnpm --filter @clementine/shared build`
- [ ] T031 [P] Verify barrel exports work: create temp file importing from `@clementine/shared` and type-check
- [ ] T032 Run validation gates from repo root: `pnpm app:check`
- [ ] T033 Verify all JSDoc comments are present on exported schemas and types
- [ ] T034 Run quickstart.md validation: verify usage examples in quickstart.md work

**Checkpoint**: All schemas implemented, tested, exported, and validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: N/A for this feature
- **User Stories (Phase 3-5)**: All can start in parallel after Setup (no inter-dependencies)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - createOutcomeSchema is self-contained
- **User Story 2 (P1)**: No dependencies - sessionResponseSchema is self-contained
- **User Story 3 (P2)**: No dependencies - mediaDisplayNameSchema modifies existing file but is independent

**Note**: All three user stories can be implemented in parallel because they touch different files.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Schema definition before type exports
- Type exports before barrel exports
- Story complete before moving to Polish phase

### Parallel Opportunities

- **Phase 3-5**: All three user stories can run in parallel (different files)
- **Within US1**: T006, T007 can run in parallel; T009, T010, T011 can run in parallel
- **Polish**: T031, T032 can run in parallel

---

## Parallel Example: All User Stories

```bash
# Launch all three user stories in parallel (different files):
Task: "US1 - Create createOutcomeSchema in packages/shared/src/schemas/experience/create-outcome.schema.ts"
Task: "US2 - Create sessionResponseSchema in packages/shared/src/schemas/session/session-response.schema.ts"
Task: "US3 - Add mediaDisplayNameSchema to packages/shared/src/schemas/media/media-reference.schema.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1 (createOutcomeSchema)
3. **STOP and VALIDATE**: Test US1 independently
4. This provides the foundation for PRD 1B (experience config)

### Incremental Delivery

1. Complete Setup → Verified
2. Add User Story 1 → Test independently → createOutcomeSchema ready
3. Add User Story 2 → Test independently → sessionResponseSchema ready
4. Add User Story 3 → Test independently → mediaDisplayNameSchema ready
5. Complete Polish → All schemas validated and exported

### Parallel Team Strategy

With multiple developers:

1. Setup: Any developer
2. After Setup:
   - Developer A: User Story 1 (createOutcomeSchema)
   - Developer B: User Story 2 (sessionResponseSchema)
   - Developer C: User Story 3 (mediaDisplayNameSchema)
3. All stories complete independently, then Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Tests are written first (TDD) per Success Criteria SC-006
- All schemas defined locally in create-outcome.schema.ts (no imports from deprecated nodes/)
- mediaDisplayNameSchema uses `.catch('Untitled')` for backward compatibility
- Commit after each task or logical group

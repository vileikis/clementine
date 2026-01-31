# Tasks: Strongly Typed Step Validation and Simplified Answer Schema

**Input**: Design documents from `/specs/051-step-validation-types/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: No test tasks included (not requested in specification - existing tests will be verified)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Monorepo structure:
- **Shared package**: `packages/shared/src/`
- **App**: `apps/clementine-app/src/`
- **Tests**: `apps/clementine-app/tests/` and `packages/shared/tests/`

---

## Phase 1: Shared Package Schema Update (US1 + US2 Foundation)

**Purpose**: Update answer value schema in shared package - foundation for both US1 and US2

**Why Shared Phase**: Answer schema changes must be complete before validator type updates (US1) and renderer updates (US2) can proceed. This is the single blocking prerequisite.

- [ ] T001 Create answerValueSchema in packages/shared/src/schemas/session/session.schema.ts (add before answerSchema around line 40)
- [ ] T002 Create AnswerValue type inferred from answerValueSchema in packages/shared/src/schemas/session/session.schema.ts
- [ ] T003 Update answerSchema.value to use answerValueSchema instead of inline union in packages/shared/src/schemas/session/session.schema.ts
- [ ] T004 Export AnswerValue type in packages/shared/src/schemas/session/session.schema.ts (add to existing exports around line 219)
- [ ] T005 Build shared package with `pnpm --filter @clementine/shared build`
- [ ] T006 Verify TypeScript compilation passes with `pnpm --filter @clementine/shared type-check`

**Checkpoint**: Shared package schema updated - US1 and US2 can now proceed in parallel

---

## Phase 2: User Story 1 - Type-Safe Validator Implementation (Priority: P1) 🎯

**Goal**: Replace loose typing with specific config types for full TypeScript autocomplete and compile-time error detection

**Independent Test**:
1. Open step-validation.ts in IDE
2. Type `config.` inside validateScaleInput function
3. Verify autocomplete shows: min, max, minLabel, maxLabel, required
4. Add line `config.nonExistentProperty` and verify TypeScript compilation fails with clear error

**Acceptance Criteria** (from spec.md):
- ✅ TypeScript autocomplete shows available properties when typing `config.`
- ✅ Compilation fails when accessing non-existent config properties
- ✅ TypeScript shows type error when wrong config type passed to validator
- ✅ Config schema refactoring triggers compile errors in all affected validators

### Implementation for User Story 1

- [ ] T007 [P] [US1] Import specific config types in apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts (add ExperienceInputScaleStepConfig, ExperienceInputYesNoStepConfig, ExperienceInputMultiSelectStepConfig, ExperienceInputShortTextStepConfig, ExperienceInputLongTextStepConfig from @clementine/shared)
- [ ] T008 [P] [US1] Update validateScaleInput function signature to use ExperienceInputScaleStepConfig in apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts (around line 85)
- [ ] T009 [P] [US1] Update validateYesNoInput function signature to use ExperienceInputYesNoStepConfig in apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts (around line 120)
- [ ] T010 [P] [US1] Update validateMultiSelectInput function signature to use ExperienceInputMultiSelectStepConfig in apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts (around line 142)
- [ ] T011 [P] [US1] Update validateTextInput function signature to use ExperienceInputShortTextStepConfig | ExperienceInputLongTextStepConfig union in apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts (around line 194)
- [ ] T012 [US1] Update validateStepInput switch statement with type assertions in apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts (add `as ExperienceInputScaleStepConfig` etc. for each case)
- [ ] T013 [US1] Remove StepConfig type definition in apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts (around line 22)
- [ ] T014 [US1] Run TypeScript type check with `pnpm app:type-check` and verify no errors
- [ ] T015 [US1] Verify IDE autocomplete works by opening step-validation.ts and typing `config.` in validateScaleInput
- [ ] T016 [US1] Test compile-time error detection by temporarily adding `config.invalidProp` and verifying TypeScript error

**Checkpoint**: US1 complete - Validators now have full type safety with autocomplete

---

## Phase 3: User Story 2 - Unified Answer Storage Format (Priority: P1) 🎯

**Goal**: Ensure all answer values use consistent string/string[] format for predictable storage and analytics

**Independent Test**:
1. Start dev server: `pnpm app:dev`
2. Navigate to experience runtime
3. Test yes/no step - verify Firestore shows answer value as "yes" or "no" (not boolean)
4. Test scale step - verify Firestore shows answer value as "3" (not number 3)
5. Test text input - verify answer value is string
6. Test multi-select - verify answer value is string[]

**Acceptance Criteria** (from spec.md):
- ✅ Yes/no answers stored as "yes"/"no" strings (not boolean)
- ✅ Scale answers stored as "3" strings (not number 3)
- ✅ Text answers stored as strings (no change)
- ✅ Multi-select answers stored as string[] (no change)
- ✅ Analytics grouping works identically for all types

### Implementation for User Story 2

**Step 1: Update Step Registry**

- [ ] T017 [P] [US2] Import AnswerValue type from @clementine/shared in apps/clementine-app/src/domains/experience/steps/registry/step-registry.ts (add to existing imports around line 38-43)
- [ ] T018 [P] [US2] Remove local AnswerValue type definition in apps/clementine-app/src/domains/experience/steps/registry/step-registry.ts (around line 60)
- [ ] T019 [P] [US2] Re-export AnswerValue from shared in apps/clementine-app/src/domains/experience/steps/registry/step-registry.ts (add `export type { AnswerValue }` after removing local definition)

**Step 2: Update Renderers**

- [ ] T020 [P] [US2] Update InputYesNoRenderer answer parsing logic in apps/clementine-app/src/domains/experience/steps/renderers/InputYesNoRenderer.tsx (change line 32 from `typeof answer === 'boolean'` to parse "yes"/"no" strings)
- [ ] T021 [P] [US2] Update InputYesNoRenderer handleSelect to save "yes"/"no" strings in apps/clementine-app/src/domains/experience/steps/renderers/InputYesNoRenderer.tsx (change line 38 from `onAnswer(value)` to `onAnswer(value ? 'yes' : 'no')`)
- [ ] T022 [P] [US2] Update InputScaleRenderer answer parsing logic in apps/clementine-app/src/domains/experience/steps/renderers/InputScaleRenderer.tsx (change line 35 from `typeof answer === 'number'` to parse string)
- [ ] T023 [P] [US2] Update InputScaleRenderer handleSelect to save string in apps/clementine-app/src/domains/experience/steps/renderers/InputScaleRenderer.tsx (change line 41 from `onAnswer(value)` to `onAnswer(String(value))`)

**Step 3: Verification**

- [ ] T024 [US2] Run TypeScript type check with `pnpm app:type-check` and verify no errors
- [ ] T025 [US2] Run linter with `pnpm app:lint` and verify no errors
- [ ] T026 [US2] Run existing tests with `pnpm app:test` and verify all pass
- [ ] T027 [US2] Manual test: Start dev server and test yes/no renderer saves "yes"/"no" strings
- [ ] T028 [US2] Manual test: Test scale renderer saves number as string (e.g., "3")
- [ ] T029 [US2] Manual test: Check Firestore console to verify answer values are strings

**Checkpoint**: US2 complete - All renderers save answers in consistent string format

---

## Phase 4: User Story 3 - Consistent Renderer Behavior (Priority: P2)

**Goal**: Ensure answer handling logic is uniform across all step types (cleanup and verification)

**Independent Test**:
1. Review each renderer component
2. Verify all use AnswerValue type from shared
3. Verify conversion happens at save boundary
4. Verify UI layer still uses natural types (boolean for yes/no, number for scale)

**Acceptance Criteria** (from spec.md):
- ✅ InputYesNoRenderer calls onAnswer with "yes"/"no" strings
- ✅ InputScaleRenderer calls onAnswer with string representation
- ✅ Text renderers continue using strings (no change needed)
- ✅ Multi-select renderer continues using string[] (no change needed)

### Implementation for User Story 3

**Note**: Most work completed in US2. This phase focuses on verification and any remaining consistency improvements.

- [ ] T030 [P] [US3] Verify InputShortTextRenderer uses AnswerValue type in apps/clementine-app/src/domains/experience/steps/renderers/InputShortTextRenderer.tsx
- [ ] T031 [P] [US3] Verify InputLongTextRenderer uses AnswerValue type in apps/clementine-app/src/domains/experience/steps/renderers/InputLongTextRenderer.tsx
- [ ] T032 [P] [US3] Verify InputMultiSelectRenderer uses AnswerValue type in apps/clementine-app/src/domains/experience/steps/renderers/InputMultiSelectRenderer.tsx
- [ ] T033 [US3] Review all renderer components for consistent answer handling patterns
- [ ] T034 [US3] Document any renderer-specific conversion logic in code comments if needed

**Checkpoint**: US3 complete - All renderers verified for consistent behavior

---

## Phase 5: Final Validation & Polish

**Purpose**: Cross-cutting validation and documentation

- [ ] T035 Run full validation loop: `pnpm app:check` (format + lint)
- [ ] T036 Run TypeScript type check: `pnpm app:type-check`
- [ ] T037 Run test suite: `pnpm app:test`
- [ ] T038 [P] Verify no `Record<string, unknown>` remains for step configs (search codebase)
- [ ] T039 [P] Verify all answer values use string | string[] types (search for old usage)
- [ ] T040 Review git diff to ensure all changes align with spec
- [ ] T041 Update CHANGELOG or commit message with summary of changes

**Final Checkpoint**: Feature complete and ready for PR

---

## Dependencies & Execution Order

### Story Dependencies

```
Phase 1 (Schema Update)
    ↓
    ├─→ Phase 2 (US1 - Validators) ───┐
    │                                  │
    └─→ Phase 3 (US2 - Renderers) ────┤
                                       ↓
                               Phase 4 (US3 - Verification)
                                       ↓
                               Phase 5 (Final Validation)
```

**Parallel Execution Opportunities**:

1. **After Phase 1**: US1 (Validators) and US2 (Renderers) can be implemented in parallel
2. **Within US1**: Tasks T007-T011 can run in parallel (different validators)
3. **Within US2**:
   - Tasks T017-T019 (registry) can run in parallel
   - Tasks T020-T023 (renderers) can run in parallel
4. **Within US3**: Tasks T030-T032 (verification) can run in parallel
5. **Within Phase 5**: Tasks T038-T039 can run in parallel

### Independent MVP Delivery

**Minimum MVP** (deliver value fastest):
- Phase 1 + Phase 2 (US1) = Type-safe validators with autocomplete

**Recommended MVP** (complete refactor):
- Phase 1 + Phase 2 + Phase 3 = Full type safety + unified answer format

**Full Feature**:
- All phases = Type safety + unified format + verified consistency

---

## Implementation Strategy

### Approach: Incremental with Parallel Work

1. **Phase 1 (Required First)**: ~10 minutes
   - Schema update is blocking - must complete before US1/US2
   - Single developer, sequential tasks

2. **Phase 2 + 3 (Parallel)**: ~20-25 minutes total
   - US1 (validators): ~15 minutes
   - US2 (renderers): ~15 minutes
   - Can be done by 2 developers in parallel (same timeframe)
   - Or single developer sequential: 30 minutes

3. **Phase 4 (Quick verification)**: ~5 minutes
   - Mostly checking existing code
   - Minimal implementation work

4. **Phase 5 (Validation)**: ~10 minutes
   - Standard validation loop
   - Can be parallelized (T038-T039)

**Total Time**:
- Single developer sequential: ~55 minutes
- Two developers (parallel US1/US2): ~40 minutes

---

## File Impact Summary

**Files Modified**: 5
- `packages/shared/src/schemas/session/session.schema.ts` (US1+US2 foundation)
- `apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts` (US1)
- `apps/clementine-app/src/domains/experience/steps/registry/step-registry.ts` (US2)
- `apps/clementine-app/src/domains/experience/steps/renderers/InputYesNoRenderer.tsx` (US2)
- `apps/clementine-app/src/domains/experience/steps/renderers/InputScaleRenderer.tsx` (US2)

**Files Verified** (no changes needed): 3
- `apps/clementine-app/src/domains/experience/steps/renderers/InputShortTextRenderer.tsx` (US3)
- `apps/clementine-app/src/domains/experience/steps/renderers/InputLongTextRenderer.tsx` (US3)
- `apps/clementine-app/src/domains/experience/steps/renderers/InputMultiSelectRenderer.tsx` (US3)

**Files Added**: 0

**Files Deleted**: 0

---

## Validation Checklist

Before marking feature complete, verify:

- [ ] All tasks marked complete (T001-T041)
- [ ] `pnpm app:type-check` passes with no errors
- [ ] `pnpm app:lint` passes with no warnings
- [ ] `pnpm app:test` passes with all tests green
- [ ] TypeScript autocomplete works in validators (`config.` shows properties)
- [ ] Invalid property access shows TypeScript compile error
- [ ] Yes/No renderer saves "yes"/"no" strings (verified in Firestore)
- [ ] Scale renderer saves number as string (verified in Firestore)
- [ ] Text renderers save strings (verified)
- [ ] Multi-select renderer saves string[] (verified)
- [ ] No `Record<string, unknown>` remains for step configs
- [ ] AnswerValue type imported from @clementine/shared (not defined locally)
- [ ] Git diff reviewed and aligns with spec
- [ ] Ready for PR creation

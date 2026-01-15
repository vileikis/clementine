# Tasks: Experience Designer Draft & Publish Versioning

**Input**: Design documents from `/specs/030-exp-versioning/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Unit tests included per Constitution Principle IV (Minimal Testing Strategy)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Paths relative to `apps/clementine-app/src/`

---

## Phase 1: Setup (Schema Foundation)

**Purpose**: Add version fields to Experience schema

- [ ] T001 Add `draftVersion` field to experienceSchema in `domains/experience/shared/schemas/experience.schema.ts`
- [ ] T002 Add `publishedVersion` field to experienceSchema in `domains/experience/shared/schemas/experience.schema.ts`
- [ ] T003 Export updated Experience type from `domains/experience/shared/schemas/experience.schema.ts`

**Checkpoint**: Schema updated with version fields, backward compatible via Zod defaults

---

## Phase 2: Foundational (Shared Update Helper)

**Purpose**: Create reusable update helper with atomic version increment (mirrors Event Designer pattern)

**⚠️ CRITICAL**: US2 and US4 depend on this helper

- [ ] T004 Create `updateExperienceConfigField.ts` in `domains/experience/shared/lib/`
- [ ] T005 Implement transaction-based update with `increment(1)` for draftVersion in `domains/experience/shared/lib/updateExperienceConfigField.ts`
- [ ] T006 Add dot-notation prefix transformation for nested field updates in `domains/experience/shared/lib/updateExperienceConfigField.ts`
- [ ] T007 Export helper from `domains/experience/shared/lib/index.ts` barrel file
- [ ] T008 [P] Add unit test for updateExperienceConfigField in `domains/experience/shared/lib/__tests__/updateExperienceConfigField.test.ts`

**Checkpoint**: Shared helper ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Accurate Change Indicator (Priority: P1) 🎯 MVP

**Goal**: EditorChangesBadge displays correct version-based state (never published, has changes, synced)

**Independent Test**: Open Experience Designer and verify badge reflects actual `draftVersion` vs `publishedVersion`

### Tests for User Story 1

- [ ] T009 [P] [US1] Add schema unit tests for version field defaults in `domains/experience/shared/schemas/__tests__/experience.schema.test.ts`

### Implementation for User Story 1

- [ ] T010 [US1] Update EditorChangesBadge props in ExperienceDesignerLayout to use `experience.draftVersion` in `domains/experience/designer/containers/ExperienceDesignerLayout.tsx`
- [ ] T011 [US1] Update EditorChangesBadge props in ExperienceDesignerLayout to use `experience.publishedVersion` in `domains/experience/designer/containers/ExperienceDesignerLayout.tsx`
- [ ] T012 [US1] Remove existing deep-comparison change detection logic from ExperienceDesignerLayout in `domains/experience/designer/containers/ExperienceDesignerLayout.tsx`

**Checkpoint**: EditorChangesBadge shows accurate version state - US1 independently testable

---

## Phase 4: User Story 2 - Atomic Draft Version Increment (Priority: P1)

**Goal**: Every draft modification atomically increments `draftVersion` using Firestore `increment(1)`

**Independent Test**: Edit a step, verify `draftVersion` increments in Firestore and badge updates

### Implementation for User Story 2

- [ ] T013 [US2] Refactor useUpdateExperienceDraft to use updateExperienceConfigField helper in `domains/experience/designer/hooks/useUpdateExperienceDraft.ts`
- [ ] T014 [US2] Ensure draftVersion increment and updatedAt timestamp update in useUpdateExperienceDraft in `domains/experience/designer/hooks/useUpdateExperienceDraft.ts`
- [ ] T015 [US2] Preserve existing Sentry error reporting in useUpdateExperienceDraft in `domains/experience/designer/hooks/useUpdateExperienceDraft.ts`
- [ ] T016 [US2] Verify query cache invalidation pattern in useUpdateExperienceDraft in `domains/experience/designer/hooks/useUpdateExperienceDraft.ts`

**Checkpoint**: Draft edits increment version atomically - US2 independently testable

---

## Phase 5: User Story 3 - Publish Version Sync (Priority: P1)

**Goal**: Publishing sets `publishedVersion = draftVersion` and copies draft to published

**Independent Test**: Publish experience, verify `publishedVersion` equals `draftVersion` and badge shows synced

### Implementation for User Story 3

- [ ] T017 [US3] Add publishedVersion sync to usePublishExperience transaction in `domains/experience/designer/hooks/usePublishExperience.ts`
- [ ] T018 [US3] Read current draftVersion in transaction before setting publishedVersion in `domains/experience/designer/hooks/usePublishExperience.ts`
- [ ] T019 [US3] Update return type to include version info in usePublishExperience in `domains/experience/designer/hooks/usePublishExperience.ts`
- [ ] T020 [US3] Verify cache invalidation triggers UI update in usePublishExperience in `domains/experience/designer/hooks/usePublishExperience.ts`

**Checkpoint**: Publish syncs versions - US3 independently testable

---

## Phase 6: User Story 4 - Dot-Notation Partial Updates (Priority: P2)

**Goal**: Draft updates use Firestore dot-notation to avoid overwriting unrelated fields

**Independent Test**: Update one step, verify other steps and metadata unchanged in Firestore

### Implementation for User Story 4

- [ ] T021 [US4] Refactor useUpdateDraftSteps to use updateExperienceConfigField with dot-notation in `domains/experience/designer/hooks/useUpdateDraftSteps.ts`
- [ ] T022 [US4] Ensure partial update uses `draft.steps` prefix in useUpdateDraftSteps in `domains/experience/designer/hooks/useUpdateDraftSteps.ts`
- [ ] T023 [US4] Preserve existing error handling and cache invalidation in useUpdateDraftSteps in `domains/experience/designer/hooks/useUpdateDraftSteps.ts`

**Checkpoint**: Partial updates use dot-notation - US4 independently testable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, cleanup, and final verification

- [ ] T024 [P] Run `pnpm app:check` to verify linting and formatting
- [ ] T025 [P] Run `pnpm app:type-check` to verify TypeScript compilation
- [ ] T026 [P] Run `pnpm app:test` to verify all unit tests pass
- [ ] T027 Manually test quickstart.md validation scenarios in browser
- [ ] T028 Verify backward compatibility with existing experiences (no version fields in Firestore)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - schema changes first
- **Foundational (Phase 2)**: Depends on Setup - shared helper needs schema types
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 can proceed independently after Phase 2
  - US2 depends on Phase 2 helper
  - US3 can proceed independently after Phase 2
  - US4 depends on Phase 2 helper
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **US2 (P1)**: Can start after Phase 2 - Uses helper from foundational
- **US3 (P1)**: Can start after Phase 2 - Independent of US1/US2
- **US4 (P2)**: Can start after Phase 2 - Uses helper from foundational

### Within Each User Story

- Tests written first (where applicable)
- Helper integration before business logic
- Verify existing patterns preserved

### Parallel Opportunities

**Phase 1 (Setup)**:
- T001, T002 can run in sequence (same file)
- T003 depends on T001, T002

**Phase 2 (Foundational)**:
- T004-T007 are sequential (same file, building up)
- T008 can run in parallel after T005

**User Stories (After Phase 2)**:
- US1, US2, US3, US4 can all start in parallel
- Within US1: T010, T011, T012 are sequential (same file)
- Within US2: T013-T016 are sequential (same file)
- Within US3: T017-T020 are sequential (same file)
- Within US4: T021-T023 are sequential (same file)

**Phase 7 (Polish)**:
- T024, T025, T026 can run in parallel

---

## Parallel Example: After Foundational Phase

```bash
# Once Phase 2 completes, launch all user stories in parallel:

# Developer A - US1 (Badge Integration):
Task: "Update EditorChangesBadge props to use experience.draftVersion"
Task: "Update EditorChangesBadge props to use experience.publishedVersion"

# Developer B - US2 (Draft Versioning):
Task: "Refactor useUpdateExperienceDraft to use updateExperienceConfigField"

# Developer C - US3 (Publish Versioning):
Task: "Add publishedVersion sync to usePublishExperience transaction"

# Developer D - US4 (Dot-Notation):
Task: "Refactor useUpdateDraftSteps to use updateExperienceConfigField"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (schema fields)
2. Complete Phase 2: Foundational (shared helper)
3. Complete Phase 3: User Story 1 (badge integration)
4. **STOP and VALIDATE**: Badge shows version state correctly
5. Deploy/demo if ready - users see accurate change indicator

### Incremental Delivery

1. Setup + Foundational → Schema and helper ready
2. Add US1 → Badge works with versions → Deploy (MVP!)
3. Add US2 → Edits increment version → Deploy
4. Add US3 → Publish syncs versions → Deploy
5. Add US4 → Partial updates optimized → Deploy
6. Each story adds value without breaking previous stories

### Recommended Single-Developer Flow

1. T001-T003 (Schema)
2. T004-T008 (Helper + test)
3. T009-T012 (US1 - Badge) → **Test MVP**
4. T013-T016 (US2 - Draft increment)
5. T017-T020 (US3 - Publish sync)
6. T021-T023 (US4 - Dot-notation)
7. T024-T028 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after completion
- All P1 stories (US1-US3) should be completed for full versioning functionality
- US4 (P2) is an optimization that can be deferred if needed
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

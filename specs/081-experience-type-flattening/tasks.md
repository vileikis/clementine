# Tasks: Experience Type Flattening

**Input**: Design documents from `/specs/081-experience-type-flattening/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/firestore-schema.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted. Migration script testing included as part of US4.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Includes exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Ensure shared package is ready for schema changes

- [x] T001 Build shared package to confirm clean baseline: `pnpm --filter @clementine/shared build`

---

## Phase 2: Foundational — Schema & Core Types

**Purpose**: Update all shared schemas and core types. MUST complete before ANY user story.

**Why blocking**: Every frontend component and backend function depends on these schemas. Changing them first lets TypeScript catch all downstream breakages.

- [x] T002 Add `experienceTypeSchema`, flatten `experienceConfigSchema` (remove outcome wrapper, add per-type config fields directly), and update `experienceSchema` (replace `profile` with `type`) in `packages/shared/src/schemas/experience/experience.schema.ts`
- [x] T003 [P] Remove `outcomeSchema` wrapper export from `packages/shared/src/schemas/experience/outcome.schema.ts` — keep all per-type config schemas (photoOutcomeConfigSchema, aiImageOutcomeConfigSchema, etc.) unchanged
- [x] T004 [P] Flatten `jobSnapshotSchema` — replace `outcome` field with `type: experienceTypeSchema` + per-type config fields directly on snapshot in `packages/shared/src/schemas/job/job.schema.ts`
- [x] T005 Update shared barrel exports — add `experienceTypeSchema`/`ExperienceType`, remove `experienceProfileSchema`/`ExperienceProfile`, remove `outcomeSchema`/`Outcome` in `packages/shared/src/schemas/experience/index.ts` and `packages/shared/src/schemas/index.ts`
- [x] T006 [P] Create `typeMetadata` record replacing `profileMetadata` — map all 6 experience types to label, allowedStepCategories, slotCompatibility, and comingSoon flag per data-model.md in `apps/clementine-app/src/domains/experience/shared/types/type-metadata.ts` (replaces `profile.types.ts`)
- [x] T007 Build shared package and verify no schema test regressions: `pnpm --filter @clementine/shared build && pnpm --filter @clementine/shared test`

**Checkpoint**: Schema layer is updated. All downstream TypeScript consumers will show compile errors — this is expected and will be resolved in subsequent phases.

---

## Phase 3: User Story 1 — Single-Step Type Selection (Priority: P1) 🎯 MVP

**Goal**: Replace the two-step profile+outcome type selection with a single experience type picker at creation time.

**Independent Test**: Create a new experience → single type picker shown with all 6 types → selecting one creates the experience with that type immediately.

### Implementation for User Story 1

- [x] T008 [US1] Create `ExperienceTypePicker` component — card-based selector showing all 6 types (Photo, GIF [coming soon], Video [coming soon], AI Image, AI Video, Survey) with coming-soon badges on disabled items in `apps/clementine-app/src/domains/experience/library/components/ExperienceTypePicker.tsx`
- [x] T009 [US1] Update `CreateExperienceForm` — replace `ProfileSelector` with `ExperienceTypePicker`, change form default from `profile: 'freeform'` to `type: 'ai.image'`, update Zod validation schema to use `experienceTypeSchema` in `apps/clementine-app/src/domains/experience/library/components/CreateExperienceForm.tsx`
- [x] T010 [US1] Update create experience action/mutation — write `type` field instead of `profile` when creating experience document in Firestore, initialize active type's default config on `draft` per contracts/firestore-schema.md in `apps/clementine-app/src/domains/experience/shared/` (locate create experience action)
- [x] T011 [P] [US1] Delete `ProfileSelector` component in `apps/clementine-app/src/domains/experience/library/components/ProfileSelector.tsx`
- [x] T012 [P] [US1] Delete `OutcomeTypePicker` component (type selection now happens at creation, not in Create tab) in `apps/clementine-app/src/domains/experience/create/components/outcome-picker/OutcomeTypePicker.tsx`

**Checkpoint**: Creating an experience uses a single-step type picker. The old two-step flow (profile → outcome type) is gone.

---

## Phase 4: User Story 2 — Type Visible in Library (Priority: P2)

**Goal**: Show experience type as a badge on library cards and provide type-based filtering.

**Independent Test**: View experience library → each card shows its type badge → filter tabs filter by type.

### Implementation for User Story 2

- [x] T013 [P] [US2] Create `TypeBadge` component — colored badge displaying experience type label, use `typeMetadata` for labels and color mapping in `apps/clementine-app/src/domains/experience/library/components/TypeBadge.tsx`
- [x] T014 [US2] Update `ExperienceListItem` — replace `ProfileBadge` with `TypeBadge`, read `experience.type` instead of `experience.profile` in `apps/clementine-app/src/domains/experience/library/components/ExperienceListItem.tsx`
- [x] T015 [US2] Update `ExperiencesPage` — replace profile filter tabs (All/Freeform/Survey/Story) with type filter tabs (All/Photo/AI Image/AI Video/Survey), update filter logic to match on `experience.type` in `apps/clementine-app/src/domains/experience/library/containers/ExperiencesPage.tsx`
- [x] T016 [US2] Delete `ProfileBadge` component in `apps/clementine-app/src/domains/experience/library/components/ProfileBadge.tsx`

**Checkpoint**: Library shows type badges on every card. Filter tabs work by type. Old profile concepts are gone from library view.

---

## Phase 5: User Story 3 — Simplified Configuration Layout (Priority: P3)

**Goal**: Config forms read/write directly from `experience.draft.[type]` instead of `experience.draft.outcome.[type]`. Backend pipeline reads from flattened snapshot. All "outcome" terminology removed from frontend.

**Independent Test**: Open any non-survey experience → config form loads directly → editing auto-saves to flattened path → switching type clears old config and shows new defaults → backend processes jobs using flattened snapshot.

### Frontend — Rename & Update Hooks/Lib for User Story 3

- [x] T017 [P] [US3] Rename `outcome-operations.ts` → `experience-config-operations.ts` and update all functions to read/write flattened config paths (`experience.draft.[type]` instead of `experience.draft.outcome.[type]`) in `apps/clementine-app/src/domains/experience/create/lib/experience-config-operations.ts`
- [x] T018 [P] [US3] Rename `useUpdateOutcome` → `useUpdateExperienceConfig` and update mutation to write to flattened config paths in `apps/clementine-app/src/domains/experience/create/hooks/useUpdateExperienceConfig.ts`
- [x] T019 [P] [US3] Rename `useOutcomeValidation` → `useExperienceConfigValidation` and update field path references in `apps/clementine-app/src/domains/experience/create/hooks/useExperienceConfigValidation.ts`
- [x] T020 [P] [US3] Rename `OutcomeTypeSelector` → `ExperienceTypeSwitch` — update to read/write `experience.type` instead of `experience.draft.outcome.type`, move out of `outcome-picker/` directory in `apps/clementine-app/src/domains/experience/create/components/ExperienceTypeSwitch.tsx`
- [x] T021 [P] [US3] Rename `RemoveOutcomeAction` → `ClearTypeConfigAction` — update to clear the active type's config field on `experience.draft`, move out of `outcome-picker/` directory in `apps/clementine-app/src/domains/experience/create/components/ClearTypeConfigAction.tsx`

### Frontend — Update Config Forms for User Story 3

- [x] T022 [US3] Update `CreateTabForm` — read type from `experience.type` (not `experience.draft.outcome.type`), read config from `experience.draft.[type]` (not `experience.draft.outcome.[type]`), hide Create tab for survey type, use renamed hooks/components in `apps/clementine-app/src/domains/experience/create/components/CreateTabForm.tsx`
- [x] T023 [US3] Update `getStepTypesForProfile` → `getStepTypesForType` — change parameter from `ExperienceProfile` to `ExperienceType`, map survey→[info,input,capture], all others→[info,input,capture,transform] in `apps/clementine-app/src/domains/experience/steps/registry/step-utils.ts`

### Backend — Update Pipeline for User Story 3

- [x] T024 [P] [US3] Update `buildJobSnapshot` — copy `experience.type` → `snapshot.type`, copy per-type configs from flattened `config.[type]` instead of `config.outcome.[type]` in `functions/src/repositories/job.ts`
- [x] T025 [P] [US3] Update `startTransformPipeline` — validate `experience.type` (reject survey), read active config from flattened path, update `getOutcomeAspectRatio` helper in `functions/src/callable/startTransformPipeline.ts`
- [x] T026 [US3] Update `runOutcome` dispatcher — use `snapshot.type` instead of `snapshot.outcome.type` for executor lookup in `functions/src/services/transform/engine/runOutcome.ts`
- [x] T027 [P] [US3] Update `aiImageOutcome` — read from `snapshot.aiImage` instead of `snapshot.outcome.aiImage` in `functions/src/services/transform/outcomes/aiImageOutcome.ts`
- [x] T028 [P] [US3] Update `aiVideoOutcome` — read from `snapshot.aiVideo` instead of `snapshot.outcome.aiVideo` in `functions/src/services/transform/outcomes/aiVideoOutcome.ts`
- [x] T029 [P] [US3] Update `photoOutcome` — read from `snapshot.photo` instead of `snapshot.outcome.photo` in `functions/src/services/transform/outcomes/photoOutcome.ts`

### Cleanup for User Story 3

- [x] T030 [US3] Delete empty `outcome-picker/` directory after all components moved out in `apps/clementine-app/src/domains/experience/create/components/outcome-picker/`

**Checkpoint**: Config forms show type-specific settings directly. Backend processes jobs from flattened snapshots. Zero "outcome" references remain in frontend code.

---

## Phase 6: User Story 4 — Data Migration (Priority: P4)

**Goal**: Migrate all existing Firestore experience documents from old structure (profile + nested outcome) to new structure (type + flattened config).

**Independent Test**: Run migration with `--dry-run` → verify transformation output → run live against emulators → verify all documents have correct type and flattened config.

### Implementation for User Story 4

- [ ] T031 [US4] Write migration script following 072 pattern — support `--dry-run` and `--production` flags, implement type derivation rules (freeform→outcome.type, survey→survey, story→survey), flatten draft and published configs, remove old fields (profile, outcome wrapper), make idempotent in `functions/scripts/migrations/081-experience-type-flattening.ts`
- [ ] T032 [US4] Test migration script — run `--dry-run` against emulators, verify all mapping cases (freeform/ai.image, freeform/photo, freeform/null, survey, story), verify both draft and published configs are flattened, verify old fields removed in `functions/scripts/migrations/081-experience-type-flattening.ts`

**Checkpoint**: Migration script handles all existing data shapes and can be safely run against production.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, barrel export updates, and full validation

- [ ] T033 Update barrel exports across experience domain — update `create/index.ts`, `library/index.ts`, `shared/index.ts`, `create/components/index.ts` to export renamed components/hooks in `apps/clementine-app/src/domains/experience/`
- [ ] T034 [P] Remove remaining dead code — delete any lingering references to `experienceProfileSchema`, `outcomeSchema`, `OutcomeType` imports, `'story'` profile code across the codebase
- [ ] T035 [P] Grep for remaining old references — search for `\.profile`, `outcome\.type`, `outcome\.aiImage`, `outcomeSchema`, `useUpdateOutcome`, `OutcomeTypePicker`, `ProfileSelector`, `ProfileBadge` across all workspaces and fix any remaining hits
- [ ] T036 Run full validation suite — `pnpm --filter @clementine/shared build && pnpm --filter @clementine/shared test && pnpm app:check && pnpm app:type-check && pnpm app:test && pnpm functions:build`

**Checkpoint**: Zero compilation errors, zero old-term references, all tests pass, all linting clean.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — no dependency on other stories
- **US2 (Phase 4)**: Depends on Phase 2 — no dependency on other stories
- **US3 (Phase 5)**: Depends on Phase 2 — no dependency on other stories
- **US4 (Phase 6)**: Depends on Phase 2 — no dependency on other stories (but should run last to capture final schema)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — only touches creation flow
- **US2 (P2)**: Independent — only touches library view
- **US3 (P3)**: Independent — touches config forms + backend pipeline
- **US4 (P4)**: Independent — standalone migration script (should be written after schema is finalized)

### Within Each User Story

- Schema changes (Phase 2) before any story work
- Renames/refactors before logic changes
- Frontend before backend (within US3, order is flexible)
- Delete old files after replacements are wired up

### Parallel Opportunities

**Phase 2** (after T002):
```
T003 (outcome.schema.ts) ║ T004 (job.schema.ts) ║ T006 (type-metadata.ts)
```

**Phase 3 + Phase 4** (after Phase 2, can run simultaneously):
```
US1: T008→T009→T010 ║ US2: T013→T014→T015
     T011,T012 [P]  ║      T016 (after T014)
```

**Phase 5 frontend renames** (all parallel — different files):
```
T017 ║ T018 ║ T019 ║ T020 ║ T021
```

**Phase 5 backend** (after T024):
```
T024 (job.ts) ║ T025 (startTransformPipeline.ts)
→ T026 (runOutcome.ts)
→ T027 ║ T028 ║ T029 (outcome executors — all parallel)
```

---

## Parallel Example: US1 + US2 Simultaneously

```
# After Phase 2 completes, launch US1 and US2 in parallel:

# Developer A — US1:
T008: Create ExperienceTypePicker.tsx
T009: Update CreateExperienceForm.tsx (depends on T008)
T011: Delete ProfileSelector.tsx          ║  (parallel with T012)
T012: Delete OutcomeTypePicker.tsx         ║

# Developer B — US2:
T013: Create TypeBadge.tsx
T014: Update ExperienceListItem.tsx (depends on T013)
T015: Update ExperiencesPage.tsx
T016: Delete ProfileBadge.tsx (depends on T014)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational schemas
3. Complete Phase 3: US1 — single-step type selection
4. **STOP and VALIDATE**: Create experiences with new type picker
5. Proceed to remaining stories

### Recommended Execution Order (Single Developer)

1. Phase 1 → Phase 2 (foundation)
2. Phase 3: US1 (creation flow — most visible UX change)
3. Phase 4: US2 (library view — small, quick win)
4. Phase 5: US3 (config forms + backend — largest phase)
5. Phase 6: US4 (migration script — run before deploy)
6. Phase 7: Polish (cleanup + validation)

### Incremental Delivery

Each phase adds value without breaking previous phases:
- After US1: New experiences use single-step type picker
- After US2: Library shows type badges
- After US3: Config forms are simplified, backend processes flattened snapshots
- After US4: All existing data migrated
- After Polish: Codebase is clean, no legacy references remain

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [USn] label maps task to specific user story for traceability
- Each user story is independently completable and testable after Phase 2
- This is a pre-launch refactor — no backward compatibility needed
- Migration script (US4) should be written and tested last but run first during deployment
- Backend "outcome" naming is retained (runOutcome, aiImageOutcome) — semantically correct there
- Frontend "outcome" naming is eliminated — replaced with "experience config" terminology

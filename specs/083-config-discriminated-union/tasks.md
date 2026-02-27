# Tasks: Experience Config Discriminated Union

**Input**: Design documents from `/specs/083-config-discriminated-union/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks grouped by user story. US1 (schema) is foundational and blocks all other stories. US2 (migration) is independent infrastructure. US3-US5 (P2) can proceed in parallel after US1. US6-US7 (P3) can proceed after US1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational — Schema Restructure (US1, Priority: P1)

**Goal**: Replace flat nullable ExperienceConfig with a Zod discriminated union keyed on `type`. Update Experience document schema to replace `type` with `draftType`.

**Independent Test**: Build the shared package (`pnpm --filter @clementine/shared build`). Verify Zod parsing produces correct discriminated variants for each type. Verify TypeScript narrows type-specific fields after checking `config.type`.

**⚠️ CRITICAL**: No other story can begin until this phase is complete (all app code depends on the new schema shape).

- [ ] T001 [US1] Create discriminated union config variants in `packages/shared/src/schemas/experience/experience-config.schema.ts`. Define 6 `z.looseObject()` variants (survey, photo, ai.image, ai.video, gif, video) each with `type: z.literal(...)`, shared `steps` field, and type-specific config field. Combine into `experienceConfigSchema` using `z.discriminatedUnion('type', [...])`. Export individual variant schemas and the union type.
- [ ] T002 [US1] Update experience document schema in `packages/shared/src/schemas/experience/experience.schema.ts`. Remove `type: experienceTypeSchema` field. Add `draftType: experienceTypeSchema` field. Change `draft` and `published` to use the new discriminated union `experienceConfigSchema`. Update `ExperienceConfig` and `Experience` type exports.
- [ ] T003 [US1] Update shared package barrel exports in `packages/shared/src/schemas/experience/index.ts` (or wherever schemas are re-exported). Ensure new variant schemas and updated types are accessible to consumers. Build shared package and verify no errors: `pnpm --filter @clementine/shared build`.
- [ ] T004 [US1] Update `apps/clementine-app/src/domains/experience/shared/schemas/experience.input.schemas.ts` (if it references ExperienceConfig or Experience types) to align with the new schema shape. Check for any other input schemas that reference `type` on Experience.

**Checkpoint**: Shared package builds cleanly. TypeScript type narrowing works on `config.type`. All variants parse correctly.

---

## Phase 2: Migration Script (US2, Priority: P1)

**Goal**: Create a one-time idempotent migration script that transforms all existing Firestore experience documents to the new schema.

**Independent Test**: Run the migration script against a Firestore database. Verify all documents have `draftType` set, `type` removed, `draft.type` and `published.type` injected, and null config fields cleaned up. Run a second time and verify idempotency (no errors, no changes).

- [ ] T005 [US2] Create migration script at `functions/scripts/migrations/083-config-discriminated-union.ts`. Using Firebase Admin SDK, iterate all experience documents in batches of 500. For each document: (1) read `experience.type`, (2) set `draft.type = experience.type`, (3) if `published` is not null set `published.type = experience.type`, (4) set `draftType = experience.type`, (5) delete top-level `type` field with `FieldValue.delete()`, (6) delete null type-specific config fields (photo, gif, video, aiImage, aiVideo) from draft and published. Add idempotency check: skip if `draft.type` already exists. Log progress (documents processed, skipped, errors).

**Checkpoint**: Migration script runs successfully against Firestore. All documents parse through the new schema without errors.

---

## Phase 3: Admin UI — Write Paths (US3, Priority: P2)

**Goal**: Update all experience write operations to use the new schema: set `draftType` instead of `type`, build discriminated union drafts.

**Independent Test**: Create an experience of each type, switch types, and duplicate. Verify Firestore documents match the new schema shape.

- [ ] T006 [US3] Refactor `buildDefaultDraft()` in `apps/clementine-app/src/domains/experience/shared/hooks/useCreateExperience.ts`. Change return type from flat nullable config to discriminated union variants. Each case (ai.image, ai.video, photo, survey, etc.) returns `{ type: '...', steps: [], [typeConfig]: defaults }` — no null fields for other types. Update the `WithFieldValue<ExperienceConfig>` type usage to match the new union type.
- [ ] T007 [US3] Update `useCreateExperience()` mutation in `apps/clementine-app/src/domains/experience/shared/hooks/useCreateExperience.ts`. In the `newExperience` object: replace `type: validated.type` with `draftType: validated.type`. The `draft` field already receives the discriminated config from `buildDefaultDraft()` (updated in T006).
- [ ] T008 [US3] Rewrite `switchExperienceType()` in `apps/clementine-app/src/domains/experience/shared/lib/switchExperienceType.ts`. Instead of setting `type` and conditionally initializing `draft.[key]`, build a new discriminated union config: `{ type: newType, steps: existingDraft.steps, [typeConfig]: defaults }`. Write `draft: newConfig`, `draftType: newType` (not `type`), `draftVersion: increment(1)`, `updatedAt: serverTimestamp()`. Remove the `defaultConfig` parameter — the function builds defaults internally using `buildDefaultDraft()` (import from useCreateExperience or extract to shared utility).
- [ ] T009 [US3] Update `useDuplicateExperience()` in `apps/clementine-app/src/domains/experience/shared/hooks/useDuplicateExperience.ts`. In the `newExperience` object: replace `type: source.type` with `draftType: source.draftType`. The `draft` and `published` fields (deep-cloned from source) already carry `type` on the config.

**Checkpoint**: All write operations produce documents matching the new schema. No top-level `type` field written.

---

## Phase 4: Admin UI — Read Paths & Library (US3, Priority: P2)

**Goal**: Update all experience read operations and the library UI to use `draftType` and `draft.type` instead of `experience.type`.

**Independent Test**: Navigate the library, filter by type, open the designer, view the create tab. All type-dependent behavior works identically.

- [ ] T010 [P] [US3] Update Firestore query in `apps/clementine-app/src/domains/experience/shared/hooks/useWorkspaceExperiences.ts`. Change `where('type', '==', filters.type)` to `where('draftType', '==', filters.type)`.
- [ ] T011 [P] [US3] Update query key factory in `apps/clementine-app/src/domains/experience/shared/queries/experience.query.ts`. If the key includes the field name `type`, update to `draftType` for cache consistency.
- [ ] T012 [P] [US3] Update `ExperienceListItem` in `apps/clementine-app/src/domains/experience/library/components/ExperienceListItem.tsx`. Change `experience.type` to `experience.draftType` for the TypeBadge prop.
- [ ] T013 [P] [US3] Update `ExperiencesPage` in `apps/clementine-app/src/domains/experience/library/containers/ExperiencesPage.tsx`. If any direct references to `experience.type` exist for display or filtering logic, change to `experience.draftType`.
- [ ] T014 [P] [US3] Update `CreateTabForm` in `apps/clementine-app/src/domains/experience/create/components/CreateTabForm.tsx`. Change `experience.type` reads to `experience.draft.type`. Update `getConfigKey()` usage to read from `experience.draft.type`. Update any conditional rendering based on type.
- [ ] T015 [P] [US3] Update `ExperienceTypeSwitch` in `apps/clementine-app/src/domains/experience/create/components/ExperienceTypeSwitch.tsx`. The `value` prop should come from `experience.draft.type` (passed by parent). The `onChange` handler should call the updated `switchExperienceType()` from T008.
- [ ] T016 [P] [US3] Update `StepConfigPanelContainer` in `apps/clementine-app/src/domains/experience/designer/containers/StepConfigPanelContainer.tsx`. Replace `experience.type` reads with `experience.draft.type`. Simplify aspect ratio access using discriminated union narrowing (e.g., `if (draft.type === 'photo') draft.photo.aspectRatio` — no null-check needed).
- [ ] T017 [P] [US3] Update `step-utils.ts` in `apps/clementine-app/src/domains/experience/steps/registry/step-utils.ts`. Update `getStepTypesForType()` and related functions to accept type from `config.type` if callers pass it differently. Check all call sites.
- [ ] T018 [P] [US3] Update `ExperienceCollectPage` in `apps/clementine-app/src/domains/experience/designer/containers/ExperienceCollectPage.tsx`. Replace any `experience.type` references with `experience.draft.type` or `experience.draftType` as appropriate.

**Checkpoint**: Library filter works, type badges display correctly, create tab shows correct forms, designer reads aspect ratio from narrowed config.

---

## Phase 5: Validation Simplification (US4, Priority: P2)

**Goal**: Rename and simplify validation files. Remove structural checks (enforced by union at parse time), keep semantic checks only.

**Independent Test**: Call `validateConfig()` with each config variant. Verify only semantic errors returned. Verify structural errors are caught at parse time by Zod, not by validation.

- [ ] T019 [US4] Rename `apps/clementine-app/src/domains/experience/shared/lib/outcome-validation.ts` to `config-validation.ts`. Rename exported function `validateOutcome()` to `validateConfig()`. Rename types: `OutcomeValidationError` → `ConfigValidationError`, `OutcomeValidationResult` → `ConfigValidationResult`. Change function signature from `validateConfig(type: ExperienceType, config: ExperienceConfig | null, steps: ExperienceStep[])` to `validateConfig(config: ExperienceConfig, steps: ExperienceStep[])`. Read `config.type` internally. Remove structural null-checks ("Photo configuration is missing", "AI Image configuration is missing", "AI Video configuration is missing"). Keep semantic validators (captureStepId, prompt, refMedia, coming-soon). Update the `typeValidators` dispatch map to work with `config.type`.
- [ ] T020 [US4] Rename `apps/clementine-app/src/domains/experience/shared/utils/hasTransformConfig.ts` to `config-checks.ts`. Rename `hasOutcome()` to `hasTypeConfig()`. Simplify the function body: with the discriminated union, type-specific config is guaranteed to exist on the variant, so the function simplifies to `config.type !== 'survey'`. Update the function signature to accept an `ExperienceConfig` directly instead of `Experience` + `configSource`.
- [ ] T021 [US4] Update barrel exports in `apps/clementine-app/src/domains/experience/shared/lib/index.ts` and `apps/clementine-app/src/domains/experience/shared/utils/index.ts` (if they exist). Replace old file/function names with new ones.
- [ ] T022 [US4] Update all import sites for the renamed files. Search for imports of `outcome-validation`, `validateOutcome`, `hasTransformConfig`, `hasOutcome` across the app and replace with new names. Key files: `usePublishExperience.ts`, `ExperiencePreviewModal.tsx`, and any other consumers.

**Checkpoint**: Validation functions renamed and simplified. All imports updated. No references to old names remain.

---

## Phase 6: Publish Flow (US5, Priority: P2)

**Goal**: Update the publish flow to read type from `draft.type` and pass config directly to validation.

**Independent Test**: Create an experience, publish it. Verify `published.type` matches `draft.type`. Change draft type, verify `published.type` still reflects the old published type.

- [ ] T023 [US5] Update `usePublishExperience()` in `apps/clementine-app/src/domains/experience/designer/hooks/usePublishExperience.ts`. In `validateForPublish()`: replace `experience.type` reads with `experience.draft.type`. Update `validateConfig()` call to pass config directly (no separate type parameter). In the publish transaction: the draft copy to published already carries `type` — no additional writes needed for type. Remove any references to `experience.type`. Update `getStepTypesForType()` call to use `experience.draft.type`.

**Checkpoint**: Publish flow works end-to-end. Published config is self-describing with its own `type` field.

---

## Phase 7: Backend & Guest Runtime (US6, Priority: P3)

**Goal**: Update cloud functions and any guest runtime code to read type from `published.type` instead of the top-level `experience.type`.

**Independent Test**: Trigger a transform pipeline job. Verify the cloud function reads type from `published.type`. Verify job snapshot contains the correct type.

- [ ] T024 [P] [US6] Update `startTransformPipeline` in `functions/src/callable/startTransformPipeline.ts`. Replace `experience.type` reads with `experience.published.type` (or `experience.published?.type`). Remove manual config presence checks (JC-005: `if (experienceType === 'photo' && !config?.photo)`) — the discriminated union guarantees the right config exists. Keep the `IMPLEMENTED_TYPES` check but read type from published config.
- [ ] T025 [P] [US6] Update `buildJobSnapshot()` in `functions/src/repositories/job.ts`. Replace `type: experience.type` with `type: experience.published.type` (or however published config is accessed). Update any per-type config reads to use the self-describing published config.
- [ ] T026 [US6] Search for any remaining `experience.type` references in `functions/src/` and guest-facing code in `apps/clementine-app/src/domains/guest/`. Update to read from published config. Check `ExperiencePage.tsx` and any guest runtime containers.

**Checkpoint**: Cloud functions correctly process experiences using `published.type`. No references to top-level `experience.type` remain in backend code.

---

## Phase 8: Firestore Index (US7, Priority: P3)

**Goal**: Replace the `status + type + createdAt` composite index with `status + draftType + createdAt`.

- [ ] T027 [US7] Update `firebase/firestore.indexes.json`. In the experiences collection composite index (lines 244-260), change `"fieldPath": "type"` to `"fieldPath": "draftType"`. Keep `status` and `createdAt` fields unchanged.

**Checkpoint**: Index configuration updated. Deploy with `pnpm fb:deploy:indexes` when ready.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and verification across all workspaces.

- [ ] T028 Run `pnpm --filter @clementine/shared build` to verify shared package compiles cleanly with new discriminated union schema.
- [ ] T029 Run `pnpm app:type-check` from `apps/clementine-app/` to verify zero TypeScript errors across the entire app. Fix any remaining type errors from the `experience.type` removal.
- [ ] T030 Run `pnpm app:check` (format + lint) from `apps/clementine-app/` to ensure code quality. Fix any lint/format issues.
- [ ] T031 Search entire codebase for remaining references to `experience.type` (excluding comments/docs). Grep for `experience\.type` and `experience.type` across `apps/`, `functions/`, `packages/`. All should be replaced with `draftType`, `draft.type`, or `published.type`.
- [ ] T032 Verify in local dev server (`pnpm app:dev`): create experience, switch types, edit config, filter library, publish. Confirm no runtime errors and identical behavior to before the refactor.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Schema — US1)**: No dependencies — start immediately. **BLOCKS all other phases.**
- **Phase 2 (Migration — US2)**: Depends on Phase 1. Independent of app phases.
- **Phase 3 (Write paths — US3)**: Depends on Phase 1.
- **Phase 4 (Read paths — US3)**: Depends on Phase 1. Can partially parallel with Phase 3 (different files).
- **Phase 5 (Validation — US4)**: Depends on Phase 1. Can parallel with Phases 3-4 (different files).
- **Phase 6 (Publish — US5)**: Depends on Phase 5 (validation rename). Can parallel with Phases 3-4.
- **Phase 7 (Backend — US6)**: Depends on Phase 1. Can parallel with Phases 3-6.
- **Phase 8 (Index — US7)**: No code dependency — can happen anytime after Phase 1.
- **Phase 9 (Polish)**: Depends on all previous phases.

### User Story Dependencies

- **US1 (Schema)**: Foundation — blocks everything.
- **US2 (Migration)**: Depends only on US1. Independent of app code.
- **US3 (Admin UI)**: Depends on US1. Largest surface area.
- **US4 (Validation)**: Depends on US1. Independent of US3.
- **US5 (Publish)**: Depends on US4 (renamed validation functions).
- **US6 (Backend)**: Depends on US1. Independent of US3-US5.
- **US7 (Index)**: Depends on US1 (conceptually). No code dependencies.

### Parallel Opportunities

**After Phase 1 completes, these can run in parallel:**
- Phase 2 (migration script)
- Phase 3 + 4 (admin UI write + read paths)
- Phase 5 (validation rename/simplify)
- Phase 7 (backend updates)
- Phase 8 (index update)

**Within Phase 4, all tasks (T010-T018) are parallelizable** — they touch different files.

**Within Phase 7, T024 and T025 are parallelizable** — different files.

---

## Parallel Example: After Phase 1

```text
# These can all proceed simultaneously after schema is done:
Agent 1: T005 (migration script)
Agent 2: T006 → T007 → T008 → T009 (write paths, sequential)
Agent 3: T010-T018 (read paths, all parallel)
Agent 4: T019 → T020 → T021 → T022 (validation rename)
Agent 5: T024, T025 (backend updates, parallel)
Agent 6: T027 (index update)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Schema restructure
2. **STOP and VALIDATE**: Shared package builds, types narrow correctly
3. This is the minimum to prove the approach works

### Incremental Delivery

1. Phase 1 (Schema) → Validate discriminated union works
2. Phase 2 (Migration) → Run against Firestore, validate data
3. Phases 3-6 (App updates) → Deploy app code after migration
4. Phase 7 (Backend) → Update cloud functions
5. Phase 8 (Index) → Deploy updated index
6. Phase 9 (Polish) → Final validation

### Deployment Order

1. Deploy shared package (new schema)
2. Run migration script (transform Firestore data)
3. Deploy app + functions (all code reads new schema)
4. Deploy Firestore indexes (new composite index)
5. Remove old index (after verifying queries work)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All write paths use Firestore transactions — atomic `draftType` + `draft` updates
- Migration MUST run before app code deployment (app expects new schema)
- `buildDefaultDraft()` is shared by create and switch-type — consider extracting to a shared utility if not already
- The `updateExperienceConfigField.ts` helper (dot-notation updates) does NOT need changes — it updates sub-fields and doesn't touch `type`

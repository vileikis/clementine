# Tasks: Flatten Transform Configuration

**Input**: Design documents from `/specs/054-transform-flatten/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Update existing tests (no new test tasks needed - tests are updated inline with implementation)

**Organization**: Tasks grouped by user story. US1 is foundational and must complete first.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Foundational - User Story 1 - Developer Updates Schema References (Priority: P1) 🎯

**Goal**: Flatten `transform.nodes` to top-level `transformNodes` in shared schema package

**Independent Test**: Import `experienceConfigSchema` and verify `transformNodes` field exists at top level with `[]` default

**⚠️ CRITICAL**: All other user stories depend on this phase completing first

### Schema Changes

- [X] T001 [US1] Remove `outputAspectRatioSchema` and `outputFormatSchema` from `packages/shared/src/schemas/experience/transform.schema.ts`
- [X] T002 [US1] Remove `transformConfigSchema` from `packages/shared/src/schemas/experience/transform.schema.ts` (keep `transformNodeSchema`)
- [X] T003 [US1] Update `packages/shared/src/schemas/experience/transform.schema.test.ts` to remove tests for deleted schemas
- [X] T004 [US1] Replace `transform: transformConfigSchema` with `transformNodes: z.array(transformNodeSchema).default([])` in `packages/shared/src/schemas/experience/experience.schema.ts`
- [X] T005 [US1] Update `packages/shared/src/schemas/experience/experience.schema.test.ts` for new schema structure
- [X] T006 [US1] Remove `TransformConfig`, `OutputFormat`, `OutputAspectRatio` exports from `packages/shared/src/index.ts`

### Validation

- [X] T007 [US1] Build shared package: `pnpm --filter @clementine/shared build`
- [X] T008 [US1] Run shared package tests: `pnpm --filter @clementine/shared test`

**Checkpoint**: Shared schema complete - TypeScript will now report errors in consuming packages

---

## Phase 2: User Story 2 + 4 - Cloud Functions & Guest Domain (Priority: P1)

**Goal**: Update Cloud Functions to read `transformNodes` and ensure guest experience processes correctly

**Independent Test**: Trigger transform pipeline job and verify nodes are read from `transformNodes`

### Cloud Functions (US2)

- [X] T009 [US2] Update `buildJobSnapshot()` to use `transformNodes` in `functions/src/repositories/job.ts`
- [X] T010 [US2] Update `functions/src/repositories/job.test.ts` for new schema
- [X] T011 [US2] Update `functions/src/callable/startTransformPipeline.ts` to use `transformNodes`
- [X] T012 [US2] Update `functions/src/tasks/processMediaJob.ts` if it references transform config (N/A - uses legacy pipeline)
- [X] T013 [US2] Update `functions/scripts/seed-emulators.ts` fixture data to use `transformNodes`
- [X] T014 [US2] Update `packages/shared/src/schemas/job/job.schema.ts` if it references `TransformConfig`

### Guest Domain (US4)

- [X] T015 [P] [US4] Update `apps/clementine-app/src/domains/guest/containers/ExperiencePage.tsx` to use `transformNodes` (N/A - uses hasTransformConfig utility, updated in T024)

### Validation

- [X] T016 [US2] Build functions: `pnpm functions:build`

**Checkpoint**: Backend processing works with new schema

---

## Phase 3: User Story 3 - Frontend Editor (Priority: P2)

**Goal**: Update frontend experience editor to save/load transform nodes using new field

**Independent Test**: Add a transform node in UI, refresh page, verify node persists

### Transform Operations Library

- [X] T017 [US3] Update `DEFAULT_TRANSFORM_CONFIG` to use `transformNodes` in `apps/clementine-app/src/domains/experience/generate/lib/transform-operations.ts`
- [X] T018 [US3] Update all operation functions (addNode, removeNode, duplicateNode, reorderNodes, updateNodePrompt, updateNodeModel, updateNodeAspectRatio, addNodeRefMedia, removeNodeRefMedia) in `apps/clementine-app/src/domains/experience/generate/lib/transform-operations.ts`
- [X] T019 [US3] Update `apps/clementine-app/src/domains/experience/generate/lib/transform-operations.test.ts` fixtures and assertions

### Schema Re-exports

- [X] T020 [P] [US3] Remove `TransformConfig`, `OutputFormat` re-exports from `apps/clementine-app/src/domains/experience/shared/schemas/index.ts`

### Hooks

- [X] T021 [US3] Update `apps/clementine-app/src/domains/experience/generate/hooks/useUpdateTransformConfig.ts` to use `transformNodes`
- [X] T022 [P] [US3] Update `apps/clementine-app/src/domains/experience/generate/hooks/useRefMediaUpload.ts` if it references transform config
- [X] T023 [P] [US3] Update exports in `apps/clementine-app/src/domains/experience/generate/hooks/index.ts` if needed (N/A - barrel re-exports unchanged)

### Utility Functions

- [X] T024 [US3] Update or remove `apps/clementine-app/src/domains/experience/shared/utils/hasTransformConfig.ts` (may need renaming to `hasTransformNodes`)

### Components

- [X] T025 [P] [US3] Update `apps/clementine-app/src/domains/experience/generate/containers/TransformPipelineEditor.tsx` to use `transformNodes`
- [X] T026 [P] [US3] Update `apps/clementine-app/src/domains/experience/generate/components/NodeListItem/NodeListItem.tsx` if it references transform config
- [X] T027 [P] [US3] Update `apps/clementine-app/src/domains/experience/generate/components/NodeListItem/NodeSettings.tsx` if it references transform config
- [X] T028 [P] [US3] Update `apps/clementine-app/src/domains/experience/generate/components/NodeListItem/AIImageNode.tsx` if it references transform config
- [X] T029 [P] [US3] Update `apps/clementine-app/src/domains/experience/generate/components/PromptComposer/PromptComposer.tsx` if it references transform config
- [X] T030 [P] [US3] Update `apps/clementine-app/src/domains/experience/generate/components/PromptComposer/ControlRow.tsx` if it references transform config

### Preview

- [X] T031 [P] [US3] Update `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx` to use `transformNodes` (uses hasTransformConfig alias)

### Validation

- [X] T032 [US3] Run app type check: `pnpm app:type-check`
- [X] T033 [US3] Run app tests: `pnpm app:test`

**Checkpoint**: Frontend editor fully functional with new schema

---

## Phase 4: Polish & Validation

**Purpose**: Final verification and cleanup

- [X] T034 Run full validation: `pnpm app:check`
- [X] T035 Search codebase for remaining `transform?.nodes` or `transform.nodes` references (only in specs/docs, not code)
- [X] T036 Search codebase for remaining `TransformConfig` or `OutputFormat` type usage (AiTransformConfig and detectOutputFormat are unrelated)
- [X] T037 Verify quickstart.md validation commands pass
- [X] T038 Remove legacy session schema references in `packages/shared/src/schemas/session.schemas.legacy.ts` if applicable (N/A - pipelineConfigSchema is unrelated)
- [X] T039 Clean up any spec contract files: `specs/048-inline-prompt-phase-1ab/contracts/transform-schemas.ts` (N/A - historical spec doc)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (US1 - Schema) ─┬─► Phase 2 (US2+US4 - Backend/Guest) ─► Phase 4 (Polish)
                        │
                        └─► Phase 3 (US3 - Frontend) ─────────►
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (Schema) | None | None - MUST complete first |
| US2 (Functions) | US1 | US3, US4 |
| US3 (Frontend) | US1 | US2, US4 |
| US4 (Guest) | US1 | US2, US3 |

### Within Each Phase

- Tasks marked [P] can run in parallel
- Non-[P] tasks should run sequentially in order listed
- Validation tasks must run after all implementation tasks in that phase

### Parallel Opportunities

**Phase 2** (after US1 complete):
```
T009-T014 (Functions) can run parallel with T015 (Guest)
```

**Phase 3** (after US1 complete):
```
T020, T022, T023 can run parallel
T025-T031 (Components) can all run parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Schema changes
2. Build shared package
3. **STOP**: All TypeScript errors now visible
4. This is the MVP - schema is the foundation

### Incremental Delivery

1. Phase 1 (US1) → Build shared package → Errors visible
2. Phase 2 (US2+US4) → Build functions → Backend works
3. Phase 3 (US3) → Type check app → Frontend works
4. Phase 4 → Full validation → Ready for merge

### Single Developer Strategy

Execute phases sequentially in order. Within each phase, complete all tasks before validation.

---

## Notes

- All file paths are absolute from monorepo root
- Tests are updated inline (no separate test-first tasks for this refactor)
- Many Phase 3 component tasks may be no-ops if they don't directly reference transform config
- The `outputFormat` in Cloud Functions (image/gif/video) is UNRELATED to schema - do not modify
- Legacy session schema may have stale references - clean up in Phase 4

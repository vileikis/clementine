# Tasks: Session Result Media Schema Alignment

**Input**: Design documents from `/specs/064-session-result-media/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Shared schemas**: `packages/shared/src/schemas/`
- **Cloud Functions**: `functions/src/`
- **Frontend app**: `apps/clementine-app/src/`

---

## Phase 1: Setup

**Purpose**: No project initialization needed — all workspaces already exist. This phase is empty.

*(No tasks — existing monorepo structure is used as-is)*

---

## Phase 2: Foundational (Schema Change)

**Purpose**: Replace `sessionResultMediaSchema` with `mediaReferenceSchema` in the shared schema package. This MUST be complete before writer and consumer updates.

**Why foundational**: The shared schema is the single source of truth for the `Session` type. All downstream code (writers and consumers) imports from this package. Changing the schema first ensures TypeScript catches all locations that need updating.

- [x] T001 Remove `sessionResultMediaSchema`, `SessionResultMedia` type export, and `capturedMediaSchema` import from `sessionSchema`. Add `mediaReferenceSchema` import from `../media/media-reference.schema` and create a backward-compatible `resultMediaReferenceSchema` using `z.preprocess()` that normalizes legacy documents (maps `assetId` → `mediaAssetId`, adds default `displayName: 'Result'`). Replace `resultMedia: sessionResultMediaSchema.nullable().default(null)` with `resultMedia: resultMediaReferenceSchema.nullable().default(null)` in `packages/shared/src/schemas/session/session.schema.ts`
- [x] T002 Update barrel exports in `apps/clementine-app/src/domains/session/shared/schemas/index.ts` — remove `sessionResultMediaSchema` and `type SessionResultMedia` re-exports from `@clementine/shared`

**Checkpoint**: `pnpm --filter @clementine/shared build` should succeed. TypeScript will now report errors in downstream code that references the removed `SessionResultMedia` type — those errors are expected and will be fixed in subsequent phases.

---

## Phase 3: User Story 2 — All Result Writers Produce Standard Format (Priority: P2)

**Goal**: Update the single writer pathway (Cloud Function `transformPipelineJob` → `updateSessionResultMedia()`) to produce `MediaReference` format instead of legacy format.

**Independent Test**: Trigger a transform job and verify the Firestore session document contains `{mediaAssetId, url, filePath, displayName}` instead of `{stepId, assetId, url, createdAt}`.

**Why before US1**: US1 (schema alignment) is already delivered by Phase 2. The writer must be updated next so new documents use the correct format before verifying consumers.

### Implementation for User Story 2

- [x] T003 [US2] Update `updateSessionResultMedia()` function signature in `functions/src/repositories/session.ts` — change parameter type from `SessionResultMedia` to `MediaReference` (import from `@clementine/shared`). Remove the `SessionResultMedia` type import.
- [x] T004 [US2] Update the `finalizeJobSuccess()` function in `functions/src/tasks/transformPipelineJob.ts` — change the `updateSessionResultMedia()` call at lines 173-178 to write `{mediaAssetId: output.assetId, url: output.url, filePath: getOutputStoragePath(projectId, sessionId, 'output', 'jpg'), displayName: 'Result'}` instead of `{stepId: 'create', assetId: output.assetId, url: output.url, createdAt: Date.now()}`. Import `getOutputStoragePath` from `../infra/storage`.

**Checkpoint**: `pnpm functions:build` should succeed. New transform jobs will write `MediaReference` format to Firestore.

---

## Phase 4: User Story 3 — All Result Consumers Read Standard Format (Priority: P3)

**Goal**: Update all frontend consumers that reference the `SessionResultMedia` type to use `MediaReference` instead.

**Independent Test**: Load a session with result media (both new and legacy format) on the SharePage and verify the result displays correctly and sharing works.

### Implementation for User Story 3

- [x] T005 [P] [US3] Update `runtime.types.ts` in `apps/clementine-app/src/domains/experience/shared/types/runtime.types.ts` — replace `import type { SessionResultMedia } from '@/domains/session'` with `import type { MediaReference } from '@clementine/shared'` and change `resultMedia: SessionResultMedia | null` to `resultMedia: MediaReference | null` in the `RuntimeState` interface. Remove the unused `SessionMode` import from `@/domains/session` if it was only imported alongside `SessionResultMedia` (check if `SessionMode` is still used in this file).
- [x] T006 [P] [US3] Update `experienceRuntimeStore.ts` in `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts` — replace `import type { SessionResultMedia } from '@/domains/session'` with `import type { MediaReference } from '@clementine/shared'`. Change `resultMedia: SessionResultMedia | null` to `resultMedia: MediaReference | null` in `ExperienceRuntimeState` interface. Change `setResultMedia: (resultMedia: SessionResultMedia) => void` to `setResultMedia: (resultMedia: MediaReference) => void` in `ExperienceRuntimeActions` interface.

**Checkpoint**: `pnpm app:type-check` should pass with zero errors. SharePage continues to work unchanged (it only accesses `.url`).

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validation, cleanup, and verification across all workspaces.

- [x] T007 Run `pnpm --filter @clementine/shared test` to verify existing schema tests still pass and the backward-compatible preprocessor correctly normalizes legacy `resultMedia` documents in `packages/shared/src/schemas/session/session.schema.ts`
- [x] T008 Run `pnpm app:check` (format + lint) and `pnpm app:type-check` across the TanStack Start app to ensure no regressions in `apps/clementine-app/`
- [x] T009 Run `pnpm functions:build` to verify Cloud Functions compile cleanly in `functions/`
- [x] T010 Run quickstart.md verification steps: confirm type-check passes, schema tests pass for both new and legacy formats, and no `SessionResultMedia` or `sessionResultMediaSchema` references remain in the codebase

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — starts immediately
- **Phase 3 (US2 - Writers)**: Depends on Phase 2 (schema must be updated before writer code)
- **Phase 4 (US3 - Consumers)**: Depends on Phase 2 (schema must be updated before consumer code). Can run in parallel with Phase 3.
- **Phase 5 (Polish)**: Depends on Phases 2, 3, and 4 all being complete

### User Story Dependencies

- **User Story 1 (P1 - Schema)**: Delivered by Phase 2 (Foundational) — no separate phase needed since the schema change IS the foundational work
- **User Story 2 (P2 - Writers)**: Depends on Phase 2. Single writer, sequential tasks (T003 → T004).
- **User Story 3 (P3 - Consumers)**: Depends on Phase 2. T005 and T006 can run in parallel (different files).

### Parallel Opportunities

- T005 and T006 can run in parallel (different files, both depend only on Phase 2)
- Phase 3 (Writers) and Phase 4 (Consumers) can run in parallel after Phase 2 completes
- T007, T008, T009 can run in parallel during Phase 5

---

## Parallel Example: User Story 3

```bash
# Launch consumer updates together (different files, no dependencies):
Task T005: "Update runtime.types.ts — replace SessionResultMedia with MediaReference"
Task T006: "Update experienceRuntimeStore.ts — replace SessionResultMedia with MediaReference"
```

---

## Implementation Strategy

### MVP First (Phase 2 + Phase 3)

1. Complete Phase 2: Schema change with backward compatibility
2. Complete Phase 3: Writer update
3. **STOP and VALIDATE**: Run `pnpm functions:build` and verify new transform jobs write correct format
4. At this point, new sessions use the standard format while legacy sessions still parse correctly

### Incremental Delivery

1. Phase 2 → Schema aligned, backward compat in place
2. Phase 3 → Writer produces correct format → Verify with `pnpm functions:build`
3. Phase 4 → Consumers use correct types → Verify with `pnpm app:type-check`
4. Phase 5 → Full validation across all workspaces

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 (Schema Alignment) is inherently delivered by Phase 2 — it has no separate phase because the schema change IS the foundational prerequisite
- SharePage.tsx and useShareActions.ts require NO changes — they only access `.url` which exists on both old and new schemas
- useRuntime.ts requires NO changes — it uses the `RuntimeState` interface which auto-resolves via runtime.types.ts
- Total files modified: 6 (across 3 workspaces)

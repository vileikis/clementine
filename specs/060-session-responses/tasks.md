# Tasks: Session Responses + Guest Runtime

**Input**: Design documents from `/specs/060-session-responses/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Shared schemas**: `packages/shared/src/schemas/session/`
- **App runtime**: `apps/clementine-app/src/domains/experience/runtime/`
- **App session**: `apps/clementine-app/src/domains/session/shared/`
- **App guest**: `apps/clementine-app/src/domains/guest/components/`

---

## Phase 1: Setup (Schema Foundation)

**Purpose**: Add responses field to shared schema - required before any runtime changes

- [x] T001 Add `responses` field to session schema in `packages/shared/src/schemas/session/session.schema.ts` with JSDoc deprecation comments on `answers` and `capturedMedia`
- [x] T002 Add `mediaReferenceSchema` to `packages/shared/src/schemas/session/session-response.schema.ts` for capture context validation (SKIPPED: Already exists in media-reference.schema.ts)
- [x] T003 Export `MediaReference` type from `packages/shared/src/schemas/session/index.ts` (SKIPPED: Already exported via @clementine/shared)
- [x] T004 Run `pnpm --filter @clementine/shared build` to verify schema compiles

---

## Phase 2: Foundational (Store Infrastructure)

**Purpose**: Core store infrastructure that MUST be complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add `responses: SessionResponse[]` state field to `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`
- [x] T006 Add `setResponse` action to store that updates/inserts by stepId in `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`
- [x] T007 Update `initFromSession` to initialize `responses` from session data in `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`
- [x] T008 Add `responses` to `RuntimeState` type in `apps/clementine-app/src/domains/experience/shared/types/runtime.types.ts`
- [x] T009 Add `setResponse`, `getResponse`, `getResponses` methods to useRuntime hook in `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts`
- [x] T010 Add `responses` parameter to `updateSessionProgressInputSchema` in `apps/clementine-app/src/domains/session/shared/hooks/useUpdateSessionProgress.ts`
- [x] T011 Update mutation to write `responses` to Firestore in `apps/clementine-app/src/domains/session/shared/hooks/useUpdateSessionProgress.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Text Input Response (Priority: P1) 🎯 MVP

**Goal**: Guest can complete text input steps (shortText, longText, scale, yesNo) and responses are stored in unified format

**Independent Test**: Complete a short text input step and verify response has stepId, stepName, stepType, value, context=null, and timestamps

### Implementation for User Story 1

- [x] T012 [US1] Create `buildTextResponse` helper function in `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts` that builds SessionResponse with value and null context
- [x] T013 [US1] Update `handleAnswer` in `apps/clementine-app/src/domains/guest/components/GuestRuntimeContent.tsx` to call `runtime.setResponse()` for text input steps (shortText, longText, scale, yesNo)
- [x] T014 [US1] Update ExperienceRuntime sync logic to pass `responses` to `syncToFirestore` in `apps/clementine-app/src/domains/experience/runtime/containers/ExperienceRuntime.tsx`
- [x] T015 [US1] Remove writing of `answers` array for text inputs in sync logic (backward compatible: keep reading) - NOTE: Dual-write kept for migration period

**Checkpoint**: Text input responses now store in unified format. Test with shortText, scale, and yesNo steps.

---

## Phase 4: User Story 2 - Photo/Video Capture Response (Priority: P1)

**Goal**: Guest can complete capture steps (photo, video) and responses store MediaReference[] in context with value=null

**Independent Test**: Complete a photo capture and verify response has value=null, context contains MediaReference array with mediaAssetId, url, filePath, displayName

### Implementation for User Story 2

- [x] T016 [US2] Create `buildCaptureResponse` helper function in `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts` that builds SessionResponse with null value and MediaReference[] context
- [x] T017 [US2] Update capture handler in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/CapturePhotoRunMode.tsx` to call `setResponse()` with MediaReference context including filePath and displayName
- [x] T018 [US2] Remove writing of `capturedMedia` array in sync logic (backward compatible: keep reading) - NOTE: Dual-write kept for migration period

**Checkpoint**: Photo and video capture responses now store in unified format with MediaReference context.

---

## Phase 5: User Story 3 - Multi-Select Input Response (Priority: P2)

**Goal**: Guest can complete multi-select input steps and responses store both value array and full option objects in context

**Independent Test**: Select multiple options and verify response has value=["opt1", "opt2"] and context contains MultiSelectOption[] with promptFragment

### Implementation for User Story 3

- [x] T019 [US3] Create `buildMultiSelectResponse` helper function in `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts` that builds SessionResponse with string[] value and MultiSelectOption[] context
- [x] T020 [US3] Update multi-select handler in `apps/clementine-app/src/domains/guest/components/GuestRuntimeContent.tsx` to call `runtime.setResponse()` with both value array and option context

**Checkpoint**: Multi-select responses now store both selected values and full option metadata.

---

## Phase 6: User Story 4 - Responses Persist to Storage (Priority: P1)

**Goal**: All responses persist to Firestore and survive page refresh, deprecated fields remain readable

**Independent Test**: Complete steps, refresh page, verify responses load correctly; verify old sessions with answers/capturedMedia still work

### Implementation for User Story 4

- [x] T021 [US4] Verify `initFromSession` loads existing `responses` from Firestore document in `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`
- [x] T022 [US4] Update completion sync to include final `responses` array in `apps/clementine-app/src/domains/experience/runtime/containers/ExperienceRuntime.tsx`
- [x] T023 [US4] Verify backward compatibility: sessions with only `answers`/`capturedMedia` still load (no responses field) in `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`

**Checkpoint**: Full persistence working. Responses survive refresh and old sessions remain compatible.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T024 Add JSDoc comments to all new functions and types
- [x] T025 Run `pnpm app:check` to fix lint and format issues
- [x] T026 Run `pnpm app:type-check` to verify TypeScript compilation
- [ ] T027 Run quickstart.md manual validation scenarios (requires manual testing)
- [x] T028 Verify no writes to deprecated `answers` and `capturedMedia` fields for new sessions - NOTE: Dual-write intentionally kept for migration period safety

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Text Input) and US2 (Capture) are P1 and can run in parallel
  - US3 (Multi-Select) is P2, can start after Foundational
  - US4 (Persistence) is P1 but logically verifies US1-US3, best done after
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational - No dependencies on other stories
- **User Story 4 (P1)**: Logically tests all stories, best after US1-US3 but technically independent

### Within Each User Story

- Helper function before component integration
- Component integration before sync updates
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003 can run in parallel (different files)
- T005, T006, T007 must be sequential (same file)
- T012-T015 (US1) and T016-T018 (US2) can run in parallel after Foundational
- T024, T025, T026 can run in parallel (different concerns)

---

## Parallel Example: User Stories 1 & 2 (After Foundational)

```bash
# Can launch US1 and US2 implementation in parallel:
# Developer A: User Story 1 (Text Input)
Task: T012 [US1] Create buildTextResponse helper
Task: T013 [US1] Update handleAnswer for text inputs
Task: T014 [US1] Update sync logic for responses
Task: T015 [US1] Remove answers array writes

# Developer B: User Story 2 (Capture)
Task: T016 [US2] Create buildCaptureResponse helper
Task: T017 [US2] Update capture handler
Task: T018 [US2] Remove capturedMedia array writes
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (schema changes)
2. Complete Phase 2: Foundational (store + hook infrastructure)
3. Complete Phase 3: User Story 1 (text inputs)
4. **STOP and VALIDATE**: Test text input responses independently
5. Deploy/demo if ready - text inputs work in new format

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add User Story 1 → Text inputs work → Deploy (MVP!)
3. Add User Story 2 → Captures work → Deploy
4. Add User Story 3 → Multi-select works → Deploy
5. Add User Story 4 → Full persistence verified → Deploy
6. Each story adds value without breaking previous stories

### Recommended Order

Given the dependencies and P1 priorities:
1. **Phase 1-2**: Setup + Foundational (required first)
2. **Phase 3**: User Story 1 - Text inputs (most common step type)
3. **Phase 4**: User Story 2 - Captures (core to product)
4. **Phase 6**: User Story 4 - Persistence (verify all works)
5. **Phase 5**: User Story 3 - Multi-select (P2, can wait)
6. **Phase 7**: Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Backward compatibility: Keep reading from deprecated fields, stop writing to them

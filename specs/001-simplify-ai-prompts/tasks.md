# Tasks: Simplify AI Prompts

**Input**: Design documents from `/specs/001-simplify-ai-prompts/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included as this feature requires updating existing tests and adding new test coverage for passthrough mode and prompt validation (Constitution Principle IV: Minimal Testing Strategy).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: All paths are within `web/` workspace
- **Source**: `web/src/`
- **Tests**: Co-located with source files (e.g., `web/src/lib/repositories/scenes.test.ts`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks needed - this is a modification to existing codebase.

**Checkpoint**: Foundation exists, ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type and schema changes that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 [P] Remove EffectType enum from web/src/lib/types/firestore.ts
- [ ] T002 [P] Remove `effect` field from Scene interface in web/src/lib/types/firestore.ts
- [ ] T003 [P] Remove `defaultPrompt` field from Scene interface in web/src/lib/types/firestore.ts
- [ ] T004 [P] Update `prompt` field to `prompt: string | null` in Scene interface in web/src/lib/types/firestore.ts
- [ ] T005 [P] Remove `effect` field from TransformParams in web/src/lib/ai/types.ts
- [ ] T006 [P] Update SceneSchema prompt validation in web/src/lib/schemas/firestore.ts (z.string().max(600).nullable())
- [ ] T007 [P] Remove `effect` and `defaultPrompt` fields from SceneSchema in web/src/lib/schemas/firestore.ts
- [ ] T008 Delete web/src/lib/ai/prompts.ts file entirely (remove buildPromptForEffect function)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Custom AI Effect with Prompt (Priority: P1) 🎯 MVP

**Goal**: Event creators can define custom AI transformations using their own prompts and optional reference images. AI transformation uses the scene's custom prompt directly without hardcoded templates.

**Independent Test**: Create a scene with custom prompt "Transform into anime style" and reference image, submit a photo as guest, verify AI transformation follows the prompt and style.

### Tests for User Story 1

> **NOTE: Update these tests to FAIL before implementation, then make them pass**

- [ ] T009 [P] [US1] Update scenes.test.ts to remove tests for `effect` field in web/src/lib/repositories/scenes.test.ts
- [ ] T010 [P] [US1] Update scenes.test.ts to remove tests for `defaultPrompt` field in web/src/lib/repositories/scenes.test.ts
- [ ] T011 [P] [US1] Add test for creating scene with custom prompt in web/src/lib/repositories/scenes.test.ts
- [ ] T012 [P] [US1] Add test for prompt validation (max 600 chars) in web/src/lib/repositories/scenes.test.ts
- [ ] T013 [P] [US1] Add test for prompt validation failure (> 600 chars) in web/src/lib/repositories/scenes.test.ts

### Implementation for User Story 1

- [ ] T014 [P] [US1] Remove buildPromptForEffect import from web/src/lib/ai/providers/google-ai.ts
- [ ] T015 [P] [US1] Update Google AI provider to use params.prompt directly in web/src/lib/ai/providers/google-ai.ts
- [ ] T016 [P] [US1] Remove buildPromptForEffect import from web/src/lib/ai/providers/n8n-webhook.ts
- [ ] T017 [P] [US1] Update n8n provider to pass params.prompt directly in payload in web/src/lib/ai/providers/n8n-webhook.ts
- [ ] T018 [P] [US1] Remove buildPromptForEffect import from web/src/lib/ai/providers/mock.ts
- [ ] T019 [P] [US1] Update mock provider to log params.prompt directly in web/src/lib/ai/providers/mock.ts
- [ ] T020 [US1] Remove defaultPrompt handling from scenes repository in web/src/lib/repositories/scenes.ts
- [ ] T021 [US1] Update createScene action to remove effect parameter in web/src/app/actions/scenes.ts
- [ ] T022 [US1] Update updateScene action to remove effect parameter in web/src/app/actions/scenes.ts
- [ ] T023 [US1] Ensure prompt validation uses updated SceneSchema in web/src/app/actions/scenes.ts
- [ ] T024 [US1] Update PromptEditor component for 600 char validation in web/src/components/organizer/PromptEditor.tsx
- [ ] T025 [US1] Add character count display (X / 600) in PromptEditor in web/src/components/organizer/PromptEditor.tsx
- [ ] T026 [US1] Add validation error display for > 600 chars in PromptEditor in web/src/components/organizer/PromptEditor.tsx
- [ ] T027 [US1] Ensure mobile-friendly keyboard type in PromptEditor in web/src/components/organizer/PromptEditor.tsx

**Checkpoint**: At this point, custom AI prompts should be fully functional - creators can enter prompts, AI providers use them directly

---

## Phase 4: User Story 2 - No-Transform Passthrough (Priority: P2)

**Goal**: Event creators can create scenes where guests upload photos without AI transformation (passthrough mode for photo collection, manual processing, or cost reduction).

**Independent Test**: Create a scene with empty prompt, submit a photo as guest, verify input photo is directly copied to result without transformation (< 5 seconds).

### Tests for User Story 2

- [ ] T028 [P] [US2] Add test for passthrough mode (empty prompt) in web/src/lib/repositories/sessions.test.ts
- [ ] T029 [P] [US2] Add test for passthrough copies input to result in web/src/lib/repositories/sessions.test.ts
- [ ] T030 [P] [US2] Add test for passthrough completes quickly (< 5s) in web/src/lib/repositories/sessions.test.ts
- [ ] T031 [P] [US2] Add test for copyImageToResult function in web/src/lib/storage/upload.test.ts

### Implementation for User Story 2

- [ ] T032 [US2] Add copyImageToResult function in web/src/lib/storage/upload.ts
- [ ] T033 [US2] Implement Firebase Storage copy logic (getBytes + uploadBytes) in copyImageToResult in web/src/lib/storage/upload.ts
- [ ] T034 [US2] Add passthrough mode detection in triggerTransformAction in web/src/app/actions/sessions.ts
- [ ] T035 [US2] Implement early exit for empty prompt (call copyImageToResult) in triggerTransformAction in web/src/app/actions/sessions.ts
- [ ] T036 [US2] Update session state to "ready" for passthrough in triggerTransformAction in web/src/app/actions/sessions.ts
- [ ] T037 [US2] Ensure passthrough skips AI provider calls in triggerTransformAction in web/src/app/actions/sessions.ts

**Checkpoint**: At this point, both custom AI prompts AND passthrough mode should work independently

---

## Phase 5: User Story 3 - Remove Legacy Effect System (Priority: P3)

**Goal**: Clean up deprecated code paths by removing predefined effect types (background_swap, deep_fake) and associated UI components, since all existing events already have prompts populated.

**Independent Test**: Verify existing scenes with predefined effects continue to work using their `prompt` field, and new scene creation UI only shows custom prompt editor (no effect type selector).

### Tests for User Story 3

No new tests needed - existing tests already updated in Phase 3 (removed effect field tests).

### Implementation for User Story 3

- [ ] T038 [US3] Delete EffectPicker component file at web/src/components/organizer/EffectPicker.tsx
- [ ] T039 [US3] Remove EffectPicker import from scene configuration page in web/src/app/events/[eventId]/scene/page.tsx
- [ ] T040 [US3] Remove EffectPicker component usage from scene configuration page in web/src/app/events/[eventId]/scene/page.tsx
- [ ] T041 [US3] Verify scene page only shows PromptEditor and RefImageUploader in web/src/app/events/[eventId]/scene/page.tsx

**Checkpoint**: All user stories should now be independently functional - legacy code removed, clean prompt-based system in place

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and validation

- [ ] T042 [P] Add JSDoc comments for copyImageToResult function in web/src/lib/storage/upload.ts
- [ ] T043 [P] Add logging for passthrough mode in triggerTransformAction in web/src/app/actions/sessions.ts
- [ ] T044 [P] Update any remaining references to effect or defaultPrompt in web/src (search and clean up)
- [ ] T045 Verify mobile viewport (320px) for PromptEditor using dev tools

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T046 Run `pnpm lint` and fix all errors/warnings
- [ ] T047 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T048 Run `pnpm test` and ensure all tests pass
- [ ] T049 Verify feature in local dev server (`pnpm dev`) - test both custom prompts and passthrough
- [ ] T050 Manual test: Create scene with custom prompt, verify AI transformation
- [ ] T051 Manual test: Create scene with empty prompt, verify passthrough (< 5s)
- [ ] T052 Manual test: Validate prompt > 600 chars shows error
- [ ] T053 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No setup needed - working in existing codebase
- **Foundational (Phase 2)**: No dependencies - BLOCKS all user stories (type/schema changes)
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (Custom AI Prompts): Can start after Foundational
  - User Story 2 (Passthrough Mode): Can start after Foundational (independent of US1)
  - User Story 3 (Remove Legacy): Can start after Foundational (independent of US1/US2)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (adds passthrough, doesn't modify US1)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories (cleanup only, doesn't break US1/US2)

### Within Each User Story

- Tests should be updated/added first and verified to fail
- Type/schema changes in Foundational must complete before implementation
- AI provider updates can run in parallel (different files)
- Server Action updates depend on AI provider updates
- UI component updates can run in parallel with Server Actions

### Parallel Opportunities

- **Foundational tasks**: All T001-T008 marked [P] can run in parallel (different sections of files or different files)
- **US1 tests**: All T009-T013 marked [P] can run in parallel
- **US1 AI providers**: T014-T019 marked [P] can run in parallel (google-ai.ts, n8n-webhook.ts, mock.ts)
- **US2 tests**: All T028-T031 marked [P] can run in parallel
- **Polish**: T042-T044 marked [P] can run in parallel
- **Different user stories**: US1, US2, US3 can be worked on in parallel by different team members after Foundational completes

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational type/schema changes together:
Task: "Remove EffectType enum from web/src/lib/types/firestore.ts"
Task: "Remove effect field from Scene interface in web/src/lib/types/firestore.ts"
Task: "Remove defaultPrompt field from Scene interface in web/src/lib/types/firestore.ts"
Task: "Update prompt field to prompt: string | null in Scene interface in web/src/lib/types/firestore.ts"
Task: "Remove effect field from TransformParams in web/src/lib/ai/types.ts"
Task: "Update SceneSchema prompt validation in web/src/lib/schemas/firestore.ts"
Task: "Remove effect and defaultPrompt fields from SceneSchema in web/src/lib/schemas/firestore.ts"
Task: "Delete web/src/lib/ai/prompts.ts file entirely"
```

---

## Parallel Example: User Story 1 - AI Providers

```bash
# Launch all AI provider updates together (after foundational types are complete):
Task: "Update Google AI provider to use params.prompt directly in web/src/lib/ai/providers/google-ai.ts"
Task: "Update n8n provider to pass params.prompt directly in web/src/lib/ai/providers/n8n-webhook.ts"
Task: "Update mock provider to log params.prompt directly in web/src/lib/ai/providers/mock.ts"
```

---

## Parallel Example: User Story 2 - Tests

```bash
# Launch all passthrough tests together:
Task: "Add test for passthrough mode (empty prompt) in web/src/lib/repositories/sessions.test.ts"
Task: "Add test for passthrough copies input to result in web/src/lib/repositories/sessions.test.ts"
Task: "Add test for passthrough completes quickly (< 5s) in web/src/lib/repositories/sessions.test.ts"
Task: "Add test for copyImageToResult function in web/src/lib/storage/upload.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (type/schema changes) - CRITICAL
2. Complete Phase 3: User Story 1 (custom AI prompts)
3. **STOP and VALIDATE**: Test User Story 1 independently
   - Create scene with custom prompt
   - Verify AI transformation uses custom prompt
   - Test prompt validation (600 char limit)
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Type system updated, foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
   - Event creators can define custom AI prompts
   - AI providers use prompts directly
3. Add User Story 2 → Test independently → Deploy/Demo
   - Passthrough mode available for non-AI use cases
   - Cost savings for events that don't need AI
4. Add User Story 3 → Test independently → Deploy/Demo
   - Codebase cleaned up, legacy code removed
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together (Phase 2)
2. Once Foundational is done:
   - Developer A: User Story 1 (custom AI prompts)
   - Developer B: User Story 2 (passthrough mode)
   - Developer C: User Story 3 (remove legacy code)
3. Stories complete and integrate independently
4. Polish phase wraps up cross-cutting concerns

---

## Task Summary

- **Total tasks**: 53
- **Foundational tasks**: 8 (T001-T008)
- **User Story 1 tasks**: 19 (T009-T027) - 5 tests, 14 implementation
- **User Story 2 tasks**: 10 (T028-T037) - 4 tests, 6 implementation
- **User Story 3 tasks**: 4 (T038-T041) - 0 new tests, 4 implementation
- **Polish & Validation tasks**: 12 (T042-T053)

### Parallel Opportunities

- 8 parallel tasks in Foundational (T001-T008)
- 5 parallel tests in US1 (T009-T013)
- 6 parallel implementations in US1 (T014-T019)
- 4 parallel tests in US2 (T028-T031)
- 3 parallel polish tasks (T042-T044)
- **Total: 26 tasks can run in parallel** (49% of total)

### Independent Test Criteria

- **US1**: Create scene with custom prompt → Verify AI uses prompt directly
- **US2**: Create scene with empty prompt → Verify passthrough < 5s
- **US3**: Verify scene UI only shows PromptEditor (no EffectPicker)

### Suggested MVP Scope

**User Story 1 only** (19 tasks + 8 foundational = 27 tasks):
- Foundational type/schema changes
- Custom AI prompts functional
- AI providers use prompts directly
- Prompt validation (600 chars)
- Mobile-friendly PromptEditor

This delivers core value: custom AI transformations replacing hardcoded effects.

---

## Format Validation

✅ All tasks follow required checklist format:
- `- [ ]` checkbox prefix
- Sequential Task IDs (T001-T053)
- `[P]` marker for parallel tasks (26 tasks marked)
- `[Story]` label for user story tasks (US1, US2, US3)
- Clear descriptions with exact file paths
- No vague tasks, all actionable and specific

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Existing scenes with `effect` field will continue to work (backwards compatible)
- No data migration needed (user confirmed all scenes have prompts)

# Tasks: AI Transform Pipeline

**Input**: Design documents from `/specs/029-ai-transform-pipeline/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests are deferred per plan.md. Manual integration testing with emulators will be performed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Firebase Cloud Functions monorepo within a pnpm workspace:
- Cloud Functions: `functions/src/`
- Schemas: `functions/src/lib/schemas/`
- Services: `functions/src/services/`
- Tests: Manual integration tests with Firebase emulators

---

## Phase 1: Setup (Dependencies & Configuration)

**Purpose**: Install dependencies and configure Firebase Params for API keys

- [x] T001 Install @google/genai SDK in functions/package.json
- [x] T002 Configure GOOGLE_AI_API_KEY using Firebase Params (defineSecret) - Will be prompted on first emulator run
- [x] T003 Upload reference images to Firebase Storage at media/company-test-001/ai-reference/ (hobbit-costume.jpg, black-magic-wand.jpg) - Already handled by seed script

---

## Phase 2: Foundational (AI Service Infrastructure)

**Purpose**: Create AI service layer that all user stories will use

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [P] Create AiTransformConfig interface in functions/src/services/ai/providers/types.ts
- [ ] T005 [P] Create AiProvider interface in functions/src/services/ai/providers/types.ts
- [ ] T006 [P] Create AiTransformError class and AiTransformErrorCode type in functions/src/services/ai/providers/types.ts
- [ ] T007 Create GoogleGeminiProvider class implementing AiProvider in functions/src/services/ai/providers/gemini.provider.ts
- [ ] T008 Implement GoogleGeminiProvider.transformImage() method with Gemini API integration in functions/src/services/ai/providers/gemini.provider.ts
- [ ] T009 Create MOCKED_AI_CONFIG constant in functions/src/services/ai/config.ts
- [ ] T010 Implement transformImage() orchestration function in functions/src/services/ai/ai-transform.service.ts
- [ ] T011 Create barrel export in functions/src/services/ai/index.ts for AI services and types

**Checkpoint**: AI service infrastructure ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Process Single Image with AI Transform (Priority: P1) 🎯 MVP

**Goal**: Enable AI transformation for single image sessions via aiTransform flag

**Independent Test**: Submit a single-image session with `aiTransform: true` via processMedia endpoint and verify output contains AI-transformed image

### Implementation for User Story 1

- [ ] T012 [P] [US1] Add aiTransform field to processMediaRequestSchema in functions/src/lib/schemas/media-pipeline.schema.ts
- [ ] T013 [P] [US1] Add aiTransform field to pipelineOptionsSchema in functions/src/lib/schemas/media-pipeline.schema.ts
- [ ] T014 [US1] Extract aiTransform from request body and pass to Cloud Task payload in functions/src/http/processMedia.ts
- [ ] T015 [US1] Extract aiTransform from task payload and pass to pipelineOptions in functions/src/tasks/processMediaJob.ts
- [ ] T016 [US1] Import transformImage from services/ai in functions/src/services/media-pipeline/image.pipeline.ts
- [ ] T017 [US1] Add AI transform step in image.pipeline.ts after downloading input, check options.aiTransform
- [ ] T018 [US1] Call transformImage() with inputBuffer and MOCKED_AI_CONFIG in functions/src/services/media-pipeline/image.pipeline.ts
- [ ] T019 [US1] Update session state to 'ai-transform' during transformation in functions/src/services/media-pipeline/image.pipeline.ts
- [ ] T020 [US1] Use transformed buffer for subsequent pipeline steps (overlay, encoding) in functions/src/services/media-pipeline/image.pipeline.ts
- [ ] T021 [US1] Wrap AI transform in try-catch and handle AiTransformError → markSessionFailed() in functions/src/services/media-pipeline/image.pipeline.ts

**Checkpoint**: Single image with aiTransform: true should complete successfully and produce AI-transformed output

---

## Phase 4: User Story 2 - Skip AI Transform for GIF Pipeline (Priority: P1)

**Goal**: Ensure AI transform is correctly ignored for GIF/video output formats

**Independent Test**: Submit multi-image session with `aiTransform: true` and `outputFormat: "gif"`, verify standard GIF output without transformation

### Implementation for User Story 2

- [ ] T022 [US2] Add check in processGIF() for aiTransform flag in functions/src/services/media-pipeline/gif.pipeline.ts
- [ ] T023 [US2] Log warning when aiTransform is true but outputFormat is 'gif' in functions/src/services/media-pipeline/gif.pipeline.ts
- [ ] T024 [US2] Ensure GIF pipeline continues without calling transformImage() in functions/src/services/media-pipeline/gif.pipeline.ts

**Checkpoint**: GIF sessions with aiTransform: true should log warning and produce standard GIF without errors

---

## Phase 5: User Story 3 - AI Transform with Reference Images (Priority: P2)

**Goal**: Include reference images from Firebase Storage in AI transformation requests

**Independent Test**: Verify mocked AI config includes reference image paths and these are loaded during transformation

### Implementation for User Story 3

- [ ] T025 [US3] Implement reference image loading logic in transformImage() service in functions/src/services/ai/ai-transform.service.ts
- [ ] T026 [US3] Download reference images to buffers using Firebase Admin Storage SDK in functions/src/services/ai/ai-transform.service.ts
- [ ] T027 [US3] Pass reference image buffers to GoogleGeminiProvider.transformImage() in functions/src/services/ai/ai-transform.service.ts
- [ ] T028 [US3] Validate reference image paths exist in Storage before AI call in functions/src/services/ai/ai-transform.service.ts
- [ ] T029 [US3] Throw AiTransformError with code 'REFERENCE_IMAGE_NOT_FOUND' if validation fails in functions/src/services/ai/ai-transform.service.ts

**Checkpoint**: AI transformations should include configured reference images from Storage

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, error handling, logging, and documentation

- [ ] T030 [P] Add AI transformation logging (start, completion, duration) in functions/src/services/ai/ai-transform.service.ts
- [ ] T031 [P] Add error code mapping for AiTransformError types in functions/src/services/media-pipeline/image.pipeline.ts
- [ ] T032 [P] Update MANUAL-TESTING.md with AI transform test scenarios
- [ ] T033 Test locally with emulators: Success path (single image with aiTransform: true)
- [ ] T034 Test locally with emulators: Skip path (GIF with aiTransform: true)
- [ ] T035 Test locally with emulators: Error path (missing reference image)
- [ ] T036 Test locally with emulators: AI transform + overlay combination

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T037 Run `pnpm lint` from root and fix all errors/warnings
- [ ] T038 Run `pnpm type-check` from root and resolve all TypeScript errors
- [ ] T039 Verify all acceptance scenarios from spec.md pass with emulators
- [ ] T040 Commit changes after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (P1 → P1 → P2)
  - US1 and US2 are both P1 but US1 must complete first (US2 modifies different pipeline)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after US1 (separate pipeline) - No technical dependencies but lower priority within P1
- **User Story 3 (P2)**: Can start after US1 (enhances AI transform) - Requires US1 to be complete

### Within Each User Story

- Schema changes before HTTP endpoint changes
- HTTP endpoint changes before task handler changes
- Task handler changes before pipeline integration
- Pipeline integration before error handling
- Core implementation before logging/monitoring

### Parallel Opportunities

- Phase 1: All setup tasks (T001, T002, T003) can run in parallel
- Phase 2: T004, T005, T006 (types) can run in parallel
- Phase 3 (US1): T012, T013 (schema changes) can run in parallel
- Phase 6: T030, T031, T032 (logging, error mapping, docs) can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all type definition tasks together:
Task T004: "Create AiTransformConfig interface in functions/src/services/ai/providers/types.ts"
Task T005: "Create AiProvider interface in functions/src/services/ai/providers/types.ts"
Task T006: "Create AiTransformError class in functions/src/services/ai/providers/types.ts"
```

---

## Parallel Example: User Story 1

```bash
# Launch schema changes in parallel:
Task T012: "Add aiTransform to processMediaRequestSchema in functions/src/lib/schemas/media-pipeline.schema.ts"
Task T013: "Add aiTransform to pipelineOptionsSchema in functions/src/lib/schemas/media-pipeline.schema.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install SDK, env vars, reference images)
2. Complete Phase 2: Foundational (AI service infrastructure - CRITICAL)
3. Complete Phase 3: User Story 1 (single image AI transform)
4. **STOP and VALIDATE**: Test User Story 1 independently with emulators
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → AI infrastructure ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (boundary validation)
4. Add User Story 3 → Test independently → Deploy/Demo (enhanced AI with references)
5. Each story adds value without breaking previous stories

### Sequential Strategy (Recommended)

Since this is a single backend feature with tight coupling:

1. Complete Setup + Foundational together
2. Complete User Story 1 (core functionality)
3. Complete User Story 2 (boundary condition)
4. Complete User Story 3 (enhancement)
5. Complete Polish phase (validation & docs)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable with emulators
- Manual testing replaces automated tests per plan.md
- Commit after each logical group of tasks
- Stop at any checkpoint to validate story independently
- MOCKED_AI_CONFIG avoids premature Firestore integration (YAGNI principle)
- Reference images must be uploaded to Storage before testing US3

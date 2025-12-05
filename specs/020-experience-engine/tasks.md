# Tasks: Experience Engine

**Input**: Design documents from `/specs/020-experience-engine/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Minimal testing per Constitution Principle IV - core hooks only, co-located test files.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/features/experience-engine/` for engine module
- **Sessions**: `web/src/features/sessions/` for session domain extensions

---

## Phase 1: Setup (Module Structure)

**Purpose**: Create feature module structure and barrel exports

- [X] T001 Create feature module directory structure at `web/src/features/experience-engine/`
- [X] T002 [P] Create barrel export at `web/src/features/experience-engine/index.ts`
- [X] T003 [P] Create types barrel at `web/src/features/experience-engine/types/index.ts`
- [X] T004 [P] Create hooks barrel at `web/src/features/experience-engine/hooks/index.ts`
- [X] T005 [P] Create components barrel at `web/src/features/experience-engine/components/index.ts`
- [X] T006 [P] Create schemas barrel at `web/src/features/experience-engine/schemas/index.ts`
- [X] T007 [P] Create lib barrel at `web/src/features/experience-engine/lib/index.ts`
- [X] T008 [P] Create steps barrel at `web/src/features/experience-engine/components/steps/index.ts`

---

## Phase 2: Foundational (Types, Schemas, Sessions Extension)

**Purpose**: Core types and schemas that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Engine Types & Schemas

- [X] T009 [P] Create EngineConfig and EngineState types in `web/src/features/experience-engine/types/engine.types.ts`
- [X] T010 [P] Create StepRendererProps and RendererRegistry types in `web/src/features/experience-engine/types/renderer.types.ts`
- [X] T011 [P] Create EngineConfig Zod schema in `web/src/features/experience-engine/schemas/engine.schemas.ts`

### Sessions Module Extension

- [X] T012 [P] Add TransformationStatus type to `web/src/features/sessions/types/sessions.types.ts`
- [X] T013 [P] Add EngineSession type to `web/src/features/sessions/types/sessions.types.ts`
- [X] T014 [P] Add transformation status Zod schema to `web/src/features/sessions/schemas/sessions.schemas.ts`
- [X] T015 Update sessions barrel export at `web/src/features/sessions/index.ts` to include new types

### Step Registry

- [X] T016 Create step registry utility in `web/src/features/experience-engine/lib/step-registry.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Engine Initialization (Priority: P1) 🎯 MVP

**Goal**: Developer can initialize ExperienceEngine with configuration, renders first step

**Independent Test**: Mount ExperienceEngine with valid config, verify first step renders within 100ms

### Implementation for User Story 1

- [X] T017 [US1] Create useEngineSession hook (ephemeral mode only first) in `web/src/features/experience-engine/hooks/useEngineSession.ts`
- [X] T018 [US1] Create useEngine hook with initialization logic in `web/src/features/experience-engine/hooks/useEngine.ts`
- [X] T019 [US1] Create StepRenderer component (dispatcher) in `web/src/features/experience-engine/components/StepRenderer.tsx`
- [X] T020 [US1] Create ExperienceEngine component (main wrapper) in `web/src/features/experience-engine/components/ExperienceEngine.tsx`
- [X] T021 [US1] Handle empty steps edge case (render empty state) in ExperienceEngine
- [ ] T022 [US1] Add unit test for useEngine initialization in `web/src/features/experience-engine/__tests__/useEngine.test.ts`

**Checkpoint**: Engine initializes and renders first step - US1 complete

---

## Phase 4: User Story 2 - Step Navigation (Priority: P1)

**Goal**: Developer can navigate between steps with next/previous/skip/restart

**Independent Test**: Trigger navigation actions, verify correct step renders with preserved data

### Implementation for User Story 2

- [X] T023 [US2] Add navigation methods (next, previous, skip, restart) to useEngine hook in `web/src/features/experience-engine/hooks/useEngine.ts`
- [X] T024 [US2] Implement navigation debouncing (150ms) in useEngine hook
- [X] T025 [US2] Implement canGoBack/canGoNext/canSkip computed flags based on config
- [X] T026 [US2] Preserve input data across navigation in useEngineSession
- [X] T027 [US2] Fire onComplete callback when last step completes
- [ ] T028 [US2] Add unit test for navigation actions in `web/src/features/experience-engine/__tests__/useEngine.test.ts`

**Checkpoint**: Full navigation works - US2 complete

---

## Phase 5: User Story 3 - All Step Renderers (Priority: P1)

**Goal**: Engine renders all 11 step types correctly with user interaction

**Independent Test**: Initialize engine with each step type individually, verify correct rendering

### Basic Step Components (reuse existing preview components)

- [X] T029 [P] [US3] Create InfoStep renderer in `web/src/features/experience-engine/components/steps/InfoStep.tsx`
- [X] T030 [P] [US3] Create ShortTextStep renderer in `web/src/features/experience-engine/components/steps/ShortTextStep.tsx`
- [X] T031 [P] [US3] Create LongTextStep renderer in `web/src/features/experience-engine/components/steps/LongTextStep.tsx`
- [X] T032 [P] [US3] Create EmailStep renderer in `web/src/features/experience-engine/components/steps/EmailStep.tsx`
- [X] T033 [P] [US3] Create MultipleChoiceStep renderer in `web/src/features/experience-engine/components/steps/MultipleChoiceStep.tsx`
- [X] T034 [P] [US3] Create OpinionScaleStep renderer in `web/src/features/experience-engine/components/steps/OpinionScaleStep.tsx`
- [X] T035 [P] [US3] Create YesNoStep renderer (with auto-advance) in `web/src/features/experience-engine/components/steps/YesNoStep.tsx`

### Special Step Components

- [X] T036 [US3] Create CaptureStep renderer (camera/upload + auto-advance) in `web/src/features/experience-engine/components/steps/CaptureStep.tsx`
- [X] T037 [US3] Create placeholder AiTransformStep renderer in `web/src/features/experience-engine/components/steps/AiTransformStep.tsx`
- [X] T038 [US3] Create placeholder ProcessingStep renderer in `web/src/features/experience-engine/components/steps/ProcessingStep.tsx`
- [X] T039 [US3] Create placeholder RewardStep renderer in `web/src/features/experience-engine/components/steps/RewardStep.tsx`

### Step Registry Integration

- [X] T040 [US3] Register all step components in step-registry.ts
- [X] T041 [US3] Handle unknown step type with error boundary in StepRenderer

**Checkpoint**: All 11 step types render - US3 complete

---

## Phase 6: User Story 4 - AI Transform Step (Priority: P2)

**Goal**: AI transform step triggers background job and auto-advances

**Independent Test**: Initialize engine with ai-transform step, verify job triggers and auto-advance occurs

### Session Actions for Transform

- [ ] T042 [US4] Implement triggerTransformJob server action in `web/src/features/sessions/actions/sessions.actions.ts`
- [ ] T043 [US4] Implement updateTransformStatus server action in `web/src/features/sessions/actions/sessions.actions.ts`

### Variable Interpolation

- [X] T044 [US4] Create variable interpolation utility in `web/src/features/experience-engine/lib/variable-interpolation.ts`
- [ ] T045 [US4] Add unit test for variable interpolation in `web/src/features/experience-engine/__tests__/variable-interpolation.test.ts`

### AiTransformStep Implementation

- [ ] T046 [US4] Implement full AiTransformStep with job trigger in `web/src/features/experience-engine/components/steps/AiTransformStep.tsx`
- [ ] T047 [US4] Add error state with retry button to AiTransformStep
- [ ] T048 [US4] Add auto-advance after successful trigger (500ms delay)

**Checkpoint**: AI transform triggers job and advances - US4 complete

---

## Phase 7: User Story 5 - Processing Step (Priority: P2)

**Goal**: Processing step displays loading feedback and auto-advances when transformation completes

**Independent Test**: Initialize engine with processing step while transform in progress, verify auto-advance on completion

### Real-time Subscription

- [ ] T049 [US5] Create useTransformationStatus hook in `web/src/features/sessions/hooks/useTransformationStatus.ts`
- [ ] T050 [US5] Update sessions hooks barrel to export useTransformationStatus

### ProcessingStep Implementation

- [ ] T051 [US5] Implement full ProcessingStep with rotating messages in `web/src/features/experience-engine/components/steps/ProcessingStep.tsx`
- [ ] T052 [US5] Add real-time subscription to transformation status
- [ ] T053 [US5] Implement auto-advance when status becomes "complete"
- [ ] T054 [US5] Handle immediate auto-advance if already complete on mount
- [ ] T055 [US5] Add error state display when transformation fails

**Checkpoint**: Processing step waits and advances - US5 complete

---

## Phase 8: User Story 6 - Reward Step (Priority: P2)

**Goal**: Reward step displays transformation result with sharing options

**Independent Test**: Initialize engine with reward step, verify result displays or loading skeleton shows

### RewardStep Implementation

- [ ] T056 [US6] Implement full RewardStep with result display in `web/src/features/experience-engine/components/steps/RewardStep.tsx`
- [ ] T057 [US6] Add loading skeleton when result not yet available
- [ ] T058 [US6] Add real-time update when result arrives
- [ ] T059 [US6] Implement download action (allowDownload config)
- [ ] T060 [US6] Implement share actions (allowSystemShare, socials config)
- [ ] T061 [US6] Add error state display

**Checkpoint**: Reward step displays result - US6 complete

---

## Phase 9: User Story 7 - Lifecycle Callbacks (Priority: P2)

**Goal**: Engine emits lifecycle callbacks at key moments

**Independent Test**: Provide callback functions, verify they fire at correct moments with expected payloads

### Callback Implementation

- [ ] T062 [US7] Implement onStart callback firing in useEngine
- [ ] T063 [US7] Implement onStepChange callback with StepChangeInfo payload
- [ ] T064 [US7] Implement onDataUpdate callback when session data changes
- [ ] T065 [US7] Implement onComplete callback when last step completes
- [ ] T066 [US7] Implement onError callback for unrecoverable errors

**Checkpoint**: All callbacks fire correctly - US7 complete

---

## Phase 10: User Story 8 - Variable Interpolation (Priority: P3)

**Goal**: AI prompts support {{variable}} syntax referencing previous step inputs

**Independent Test**: Configure ai-transform with variables, verify substitution occurs

### Variable Interpolation Enhancement

- [ ] T067 [US8] Handle capture step variable (photo URL) in interpolation
- [ ] T068 [US8] Handle input step variables (text, selection, etc.)
- [ ] T069 [US8] Handle static variables
- [ ] T070 [US8] Graceful degradation for non-existent step references (empty string)
- [ ] T071 [US8] Add comprehensive unit tests for all variable types

**Checkpoint**: Variable interpolation works - US8 complete

---

## Phase 11: Persisted Session Mode

**Goal**: Engine supports persisted sessions with Firestore sync

**Purpose**: Enable Guest Flow with real session persistence

### Session Actions

- [ ] T072 Implement createEngineSession server action in `web/src/features/sessions/actions/sessions.actions.ts`
- [ ] T073 Implement loadEngineSession server action in `web/src/features/sessions/actions/sessions.actions.ts`
- [ ] T074 Implement updateSessionData server action in `web/src/features/sessions/actions/sessions.actions.ts`
- [ ] T075 Implement updateSessionStepIndex server action in `web/src/features/sessions/actions/sessions.actions.ts`

### Persisted Mode in Hook

- [ ] T076 Add persisted mode to useEngineSession hook
- [ ] T077 Create/load session on mount based on existingSessionId
- [ ] T078 Sync data updates to Firestore via server actions
- [ ] T079 Add unit test for persisted mode in `web/src/features/experience-engine/__tests__/useEngineSession.test.ts`

**Checkpoint**: Persisted session mode works

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Error Handling

- [ ] T080 [P] Add error boundary wrapper around step renderers
- [ ] T081 [P] Implement session sync failure recovery (preserve local data, retry)

### Documentation

- [ ] T082 [P] Update feature module barrel exports for public API
- [ ] T083 [P] Verify all exports have explicit TypeScript types

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T084 Run `pnpm lint` and fix all errors/warnings
- [X] T085 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T086 Run `pnpm test` and ensure all tests pass
- [ ] T087 Verify feature in local dev server (`pnpm dev`)
- [ ] T088 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **US1-US3 (Phases 3-5)**: All P1, depend on Foundational
  - US1 → US2 (navigation needs initialization)
  - US3 can start after US1 (needs StepRenderer)
- **US4-US7 (Phases 6-9)**: All P2, depend on US3 (need step renderers)
  - US4 → US5 → US6 (AI flow chain)
  - US7 can run in parallel with US4-US6
- **US8 (Phase 10)**: P3, depends on US4 (needs ai-transform step)
- **Persisted Mode (Phase 11)**: Depends on US1-US3 core
- **Polish (Phase 12)**: Depends on all user stories

### User Story Dependencies

```
Foundational
     │
     ├── US1 (Engine Init)
     │    │
     │    ├── US2 (Navigation)
     │    │    │
     │    │    └── US3 (All Steps)
     │    │         │
     │    │         ├── US4 (AI Transform)
     │    │         │    │
     │    │         │    ├── US5 (Processing)
     │    │         │    │    │
     │    │         │    │    └── US6 (Reward)
     │    │         │    │
     │    │         │    └── US8 (Variables) [P3]
     │    │         │
     │    │         └── US7 (Callbacks) [parallel with US4-US6]
     │    │
     │    └── Persisted Mode [parallel with US2+]
     │
     └── Polish (after all stories)
```

### Parallel Opportunities

**Phase 2 (Foundational)** - All [P] tasks can run in parallel:
```
T009 (engine types) | T010 (renderer types) | T011 (schemas)
T012 (transform status) | T013 (session type) | T014 (session schema)
```

**Phase 5 (US3 Step Renderers)** - Basic steps can run in parallel:
```
T029 (Info) | T030 (ShortText) | T031 (LongText) | T032 (Email)
T033 (MultipleChoice) | T034 (OpinionScale) | T035 (YesNo)
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Engine Init)
4. Complete Phase 4: User Story 2 (Navigation)
5. Complete Phase 5: User Story 3 (All Steps)
6. **STOP and VALIDATE**: Test engine with all step types
7. Deploy/demo if ready - **This is a working engine for Admin Preview**

### Incremental Delivery

1. MVP (US1-US3) → Admin Preview can use engine with ephemeral mode
2. Add US4-US6 → AI transformation flow works
3. Add US7 → Analytics/logging integration possible
4. Add US8 → Personalized AI prompts
5. Add Persisted Mode → Guest Flow can use engine

### Task Count Summary

| Phase | Story | Tasks |
|-------|-------|-------|
| Setup | - | 8 |
| Foundational | - | 8 |
| Phase 3 | US1 | 6 |
| Phase 4 | US2 | 6 |
| Phase 5 | US3 | 13 |
| Phase 6 | US4 | 7 |
| Phase 7 | US5 | 7 |
| Phase 8 | US6 | 6 |
| Phase 9 | US7 | 5 |
| Phase 10 | US8 | 5 |
| Phase 11 | Persisted | 8 |
| Phase 12 | Polish | 9 |
| **Total** | | **88** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP scope: US1-US3 (Phases 1-5) = 41 tasks for working engine

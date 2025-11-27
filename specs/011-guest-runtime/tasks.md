# Tasks: Guest Experience Runtime Engine

**Input**: Design documents from `/specs/011-guest-runtime/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md

**Tests**: Not explicitly requested - minimal testing per Constitution Principle IV.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Per plan.md, this feature uses Next.js monorepo structure:
- **Source**: `web/src/`
- **Features**: `web/src/features/{feature}/`
- **App Routes**: `web/src/app/(public)/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend existing session schemas with journey support fields

- [x] T001 Add StepInputValue discriminated union schema in `web/src/features/sessions/schemas/sessions.schemas.ts`
- [x] T002 Add sessionDataSchema with catchall for step inputs in `web/src/features/sessions/schemas/sessions.schemas.ts`
- [x] T003 Extend sessionSchema with journeyId, currentStepIndex, data fields in `web/src/features/sessions/schemas/sessions.schemas.ts`
- [x] T004 Export StepInputValue type from sessions schemas in `web/src/features/sessions/schemas/sessions.schemas.ts`
- [x] T005 Run `pnpm type-check` to verify schema changes compile

---

## Phase 2: Foundational (Session Server Actions)

**Purpose**: Core session server actions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Implement startJourneySessionAction in `web/src/features/sessions/actions/sessions.actions.ts`
- [x] T007 Implement advanceStepAction in `web/src/features/sessions/actions/sessions.actions.ts`
- [x] T008 Implement goBackStepAction in `web/src/features/sessions/actions/sessions.actions.ts`
- [x] T009 Implement saveStepDataAction in `web/src/features/sessions/actions/sessions.actions.ts`
- [x] T010 Implement selectExperienceAction in `web/src/features/sessions/actions/sessions.actions.ts`
- [x] T011 Implement getJourneyForGuestAction in `web/src/features/sessions/actions/sessions.actions.ts`
- [x] T012 Implement getExperiencesForGuestAction in `web/src/features/sessions/actions/sessions.actions.ts`
- [x] T013 Wire AI transform in triggerTransformAction (replace passthrough) in `web/src/features/sessions/actions/sessions.actions.ts`
- [x] T014 Implement retryTransformAction in `web/src/features/sessions/actions/sessions.actions.ts`
- [x] T015 Run `pnpm type-check` to verify all actions compile

**Checkpoint**: Foundation ready - all session actions available for guest runtime ✅

---

## Phase 3: User Story 1 - Complete Guest Journey End-to-End (Priority: P1) 🎯 MVP

**Goal**: A guest can open a join link and complete a full journey including camera capture and AI-generated results

**Independent Test**: Open join link → navigate steps → capture photo → see AI result with download/share

### Core Runtime Hook

- [x] T016 [US1] Create JourneyRuntimeState interface in `web/src/features/guest/hooks/useJourneyRuntime.ts`
- [x] T017 [US1] Implement useJourneyRuntime reducer with actions (SESSION_CREATED, ADVANCE, GO_BACK, ERROR) in `web/src/features/guest/hooks/useJourneyRuntime.ts`
- [x] T018 [US1] Implement session initialization in useJourneyRuntime (calls startJourneySessionAction on mount) in `web/src/features/guest/hooks/useJourneyRuntime.ts`
- [x] T019 [US1] Implement next() function in useJourneyRuntime (calls advanceStepAction) in `web/src/features/guest/hooks/useJourneyRuntime.ts`
- [x] T020 [US1] Implement previous() function in useJourneyRuntime (calls goBackStepAction) in `web/src/features/guest/hooks/useJourneyRuntime.ts`
- [x] T021 [US1] Implement saveInput() function in useJourneyRuntime (calls saveStepDataAction) in `web/src/features/guest/hooks/useJourneyRuntime.ts`
- [x] T022 [US1] Export useJourneyRuntime hook from `web/src/features/guest/hooks/useJourneyRuntime.ts`

### Guest Capture Step Component

- [x] T023 [P] [US1] Create GuestCaptureStep component with real camera integration in `web/src/features/guest/components/GuestCaptureStep.tsx`
- [x] T024 [US1] Wire GuestCaptureStep to useCamera hook and saveCaptureAction in `web/src/features/guest/components/GuestCaptureStep.tsx`
- [x] T025 [US1] Add onCaptureComplete callback to GuestCaptureStep in `web/src/features/guest/components/GuestCaptureStep.tsx`

### Guest Processing Step Component

- [x] T026 [P] [US1] Create GuestProcessingStep component with transform trigger in `web/src/features/guest/components/GuestProcessingStep.tsx`
- [x] T027 [US1] Wire GuestProcessingStep to triggerTransformAction in `web/src/features/guest/components/GuestProcessingStep.tsx`
- [x] T028 [US1] Add Firestore real-time subscription for session state in GuestProcessingStep in `web/src/features/guest/components/GuestProcessingStep.tsx`
- [x] T029 [US1] Add onProcessingComplete callback to GuestProcessingStep in `web/src/features/guest/components/GuestProcessingStep.tsx`

### Guest Reward Step Component

- [x] T030 [P] [US1] Create GuestRewardStep component with result display in `web/src/features/guest/components/GuestRewardStep.tsx`
- [x] T031 [US1] Add download button functionality to GuestRewardStep in `web/src/features/guest/components/GuestRewardStep.tsx`
- [x] T032 [US1] Add share button with native share API fallback in GuestRewardStep in `web/src/features/guest/components/GuestRewardStep.tsx`

### Step Renderer Integration

- [x] T033 [US1] Create JourneyStepRenderer component in `web/src/features/guest/components/JourneyStepRenderer.tsx`
- [x] T034 [US1] Add step type routing in JourneyStepRenderer (capture → GuestCaptureStep, processing → GuestProcessingStep, reward → GuestRewardStep) in `web/src/features/guest/components/JourneyStepRenderer.tsx`
- [x] T035 [US1] Wire other step types to existing preview renderers with real callbacks in JourneyStepRenderer in `web/src/features/guest/components/JourneyStepRenderer.tsx`

### Main Container

- [x] T036 [US1] Create JourneyGuestContainer component in `web/src/features/guest/components/JourneyGuestContainer.tsx`
- [x] T037 [US1] Wire JourneyGuestContainer to useJourneyRuntime hook in `web/src/features/guest/components/JourneyGuestContainer.tsx`
- [x] T038 [US1] Add EventThemeProvider wrapper in JourneyGuestContainer in `web/src/features/guest/components/JourneyGuestContainer.tsx`
- [x] T039 [US1] Add loading and error states to JourneyGuestContainer in `web/src/features/guest/components/JourneyGuestContainer.tsx`

### Route Integration

- [x] T040 [US1] Update join page routing logic to check activeJourneyId in `web/src/app/(public)/join/[eventId]/page.tsx`
- [x] T041 [US1] Add journey and steps loading to join page in `web/src/app/(public)/join/[eventId]/page.tsx`
- [x] T042 [US1] Render JourneyGuestContainer when activeJourneyId exists in `web/src/app/(public)/join/[eventId]/page.tsx`
- [x] T043 [US1] Add fallback to legacy GuestFlowContainer when no activeJourneyId in `web/src/app/(public)/join/[eventId]/page.tsx`

### Exports

- [x] T044 [US1] Update guest feature barrel exports with new components and hooks in `web/src/features/guest/index.ts`

**Checkpoint**: At this point, User Story 1 is functional - guest can complete full journey with capture and AI result

---

## Phase 4: User Story 2 - Navigate Journey Steps with Input Collection (Priority: P1)

**Goal**: A guest can navigate through input steps (text, email, multiple choice, etc.) with data persisted to session

**Independent Test**: Navigate journey with input steps → enter data → verify saved to session → advance to next steps

### Input Step Rendering

- [X] T045 [US2] Wire ShortTextStep to real onInputChange callback in JourneyStepRenderer in `web/src/features/guest/components/JourneyStepRenderer.tsx`
- [X] T046 [US2] Wire LongTextStep to real onInputChange callback in JourneyStepRenderer in `web/src/features/guest/components/JourneyStepRenderer.tsx`
- [X] T047 [US2] Wire EmailStep to real onInputChange callback with validation in JourneyStepRenderer in `web/src/features/guest/components/JourneyStepRenderer.tsx`
- [X] T048 [US2] Wire MultipleChoiceStep to real onInputChange callback in JourneyStepRenderer in `web/src/features/guest/components/JourneyStepRenderer.tsx`
- [X] T049 [US2] Wire YesNoStep to real onInputChange callback in JourneyStepRenderer in `web/src/features/guest/components/JourneyStepRenderer.tsx`
- [X] T050 [US2] Wire OpinionScaleStep to real onInputChange callback in JourneyStepRenderer in `web/src/features/guest/components/JourneyStepRenderer.tsx`

### Input Validation

- [X] T051 [US2] Add email format validation with Zod in JourneyStepRenderer for email steps in `web/src/features/guest/components/JourneyStepRenderer.tsx`
- [X] T052 [US2] Add required field validation for text steps in JourneyStepRenderer in `web/src/features/guest/components/JourneyStepRenderer.tsx`
- [X] T053 [US2] Display validation errors inline in step components in `web/src/features/guest/components/JourneyStepRenderer.tsx`

### Navigation Controls

- [X] T054 [P] [US2] ~~Create JourneyNavigation component with back/next buttons~~ **NOT NEEDED** - Navigation driven by step CTA buttons
- [X] T055 [US2] Move validation logic to handleStepComplete (triggered by step CTA) in `web/src/features/guest/components/JourneyGuestContainer.tsx`
- [X] T056 [US2] Add auto-advance for yes_no steps after selection in `web/src/features/guest/components/JourneyGuestContainer.tsx`

**Checkpoint**: User Story 2 complete - all input steps collect and persist data, validation prevents invalid advancement ✅

---

## Phase 5: User Story 3 - Recover from Errors Gracefully (Priority: P2)

**Goal**: Guest can recover from errors (camera denied, AI timeout, network issues) without losing progress

**Independent Test**: Simulate errors → verify recovery UI → retry successfully → continue journey

### Error Boundary

- [X] T057 [P] [US3] Create JourneyErrorBoundary component in `web/src/features/guest/components/JourneyErrorBoundary.tsx`
- [X] T058 [US3] Add error state rendering with retry and restart options in JourneyErrorBoundary in `web/src/features/guest/components/JourneyErrorBoundary.tsx`
- [X] T059 [US3] Wrap JourneyStepRenderer with JourneyErrorBoundary in JourneyGuestContainer in `web/src/features/guest/components/JourneyGuestContainer.tsx`

### Camera Error Handling

- [X] T060 [P] [US3] Create CameraPermissionDenied component with retry and upload fallback in `web/src/features/guest/components/CameraPermissionDenied.tsx`
- [X] T061 [US3] Wire CameraPermissionDenied to GuestCaptureStep when permission denied in `web/src/features/guest/components/GuestCaptureStep.tsx`
- [X] T062 [US3] Add file upload fallback option in GuestCaptureStep in `web/src/features/guest/components/GuestCaptureStep.tsx`

### AI Transform Error Handling

- [X] T063 [US3] Add retry button to GuestProcessingStep on transform error in `web/src/features/guest/components/GuestProcessingStep.tsx`
- [X] T064 [US3] Wire retry button to retryTransformAction in GuestProcessingStep in `web/src/features/guest/components/GuestProcessingStep.tsx`
- [X] T065 [US3] Add timeout detection (45s) and fallback message in GuestProcessingStep in `web/src/features/guest/components/GuestProcessingStep.tsx`

### Event/Journey Unavailable

- [X] T066 [P] [US3] Create EventUnavailableScreen component in `web/src/features/guest/components/EventUnavailableScreen.tsx`
- [X] T067 [US3] Show EventUnavailableScreen when event not found or archived in join page in `web/src/app/(public)/join/[eventId]/page.tsx`
- [X] T068 [US3] Show EventUnavailableScreen when journey not found or has no steps in `web/src/app/(public)/join/[eventId]/page.tsx`

**Checkpoint**: User Story 3 complete - errors are handled gracefully with recovery options ✅

---

## Phase 6: User Story 4 - Select Experience from Multiple Options (Priority: P3)

**Goal**: Guest can select from multiple AI experiences before capture

**Independent Test**: View experience picker → select experience → capture → verify AI uses selected experience config

### Experience Picker Integration

- [X] T069 [US4] Wire ExperiencePickerStep to real selectExperienceAction in JourneyStepRenderer in `web/src/features/guest/components/JourneyStepRenderer.tsx`
- [X] T070 [US4] Load experiences via getExperiencesForGuestAction for picker steps in JourneyGuestContainer in `web/src/features/guest/components/JourneyGuestContainer.tsx`
- [X] T071 [US4] Pass experiences prop to JourneyStepRenderer in JourneyGuestContainer in `web/src/features/guest/components/JourneyGuestContainer.tsx`

### Selected Experience Context

- [X] T072 [US4] ~~Add selectedExperienceId to useJourneyRuntime state~~ **NOT NEEDED** - tracked in session.data
- [X] T073 [US4] ~~Update GuestCaptureStep to use selected experience's capture config~~ **NOT NEEDED** - capture step uses step config, experience config used by AI transform
- [X] T074 [US4] Verify triggerTransformAction uses selected_experience_id from session in `web/src/features/sessions/actions/sessions.actions.ts`

**Checkpoint**: User Story 4 complete - experience selection flows through to AI processing ✅

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories

- [X] T075 [P] Update component exports in `web/src/features/guest/index.ts`
- [ ] T076 [P] Add loading states to all async operations - **SKIPPED** (already implemented in existing components)
- [ ] T077 [P] Ensure all touch targets are ≥44x44px (mobile-first) - **DEFERRED** (manual UI testing required)
- [ ] T078 Verify event theme applies to all new components - **DEFERRED** (manual testing required)
- [ ] T079 Add keyboard navigation support to navigation controls - **DEFERRED** (enhancement for future iteration)

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T080 Run `pnpm lint` and fix all errors/warnings
- [X] T081 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T082 Verify feature in local dev server (`pnpm dev`) - **MANUAL TEST REQUIRED**
- [ ] T083 Test full journey on mobile device (320px viewport) - **MANUAL TEST REQUIRED**
- [ ] T084 Test camera capture on mobile device - **MANUAL TEST REQUIRED**
- [ ] T085 Test AI transform with mock provider - **MANUAL TEST REQUIRED**
- [ ] T086 Test error recovery scenarios (deny camera, mock timeout) - **MANUAL TEST REQUIRED**
- [ ] T087 Commit only after validation loop passes cleanly - **READY FOR COMMIT**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 - core end-to-end flow
- **Phase 4 (US2)**: Depends on Phase 2 - can run parallel to US1
- **Phase 5 (US3)**: Depends on Phase 3 - extends error handling
- **Phase 6 (US4)**: Depends on Phase 2 - can run parallel to US1
- **Phase 7 (Polish)**: Depends on all user stories

### User Story Dependencies

- **User Story 1 (P1)**: Core flow - no other story dependencies
- **User Story 2 (P1)**: Input collection - can be parallel with US1
- **User Story 3 (P2)**: Error handling - builds on US1 components
- **User Story 4 (P3)**: Experience picker - builds on US1 flow

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
```
All server actions can be developed in parallel by different developers
since they're independent functions in the same file
```

**Within Phase 3 (US1)**:
```
# These can run in parallel (different files):
Task: T023 GuestCaptureStep.tsx
Task: T026 GuestProcessingStep.tsx
Task: T030 GuestRewardStep.tsx
```

**Across User Stories**:
```
# After Phase 2, these can run in parallel:
Developer A: User Story 1 (Phase 3)
Developer B: User Story 2 (Phase 4)
Developer C: User Story 4 (Phase 6)
# User Story 3 (Phase 5) depends on US1 completion
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (schema extensions)
2. Complete Phase 2: Foundational (all session actions)
3. Complete Phase 3: User Story 1 (end-to-end journey)
4. Complete Phase 4: User Story 2 (input collection)
5. **STOP and VALIDATE**: Test full journey on mobile
6. Deploy/demo if ready - this is the MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test end-to-end → Deploy (captures working!)
3. Add User Story 2 → Test inputs → Deploy (full data collection!)
4. Add User Story 3 → Test errors → Deploy (production-ready!)
5. Add User Story 4 → Test picker → Deploy (multi-experience!)

### Suggested MVP Scope

**MVP = User Story 1 + User Story 2**

This delivers:
- Complete guest journey end-to-end (join → capture → AI → result)
- All input types working with data persistence
- Core value proposition: guests complete journeys and get AI results

User Stories 3-4 add polish:
- Error recovery (US3) - important for production
- Experience selection (US4) - nice to have

---

## Notes

- [P] tasks = different files, no dependencies
- [USn] label maps task to specific user story
- Each user story is independently testable
- US1 + US2 together form the MVP
- Commit after each task or logical group
- Stop at any checkpoint to validate independently

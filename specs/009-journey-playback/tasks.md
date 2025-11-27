# Tasks: Journey Playback Mode

**Input**: Design documents from `/specs/009-journey-playback/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested - skipping test tasks.

**Organization**: Tasks grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Exact file paths included in descriptions

## Path Conventions

- **Web app**: `web/src/features/steps/` for playback components and hooks
- **Integration**: `web/src/features/journeys/` for editor integration

---

## Phase 1: Setup (Types and Infrastructure)

**Purpose**: Create all TypeScript types and base infrastructure

- [X] T001 [P] Create playback types in `web/src/features/steps/types/playback.types.ts` with PlaybackState, PlaybackStatus, StepInputValue, PlaybackMockSession, PlaybackActions, PreviewNavigationBarProps, PlaybackModeProps
- [X] T002 [P] Create hooks directory structure `web/src/features/steps/hooks/` if not exists
- [X] T003 Update barrel exports in `web/src/features/steps/index.ts` to export new types

---

## Phase 2: Foundational (Core Hooks)

**Purpose**: Core hooks that ALL user stories depend on

**⚠️ CRITICAL**: No UI work can begin until these hooks are complete

- [X] T004 Create useMockSession hook in `web/src/features/steps/hooks/useMockSession.ts` with state management for PlaybackMockSession, updateInput(), and reset() functions
- [X] T005 Create useJourneyPlayback hook in `web/src/features/steps/hooks/useJourneyPlayback.ts` with PlaybackState management, navigation logic (start, next, previous, restart, exit), integration with useMockSession
- [X] T006 Export hooks from `web/src/features/steps/hooks/index.ts`

**Checkpoint**: Foundation ready - UI components can now be built

---

## Phase 3: User Story 1 - Play Full Journey Preview (Priority: P1) 🎯 MVP

**Goal**: Creator can click "Play Journey" and navigate through all steps in sequence

**Independent Test**: Click "Play Journey" on a journey with multiple steps, use Next/Back to navigate, verify theming applies

### Implementation for User Story 1

- [X] T007 [US1] Create PreviewNavigationBar component in `web/src/features/steps/components/preview/PreviewNavigationBar.tsx` with Back, Next, Restart, Exit buttons, step counter, 44x44px touch targets, fixed bottom position
- [X] T008 [US1] Create PlaybackMode component in `web/src/features/steps/components/preview/PlaybackMode.tsx` with full-screen overlay wrapper, ViewSwitcher integration, PreviewRuntime for current step, PreviewNavigationBar integration
- [X] T009 [US1] Update JourneyEditorHeader in `web/src/features/journeys/components/editor/JourneyEditorHeader.tsx` to add "Play Journey" button with Play icon, accept onPlayClick callback prop
- [X] T010 [US1] Update JourneyEditor in `web/src/features/journeys/components/editor/JourneyEditor.tsx` to add isPlaybackOpen state, pass onPlayClick to header, conditionally render PlaybackMode overlay, pass steps/theme/experiences to PlaybackMode, handle onExit callback
- [X] T011 [US1] Update preview barrel exports in `web/src/features/steps/components/preview/index.ts` to export PlaybackMode and PreviewNavigationBar

**Checkpoint**: User Story 1 complete - creators can launch and navigate through journey playback

---

## Phase 4: User Story 2 - Interactive Step Inputs with Session State (Priority: P1)

**Goal**: User inputs persist across steps during playback

**Independent Test**: Enter text in Short Text step, navigate forward and back, verify entered text persists

### Implementation for User Story 2

- [X] T012 [P] [US2] Enhance ShortTextStep in `web/src/features/steps/components/preview/steps/ShortTextStep.tsx` to add isInteractive and onValueChange props, implement controlled input when interactive
- [X] T013 [P] [US2] Enhance LongTextStep in `web/src/features/steps/components/preview/steps/LongTextStep.tsx` to add isInteractive and onValueChange props, implement controlled textarea when interactive
- [X] T014 [P] [US2] Enhance EmailStep in `web/src/features/steps/components/preview/steps/EmailStep.tsx` to add isInteractive and onValueChange props, implement controlled input when interactive
- [X] T015 [P] [US2] Enhance MultipleChoiceStep in `web/src/features/steps/components/preview/steps/MultipleChoiceStep.tsx` to add isInteractive and onValueChange props, implement selection handler when interactive
- [X] T016 [P] [US2] Enhance YesNoStep in `web/src/features/steps/components/preview/steps/YesNoStep.tsx` to add isInteractive and onValueChange props, implement click handlers when interactive
- [X] T017 [P] [US2] Enhance OpinionScaleStep in `web/src/features/steps/components/preview/steps/OpinionScaleStep.tsx` to add isInteractive and onValueChange props, implement click handlers when interactive
- [X] T018 [P] [US2] Enhance ExperiencePickerStep in `web/src/features/steps/components/preview/steps/ExperiencePickerStep.tsx` to add isInteractive and onValueChange props, implement selection handler when interactive
- [X] T019 [US2] Update PreviewRuntime in `web/src/features/steps/components/preview/PreviewRuntime.tsx` to add mode prop ("single-step" | "playback"), pass isInteractive and onValueChange to step renderers when in playback mode
- [X] T020 [US2] Update PlaybackMode in `web/src/features/steps/components/preview/PlaybackMode.tsx` to pass session values and updateInput callbacks to PreviewRuntime for each step

**Checkpoint**: User Story 2 complete - inputs persist across step navigation

---

## Phase 5: User Story 3 - Preview Navigation Controls (Priority: P1)

**Goal**: Full navigation control with Restart clearing state and Exit returning to editor

**Independent Test**: Use Restart at step 3, verify return to step 1 with cleared inputs; use Exit, verify editor returns to previous state

### Implementation for User Story 3

- [X] T021 [US3] Enhance PreviewNavigationBar in `web/src/features/steps/components/preview/PreviewNavigationBar.tsx` to add proper disabled states for Back (first step) and Next (last step), add completion indicator when journey complete
- [X] T022 [US3] Enhance useJourneyPlayback in `web/src/features/steps/hooks/useJourneyPlayback.ts` to ensure restart() clears mock session state via useMockSession.reset(), ensure proper canGoBack/canGoNext computation
- [X] T023 [US3] Enhance PlaybackMode in `web/src/features/steps/components/preview/PlaybackMode.tsx` to integrate ViewSwitcher for mobile/desktop toggle, preserve playback state across viewport changes

**Checkpoint**: User Story 3 complete - full navigation controls working with proper state management

---

## Phase 6: User Story 4 - Auto-Advance for Specific Step Types (Priority: P2)

**Goal**: Capture and Processing steps auto-advance after mock actions complete

**Independent Test**: Reach Processing step, observe auto-advance after 1-2 seconds without clicking Next

### Implementation for User Story 4

- [ ] T024 [P] [US4] Enhance CaptureStep in `web/src/features/steps/components/preview/steps/CaptureStep.tsx` to add isInteractive and onComplete props, trigger onComplete when mock capture button clicked
- [ ] T025 [P] [US4] Enhance ProcessingStep in `web/src/features/steps/components/preview/steps/ProcessingStep.tsx` to add isInteractive and onComplete props, trigger onComplete after animation completes (1-2 seconds)
- [ ] T026 [US4] Update useJourneyPlayback in `web/src/features/steps/hooks/useJourneyPlayback.ts` to add handleStepComplete function that auto-advances for Capture and Processing steps, add isAutoAdvancing state to prevent double-advances
- [ ] T027 [US4] Update PreviewRuntime in `web/src/features/steps/components/preview/PreviewRuntime.tsx` to pass onComplete callback to CaptureStep and ProcessingStep when in playback mode
- [ ] T028 [US4] Update PlaybackMode in `web/src/features/steps/components/preview/PlaybackMode.tsx` to wire handleStepComplete from useJourneyPlayback to PreviewRuntime

**Checkpoint**: User Story 4 complete - Capture and Processing steps auto-advance

---

## Phase 7: User Story 5 - Error Handling in Playback (Priority: P3)

**Goal**: Graceful error handling when step rendering fails

**Independent Test**: Create step with invalid config, verify fallback UI appears, verify navigation still works

### Implementation for User Story 5

- [ ] T029 [US5] Create StepErrorBoundary component in `web/src/features/steps/components/preview/StepErrorBoundary.tsx` with error state, fallback UI showing step type and error message, key prop support for reset on step change
- [ ] T030 [US5] Update PlaybackMode in `web/src/features/steps/components/preview/PlaybackMode.tsx` to wrap step rendering in StepErrorBoundary, pass stepId as key to reset boundary on navigation
- [ ] T031 [US5] Export StepErrorBoundary from `web/src/features/steps/components/preview/index.ts`

**Checkpoint**: User Story 5 complete - errors handled gracefully without breaking navigation

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, refinements, and validation

- [ ] T032 [P] Handle empty journey edge case in PlaybackMode - show empty state message with only Exit button
- [ ] T033 [P] Handle single step journey edge case - disable Back, show completion on Next
- [ ] T034 [P] Add navigation debouncing in useJourneyPlayback to prevent rapid clicking issues
- [ ] T035 Ensure InfoStep and RewardStep work correctly in playback mode (read-only, no interactive changes needed)

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T036 Run `pnpm lint` and fix all errors/warnings
- [ ] T037 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T038 Verify feature in local dev server (`pnpm dev`) - test all acceptance scenarios
- [ ] T039 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - can start immediately after
- **User Story 2 (Phase 4)**: Depends on Foundational - can run parallel with US1
- **User Story 3 (Phase 5)**: Depends on US1 (needs PreviewNavigationBar)
- **User Story 4 (Phase 6)**: Depends on US2 (needs interactive step pattern)
- **User Story 5 (Phase 7)**: Depends on US1 (needs PlaybackMode)
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - MVP deliverable
- **User Story 2 (P1)**: Foundation only - can parallel with US1
- **User Story 3 (P1)**: US1 (extends navigation bar)
- **User Story 4 (P2)**: US2 (extends step interactivity pattern)
- **User Story 5 (P3)**: US1 (wraps PlaybackMode)

### Parallel Opportunities

Within Setup:
- T001, T002 can run in parallel

Within User Story 2 (step enhancements):
- T012, T013, T014, T015, T016, T017, T018 can all run in parallel (different files)

Within User Story 4:
- T024, T025 can run in parallel (different files)

Within Polish:
- T032, T033, T034 can run in parallel

---

## Parallel Example: User Story 2 Step Enhancements

```bash
# Launch all step enhancements in parallel:
Task: "Enhance ShortTextStep in web/src/features/steps/components/preview/steps/ShortTextStep.tsx"
Task: "Enhance LongTextStep in web/src/features/steps/components/preview/steps/LongTextStep.tsx"
Task: "Enhance EmailStep in web/src/features/steps/components/preview/steps/EmailStep.tsx"
Task: "Enhance MultipleChoiceStep in web/src/features/steps/components/preview/steps/MultipleChoiceStep.tsx"
Task: "Enhance YesNoStep in web/src/features/steps/components/preview/steps/YesNoStep.tsx"
Task: "Enhance OpinionScaleStep in web/src/features/steps/components/preview/steps/OpinionScaleStep.tsx"
Task: "Enhance ExperiencePickerStep in web/src/features/steps/components/preview/steps/ExperiencePickerStep.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types)
2. Complete Phase 2: Foundational (hooks)
3. Complete Phase 3: User Story 1 (basic playback)
4. **STOP and VALIDATE**: Test "Play Journey" works with navigation
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Basic playback works → Demo (MVP!)
3. Add User Story 2 → Inputs persist → Demo
4. Add User Story 3 → Full navigation controls → Demo
5. Add User Story 4 → Auto-advance works → Demo
6. Add User Story 5 → Error handling → Demo
7. Polish → Production ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US1, US2, US3 are all P1 priority - core MVP
- US4 (P2) and US5 (P3) are enhancements
- No tests requested - implementation tasks only
- All state is ephemeral - no Firestore writes

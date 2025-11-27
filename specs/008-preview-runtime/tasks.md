# Tasks: Unified Preview Runtime

**Input**: Design documents from `/specs/008-preview-runtime/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested - minimal test tasks included for new utility functions only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` workspace in Next.js monorepo
- Components: `web/src/features/[feature]/components/`
- Types: `web/src/features/[feature]/types/`
- Public assets: `web/public/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create foundational types and assets required by all user stories

- [x] T001 Create preview types file with ViewportMode, ViewportDimensions, MockSessionData in `web/src/features/steps/types/preview.types.ts`
- [x] T002 [P] Update types barrel export to include preview types in `web/src/features/steps/types/index.ts`
- [x] T003 [P] Create placeholder images directory at `web/public/placeholders/`
- [x] T004 [P] Add selfie-placeholder.svg (375x500px) to `web/public/placeholders/`
- [x] T005 [P] Add transformed-placeholder.svg (375x500px) to `web/public/placeholders/`
- [x] T006 [P] Add camera-viewfinder.svg to `web/public/placeholders/`

**Checkpoint**: Types and assets ready for component development ✅

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core components that MUST be complete before user stories can be tested

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Rename SimulatorScreen.tsx to DeviceFrame.tsx in `web/src/features/steps/components/preview/`
- [x] T008 Update DeviceFrame component to accept viewportMode prop and use VIEWPORT_DIMENSIONS in `web/src/features/steps/components/preview/DeviceFrame.tsx`
- [x] T009 Create ViewSwitcher component with mobile/desktop toggle in `web/src/features/steps/components/preview/ViewSwitcher.tsx`
- [x] T010 Create PreviewRuntime wrapper component in `web/src/features/steps/components/preview/PreviewRuntime.tsx`
- [x] T011 Update preview barrel export with DeviceFrame, ViewSwitcher, PreviewRuntime in `web/src/features/steps/components/preview/index.ts`
- [x] T012 Update all existing imports from SimulatorScreen to DeviceFrame across codebase

**Checkpoint**: Foundation ready - user story integration can now begin ✅

---

## Phase 3: User Story 1 - Preview Step in Mobile Mode (Priority: P1) 🎯 MVP

**Goal**: Render step preview in a mobile phone frame (375px width) with event theme applied

**Independent Test**: Open any step in Journey Editor and see phone-sized preview with theme colors

### Implementation for User Story 1

- [x] T013 [US1] Update JourneyEditor to import PreviewRuntime and ViewportMode in `web/src/features/journeys/components/editor/JourneyEditor.tsx`
- [x] T014 [US1] Add viewportMode state (default: "mobile") to JourneyEditor in `web/src/features/journeys/components/editor/JourneyEditor.tsx`
- [x] T015 [US1] Replace existing preview rendering with PreviewRuntime component in `web/src/features/journeys/components/editor/JourneyEditor.tsx`
- [x] T016 [US1] Ensure DeviceFrame renders at 375px width when viewportMode is "mobile" in `web/src/features/steps/components/preview/DeviceFrame.tsx`
- [x] T017 [US1] Verify theme background color and image apply correctly in DeviceFrame in `web/src/features/steps/components/preview/DeviceFrame.tsx`
- [x] T018 [US1] Ensure preview container is scrollable when content exceeds frame height in `web/src/features/steps/components/preview/DeviceFrame.tsx`

**Checkpoint**: Mobile preview renders at 375px with full theme application ✅

---

## Phase 4: User Story 2 - Switch Between Mobile and Desktop Views (Priority: P1)

**Goal**: Toggle between mobile (375px) and desktop (900px) preview instantly

**Independent Test**: Click toggle button and see preview re-render in new size immediately

### Implementation for User Story 2

- [x] T019 [US2] Add preview panel header section to JourneyEditor layout in `web/src/features/journeys/components/editor/JourneyEditor.tsx`
- [x] T020 [US2] Integrate ViewSwitcher component into preview panel header in `web/src/features/journeys/components/editor/JourneyEditor.tsx`
- [x] T021 [US2] Wire ViewSwitcher onChange to setViewportMode state updater in `web/src/features/journeys/components/editor/JourneyEditor.tsx`
- [x] T022 [US2] Pass viewportMode prop to PreviewRuntime component in `web/src/features/journeys/components/editor/JourneyEditor.tsx`
- [x] T023 [US2] Ensure DeviceFrame renders at 900px width when viewportMode is "desktop" in `web/src/features/steps/components/preview/DeviceFrame.tsx`
- [x] T024 [US2] Verify instant re-render (<500ms) when toggling viewport modes

**Checkpoint**: Mobile/Desktop toggle works with instant re-render ✅

---

## Phase 5: User Story 3 - Preview All Step Types Accurately (Priority: P1)

**Goal**: All 11 step types render correctly with mock data in both viewport modes

**Independent Test**: Create steps of each type and verify they display with appropriate mock content

### Implementation for User Story 3

- [x] T025 [P] [US3] Update InfoStep preview to use theme styling in `web/src/features/steps/components/preview/steps/InfoStep.tsx`
- [x] T026 [P] [US3] Update ExperiencePickerStep preview to show experience cards in `web/src/features/steps/components/preview/steps/ExperiencePickerStep.tsx`
- [x] T027 [P] [US3] Update CaptureStep preview with camera placeholder and viewfinder overlay in `web/src/features/steps/components/preview/steps/CaptureStep.tsx`
- [x] T028 [P] [US3] Update ShortTextStep preview with input field and placeholder in `web/src/features/steps/components/preview/steps/ShortTextStep.tsx`
- [x] T029 [P] [US3] Update LongTextStep preview with textarea and character limit in `web/src/features/steps/components/preview/steps/LongTextStep.tsx`
- [x] T030 [P] [US3] Update MultipleChoiceStep preview with selectable options in `web/src/features/steps/components/preview/steps/MultipleChoiceStep.tsx`
- [x] T031 [P] [US3] Update YesNoStep preview with two buttons in `web/src/features/steps/components/preview/steps/YesNoStep.tsx`
- [x] T032 [P] [US3] Update OpinionScaleStep preview with numeric scale in `web/src/features/steps/components/preview/steps/OpinionScaleStep.tsx`
- [x] T033 [P] [US3] Update EmailStep preview with email input field in `web/src/features/steps/components/preview/steps/EmailStep.tsx`
- [x] T034 [P] [US3] Update ProcessingStep preview with rotating messages animation in `web/src/features/steps/components/preview/steps/ProcessingStep.tsx`
- [x] T035 [P] [US3] Update RewardStep preview with placeholder result image and share buttons in `web/src/features/steps/components/preview/steps/RewardStep.tsx`
- [x] T036 [US3] Update StepPreview router to pass mockSession to step components in `web/src/features/journeys/components/editor/StepPreview.tsx`

**Checkpoint**: All 11 step types render correctly in both mobile and desktop modes ✅

---

## Phase 6: User Story 4 - Theme Application in Preview (Priority: P2)

**Goal**: Preview accurately reflects event's theme settings (colors, fonts, logo)

**Independent Test**: Modify theme settings and verify preview updates to reflect changes

### Implementation for User Story 4

- [x] T037 [US4] Verify primaryColor applies to buttons in step previews via theme context
- [x] T038 [US4] Verify text.color applies to all text elements in step previews
- [x] T039 [US4] Verify background.color applies to DeviceFrame background in `web/src/features/steps/components/preview/DeviceFrame.tsx`
- [x] T040 [US4] Verify logoUrl renders in correct position when configured
- [x] T041 [US4] Verify fontFamily applies to all text when configured in `web/src/features/steps/components/preview/DeviceFrame.tsx`
- [x] T042 [US4] Handle graceful fallback when theme settings are partially configured

**Checkpoint**: Theme changes reflect accurately in preview within 1 second ✅

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [x] T043 [P] Update feature steps barrel export in `web/src/features/steps/index.ts`
- [x] T044 [P] Remove any remaining references to SimulatorScreen across codebase
- [x] T045 Code cleanup: Remove unused imports and dead code from modified files
- [x] T046 Verify all edge cases: long text scrolling, incomplete step config, rapid type switching

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [x] T047 Run `pnpm lint` and fix all errors/warnings
- [x] T048 Run `pnpm type-check` and resolve all TypeScript errors
- [x] T049 Run `pnpm test` and ensure all tests pass
- [x] T050 Verify feature in local dev server (`pnpm dev`)
- [x] T051 Manual testing: Verify all 11 step types in both viewport modes
- [x] T052 Commit only after validation loop passes cleanly

**Checkpoint**: All validation passes ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 priority but can be done sequentially
  - US3 depends on US1 (needs preview rendering working)
  - US4 can be done after US1 (theme verification)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after US1 - Adds toggle to existing preview
- **User Story 3 (P1)**: Can start after US1 - Enhances individual step previews
- **User Story 4 (P2)**: Can start after US1 - Theme verification

### Parallel Opportunities

- **Phase 1**: T002, T003, T004, T005, T006 can all run in parallel
- **Phase 5 (US3)**: T025-T035 can all run in parallel (different step component files)
- **Phase 7**: T043, T044 can run in parallel

---

## Parallel Example: User Story 3 (Step Preview Components)

```bash
# Launch all step preview updates together (11 parallel tasks):
Task: "Update InfoStep preview in web/src/features/steps/components/preview/steps/InfoStep.tsx"
Task: "Update ExperiencePickerStep preview in web/src/features/steps/components/preview/steps/ExperiencePickerStep.tsx"
Task: "Update CaptureStep preview in web/src/features/steps/components/preview/steps/CaptureStep.tsx"
Task: "Update ShortTextStep preview in web/src/features/steps/components/preview/steps/ShortTextStep.tsx"
Task: "Update LongTextStep preview in web/src/features/steps/components/preview/steps/LongTextStep.tsx"
Task: "Update MultipleChoiceStep preview in web/src/features/steps/components/preview/steps/MultipleChoiceStep.tsx"
Task: "Update YesNoStep preview in web/src/features/steps/components/preview/steps/YesNoStep.tsx"
Task: "Update OpinionScaleStep preview in web/src/features/steps/components/preview/steps/OpinionScaleStep.tsx"
Task: "Update EmailStep preview in web/src/features/steps/components/preview/steps/EmailStep.tsx"
Task: "Update ProcessingStep preview in web/src/features/steps/components/preview/steps/ProcessingStep.tsx"
Task: "Update RewardStep preview in web/src/features/steps/components/preview/steps/RewardStep.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types + assets)
2. Complete Phase 2: Foundational (DeviceFrame, ViewSwitcher, PreviewRuntime)
3. Complete Phase 3: User Story 1 (mobile preview working)
4. **STOP and VALIDATE**: Test mobile preview independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Core components ready
2. Add User Story 1 → Mobile preview works → **MVP!**
3. Add User Story 2 → Toggle between mobile/desktop
4. Add User Story 3 → All step types render correctly
5. Add User Story 4 → Theme verification complete
6. Each story adds value without breaking previous stories

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 52 |
| Phase 1 (Setup) | 6 tasks |
| Phase 2 (Foundational) | 6 tasks |
| Phase 3 (US1 - Mobile Preview) | 6 tasks |
| Phase 4 (US2 - Toggle) | 6 tasks |
| Phase 5 (US3 - All Steps) | 12 tasks |
| Phase 6 (US4 - Theme) | 6 tasks |
| Phase 7 (Polish) | 10 tasks |
| Parallel Opportunities | 17 tasks (T002-T006, T025-T035, T043-T044) |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- SimulatorScreen → DeviceFrame rename must be complete before US1 integration

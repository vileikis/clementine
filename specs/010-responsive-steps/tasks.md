# Tasks: Responsive Steps

**Input**: Design documents from `/specs/010-responsive-steps/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Jest unit tests included for ActionBar and StepLayout per plan.md testing strategy.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` (Next.js App Router)
- **Step primitives**: `web/src/components/step-primitives/`
- **Step components**: `web/src/features/steps/components/preview/steps/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: CSS foundation and base responsive utilities

- [x] T001 Add safe area CSS custom properties to `web/src/app/globals.css`
- [x] T002 [P] Export ActionBar from `web/src/components/step-primitives/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core primitives that MUST be complete before ANY step component can be updated

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create ActionBar component in `web/src/components/step-primitives/ActionBar.tsx` (mobile fixed, desktop inline)
- [x] T004 Refactor StepLayout for responsive container in `web/src/components/step-primitives/StepLayout.tsx` (add action slot, responsive centering)
- [x] T005 Update ActionButton with responsive sizing in `web/src/components/step-primitives/ActionButton.tsx`
- [x] T006 [P] Verify TextInput has 16px font in `web/src/components/step-primitives/TextInput.tsx`
- [x] T007 [P] Verify TextArea has 16px font in `web/src/components/step-primitives/TextArea.tsx`
- [x] T008 [P] Verify OptionButton meets 44px touch target in `web/src/components/step-primitives/OptionButton.tsx`
- [x] T009 [P] Verify ScaleButton meets 44px touch target in `web/src/components/step-primitives/ScaleButton.tsx`

**Checkpoint**: All primitives ready - step component updates can now begin

---

## Phase 3: User Story 1 - Guest Views Step on Mobile Device (Priority: P1) 🎯 MVP

**Goal**: Mobile users see app-like layout with fixed bottom CTA and scrollable content

**Independent Test**: Open any step on iPhone SE (375px), verify fixed bottom CTA, proper scrolling, and safe area padding

### Implementation for User Story 1

- [x] T010 [P] [US1] Update InfoStep with ActionBar pattern in `web/src/features/steps/components/preview/steps/InfoStep.tsx`
- [x] T011 [P] [US1] Update ShortTextStep with ActionBar pattern in `web/src/features/steps/components/preview/steps/ShortTextStep.tsx`
- [x] T012 [P] [US1] Update LongTextStep with ActionBar pattern in `web/src/features/steps/components/preview/steps/LongTextStep.tsx`
- [x] T013 [P] [US1] Update EmailStep with ActionBar pattern in `web/src/features/steps/components/preview/steps/EmailStep.tsx`
- [x] T014 [P] [US1] Update YesNoStep with ActionBar pattern in `web/src/features/steps/components/preview/steps/YesNoStep.tsx`
- [x] T015 [P] [US1] Update MultipleChoiceStep with ActionBar pattern in `web/src/features/steps/components/preview/steps/MultipleChoiceStep.tsx`
- [x] T016 [P] [US1] Update OpinionScaleStep with ActionBar pattern in `web/src/features/steps/components/preview/steps/OpinionScaleStep.tsx`
- [x] T017 [P] [US1] Update ExperiencePickerStep with ActionBar pattern in `web/src/features/steps/components/preview/steps/ExperiencePickerStep.tsx`
- [x] T018 [P] [US1] Update CaptureStep with ActionBar pattern in `web/src/features/steps/components/preview/steps/CaptureStep.tsx`
- [x] T019 [P] [US1] Update ProcessingStep layout for mobile in `web/src/features/steps/components/preview/steps/ProcessingStep.tsx`
- [x] T020 [P] [US1] Update RewardStep with ActionBar pattern in `web/src/features/steps/components/preview/steps/RewardStep.tsx`

**Checkpoint**: All 11 steps render with fixed bottom CTA on mobile (< 768px)

---

## Phase 4: User Story 2 - Guest Views Step on Desktop (Priority: P2)

**Goal**: Desktop users see centered, max-width container with inline CTA

**Independent Test**: Open any step on 1920px desktop, verify centered container (640px max), inline CTA

### Implementation for User Story 2

Desktop layout is handled by the responsive classes added in Phase 3. This phase focuses on verification and refinement:

- [x] T021 [US2] Verify InfoStep desktop centering in `web/src/features/steps/components/preview/steps/InfoStep.tsx`
- [x] T022 [US2] Verify ShortTextStep desktop centering in `web/src/features/steps/components/preview/steps/ShortTextStep.tsx`
- [x] T023 [US2] Verify LongTextStep desktop centering in `web/src/features/steps/components/preview/steps/LongTextStep.tsx`
- [x] T024 [US2] Verify EmailStep desktop centering in `web/src/features/steps/components/preview/steps/EmailStep.tsx`
- [x] T025 [US2] Verify YesNoStep desktop centering in `web/src/features/steps/components/preview/steps/YesNoStep.tsx`

**Checkpoint**: Simple steps render centered with inline CTA on desktop (>= 1024px)

---

## Phase 5: User Story 3 - Guest Interacts with Step-Specific Components (Priority: P1)

**Goal**: Components adapt layouts appropriately for viewport (columns, grids, touch targets)

**Independent Test**: Complete multiple choice step on mobile (single column) and desktop (2 columns if >4 options)

### Implementation for User Story 3

- [x] T026 [US3] Add responsive columns to MultipleChoiceStep in `web/src/features/steps/components/preview/steps/MultipleChoiceStep.tsx` (mobile: single column, desktop: 2 columns if >4)
- [x] T027 [US3] Add responsive button sizing to OpinionScaleStep in `web/src/features/steps/components/preview/steps/OpinionScaleStep.tsx` (mobile: 44px wrap, desktop: 48px no-wrap)
- [x] T028 [US3] Add responsive grid to ExperiencePickerStep in `web/src/features/steps/components/preview/steps/ExperiencePickerStep.tsx` (mobile: 2 cols, desktop: 3 cols)

**Checkpoint**: Component-specific responsive behavior working on mobile and desktop

---

## Phase 6: User Story 4 - Guest Views Processing and Reward Steps (Priority: P2)

**Goal**: Processing and reward steps display appropriately sized elements per viewport

**Independent Test**: View reward step on mobile (~70% image) and desktop (~50% image, max 300px)

### Implementation for User Story 4

- [x] T029 [US4] Add responsive spinner sizing to ProcessingStep in `web/src/features/steps/components/preview/steps/ProcessingStep.tsx` (mobile: 48px, desktop: 64px)
- [x] T030 [US4] Add responsive progress bar to ProcessingStep in `web/src/features/steps/components/preview/steps/ProcessingStep.tsx` (mobile: 80%, desktop: 60% max 400px)
- [x] T031 [US4] Add responsive image sizing to CaptureStep in `web/src/features/steps/components/preview/steps/CaptureStep.tsx` (mobile: 70%, desktop: 50%)
- [x] T032 [US4] Add responsive image sizing to RewardStep in `web/src/features/steps/components/preview/steps/RewardStep.tsx` (mobile: 70%, desktop: 50% max 300px)
- [x] T033 [US4] Add responsive share buttons to RewardStep in `web/src/features/steps/components/preview/steps/RewardStep.tsx` (mobile: grid, desktop: inline row)

**Checkpoint**: Processing and reward steps display correctly sized elements on all viewports

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Testing, validation, and final verification

### Unit Tests

- [ ] T034 [P] Add ActionBar unit tests in `web/src/components/step-primitives/ActionBar.test.tsx`
- [ ] T035 [P] Add StepLayout responsive tests in `web/src/components/step-primitives/StepLayout.test.tsx`

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [x] T036 Run `pnpm lint` and fix all errors/warnings
- [x] T037 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T038 Run `pnpm test` and ensure all tests pass
- [ ] T039 Manual test all 11 step types on mobile (375px) viewport
- [ ] T040 Manual test all 11 step types on desktop (1920px) viewport
- [ ] T041 Verify safe area padding on iOS simulator/device

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Mobile) and US3 (Components) are both P1 priority
  - US2 (Desktop) and US4 (Processing/Reward) are P2 priority
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 complete (verifies responsive classes work)
- **User Story 3 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 4 (P2)**: Can start after US1 complete (uses ActionBar pattern)

### Within Each User Story

- All step updates within a story can run in parallel [P]
- Each story is independently testable at its checkpoint

### Parallel Opportunities

**Phase 2 (Foundational)**:
```
T006, T007, T008, T009 can all run in parallel (different files)
```

**Phase 3 (User Story 1)**:
```
T010, T011, T012, T013, T014, T015, T016, T017, T018, T019, T020 can all run in parallel
```

**Phase 5 (User Story 3)**:
```
T026, T027, T028 can all run in parallel
```

**Phase 7 (Polish)**:
```
T034, T035 can run in parallel
```

---

## Parallel Example: User Story 1 (All 11 Steps)

```bash
# Launch all step updates together (all different files):
Task: "Update InfoStep with ActionBar pattern in web/src/features/steps/components/preview/steps/InfoStep.tsx"
Task: "Update ShortTextStep with ActionBar pattern in web/src/features/steps/components/preview/steps/ShortTextStep.tsx"
Task: "Update LongTextStep with ActionBar pattern in web/src/features/steps/components/preview/steps/LongTextStep.tsx"
Task: "Update EmailStep with ActionBar pattern in web/src/features/steps/components/preview/steps/EmailStep.tsx"
Task: "Update YesNoStep with ActionBar pattern in web/src/features/steps/components/preview/steps/YesNoStep.tsx"
Task: "Update MultipleChoiceStep with ActionBar pattern in web/src/features/steps/components/preview/steps/MultipleChoiceStep.tsx"
Task: "Update OpinionScaleStep with ActionBar pattern in web/src/features/steps/components/preview/steps/OpinionScaleStep.tsx"
Task: "Update ExperiencePickerStep with ActionBar pattern in web/src/features/steps/components/preview/steps/ExperiencePickerStep.tsx"
Task: "Update CaptureStep with ActionBar pattern in web/src/features/steps/components/preview/steps/CaptureStep.tsx"
Task: "Update ProcessingStep layout for mobile in web/src/features/steps/components/preview/steps/ProcessingStep.tsx"
Task: "Update RewardStep with ActionBar pattern in web/src/features/steps/components/preview/steps/RewardStep.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T009)
3. Complete Phase 3: User Story 1 (T010-T020)
4. **STOP and VALIDATE**: Test all 11 steps on mobile (375px)
5. Mobile responsive layout complete - deployable MVP

### Incremental Delivery

1. Complete Setup + Foundational → Primitives ready
2. Add User Story 1 → Test mobile → Deploy (MVP!)
3. Add User Story 2 → Test desktop → Deploy
4. Add User Story 3 → Test component layouts → Deploy
5. Add User Story 4 → Test processing/reward → Deploy
6. Complete Polish → Final validation → Release

### Task Summary

| Phase | Tasks | Parallel |
|-------|-------|----------|
| Setup | 2 | 1 |
| Foundational | 7 | 4 |
| US1 (Mobile) | 11 | 11 |
| US2 (Desktop) | 5 | 0 |
| US3 (Components) | 3 | 3 |
| US4 (Processing/Reward) | 5 | 0 |
| Polish | 8 | 2 |
| **Total** | **41** | **21** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable at its checkpoint
- All 11 step types must be verified on both mobile and desktop
- Safe area testing requires iOS simulator or physical device
- Theme colors should continue to apply correctly (no changes to theme system)

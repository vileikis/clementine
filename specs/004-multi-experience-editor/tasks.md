# Tasks: Multi-Experience Type Editor

**Input**: Design documents from `/specs/004-multi-experience-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/repository-contracts.md

**Tests**: Tests are NOT included in this task list (not requested in the specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Prerequisites

**Purpose**: Fix existing TypeScript errors and prepare foundation for multi-type editing

**⚠️ CRITICAL**: These tasks must complete before ANY user story work begins

### Fix TypeScript Errors (Blocking Foundation)

- [X] T001 Update `getExperiencesByEventId` return type from `PhotoExperience[]` to `Experience[]` in web/src/features/experiences/lib/repository.ts
- [X] T002 Update `ExperiencesList` component to accept `Experience[]` instead of `PhotoExperience[]` in web/src/features/experiences/components/shared/ExperiencesList.tsx
- [X] T003 Fix icon rendering logic in DesignSidebar to handle all experience types (photo, gif, video, wheel, survey) in web/src/features/events/components/designer/DesignSidebar.tsx
- [X] T004 Run `pnpm type-check` from web/ directory to verify zero TypeScript errors

**Checkpoint**: Foundation ready - TypeScript compilation passes with zero errors

---

## Phase 2: User Story 1 - Edit Shared Experience Fields (Priority: P1) 🎯 MVP

**Goal**: Enable editing of common experience settings (label, enabled status, preview media, delete) for any experience type

**Independent Test**: Create a photo experience, edit its label/enabled status/preview media, delete it, and verify all changes persist

### Implementation for User Story 1

- [X] T005 [P] [US1] Create `BaseExperienceFields` shared component (label input, enabled toggle) in web/src/features/experiences/components/shared/BaseExperienceFields.tsx
- [X] T006 [P] [US1] Create `DeleteExperienceButton` shared component with confirmation dialog in web/src/features/experiences/components/shared/DeleteExperienceButton.tsx
- [X] T007 [US1] Extract `AITransformSettings` from photo/ to shared/ directory (move from web/src/features/experiences/components/photo/AITransformSettings.tsx to web/src/features/experiences/components/shared/AITransformSettings.tsx)
- [X] T008 [US1] Create wrapper `ExperienceEditor` component with switch-case routing based on experience.type in web/src/features/experiences/components/shared/ExperienceEditor.tsx
- [X] T009 [US1] Update `ExperienceEditorWrapper` to accept `Experience` type and bind correct Server Actions in web/src/features/experiences/components/shared/ExperienceEditorWrapper.tsx
- [X] T010 [US1] Test that shared components (BaseExperienceFields, DeleteExperienceButton, PreviewMediaUpload) work with existing photo experience editing

**Checkpoint**: Shared editing components (label, enabled, preview, delete) work for photo experiences. Zero code duplication for these fields.

---

## Phase 3: User Story 2 - Create and Edit GIF Experiences (Priority: P2)

**Goal**: Enable creation and configuration of GIF experiences with GIF-specific settings (frame count, interval, loop count)

**Independent Test**: Create a GIF experience, configure frame count/interval/loop settings, enable AI transformation, and verify configuration saves correctly

### Schema & Validation for User Story 2

- [ ] T011 [P] [US2] Add `createGifExperienceSchema` to web/src/features/experiences/lib/schemas.ts
- [ ] T012 [P] [US2] Add `updateGifExperienceSchema` to web/src/features/experiences/lib/schemas.ts
- [ ] T013 [P] [US2] Export `CreateGifExperienceData` and `UpdateGifExperienceData` types from schemas

### Server Actions for User Story 2

- [ ] T014 [P] [US2] Implement `createGifExperience` Server Action in web/src/features/experiences/actions/gif-create.ts
- [ ] T015 [P] [US2] Implement `updateGifExperience` Server Action in web/src/features/experiences/actions/gif-update.ts

### UI Components for User Story 2

- [ ] T016 [P] [US2] Create `GifCaptureSettings` component (frame count, interval, loop count inputs) in web/src/features/experiences/components/gif/GifCaptureSettings.tsx
- [ ] T017 [US2] Create `GifExperienceEditor` component using shared components (BaseExperienceFields, AITransformSettings, DeleteExperienceButton) and GifCaptureSettings in web/src/features/experiences/components/gif/GifExperienceEditor.tsx
- [ ] T018 [US2] Add `case 'gif'` to ExperienceEditor wrapper switch statement to route to GifExperienceEditor in web/src/features/experiences/components/shared/ExperienceEditor.tsx
- [ ] T019 [US2] Update experience creation flow to support GIF type selection (if creation UI exists, otherwise document that GIF creation needs to be added to creation flow)

**Checkpoint**: GIF experiences can be created and edited with type-specific configuration. Both Photo and GIF experiences work independently.

---

## Phase 4: User Story 3 - Edit Photo-Specific Configuration (Priority: P3)

**Goal**: Ensure photo-specific settings (countdown timer, overlay frame, AI transformation) work within the new multi-type architecture

**Independent Test**: Edit a Photo experience, configure countdown/overlay/AI settings, and verify they save correctly without affecting GIF experiences

### Refactor Photo Editor for User Story 3

- [ ] T020 [US3] Create `PhotoExperienceEditor` component by migrating existing photo editing logic in web/src/features/experiences/components/photo/PhotoExperienceEditor.tsx
- [ ] T021 [US3] Update PhotoExperienceEditor to use shared components (BaseExperienceFields from T005, DeleteExperienceButton from T006, AITransformSettings from T007)
- [ ] T022 [US3] Keep photo-specific components (CountdownSettings, OverlaySettings) in PhotoExperienceEditor
- [ ] T023 [US3] Add `case 'photo'` to ExperienceEditor wrapper switch statement to route to PhotoExperienceEditor in web/src/features/experiences/components/shared/ExperienceEditor.tsx
- [ ] T024 [US3] Test that photo editing still works after refactoring (countdown, overlay frame, AI settings all save correctly)

**Checkpoint**: Photo experience editing works through new architecture with zero regressions. All three user stories (shared fields, GIF, Photo) are independently functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Quality improvements, validation, and documentation

- [ ] T025 [P] Verify exhaustiveness checking in ExperienceEditor switch statement (add `default: const _exhaustive: never = experience;` case)
- [ ] T026 [P] Update experience creation UI to include type selection (Photo vs GIF) if not already implemented
- [ ] T027 [P] Verify mobile responsiveness for all editors (Photo, GIF, shared components) on 320px-768px viewports
- [ ] T028 [P] Verify touch target sizes meet 44x44px requirement for delete button, toggle switches, and other interactive elements
- [ ] T029 Search codebase for duplicate label/enabled/preview/delete UI - should find only 1 instance of each in shared components
- [ ] T030 Code review: Verify shared components have no conditional logic based on experience type (type-agnostic design)
- [ ] T031 Update public exports in web/src/features/experiences/index.ts to include new components and actions

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T032 Run `pnpm lint` from web/ directory and fix all errors/warnings
- [ ] T033 Run `pnpm type-check` from web/ directory and resolve all TypeScript errors (should be zero)
- [ ] T034 Verify feature in local dev server (`pnpm dev` from root) - test photo and GIF editing workflows end-to-end
- [ ] T035 Measure extensibility: Calculate lines of code needed to add Video type (goal: <50 LOC for new type-specific component + schema + actions)
- [ ] T036 Commit changes only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
  - BLOCKS: All user story phases (TypeScript errors must be fixed first)

- **Phase 2 (User Story 1)**: Depends on Phase 1 completion
  - Creates shared components needed by US2 and US3
  - Can be independently tested and deployed as MVP

- **Phase 3 (User Story 2)**: Depends on Phase 1 completion, builds on shared components from Phase 2
  - Can start in parallel with US3 if multiple developers
  - Can be independently tested

- **Phase 4 (User Story 3)**: Depends on Phase 1 completion, uses shared components from Phase 2
  - Can start in parallel with US2 if multiple developers
  - Can be independently tested

- **Phase 5 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 1 - No dependencies on other stories
  - Creates: BaseExperienceFields, DeleteExperienceButton, AITransformSettings (shared)
  - Deliverable: Shared editing UI works for all experience types

- **User Story 2 (P2)**: Can start after Phase 1 - Reuses shared components from US1
  - Depends on: Shared components from US1 (soft dependency, can work without if needed)
  - Deliverable: GIF experience creation and editing works

- **User Story 3 (P3)**: Can start after Phase 1 - Reuses shared components from US1
  - Depends on: Shared components from US1 (soft dependency, can work without if needed)
  - Deliverable: Photo experience editing works in new architecture

### Within Each User Story

**User Story 1 (Shared Fields)**:
- T005, T006, T007 can run in parallel (different files)
- T008 depends on T005, T006, T007 (wrapper needs shared components)
- T009 depends on T008 (wrapper binding needs wrapper component)
- T010 is final verification

**User Story 2 (GIF)**:
- T011, T012, T013 can run in parallel (schema additions)
- T014, T015, T016 can run in parallel after schemas (different files)
- T017 depends on T016 (editor needs GIF-specific components)
- T018 depends on T017 (routing needs editor component)
- T019 is integration task

**User Story 3 (Photo)**:
- T020, T021, T022, T023, T024 are sequential (refactoring existing photo editor)

### Parallel Opportunities

**Phase 1 (Setup)**: T001, T002, T003 can all be done in parallel by different developers

**Phase 2 (US1)**: T005, T006, T007 can run in parallel (3 separate shared components)

**Phase 3 (US2)**:
- T011, T012, T013 in parallel (schema work)
- T014, T015, T016 in parallel (actions and components)

**Phase 5 (Polish)**: T025, T026, T027, T028, T029, T030, T031 can run in parallel

**Cross-Story Parallelism**: After Phase 1 completes, US1, US2, and US3 can all proceed in parallel if multiple developers are available

---

## Parallel Example: User Story 2 (GIF Support)

```bash
# After Phase 1 completes, launch all schema tasks together:
Task: "Add createGifExperienceSchema to schemas.ts"
Task: "Add updateGifExperienceSchema to schemas.ts"
Task: "Export CreateGifExperienceData and UpdateGifExperienceData types"

# Then launch all implementation tasks together:
Task: "Implement createGifExperience Server Action"
Task: "Implement updateGifExperience Server Action"
Task: "Create GifCaptureSettings component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup & Fix TypeScript Errors
2. Complete Phase 2: User Story 1 (Shared Fields)
3. **STOP and VALIDATE**: Test shared field editing works for photo experiences
4. Deploy/demo if ready (minimal viable increment)

### Incremental Delivery (Recommended)

1. Complete Phase 1: Setup → Foundation ready, TypeScript errors fixed
2. Add User Story 1 → Shared editing components work → Test independently → Deploy/Demo
3. Add User Story 2 → GIF creation/editing works → Test independently → Deploy/Demo
4. Add User Story 3 → Photo editing refactored → Test independently → Deploy/Demo
5. Complete Phase 5: Polish → Full feature complete

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1 together (fix TypeScript errors)
2. Once Phase 1 is done:
   - Developer A: User Story 1 (shared components)
   - Developer B: User Story 2 (GIF support) - can start schemas/actions independently
   - Developer C: User Story 3 (Photo refactoring) - can start independently
3. Stories complete and integrate through the shared ExperienceEditor wrapper

---

## Success Metrics Validation

After implementation, verify these success criteria from spec.md:

- **SC-001**: Creators can create both Photo and GIF experiences and configure type-specific settings in under 3 minutes
  - Test: Time yourself creating and configuring a photo and GIF experience

- **SC-002**: All shared field editing works identically across Photo and GIF experiences
  - Test: Edit label, enabled, preview media, delete for both photo and GIF - should behave identically

- **SC-003**: TypeScript compilation completes with zero type errors
  - Verify: Run `pnpm type-check` from web/ directory

- **SC-004**: DesignSidebar and ExperiencesList display both Photo and GIF experiences with correct icons
  - Test: Create both types and verify they display correctly in sidebar

- **SC-006**: Adding Video type requires less than 50 lines of new code
  - Measure: Count LOC for VideoExperienceEditor + video schemas + video actions

- **SC-007**: Zero code duplication exists for shared editing functionality
  - Verify: Search codebase for duplicate label/enabled/preview/delete UI (should find 1 instance each)

- **SC-008**: Creators can delete any experience type through single shared flow
  - Test: Delete photo and GIF experiences - should use same DeleteExperienceButton component

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label (US1, US2, US3) maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests are NOT included (not requested in specification)
- Architecture follows discriminated union pattern from research.md
- All Server Actions use Admin SDK per Firebase Architecture Standards (Constitution VI)
- Mobile-first design required (320px-768px viewports, 44x44px touch targets)

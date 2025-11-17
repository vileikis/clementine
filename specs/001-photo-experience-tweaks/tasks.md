# Tasks: Photo Experience Tweaks

**Input**: Design documents from `/specs/001-photo-experience-tweaks/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/experience-actions.ts, quickstart.md

**Tests**: Jest unit tests and React Testing Library component tests included per Constitution Principle IV

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `web/src/` for Next.js application
- **Tests**: Co-located with components or in `web/tests/`
- All tasks operate within the `web/` workspace

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and schema foundation

- [X] T001 Verify development environment running on branch `001-photo-experience-tweaks`
- [X] T002 Review existing ExperienceEditor component structure in `web/src/components/organizer/builder/ExperienceEditor.tsx`
- [X] T003 [P] Review existing Experience schema in `web/src/lib/schemas/firestore.ts`
- [X] T004 [P] Review existing Experience TypeScript interface in `web/src/lib/types/firestore.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema and validation updates that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Schema Updates

- [X] T005 Add `aspectRatioSchema` enum constant in `web/src/lib/schemas/firestore.ts`
- [X] T006 Add `countdownEnabled`, `countdownSeconds`, `aiAspectRatio` fields to `experienceSchema` in `web/src/lib/schemas/firestore.ts`
- [X] T007 Expand `previewTypeSchema` enum to include "gif" and "video" in `web/src/lib/schemas/firestore.ts`
- [X] T008 Remove `allowCamera`, `allowLibrary`, `overlayLogoPath` from `updateExperienceSchema` validation in `web/src/lib/schemas/firestore.ts`
- [X] T009 Add `uploadPreviewMediaSchema` and `previewMediaResultSchema` in `web/src/lib/schemas/firestore.ts`

### TypeScript Interface Updates

- [X] T010 Add `countdownEnabled`, `countdownSeconds`, `aiAspectRatio` to `Experience` interface in `web/src/lib/types/firestore.ts`
- [X] T011 Update `previewType` to include "gif" | "video" in `Experience` interface in `web/src/lib/types/firestore.ts`
- [X] T012 Mark `allowCamera`, `allowLibrary`, `overlayLogoPath` as optional (deprecated) in `Experience` interface in `web/src/lib/types/firestore.ts`

### Constants & Utilities

- [X] T013 Create `web/src/lib/constants/ai-models.ts` with `AI_MODEL_PROMPT_GUIDES` constant mapping model names to prompt guide URLs

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Simplify Photo Capture Settings (Priority: P1) 🎯 MVP

**Goal**: Remove capture options configuration UI to streamline photo experience setup

**Independent Test**: Create a new photo experience and verify capture options are no longer visible in the UI

### Implementation for User Story 1

- [X] T014 [US1] Remove capture options section (`allowCamera`, `allowLibrary` UI controls) from `web/src/components/organizer/builder/ExperienceEditor.tsx`
- [X] T015 [US1] Remove capture options state management from `web/src/components/organizer/builder/ExperienceEditor.tsx`
- [X] T016 [US1] Remove logo overlay upload field and state from `web/src/components/organizer/builder/ExperienceEditor.tsx`
- [X] T017 [US1] Update `handleSave` function to exclude deprecated fields in `web/src/components/organizer/builder/ExperienceEditor.tsx`

### Tests for User Story 1

- [ ] T018 [P] [US1] Add schema validation test ensuring `allowCamera`, `allowLibrary` are rejected in `updateExperienceSchema` in `web/tests/lib/schemas/firestore.test.ts`
- [ ] T019 [P] [US1] Add component test verifying capture options section is not rendered in `web/src/components/organizer/builder/ExperienceEditor.test.tsx`

**Checkpoint**: User Story 1 complete - capture options removed from UI and validation

---

## Phase 4: User Story 2 - Configure Rich Preview Media (Priority: P1) 🎯 MVP

**Goal**: Allow organizers to upload engaging preview media (image, GIF, or video) for photo experiences

**Independent Test**: Upload different media types (image, GIF, video) and verify they display correctly in configuration UI and on guest start screen

### Server Actions for User Story 2

- [ ] T020 [US2] Add `uploadPreviewMedia` Server Action in `web/src/lib/actions/experiences.ts` with file validation, Firebase Storage upload, and cleanup of old media
- [ ] T021 [US2] Add `deletePreviewMedia` Server Action in `web/src/lib/actions/experiences.ts` with Firebase Storage deletion
- [ ] T022 [US2] Update `updateExperience` Server Action in `web/src/lib/actions/experiences.ts` to support `previewPath` and `previewType` fields

### UI Component for User Story 2

- [ ] T023 [US2] Create `web/src/components/organizer/builder/PreviewMediaUpload.tsx` component with file upload input accepting image/GIF/video
- [ ] T024 [US2] Add conditional rendering logic to `PreviewMediaUpload.tsx` based on `previewType` (video element for videos, img for GIF/image)
- [ ] T025 [US2] Add upload/replace/remove button handlers in `PreviewMediaUpload.tsx` calling Server Actions
- [ ] T026 [US2] Add helper text "This media will appear on the guest start screen as a visual preview of the experience" in `PreviewMediaUpload.tsx`
- [ ] T027 [US2] Add file size validation (10MB max) in `PreviewMediaUpload.tsx`
- [ ] T028 [US2] Integrate `PreviewMediaUpload.tsx` component into `web/src/components/organizer/builder/ExperienceEditor.tsx`

### Tests for User Story 2

- [ ] T029 [P] [US2] Add schema validation test for `previewType` accepting "gif" and "video" in `web/tests/lib/schemas/firestore.test.ts`
- [ ] T030 [P] [US2] Add schema validation test for `uploadPreviewMediaSchema` file type and size in `web/tests/lib/schemas/firestore.test.ts`
- [ ] T031 [P] [US2] Add component test for `PreviewMediaUpload.tsx` rendering image preview in `web/src/components/organizer/builder/PreviewMediaUpload.test.tsx`
- [ ] T032 [P] [US2] Add component test for `PreviewMediaUpload.tsx` rendering GIF preview with autoplay in `web/src/components/organizer/builder/PreviewMediaUpload.test.tsx`
- [ ] T033 [P] [US2] Add component test for `PreviewMediaUpload.tsx` rendering video preview with autoplay muted loop in `web/src/components/organizer/builder/PreviewMediaUpload.test.tsx`

**Checkpoint**: User Story 2 complete - preview media upload/display fully functional

---

## Phase 5: User Story 3 - Control Countdown Timer (Priority: P2)

**Goal**: Enable organizers to control countdown timer settings before photo capture

**Independent Test**: Toggle countdown on/off, set different timer values (0-10 seconds), and verify countdown configuration saves correctly

### UI Component for User Story 3

- [ ] T034 [US3] Create `web/src/components/organizer/builder/CountdownSettings.tsx` component with toggle switch for `countdownEnabled`
- [ ] T035 [US3] Add number input (0-10 seconds) for `countdownSeconds` in `CountdownSettings.tsx` with min/max attributes
- [ ] T036 [US3] Add conditional rendering to hide countdown timer input when toggle is disabled in `CountdownSettings.tsx`
- [ ] T037 [US3] Set default value of 3 seconds for countdown timer in `CountdownSettings.tsx`
- [ ] T038 [US3] Integrate `CountdownSettings.tsx` component into `web/src/components/organizer/builder/ExperienceEditor.tsx`

### Tests for User Story 3

- [ ] T039 [P] [US3] Add schema validation test for `countdownSeconds` range (0-10) in `web/tests/lib/schemas/firestore.test.ts`
- [ ] T040 [P] [US3] Add component test for `CountdownSettings.tsx` toggle shows/hides timer input in `web/src/components/organizer/builder/CountdownSettings.test.tsx`
- [ ] T041 [P] [US3] Add component test for `CountdownSettings.tsx` default value of 3 seconds in `web/src/components/organizer/builder/CountdownSettings.test.tsx`

**Checkpoint**: User Story 3 complete - countdown settings configuration functional

---

## Phase 6: User Story 4 - Configure Frame Overlay (Priority: P2)

**Goal**: Allow organizers to apply a single custom frame overlay to photos

**Independent Test**: Upload a frame overlay image, preview it over a sample photo, and verify it appears in the configuration UI

### Server Actions for User Story 4

- [ ] T042 [US4] Add `uploadFrameOverlay` Server Action in `web/src/lib/actions/experiences.ts` with PNG validation, Firebase Storage upload, and cleanup of old overlay
- [ ] T043 [US4] Add `deleteFrameOverlay` Server Action in `web/src/lib/actions/experiences.ts` with Firebase Storage deletion
- [ ] T044 [US4] Update `updateExperience` Server Action in `web/src/lib/actions/experiences.ts` to support `overlayFramePath` field

### UI Component for User Story 4

- [ ] T045 [US4] Create `web/src/components/organizer/builder/OverlaySettings.tsx` component with toggle switch for overlay enable/disable
- [ ] T046 [US4] Add frame overlay upload field (PNG recommended) in `OverlaySettings.tsx`
- [ ] T047 [US4] Add preview display of overlay composited over sample photo in `OverlaySettings.tsx`
- [ ] T048 [US4] Add upload/replace/remove button handlers in `OverlaySettings.tsx` calling Server Actions
- [ ] T049 [US4] Integrate `OverlaySettings.tsx` component into `web/src/components/organizer/builder/ExperienceEditor.tsx`

### Tests for User Story 4

- [ ] T050 [P] [US4] Add component test for `OverlaySettings.tsx` toggle enables/disables overlay upload in `web/src/components/organizer/builder/OverlaySettings.test.tsx`
- [ ] T051 [P] [US4] Add component test for `OverlaySettings.tsx` preview rendering in `web/src/components/organizer/builder/OverlaySettings.test.tsx`

**Checkpoint**: User Story 4 complete - frame overlay configuration functional

---

## Phase 7: User Story 5 - Configure AI Transformation Settings (Priority: P1) 🎯 MVP

**Goal**: Improve AI transformation configuration UI with better visual layout and guidance

**Independent Test**: Upload reference images (verify horizontal layout), select aspect ratios, and access model-specific prompt guides

### Server Actions for User Story 5 (Reference Images)

- [ ] T052 [US5] Verify `uploadReferenceImage` Server Action exists in `web/src/lib/actions/experiences.ts` (should already exist)
- [ ] T053 [US5] Verify `deleteReferenceImage` Server Action exists in `web/src/lib/actions/experiences.ts` (should already exist)

### UI Component for User Story 5

- [ ] T054 [US5] Create `web/src/components/organizer/builder/AITransformSettings.tsx` component with horizontal Flexbox row layout for reference images
- [ ] T055 [US5] Add `flex-wrap` CSS for responsive wrapping of reference images in `AITransformSettings.tsx`
- [ ] T056 [US5] Add aspect ratio picker using shadcn/ui Select component with 5 options (1:1, 3:4, 4:5, 9:16, 16:9) in `AITransformSettings.tsx`
- [ ] T057 [US5] Add human-readable labels with use case hints for aspect ratio options in `AITransformSettings.tsx`
- [ ] T058 [US5] Add "Prompt Guide" link next to Model Picker with dynamic URL based on selected AI model in `AITransformSettings.tsx`
- [ ] T059 [US5] Configure Prompt Guide link to open in new tab with `target="_blank"` and `rel="noopener noreferrer"` in `AITransformSettings.tsx`
- [ ] T060 [US5] Integrate `AITransformSettings.tsx` component into `web/src/components/organizer/builder/ExperienceEditor.tsx`

### Tests for User Story 5

- [ ] T061 [P] [US5] Add schema validation test for `aiAspectRatio` enum values in `web/tests/lib/schemas/firestore.test.ts`
- [ ] T062 [P] [US5] Add component test for `AITransformSettings.tsx` aspect ratio picker displays all 5 options in `web/src/components/organizer/builder/AITransformSettings.test.tsx`
- [ ] T063 [P] [US5] Add component test for `AITransformSettings.tsx` Prompt Guide link URL changes based on selected model in `web/src/components/organizer/builder/AITransformSettings.test.tsx`
- [ ] T064 [P] [US5] Add component test for `AITransformSettings.tsx` reference images horizontal layout with flex-wrap in `web/src/components/organizer/builder/AITransformSettings.test.tsx`

**Checkpoint**: User Story 5 complete - AI transformation settings UI enhanced

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Mobile Responsiveness

- [ ] T065 [P] Verify preview media upload is usable on mobile viewport (320px-768px) in browser DevTools
- [ ] T066 [P] Verify countdown toggle and timer input are touch-friendly (≥44x44px) on mobile
- [ ] T067 [P] Verify aspect ratio picker is easily tappable (≥44x44px) on mobile
- [ ] T068 [P] Verify reference images wrap responsively on mobile viewports
- [ ] T069 [P] Verify Prompt Guide link is easily tappable (≥44x44px) on mobile

### Image Upload Field Enhancement (Optional)

- [ ] T070 Extend `web/src/components/organizer/builder/ImageUploadField.tsx` to support `accept` prop for MIME types (image/*, video/*) if not already supported
- [ ] T071 Add video preview support to `ImageUploadField.tsx` component if not already supported

### Documentation & Code Quality

- [ ] T072 [P] Update CLAUDE.md with active technologies if needed (preview media, countdown, overlays, AI settings)
- [ ] T073 Code cleanup and refactoring in ExperienceEditor components for maintainability

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T074 Run `pnpm lint` from repository root and fix all errors/warnings
- [ ] T075 Run `pnpm type-check` from repository root and resolve all TypeScript errors
- [ ] T076 Run `pnpm test` from repository root and ensure all tests pass
- [ ] T077 Verify feature in local dev server (`pnpm dev`) following quickstart.md manual testing guide (10 test scenarios)
- [ ] T078 Commit changes only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User Story 1 (P1 - Simplify Capture): Can start after Foundational (Phase 2)
  - User Story 2 (P1 - Preview Media): Can start after Foundational (Phase 2)
  - User Story 3 (P2 - Countdown): Can start after Foundational (Phase 2)
  - User Story 4 (P2 - Frame Overlay): Can start after Foundational (Phase 2)
  - User Story 5 (P1 - AI Settings): Can start after Foundational (Phase 2)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - can start immediately after Foundational
- **User Story 2 (P1)**: No dependencies on other stories - can start immediately after Foundational
- **User Story 3 (P2)**: No dependencies on other stories - can start immediately after Foundational
- **User Story 4 (P2)**: No dependencies on other stories - can start immediately after Foundational
- **User Story 5 (P1)**: No dependencies on other stories - can start immediately after Foundational

### Within Each User Story

- Server Actions before UI components that call them
- UI components before tests
- Tests can run in parallel where marked [P]

### Parallel Opportunities

- All Setup tasks (T001-T004) marked [P] can run in parallel
- All Foundational schema tasks (T005-T009) can run in parallel
- All Foundational TypeScript interface tasks (T010-T012) can run in parallel
- T013 (constants) can run in parallel with interface tasks
- Once Foundational phase completes, ALL user stories (US1-US5) can start in parallel (if team capacity allows)
- All tests within a user story marked [P] can run in parallel
- All mobile responsiveness checks (T065-T069) can run in parallel
- Documentation tasks (T072) can run in parallel with validation tasks

---

## Parallel Example: After Foundational Phase

```bash
# Once Phase 2 is complete, these user stories can be worked on in parallel:

# Developer A:
Task: "T014-T019 User Story 1 - Simplify Photo Capture Settings"

# Developer B:
Task: "T020-T033 User Story 2 - Configure Rich Preview Media"

# Developer C:
Task: "T034-T041 User Story 3 - Control Countdown Timer"

# Developer D:
Task: "T042-T051 User Story 4 - Configure Frame Overlay"

# Developer E:
Task: "T052-T064 User Story 5 - Configure AI Transformation Settings"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 5 Only - All P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Simplify Capture)
4. Complete Phase 4: User Story 2 (Preview Media)
5. Complete Phase 7: User Story 5 (AI Settings)
6. Complete Phase 8: Polish & Validation
7. **STOP and VALIDATE**: Test all P1 stories independently
8. Deploy/demo MVP

**MVP Scope**: User Stories 1, 2, and 5 deliver core value:
- Simplified configuration (US1)
- Rich preview media (US2)
- Better AI settings UX (US5)

**Post-MVP**: Add User Stories 3 and 4 (P2):
- Countdown timer (US3)
- Frame overlay (US4)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 5 → Test independently → Deploy/Demo (MVP complete!)
5. Add User Story 3 → Test independently → Deploy/Demo
6. Add User Story 4 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 5
   - Developer D: User Story 3 (parallel with MVP work)
   - Developer E: User Story 4 (parallel with MVP work)
3. Stories complete and integrate independently
4. Polish phase after all stories complete

---

## Summary

- **Total Tasks**: 78
- **MVP Tasks (P1 stories only)**: ~49 tasks (Phase 1, 2, 3, 4, 7, 8)
- **Full Feature Tasks**: 78 tasks (all user stories)
- **Independent User Stories**: 5 (all can be implemented and tested independently)
- **Parallel Opportunities**:
  - Setup: 2 parallel tasks
  - Foundational: 9 parallel tasks (schema, interfaces, constants)
  - All 5 user stories can run in parallel after Foundational
  - Tests within stories marked [P]
  - Mobile checks: 5 parallel tasks
- **Suggested MVP Scope**: User Stories 1, 2, 5 (P1 priorities)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests use Jest (unit/schema) and React Testing Library (component)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow Constitution principles: mobile-first, type-safe, minimal testing, validation loop
- Reference quickstart.md for manual testing scenarios (10 test cases)
- Reference plan.md for Constitution compliance checklist

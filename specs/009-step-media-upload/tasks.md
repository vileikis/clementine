# Tasks: Step Media Upload

**Input**: Design documents from `/specs/009-step-media-upload/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - tests are OPTIONAL for this feature.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` (Next.js App Router structure)
- Feature code: `web/src/features/steps/`
- Shared components: `web/src/components/shared/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure project for new feature

- [ ] T001 Install lottie-react dependency: `cd web && pnpm add lottie-react`
- [ ] T002 [P] Verify Firebase Storage configuration in web/.env.local

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, schemas, and utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Types & Schemas

- [ ] T003 [P] Add StepMediaType type to web/src/features/steps/types/step.types.ts
- [ ] T004 [P] Add mediaType field to StepBase interface in web/src/features/steps/types/step.types.ts
- [ ] T005 [P] Add stepMediaTypeSchema and update stepBaseSchema in web/src/features/steps/schemas/step.schemas.ts
- [ ] T006 Update updateStepInputSchema to include mediaType in web/src/features/steps/schemas/step.schemas.ts

### Utility Functions

- [ ] T007 [P] Create media type detection utilities in web/src/features/steps/utils/media-type.ts (detectMediaType, inferMediaTypeFromUrl, getMediaType)
- [ ] T008 [P] Create Lottie validation utilities in web/src/features/steps/utils/lottie-validation.ts (isValidLottie, validateLottieFile, LottieJSON interface)
- [ ] T009 [P] Create media validation constants in web/src/features/steps/utils/media-validation.ts (MEDIA_VALIDATION config object)
- [ ] T010 Update utils barrel export in web/src/features/steps/utils/index.ts

### Server Action

- [ ] T011 Create uploadStepMedia server action in web/src/features/steps/actions/step-media.ts
- [ ] T012 Update actions barrel export in web/src/features/steps/actions/index.ts

### Shared Components

- [ ] T013 Create LottiePlayer component in web/src/components/shared/LottiePlayer.tsx (fetches JSON from URL, renders with lottie-react)

**Checkpoint**: Foundation ready - Types, schemas, utilities, server action, and Lottie player all available

---

## Phase 3: User Story 1 - Upload Image to Step (Priority: P1) 🎯 MVP

**Goal**: Enable direct image upload (JPG, PNG, WebP) in step editors with preview

**Independent Test**: Open any step editor, click upload, select a JPG/PNG/WebP file under 10MB, verify preview appears and step displays image

### Implementation for User Story 1

- [ ] T014 [US1] Create StepMediaUpload component in web/src/features/steps/components/shared/StepMediaUpload.tsx (file input, upload state, error handling, image preview)
- [ ] T015 [US1] Create shared directory and barrel export in web/src/features/steps/components/shared/index.ts
- [ ] T016 [US1] Update BaseStepEditorProps interface to add companyId prop in web/src/features/steps/components/editors/BaseStepEditor.tsx
- [ ] T017 [US1] Replace URL input with StepMediaUpload component in BaseStepEditor in web/src/features/steps/components/editors/BaseStepEditor.tsx
- [ ] T018 [US1] Update InfoStepEditor to pass companyId to BaseStepEditor in web/src/features/steps/components/editors/InfoStepEditor.tsx
- [ ] T019 [P] [US1] Update all remaining step editors to pass companyId (CaptureStepEditor, ShortTextEditor, LongTextEditor, MultipleChoiceEditor, YesNoEditor, OpinionScaleEditor, EmailEditor, ProcessingStepEditor, RewardStepEditor, ExperiencePickerEditor)

**Checkpoint**: Image upload works end-to-end - can upload JPG/PNG/WebP and see preview in editor

---

## Phase 4: User Story 5 - Preview Media in Editor (Priority: P1)

**Goal**: Display accurate preview for all media types in the editor (images now, extensible for others)

**Independent Test**: Upload image, verify preview appears within 2 seconds, remove media, verify preview clears immediately

### Implementation for User Story 5

- [ ] T020 [US5] Add image preview rendering to StepMediaUpload in web/src/features/steps/components/shared/StepMediaUpload.tsx (static Image component for image type)
- [ ] T021 [US5] Add remove button functionality to StepMediaUpload (clears form values, does not delete from storage)
- [ ] T022 [US5] Add upload progress indicator to StepMediaUpload

**Checkpoint**: Editor shows accurate preview with upload progress and remove functionality

---

## Phase 5: User Story 6 - Backward Compatibility (Priority: P1)

**Goal**: Existing steps with mediaUrl but no mediaType continue to work

**Independent Test**: View existing step with mediaUrl only, verify it renders correctly without mediaType field

### Implementation for User Story 6

- [ ] T023 [US6] Update StepMediaUpload to infer mediaType from URL when mediaType is null in web/src/features/steps/components/shared/StepMediaUpload.tsx
- [ ] T024 [US6] Update preview-runtime step renderers to use getMediaType utility for backward compatibility in web/src/features/preview-runtime/components/step-renderers/

**Checkpoint**: All existing steps render correctly, new uploads set mediaType explicitly

---

## Phase 6: User Story 2 - Upload Video to Step (Priority: P2)

**Goal**: Enable video upload (MP4, WebM) with autoplay preview

**Independent Test**: Upload MP4 under 25MB, verify it autoplays (muted, looped) in preview

### Implementation for User Story 2

- [ ] T025 [US2] Extend StepMediaUpload to handle video file types in web/src/features/steps/components/shared/StepMediaUpload.tsx
- [ ] T026 [US2] Add video preview rendering to StepMediaUpload (autoPlay, muted, loop, playsInline)
- [ ] T027 [US2] Add 25MB size validation for video files in server action

**Checkpoint**: Video upload works with autoplay preview

---

## Phase 7: User Story 3 - Upload GIF to Step (Priority: P2)

**Goal**: Enable animated GIF upload with animated preview

**Independent Test**: Upload GIF under 10MB, verify it animates in preview

### Implementation for User Story 3

- [ ] T028 [US3] Extend StepMediaUpload to handle GIF file type in web/src/features/steps/components/shared/StepMediaUpload.tsx
- [ ] T029 [US3] Add GIF preview rendering with unoptimized Image component

**Checkpoint**: GIF upload works with animated preview

---

## Phase 8: User Story 4 - Upload Lottie Animation to Step (Priority: P3)

**Goal**: Enable Lottie JSON upload with animated preview and validation

**Independent Test**: Upload valid Lottie JSON under 5MB, verify animation plays; upload invalid JSON, verify error message

### Implementation for User Story 4

- [ ] T030 [US4] Extend StepMediaUpload to handle JSON files with Lottie validation in web/src/features/steps/components/shared/StepMediaUpload.tsx
- [ ] T031 [US4] Add Lottie preview rendering using LottiePlayer component
- [ ] T032 [US4] Add specific error message for invalid Lottie JSON structure

**Checkpoint**: Lottie upload works with animated preview and validation

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T033 [P] Update preview-runtime step renderers to handle all media types (image, gif, video, lottie) in web/src/features/preview-runtime/components/step-renderers/
- [ ] T034 [P] Add comprehensive error messages for all validation failures (file type, file size, Lottie structure)
- [ ] T035 Verify mobile-first styling (44px touch targets, responsive preview)

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T036 Run `pnpm lint` and fix all errors/warnings
- [ ] T037 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T038 Verify feature in local dev server (`pnpm dev`)
- [ ] T039 Manual testing: run through quickstart.md testing checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 (Image) → US5 (Preview) → US6 (Backward Compat) form the MVP core
  - US2 (Video), US3 (GIF), US4 (Lottie) can proceed after MVP core
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Image)**: Foundation only - MVP starting point
- **User Story 5 (P1 - Preview)**: Extends US1 with preview features
- **User Story 6 (P1 - Backward Compat)**: Extends US1/US5 with legacy support
- **User Story 2 (P2 - Video)**: Foundation + US1 core component
- **User Story 3 (P2 - GIF)**: Foundation + US1 core component
- **User Story 4 (P3 - Lottie)**: Foundation + US1 core component + LottiePlayer

### Parallel Opportunities

**Phase 2 (Foundational)** - These can all run in parallel:
- T003, T004 (types)
- T005 (schemas)
- T007, T008, T009 (utilities)
- T013 (LottiePlayer)

**Phase 3 (US1)** - After T017 completes:
- T019 (all 10 remaining editors can be updated in parallel)

**Phase 9 (Polish)**:
- T033, T034 can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all type/schema tasks together:
Task: "Add StepMediaType type to web/src/features/steps/types/step.types.ts"
Task: "Add mediaType field to StepBase interface"
Task: "Add stepMediaTypeSchema to schemas"

# Launch all utility tasks together:
Task: "Create media type detection utilities in media-type.ts"
Task: "Create Lottie validation utilities in lottie-validation.ts"
Task: "Create media validation constants in media-validation.ts"
Task: "Create LottiePlayer component"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 5 + 6)

1. Complete Phase 1: Setup (install lottie-react)
2. Complete Phase 2: Foundational (types, schemas, utilities, server action)
3. Complete Phase 3: User Story 1 (image upload)
4. Complete Phase 4: User Story 5 (preview)
5. Complete Phase 5: User Story 6 (backward compatibility)
6. **STOP and VALIDATE**: Test MVP independently with images
7. Deploy/demo if ready

### Incremental Delivery

1. MVP (US1 + US5 + US6) → Image upload works end-to-end
2. Add US2 (Video) → Video upload works
3. Add US3 (GIF) → GIF upload works
4. Add US4 (Lottie) → Lottie upload works
5. Polish phase → Cross-cutting improvements

### Single Developer Sequence

```
Setup → Foundation → US1 → US5 → US6 → US2 → US3 → US4 → Polish → Validation
```

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- StepMediaUpload is extended incrementally (Image → Video → GIF → Lottie)
- Remove action only unlinks (clears form), does NOT delete from Firebase Storage
- Backward compatibility: infer mediaType from URL extension when not stored
- Mobile-first: 44px touch targets, responsive preview scaling

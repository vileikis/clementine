# Tasks: Experience Editor & AI Playground

**Input**: Design documents from `/specs/004-exp-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - tests omitted per Minimal Testing Strategy (Constitution Principle IV)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to repository root:
- **Web app**: `web/src/` (Next.js App Router)
- **Features**: `web/src/features/experiences/`
- **Components**: `web/src/features/experiences/components/`
- **Actions**: `web/src/features/experiences/actions/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify prerequisites and create new component files

- [x] T001 Verify AI provider is configured in `.env.local` (AI_PROVIDER and GOOGLE_AI_API_KEY)
- [x] T002 Verify existing experience editor route loads at `web/src/app/(dashboard)/events/[eventId]/(studio)/design/experiences/[experienceId]/page.tsx`
- [x] T003 [P] Create AIPlayground component shell in `web/src/features/experiences/components/shared/AIPlayground.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before user stories can be implemented

**⚠️ CRITICAL**: Playground Server Action must exist before US2 can be implemented

- [x] T004 Create generatePlaygroundPreview Server Action in `web/src/features/experiences/actions/playground-generate.ts`
- [x] T005 Add playground generation input/output schemas to `web/src/features/experiences/schemas/experiences.schemas.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Configure AI Photo Experience (Priority: P1) 🎯 MVP

**Goal**: Enable experience creators to select an AI model and write a custom prompt

**Independent Test**: Navigate to `/events/{eventId}/design/experiences/{experienceId}`, select a model, edit the prompt, save, and verify changes persist on page reload

### Implementation for User Story 1

- [x] T006 [US1] Update PhotoExperienceEditor with split-screen grid layout in `web/src/features/experiences/components/photo/PhotoExperienceEditor.tsx`
- [x] T007 [US1] Add mobile responsive stacking (vertical on <1024px) in `web/src/features/experiences/components/photo/PhotoExperienceEditor.tsx`
- [x] T008 [US1] Verify model selector dropdown exists and works in `web/src/features/experiences/components/shared/AITransformSettings.tsx`
- [x] T009 [US1] Verify prompt editor textarea exists and works in `web/src/features/experiences/components/shared/AITransformSettings.tsx`
- [x] T010 [US1] Wire save button to updatePhotoExperience action for aiPhotoConfig (model, prompt) in `web/src/features/experiences/components/photo/PhotoExperienceEditor.tsx`
- [x] T011 [US1] Add toast notifications for save success/error in `web/src/features/experiences/components/photo/PhotoExperienceEditor.tsx`

**Checkpoint**: User Story 1 complete - AI configuration (model + prompt + save) works independently

---

## Phase 4: User Story 2 - Test AI Transformation in Playground (Priority: P1)

**Goal**: Enable creators to upload a test photo, trigger AI generation, and view the transformed result

**Independent Test**: Upload a test image, click Generate, wait for result, view transformed image. Verify error handling on failure.

### Implementation for User Story 2

- [x] T012 [US2] Implement drag-and-drop upload area in `web/src/features/experiences/components/shared/AIPlayground.tsx`
- [x] T013 [US2] Add file validation (JPEG/PNG/WebP, max 10MB) in `web/src/features/experiences/components/shared/AIPlayground.tsx`
- [x] T014 [US2] Display uploaded image preview (Data URL) in `web/src/features/experiences/components/shared/AIPlayground.tsx`
- [x] T015 [US2] Add Generate button with loading state in `web/src/features/experiences/components/shared/AIPlayground.tsx`
- [x] T016 [US2] Wire Generate button to generatePlaygroundPreview Server Action in `web/src/features/experiences/components/shared/AIPlayground.tsx`
- [x] T017 [US2] Display transformed result image in `web/src/features/experiences/components/shared/AIPlayground.tsx`
- [x] T018 [US2] Add error state display with retry option in `web/src/features/experiences/components/shared/AIPlayground.tsx`
- [x] T019 [US2] Integrate AIPlayground into PhotoExperienceEditor right panel in `web/src/features/experiences/components/photo/PhotoExperienceEditor.tsx`

**Checkpoint**: User Story 2 complete - Playground upload/generate/result works independently

---

## Phase 5: User Story 3 - Edit Experience General Info (Priority: P2)

**Goal**: Enable creators to edit experience name and description

**Independent Test**: Edit the name field, edit the description field, save, verify changes persist on reload

### Implementation for User Story 3

- [x] T020 [US3] Add Name input field to configuration panel in `web/src/features/experiences/components/photo/PhotoExperienceEditor.tsx`
- [x] T021 [US3] Add Description textarea to configuration panel in `web/src/features/experiences/components/photo/PhotoExperienceEditor.tsx`
- [x] T022 [US3] Wire name/description to updatePhotoExperience action in `web/src/features/experiences/components/photo/PhotoExperienceEditor.tsx`

**Checkpoint**: User Story 3 complete - General info editing works

---

## Phase 6: User Story 4 - Manage Experience Header (Priority: P2)

**Goal**: Enable header with preview media, enabled toggle, and delete functionality

**Independent Test**: Toggle enabled switch and verify state change persists. Click delete and verify experience is removed.

### Implementation for User Story 4

- [x] T023 [US4] Verify ExperienceEditorHeader displays preview media in `web/src/features/experiences/components/shared/ExperienceEditorHeader.tsx`
- [x] T024 [US4] Verify enabled toggle switch works and persists in `web/src/features/experiences/components/shared/ExperienceEditorHeader.tsx`
- [x] T025 [US4] Verify delete button shows confirmation dialog in `web/src/features/experiences/components/shared/DeleteExperienceButton.tsx`
- [x] T026 [US4] Verify delete action removes experience and navigates away in `web/src/features/experiences/components/shared/DeleteExperienceButton.tsx`

**Checkpoint**: User Story 4 complete - Header actions work

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T027 [P] Add unsaved changes detection with browser confirmation dialog in `web/src/features/experiences/components/PhotoExperienceEditor.tsx`
- [ ] T028 [P] Add keyboard shortcut (Cmd+S / Ctrl+S) for save in `web/src/features/experiences/components/PhotoExperienceEditor.tsx`
- [ ] T029 Verify touch targets ≥44x44px on all interactive elements
- [ ] T030 Verify typography ≥14px for body text on mobile

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T031 Run `pnpm lint` and fix all errors/warnings
- [ ] T032 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T033 Verify feature in local dev server (`pnpm dev`) using quickstart.md test scenarios
- [ ] T034 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS User Story 2 (playground needs Server Action)
- **User Story 1 (Phase 3)**: Depends on Setup only - can start after T003
- **User Story 2 (Phase 4)**: Depends on Foundational (T004, T005) for Server Action
- **User Story 3 (Phase 5)**: Depends on Setup only - can run parallel with US1/US2
- **User Story 4 (Phase 6)**: Depends on Setup only - can run parallel with US1/US2/US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after T003 - No dependencies on other stories
- **User Story 2 (P1)**: Requires T004, T005 complete - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Setup - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Setup - No dependencies on other stories

### Within Each User Story

- Layout tasks before feature tasks
- Core implementation before integration
- Validation and error handling last

### Parallel Opportunities

- T002, T003 can run in parallel (Setup phase)
- T027, T028 can run in parallel (Polish phase)
- All user stories can proceed in parallel after their dependencies are met
- US1 and US3/US4 can start immediately after Setup
- US2 requires Foundational phase completion

---

## Parallel Example: After Setup Complete

```bash
# These can all start in parallel after T003:
# Developer A: User Story 1
Task: "T006 [US1] Update PhotoExperienceEditor with split-screen grid layout"

# Developer B: User Story 3
Task: "T020 [US3] Add Name input field to configuration panel"

# Developer C: User Story 4
Task: "T023 [US4] Verify ExperienceEditorHeader displays preview media"

# Developer D: Foundational (blocks US2)
Task: "T004 Create generatePlaygroundPreview Server Action"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (for US2 Server Action)
3. Complete Phase 3: User Story 1 (AI Configuration)
4. Complete Phase 4: User Story 2 (Playground)
5. **STOP and VALIDATE**: Test US1 + US2 independently
6. Deploy/demo if ready - core functionality complete

### Incremental Delivery

1. Setup → Foundational → User Story 1 → **Demo: AI Config works**
2. Add User Story 2 → **Demo: Playground works**
3. Add User Story 3 → **Demo: General info editing**
4. Add User Story 4 → **Demo: Header controls**
5. Polish → **Final validation and merge**

### Single Developer Strategy

Execute phases sequentially:
1. T001-T003 (Setup)
2. T004-T005 (Foundational)
3. T006-T011 (US1)
4. T012-T019 (US2)
5. T020-T022 (US3)
6. T023-T026 (US4)
7. T027-T034 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 and US2 are both P1 priority but US1 is simpler (no Server Action needed)
- Playground Server Action (T004) is the key blocker for US2
- Verify tasks (T008, T009, T023-T026) assume existing code works - update if issues found
- All changes use existing patterns from experiences module
- No new schemas needed - uses existing updatePhotoExperienceSchema

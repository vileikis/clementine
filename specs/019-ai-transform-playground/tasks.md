# Tasks: AI Transform Step Playground

**Input**: Design documents from `/specs/019-ai-transform-playground/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/step-playground.ts

**Tests**: Not requested in spec - manual testing only per quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` (Next.js monorepo)
- Feature module: `web/src/features/steps/`
- Reference: `web/src/features/ai-presets/` (patterns to adapt)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema and action infrastructure that all user stories depend on

- [ ] T001 [P] Create playground schemas file `web/src/features/steps/schemas/step-playground.schemas.ts` with input/output Zod schemas from contracts/step-playground.ts
- [ ] T002 [P] Export new schemas from `web/src/features/steps/schemas/index.ts`
- [ ] T003 [P] Add `AI_GENERATION_FAILED` error code to `web/src/features/steps/actions/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server action that MUST be complete before ANY UI work can begin

**⚠️ CRITICAL**: No UI components can be built until this phase is complete

- [ ] T004 Create server action `web/src/features/steps/actions/step-playground.ts` implementing `generateStepPreview`:
  - Validate auth with `verifyAdminSecret()`
  - Validate input with `stepPlaygroundInputSchema`
  - Fetch step from Firestore via `experienceId` (read from step doc)
  - Validate step type is `ai-transform`
  - Validate prompt is configured
  - Extract config (model, prompt, aspectRatio, referenceImageUrls)
  - Upload test image to temp storage (`playground-temp/input-{timestamp}.{ext}`)
  - Call AI client with `getAIClient().generateImage()`
  - Return result as base64 with generation time
  - Reference: `web/src/features/ai-presets/actions/playground-generate.ts`
- [ ] T005 Export `generateStepPreview` from `web/src/features/steps/actions/index.ts`

**Checkpoint**: Server action ready - UI implementation can now begin

---

## Phase 3: User Story 1 - Test AI Transformation with Sample Image (Priority: P1) 🎯 MVP

**Goal**: Enable experience creators to test AI transformations with sample images directly within the Experience Editor

**Independent Test**: Open AI Transform editor → Click Test → Upload image → Click Generate → Verify transformed result displays with generation time

### Implementation for User Story 1

- [ ] T006 [P] [US1] Create playground folder `web/src/features/steps/components/playground/`
- [ ] T007 [US1] Create `StepAIPlayground.tsx` component in `web/src/features/steps/components/playground/StepAIPlayground.tsx`:
  - Horizontal layout (`flex flex-col md:flex-row`)
  - Props: `stepId` + `config`
  - State machine: idle → ready → generating → result/error
  - Click-to-upload for input image
  - Live timer during generation
  - Side-by-side display of input/result images
  - Generation time display after completion
  - Reference: `web/src/features/ai-presets/components/shared/AIPlayground.tsx`
- [ ] T008 [US1] Create `StepPlaygroundDialog.tsx` wrapper in `web/src/features/steps/components/playground/StepPlaygroundDialog.tsx`:
  - shadcn/ui Dialog with `max-w-4xl`
  - Props: `stepId`, `config`, `open`, `onOpenChange`
  - Renders `StepAIPlayground` inside dialog
- [ ] T009 [US1] Create barrel export `web/src/features/steps/components/playground/index.ts`
- [ ] T010 [US1] Modify `web/src/features/steps/components/editors/AiTransformEditor.tsx`:
  - Add dialog state: `const [showPlayground, setShowPlayground] = useState(false)`
  - Add "Test" button with FlaskConical icon in new "Test AI Transform" section after Aspect Ratio
  - Disable button when no prompt configured: `disabled={!form.getValues('config.prompt')}`
  - Add tooltip explaining prompt requirement when disabled
  - Import and render `StepPlaygroundDialog` at end of form

**Checkpoint**: Core playground functionality complete and testable

---

## Phase 4: User Story 2 - Upload Test Image via Drag and Drop (Priority: P2)

**Goal**: Allow drag-and-drop image upload for faster workflow

**Independent Test**: Open test dialog → Drag image file onto upload zone → Verify visual feedback and image acceptance

### Implementation for User Story 2

- [ ] T011 [US2] Enhance `StepAIPlayground.tsx` upload zone with drag-and-drop:
  - Add `onDragOver`, `onDragLeave`, `onDrop` handlers to upload zone
  - Visual feedback (highlight/border change) when dragging over zone
  - Accept dropped image files
  - Validate file type (JPEG, PNG, WebP) on drop
  - Display preview immediately on valid drop
  - Touch targets ≥44x44px for mobile

**Checkpoint**: Upload experience enhanced with drag-and-drop

---

## Phase 5: User Story 3 - Handle Generation Errors Gracefully (Priority: P2)

**Goal**: Display clear error messages with recovery options when things go wrong

**Independent Test**: Trigger error conditions (invalid file, AI service error) → Verify clear error messages appear with Retry button

### Implementation for User Story 3

- [ ] T012 [US3] Enhance `StepAIPlayground.tsx` with error handling UI:
  - Display error state with clear message for each error type
  - Client-side validation errors: invalid file type → "Only JPEG, PNG, and WebP images are allowed"
  - Client-side validation errors: file too large → "Image must be under 10MB"
  - Server errors: show error message from server response
  - AI service errors: "AI service temporarily unavailable. Please try again."
  - Add "Retry" button that resets to ready state and allows another attempt
  - Timeout handling: show error after 2-minute generation timeout

**Checkpoint**: Error handling complete with clear messages and recovery

---

## Phase 6: User Story 4 - Regenerate with Same or New Image (Priority: P3)

**Goal**: Enable iteration without starting over

**Independent Test**: Complete a generation → Click Regenerate → Verify new result with same input OR Click Clear → Verify reset to upload state

### Implementation for User Story 4

- [ ] T013 [US4] Enhance `StepAIPlayground.tsx` with regeneration controls:
  - Add "Regenerate" button in result state (same input image, new generation)
  - Add "Clear" / "Try New Image" button to reset to idle state
  - Preserve input image in state when regenerating
  - Clear both input and result when clearing

**Checkpoint**: Iteration workflow complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and quality assurance

- [ ] T014 [P] Verify mobile-first responsive design:
  - Dialog stacks vertically on mobile (`< md`)
  - Touch targets ≥44x44px
  - Upload zone large enough for touch interaction
- [ ] T015 [P] Verify all interactive elements have appropriate disabled states and tooltips

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T016 Run `pnpm lint` and fix all errors/warnings
- [ ] T017 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T018 Verify feature with manual testing checklist from quickstart.md:
  - [ ] Open Experience Editor with an AI Transform step
  - [ ] Configure prompt, model, aspect ratio
  - [ ] Click "Test" button (verify disabled without prompt)
  - [ ] Upload image via click or drag-drop
  - [ ] Click "Generate" and observe timer
  - [ ] Verify result displays with generation time
  - [ ] Test "Regenerate" button
  - [ ] Test "Clear" button
  - [ ] Test error handling (remove prompt, try again)
  - [ ] Test on mobile viewport (vertical layout)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all UI work
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - US1 (P1) can proceed first as MVP
  - US2 (P2) enhances US1 upload
  - US3 (P2) enhances US1 error handling
  - US4 (P3) enhances US1 result state
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core functionality
- **User Story 2 (P2)**: Depends on US1 (enhances upload zone)
- **User Story 3 (P2)**: Depends on US1 (enhances error states)
- **User Story 4 (P3)**: Depends on US1 (enhances result state)

### Parallel Opportunities

- T001, T002, T003 can run in parallel (different files)
- T006 can run in parallel with any other US1 task (creates folder only)
- T014, T015 can run in parallel (independent verification tasks)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all setup tasks together:
Task: "Create playground schemas in step-playground.schemas.ts"
Task: "Export schemas from schemas/index.ts"
Task: "Add AI_GENERATION_FAILED error code to actions/types.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T010)
4. **STOP and VALIDATE**: Test with quickstart.md checklist
5. Deploy/demo if ready - core value delivered!

### Incremental Delivery

1. Complete Setup + Foundational → Server action ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Drag-and-drop enhancement
4. Add User Story 3 → Error handling polish
5. Add User Story 4 → Regeneration convenience
6. Each story adds value without breaking previous stories

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 18 |
| **Setup Phase** | 3 tasks |
| **Foundational Phase** | 2 tasks |
| **User Story 1 (P1)** | 5 tasks |
| **User Story 2 (P2)** | 1 task |
| **User Story 3 (P2)** | 1 task |
| **User Story 4 (P3)** | 1 task |
| **Polish Phase** | 5 tasks |
| **Parallel Opportunities** | Setup (3), Polish (2) |
| **MVP Scope** | Phases 1-3 (T001-T010) |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All validation at system boundaries with Zod schemas
- TypeScript strict mode throughout
- Mobile-first responsive design per Constitution Principle I
- Reference implementation: `web/src/features/ai-presets/` patterns
- No automated tests requested - manual testing via quickstart.md

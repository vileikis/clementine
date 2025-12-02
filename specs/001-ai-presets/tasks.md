# Tasks: AI Presets Refactor & Legacy Step Stabilization

**Input**: Design documents from `/specs/001-ai-presets/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**Tests**: Not required for this refactor (no new functionality)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All paths relative to `web/src/` unless otherwise noted

---

## Phase 1: Setup (Migration Infrastructure)

**Purpose**: Create migration script and prepare for Firestore collection rename

- [x] T001 Create migration script directory at `scripts/`
- [x] T002 Create Firestore migration script at `scripts/migrate-experiences-to-ai-presets.ts`
- [ ] T003 Run migration script to copy `/experiences` → `/aiPresets` collection (MANUAL: requires env credentials)
- [ ] T004 Verify migration success: document count matches in both collections (MANUAL: requires env credentials)

**Checkpoint**: Firestore `/aiPresets` collection populated with all existing data

---

## Phase 2: Foundational (Feature Module Rename)

**Purpose**: Rename the feature module directory and internal files. MUST complete before user story tasks.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Rename feature directory from `features/experiences/` to `features/ai-presets/`
- [x] T006 [P] Rename `repositories/experiences.repository.ts` to `repositories/ai-presets.repository.ts`
- [x] T007 [P] Rename `schemas/experiences.schemas.ts` to `schemas/ai-presets.schemas.ts`
- [x] T008 [P] Rename `schemas/experiences.schemas.test.ts` to `schemas/ai-presets.schemas.test.ts`
- [x] T009 [P] Rename `types/experiences.types.ts` to `types/ai-presets.types.ts`
- [x] T010 Update barrel export in `features/ai-presets/repositories/index.ts`
- [x] T011 Update barrel export in `features/ai-presets/schemas/index.ts`
- [x] T012 Update barrel export in `features/ai-presets/types/index.ts`
- [x] T013 Update main barrel export in `features/ai-presets/index.ts`

**Checkpoint**: Feature module renamed, barrel exports updated

---

## Phase 3: User Story 1 - Existing Flows Continue Working (Priority: P1) 🎯 MVP

**Goal**: Ensure all existing journeys with ExperiencePicker or Capture steps continue to function after migration.

**Independent Test**: Run any existing journey with ExperiencePicker/Capture steps and verify guest experience is identical.

### Implementation for User Story 1

- [x] T014 [US1] Update collection reference from `"experiences"` to `"aiPresets"` in `features/ai-presets/repositories/ai-presets.repository.ts`
- [x] T015 [P] [US1] Rename `Experience` type to `AiPreset` in `features/ai-presets/types/ai-presets.types.ts`
- [x] T016 [P] [US1] Rename `PhotoExperience` type to `PhotoAiPreset` in `features/ai-presets/types/ai-presets.types.ts`
- [x] T017 [P] [US1] Rename `VideoExperience` type to `VideoAiPreset` in `features/ai-presets/types/ai-presets.types.ts`
- [x] T018 [P] [US1] Rename `GifExperience` type to `GifAiPreset` in `features/ai-presets/types/ai-presets.types.ts`
- [x] T019 [P] [US1] Rename `ExperienceType` type to `AiPresetType` in `features/ai-presets/types/ai-presets.types.ts`
- [x] T020 [US1] Rename Zod schemas from `experienceSchema` to `aiPresetSchema` (all variants) in `features/ai-presets/schemas/ai-presets.schemas.ts`
- [x] T021 [US1] Rename repository functions: `getExperience` → `getAiPreset`, `getExperiencesByEventId` → `getAiPresetsByEventId`, etc. in `features/ai-presets/repositories/ai-presets.repository.ts`
- [x] T022 [P] [US1] Update imports and types in `features/guest/components/JourneyGuestContainer.tsx`
- [x] T023 [P] [US1] Update imports and types in `features/guest/components/JourneyStepRenderer.tsx`
- [x] T024 [P] [US1] Update imports and types in `features/sessions/actions/sessions.actions.ts`
- [x] T025 [P] [US1] Update imports and types in `features/steps/components/preview/PreviewRuntime.tsx`
- [x] T026 [P] [US1] Update imports and types in `features/steps/components/preview/steps/CaptureStep.tsx`
- [x] T027 [P] [US1] Update imports and types in `features/steps/components/preview/steps/ExperiencePickerStep.tsx`
- [x] T028 [P] [US1] Update imports and types in `features/steps/types/playback.types.ts`
- [ ] T029 [US1] Update imports in `app/(public)/join/[eventId]/page.tsx` (SKIPPED - no experiences import found)
- [x] T030 [US1] Update action files in `features/ai-presets/actions/` to use new type names

**Checkpoint**: Existing guest flows work with `/aiPresets` collection. ExperiencePicker and Capture steps function identically.

---

## Phase 4: User Story 2 - Deprecated Steps Hidden from Creation (Priority: P2)

**Goal**: Hide ExperiencePicker and Capture step types from the "Add Step" UI to prevent new usage.

**Independent Test**: Open Journey Editor, verify deprecated step types are not available in step picker.

### Implementation for User Story 2

- [x] T031 [US2] Add `deprecated?: boolean` field to `StepTypeMeta` interface in `features/steps/constants.ts`
- [x] T032 [US2] Mark `experience-picker` step type as `deprecated: true` in `STEP_TYPE_META` in `features/steps/constants.ts`
- [x] T033 [US2] Mark `capture` step type as `deprecated: true` in `STEP_TYPE_META` in `features/steps/constants.ts`
- [x] T034 [P] [US2] Update imports and types in `features/steps/components/editors/ExperiencePickerEditor.tsx`
- [x] T035 [P] [US2] Update imports and types in `features/steps/components/editors/CaptureStepEditor.tsx`
- [x] T036 [US2] Filter deprecated step types from step picker UI (StepTypeSelector.tsx)
- [x] T037 [US2] Verify existing deprecated steps can still be viewed and edited in Journey Editor (editors still exist)

**Checkpoint**: Deprecated steps hidden from creation UI, existing steps still editable.

---

## Phase 5: User Story 3 - Codebase Uses New Naming Convention (Priority: P3)

**Goal**: Complete all remaining renames so codebase has zero references to old naming.

**Independent Test**: Run grep searches for old patterns, confirm zero matches in production code.

### Implementation for User Story 3

- [x] T038 [P] [US3] Update imports and types in `features/journeys/components/editor/StepEditor.tsx`
- [x] T039 [P] [US3] Update imports and types in `features/journeys/components/editor/StepPreview.tsx`
- [x] T040 [US3] Rename hook `useEventExperiences` to `useEventAiPresets` in `features/journeys/hooks/useEventAiPresets.ts` (renamed file and added legacy alias)
- [x] T041 [US3] Update all action function names in `features/ai-presets/actions/` (e.g., `createPhotoExperience` → `createPhotoAiPreset`)
- [ ] T042 [US3] Update component names if they reference "Experience" in `features/ai-presets/components/` (DEFERRED - keep Experience names for UI clarity)
- [x] T043 [US3] Update schema test file to use new naming in `features/ai-presets/schemas/ai-presets.schemas.test.ts`

**Checkpoint**: All `Experience` → `AiPreset` renames complete. Zero old references in codebase.

---

## Phase 6: Polish & Validation

**Purpose**: Final validation and cleanup

### Verification Tasks

- [x] T044 [P] Run `grep -r "@/features/experiences" web/src/` and verify zero matches (only comments remain)
- [x] T045 [P] Run `grep -r '"experiences"' web/src/features/` and verify zero matches (collection name) - PASSED
- [x] T046 [P] Run `grep -r "Experience\b" web/src/features/ai-presets/` - Only valid uses remain (type aliases for backward compatibility)

### Validation Loop (REQUIRED - Constitution Principle V)

- [x] T047 Run `pnpm lint` and fix all errors/warnings - PASSED
- [x] T048 Run `pnpm type-check` and resolve all TypeScript errors - PASSED
- [x] T049 Run `pnpm build` and ensure production build succeeds - PASSED
- [ ] T050 Verify feature in local dev server (`pnpm dev`) - MANUAL
- [ ] T051 Test existing journey with ExperiencePicker step - MANUAL
- [ ] T052 Test existing journey with Capture step - MANUAL
- [x] T053 Verify deprecated steps not visible in Add Step UI - Removed from StepTypeSelector.tsx

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T004) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T005-T013) completion
- **User Story 2 (Phase 4)**: Depends on Foundational; can run parallel to US1
- **User Story 3 (Phase 5)**: Depends on US1 completion (needs new type names in place)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

```
Setup (Phase 1)
    ↓
Foundational (Phase 2)
    ↓
┌───────────────────┐
│                   │
↓                   ↓
User Story 1     User Story 2
(P1 - MVP)       (P2 - Deprecation)
│                   │
└───────┬───────────┘
        ↓
    User Story 3
    (P3 - Final Cleanup)
        ↓
      Polish
    (Validation)
```

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
- T006, T007, T008, T009 can run in parallel (different files)

**Within User Story 1**:
- T015-T019 can run in parallel (same file but different type renames)
- T022-T028 can run in parallel (different files)

**Within User Story 2**:
- T034, T035 can run in parallel (different files)

**Within User Story 3**:
- T038, T039 can run in parallel (different files)

**Within Polish**:
- T044, T045, T046 can run in parallel (verification grep commands)

---

## Parallel Example: User Story 1 Type Renames

```bash
# Launch all type renames together (same file, but can be done in sequence or via IDE):
Task: "Rename Experience type to AiPreset"
Task: "Rename PhotoExperience type to PhotoAiPreset"
Task: "Rename VideoExperience type to VideoAiPreset"
Task: "Rename GifExperience type to GifAiPreset"
Task: "Rename ExperienceType type to AiPresetType"

# Launch all import updates together (different files):
Task: "Update imports in JourneyGuestContainer.tsx"
Task: "Update imports in JourneyStepRenderer.tsx"
Task: "Update imports in sessions.actions.ts"
Task: "Update imports in PreviewRuntime.tsx"
Task: "Update imports in CaptureStep.tsx"
Task: "Update imports in ExperiencePickerStep.tsx"
Task: "Update imports in playback.types.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Migration script)
2. Complete Phase 2: Foundational (Module rename)
3. Complete Phase 3: User Story 1 (Flows work)
4. **STOP and VALIDATE**: Test existing journeys
5. Deploy if ready - existing users unaffected

### Incremental Delivery

1. Setup + Foundational → Module renamed
2. User Story 1 → Test flows → Deploy (MVP - critical path)
3. User Story 2 → Test deprecation → Deploy
4. User Story 3 → Test cleanup → Deploy (complete)
5. Polish → Final validation → Done

### Recommended Approach

This is a pure refactor with tight dependencies. **Sequential execution recommended**:

1. Run migration script first (Phase 1)
2. Rename module and files (Phase 2)
3. Do all type/function renames (US1)
4. Add deprecation flags (US2)
5. Complete final cleanup (US3)
6. Run full validation (Polish)

---

## Notes

- **Scope Constraint**: DO NOT modify `web/src/app/(workspace)/` routes
- No tests required - this is a rename/refactor only
- All import updates should use IDE rename refactoring when possible
- Commit after each phase for easy rollback
- Keep `/experiences` collection as backup until stability confirmed

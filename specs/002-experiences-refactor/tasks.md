# Tasks: Experiences Feature Refactor

**Input**: Design documents from `/specs/002-experiences-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/features/experiences/` (existing module to be modified)
- **Schemas**: `web/src/features/experiences/schemas/`
- **Actions**: `web/src/features/experiences/actions/`
- **Repository**: `web/src/features/experiences/repositories/`
- **Components**: `web/src/features/experiences/components/`

---

## Phase 1: Setup

**Purpose**: Ensure development environment is ready and understand existing code

- [x] T001 Verify feature branch `002-experiences-refactor` is checked out and up to date
- [x] T002 Run `pnpm install` to ensure dependencies are current
- [x] T003 Run `pnpm type-check` to baseline current type errors (if any)
- [x] T004 Review existing schema structure in `web/src/features/experiences/schemas/experiences.schemas.ts`

---

## Phase 2: Foundational (Schema & Types)

**Purpose**: Update core schema and types that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Update Experience schema in `web/src/features/experiences/schemas/experiences.schemas.ts`:
  - Replace `eventId: string` with `companyId: string`
  - Add `eventIds: string[]` array field
  - Rename `label` to `name`
  - Remove `hidden` field
  - Rename `previewPath` to `previewMediaUrl`
  - Rename `config` to `captureConfig`
  - Rename `config.overlayFramePath` to `captureConfig.overlayUrl`
- [x] T006 Split AI config into type-specific schemas in `web/src/features/experiences/schemas/experiences.schemas.ts`:
  - Create `aiPhotoConfigSchema` for photo/gif types (enabled, model, prompt, referenceImageUrls, aspectRatio)
  - Create `aiVideoConfigSchema` for video type (add duration, fps fields)
  - Update main experience schema to use discriminated config based on type
- [x] T007 Update TypeScript types in `web/src/features/experiences/types/experiences.types.ts` to match new schema
- [x] T008 Update action types in `web/src/features/experiences/actions/types.ts` to use new field names
- [x] T009 Update schema tests in `web/src/features/experiences/schemas/experiences.schemas.test.ts` for new schema structure
- [x] T010 Run `pnpm type-check` and note all type errors introduced by schema changes

**Checkpoint**: Schema foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create New Experience for a Company (Priority: P1) 🎯 MVP

**Goal**: Enable experience creators to create new experiences owned by their company in the top-level `/experiences` collection

**Independent Test**: Create an experience through the UI and verify it appears in `/experiences` collection with correct `companyId` ownership

### Implementation for User Story 1

- [ ] T011 [US1] Update repository query pattern in `web/src/features/experiences/repositories/experiences.repository.ts`:
  - Change collection path from subcollection to root `/experiences`
  - Add `createExperience` function that writes to root collection
- [ ] T012 [US1] Update `photo-create.ts` in `web/src/features/experiences/actions/photo-create.ts`:
  - Accept `companyId` parameter instead of `eventId`
  - Accept `eventIds[]` array (can be empty for company-only experiences)
  - Use `name` instead of `label`
  - Use `aiPhotoConfig` instead of `aiConfig`
  - Use `previewMediaUrl` instead of `previewPath`
  - Use `captureConfig` instead of `config`
- [ ] T013 [US1] Update `gif-create.ts` in `web/src/features/experiences/actions/gif-create.ts`:
  - Apply same changes as photo-create (companyId, eventIds[], name, aiPhotoConfig, captureConfig)
- [ ] T014 [US1] Update `BaseExperienceFields.tsx` in `web/src/features/experiences/components/shared/BaseExperienceFields.tsx`:
  - Change `label` field to `name` field
  - Update form field labels and validation
- [ ] T015 [US1] Update `AITransformSettings.tsx` in `web/src/features/experiences/components/shared/AITransformSettings.tsx`:
  - Access `aiPhotoConfig` instead of `aiConfig` for photo/gif types
  - Rename `referenceImagePaths` to `referenceImageUrls`
- [ ] T016 [US1] Update `CreateExperienceForm.tsx` in `web/src/features/experiences/components/shared/CreateExperienceForm.tsx`:
  - Pass `companyId` from context
  - Handle `eventIds[]` array (empty or with current event ID)
  - Use new field names throughout
- [ ] T017 [US1] Update `PhotoExperienceEditor.tsx` in `web/src/features/experiences/components/photo/PhotoExperienceEditor.tsx`:
  - Use `aiPhotoConfig` instead of `aiConfig`
  - Use `captureConfig` instead of `config`
- [ ] T018 [US1] Update `GifExperienceEditor.tsx` in `web/src/features/experiences/components/gif/GifExperienceEditor.tsx`:
  - Use `aiPhotoConfig` instead of `aiConfig` (GIFs use photo models)
  - Use `captureConfig` instead of `config`
- [ ] T019 [US1] Validate company access in create actions:
  - Add `companyId` validation against user's authorized companies
  - Return appropriate error if unauthorized

**Checkpoint**: At this point, creating new experiences should work with new schema

---

## Phase 4: User Story 2 - Attach Experience to Event (Priority: P1)

**Goal**: Enable automatic attachment of experiences to events when created from Event Studio

**Independent Test**: Create an experience from Event Studio and verify the experience document's `eventIds` array contains the current event ID

### Implementation for User Story 2

- [ ] T020 [US2] Add `attachExperienceToEvent` action in `web/src/features/experiences/actions/shared.ts`:
  - Accept `experienceId` and `eventId` parameters
  - Add `eventId` to experience's `eventIds` array if not already present
- [ ] T021 [US2] Add `detachExperienceFromEvent` action in `web/src/features/experiences/actions/shared.ts`:
  - Accept `experienceId` and `eventId` parameters
  - Remove `eventId` from experience's `eventIds` array
- [ ] T022 [US2] Update create actions to auto-attach current event in `web/src/features/experiences/actions/photo-create.ts` and `gif-create.ts`:
  - If `eventId` context is available, include it in initial `eventIds` array

**Checkpoint**: At this point, experiences can be attached/detached from events

---

## Phase 5: User Story 3 - View Experiences for an Event (Priority: P1)

**Goal**: Display all experiences attached to a specific event using `eventIds` array-contains query

**Independent Test**: Load Event Studio Design Tab and verify all experiences with the event ID in their `eventIds` array are displayed

### Implementation for User Story 3

- [ ] T023 [US3] Update `getExperiencesByEventId` in `web/src/features/experiences/repositories/experiences.repository.ts`:
  - Change from subcollection query to root collection query
  - Use `where('eventIds', 'array-contains', eventId)` pattern
- [ ] T024 [US3] Update `subscribeToExperiencesByEventId` in `web/src/features/experiences/repositories/experiences.repository.ts`:
  - Apply same `array-contains` query pattern for real-time subscriptions
- [ ] T025 [US3] Update `ExperiencesList.tsx` in `web/src/features/experiences/components/shared/ExperiencesList.tsx`:
  - Use updated repository function with new query pattern
  - Display `name` instead of `label`
  - Handle empty state correctly
- [ ] T026 [US3] Update `ExperiencesSidebar.tsx` in `web/src/features/experiences/components/shared/ExperiencesSidebar.tsx`:
  - Use updated repository function with new query pattern
  - Display `name` instead of `label`
  - Auto-select first experience when list loads

**Checkpoint**: At this point, viewing experiences for an event should work correctly

---

## Phase 6: User Story 4 - Update Experience (Priority: P2)

**Goal**: Enable modifying existing experience configurations with changes persisting to `/experiences/{experienceId}`

**Independent Test**: Modify an experience field and verify the change persists in Firestore without affecting event documents

### Implementation for User Story 4

- [ ] T027 [US4] Update `photo-update.ts` in `web/src/features/experiences/actions/photo-update.ts`:
  - Use new field names (`name`, `aiPhotoConfig`, `captureConfig`, `previewMediaUrl`)
  - Validate `companyId` ownership before allowing update
  - Prevent modification of `companyId` and `type` (immutable fields)
- [ ] T028 [US4] Update `gif-update.ts` in `web/src/features/experiences/actions/gif-update.ts`:
  - Apply same changes as photo-update
- [ ] T029 [US4] Update `ExperienceEditor.tsx` in `web/src/features/experiences/components/shared/ExperienceEditor.tsx`:
  - Use new field names throughout
  - Handle `eventIds` array display/management
- [ ] T030 [US4] Update `ExperienceEditorHeader.tsx` in `web/src/features/experiences/components/shared/ExperienceEditorHeader.tsx`:
  - Display `name` instead of `label`
- [ ] T031 [US4] Update `OverlaySettings.tsx` in `web/src/features/experiences/components/photo/OverlaySettings.tsx`:
  - Use `captureConfig.overlayUrl` instead of `config.overlayFramePath`
- [ ] T032 [US4] Update `CountdownSettings.tsx` in `web/src/features/experiences/components/photo/CountdownSettings.tsx`:
  - Use `captureConfig.countdown` instead of `config.countdown`
- [ ] T033 [US4] Update `GifCaptureSettings.tsx` in `web/src/features/experiences/components/gif/GifCaptureSettings.tsx`:
  - Use `captureConfig` instead of `config`
- [ ] T034 [US4] Update `photo-media.ts` in `web/src/features/experiences/actions/photo-media.ts`:
  - Review and update storage paths if needed
  - Use `previewMediaUrl` instead of `previewPath`
- [ ] T035 [US4] Update `PreviewMediaUpload.tsx` in `web/src/features/experiences/components/shared/PreviewMediaUpload.tsx`:
  - Use `previewMediaUrl` instead of `previewPath`
- [ ] T036 [US4] Update `PreviewMediaCompact.tsx` in `web/src/features/experiences/components/shared/PreviewMediaCompact.tsx`:
  - Use `previewMediaUrl` instead of `previewPath`

**Checkpoint**: At this point, updating experiences should work with new schema

---

## Phase 7: User Story 5 - Delete Experience (Priority: P3)

**Goal**: Enable removing experiences with proper cleanup of storage assets

**Independent Test**: Delete an experience and verify it's removed from Firestore and no longer appears in the event's experience list

### Implementation for User Story 5

- [ ] T037 [US5] Update delete action in `web/src/features/experiences/actions/shared.ts`:
  - Validate user has access to experience's `companyId`
  - Delete `previewMediaUrl` from storage if present
  - Delete `aiPhotoConfig.referenceImageUrls` from storage if present
  - Delete `aiVideoConfig.referenceImageUrls` from storage if present
  - Delete Firestore document from root `/experiences` collection
- [ ] T038 [US5] Update `DeleteExperienceButton.tsx` in `web/src/features/experiences/components/shared/DeleteExperienceButton.tsx`:
  - Ensure proper confirmation dialog
  - Call updated delete action

**Checkpoint**: At this point, full CRUD operations should work with new schema

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, remaining component updates, and validation

- [ ] T039 [P] Update `utils.ts` in `web/src/features/experiences/actions/utils.ts`:
  - Review utility functions for field name updates
- [ ] T040 [P] Update `ExperienceEditorWrapper.tsx` in `web/src/features/experiences/components/shared/ExperienceEditorWrapper.tsx`:
  - Ensure wrapper passes correct props with new field names
- [ ] T041 [P] Update `ExperienceTypeSelector.tsx` in `web/src/features/experiences/components/shared/ExperienceTypeSelector.tsx`:
  - Review and update if any schema fields are referenced
- [ ] T042 [P] Update `constants.ts` in `web/src/features/experiences/constants.ts`:
  - Review and update any constants related to field names
- [ ] T043 [P] Update barrel exports in `web/src/features/experiences/index.ts`:
  - Ensure all updated types are exported
- [ ] T044 [P] Update action barrel exports in `web/src/features/experiences/actions/index.ts`
- [ ] T045 [P] Update component barrel exports in `web/src/features/experiences/components/index.ts`
- [ ] T046 [P] Update repository barrel exports in `web/src/features/experiences/repositories/index.ts`
- [ ] T047 Deploy Firestore index for `eventIds` array-contains + `createdAt` ordering (see data-model.md)

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T048 Run `pnpm lint` and fix all errors/warnings
- [ ] T049 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T050 Run `pnpm test` and ensure all tests pass
- [ ] T051 Verify feature in local dev server (`pnpm dev`):
  - Test create experience flow
  - Test view experiences for event
  - Test update experience flow
  - Test delete experience flow
- [ ] T052 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Create), US2 (Attach), US3 (View) are P1 priority
  - US4 (Update) is P2 priority
  - US5 (Delete) is P3 priority
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - May run in parallel with US1
- **User Story 3 (P1)**: Depends on T011 (repository update) - Can run in parallel with US1/US2
- **User Story 4 (P2)**: Can start after Foundational - Benefits from US1/US3 being complete
- **User Story 5 (P3)**: Can start after Foundational - Benefits from US4 being complete

### Parallel Opportunities

Within Phase 2 (Foundational):
- T005 and T006 must be sequential (T006 depends on T005)
- T007, T008, T009 can run in parallel after T005/T006

Within User Stories:
- T012 and T013 can run in parallel (different action files)
- T017 and T018 can run in parallel (different component files)
- T027 and T028 can run in parallel (different action files)

---

## Parallel Example: User Story 1

```bash
# After T011 (repository update), launch action updates in parallel:
Task: "Update photo-create.ts" (T012)
Task: "Update gif-create.ts" (T013)

# After action updates, launch component updates in parallel:
Task: "Update BaseExperienceFields.tsx" (T014)
Task: "Update AITransformSettings.tsx" (T015)
Task: "Update PhotoExperienceEditor.tsx" (T017)
Task: "Update GifExperienceEditor.tsx" (T018)
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (schema updates)
3. Complete Phase 3: User Story 1 (Create)
4. Complete Phase 4: User Story 2 (Attach)
5. Complete Phase 5: User Story 3 (View)
6. **STOP and VALIDATE**: Test create → attach → view flow
7. Deploy/demo if ready - users can create and view experiences

### Incremental Delivery

1. Complete Setup + Foundational → Schema ready
2. Add User Stories 1-3 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 4 (Update) → Test independently → Deploy/Demo
4. Add User Story 5 (Delete) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

---

## Summary

| Phase | Task Count | Purpose |
|-------|------------|---------|
| Phase 1: Setup | 4 | Environment preparation |
| Phase 2: Foundational | 6 | Schema & type updates (BLOCKING) |
| Phase 3: US1 Create | 9 | Create experience capability |
| Phase 4: US2 Attach | 3 | Event attachment capability |
| Phase 5: US3 View | 4 | View experiences capability |
| Phase 6: US4 Update | 10 | Update experience capability |
| Phase 7: US5 Delete | 2 | Delete experience capability |
| Phase 8: Polish | 14 | Cleanup and validation |
| **Total** | **52** | |

### Tasks per User Story

- US1 (Create): 9 tasks
- US2 (Attach): 3 tasks
- US3 (View): 4 tasks
- US4 (Update): 10 tasks
- US5 (Delete): 2 tasks

### MVP Scope

Complete Phases 1-5 (Setup + Foundational + US1 + US2 + US3) = **26 tasks** for full create/attach/view capability.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- This is a REFACTOR of existing code, not greenfield - existing patterns should be preserved
- No backward compatibility needed - clean schema migration
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

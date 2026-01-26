# Tasks: Experience Cover Image

**Input**: Design documents from `/specs/039-experience-media/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in specification - tests omitted.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- All paths relative to `apps/clementine-app/src/`

---

## Phase 1: Setup

**Purpose**: Verify existing infrastructure and dependencies are in place

- [x] T001 Verify existing dependencies are available: `useUploadMediaAsset` hook in `domains/media-library/hooks/`
- [x] T002 Verify existing dependencies are available: `useUpdateExperience` hook in `domains/experience/shared/hooks/`
- [x] T003 Verify existing dependencies are available: `MediaPickerField` component in `shared/editor-controls/components/`
- [x] T004 Verify existing dependencies are available: Dialog components in `ui-kit/ui/dialog.tsx`

**Checkpoint**: All existing infrastructure verified - ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create shared hook that both user stories depend on

**⚠️ CRITICAL**: User story work cannot begin until this phase is complete

- [x] T005 Create `useUploadExperienceCover` hook in `domains/experience/designer/hooks/useUploadExperienceCover.ts`
  - Wrap `useUploadMediaAsset` for cover image uploads
  - Return upload function, isUploading state, uploadProgress
  - Handle errors with toast notifications
  - Upload to Storage only (preview), no Firestore update

- [x] T006 Export `useUploadExperienceCover` from `domains/experience/designer/hooks/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Set Experience Cover Image (Priority: P1) 🎯 MVP

**Goal**: Allow admins to upload a cover image for their experience via a dialog accessible from the TopNavBar

**Independent Test**:
1. Navigate to experience designer
2. Click the experience name/thumbnail badge in TopNavBar
3. Upload an image in the dialog
4. Click Save
5. Verify thumbnail appears in navbar badge
6. Verify thumbnail appears in experience list

### Implementation for User Story 1

- [x] T007 [P] [US1] Create `ExperienceIdentityBadge` component in `domains/experience/designer/components/ExperienceIdentityBadge.tsx`
  - Display 24x24 thumbnail (or ImageIcon placeholder if no media)
  - Display experience name (truncated to 200px max)
  - Show Pencil icon on hover with opacity transition
  - Accept onClick prop to open dialog
  - Use Tailwind classes for styling

- [x] T008 [P] [US1] Create `ExperienceDetailsDialog` component in `domains/experience/designer/components/ExperienceDetailsDialog.tsx`
  - Use shadcn Dialog component
  - Include MediaPickerField for cover image (value, onChange, onUpload props)
  - Include Input field for experience name with validation (1-100 chars)
  - Include Cancel and Save buttons in DialogFooter
  - Disable Save when no changes or during upload/save
  - Show loading spinner on Save button when saving
  - Reset form state when dialog opens (useEffect on open prop)
  - Call useUpdateExperience on Save with name and media
  - Show success toast and close dialog on successful save
  - Show error toast on save failure (keep dialog open)

- [x] T009 [US1] Export new components from `domains/experience/designer/components/index.ts`

- [x] T010 [US1] Integrate into `ExperienceDesignerLayout` in `domains/experience/designer/containers/ExperienceDesignerLayout.tsx`
  - Add useState for showDetailsDialog
  - Import useAuth to get user.uid
  - Replace breadcrumb label with ExperienceIdentityBadge component
  - Add ExperienceDetailsDialog component with open/onOpenChange props
  - Pass workspaceId, experience, and userId to dialog

**Checkpoint**: User Story 1 complete - admin can upload cover image via dialog, save, and see it in navbar

---

## Phase 4: User Story 2 - Replace or Remove Cover Image (Priority: P2)

**Goal**: Allow admins to change or remove an existing cover image

**Independent Test**:
1. Set a cover image (US1)
2. Open dialog, upload a different image
3. Click Save - verify new image replaces old
4. Open dialog, click remove on MediaPickerField
5. Click Save - verify placeholder shown

### Implementation for User Story 2

- [x] T011 [US2] Verify MediaPickerField remove functionality works in `ExperienceDetailsDialog`
  - MediaPickerField should show Replace/Remove overlay on hover when image exists
  - onChange(null) should be called when Remove is clicked
  - handleRemoveMedia should set media state to null

- [x] T012 [US2] Verify replace functionality works in `ExperienceDetailsDialog`
  - onUpload should handle new file upload
  - New upload should replace existing media in local state
  - Save should update Firestore with new mediaAssetId/url

- [x] T013 [US2] Test hasChanges detection for media replacement
  - hasChanges should be true when media.mediaAssetId differs from original
  - hasChanges should be true when media goes from object to null
  - hasChanges should be true when media goes from null to object

**Checkpoint**: User Story 2 complete - admin can replace or remove cover image

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T014 Run `pnpm app:check` to verify linting and formatting pass
- [x] T015 Run `pnpm app:type-check` to verify TypeScript compilation
- [ ] T016 Manual testing: Verify cover image appears in experience list (`domains/experience/library/components/ExperienceListItem.tsx`)
- [ ] T017 Manual testing: Verify cover image appears in event editor (`domains/event/experiences/components/ExperienceSlotItem.tsx`)
- [ ] T018 Manual testing: Verify cover image appears in welcome screen preview
- [ ] T019 Test edge cases: Upload file > 5MB (should show error toast)
- [ ] T020 Test edge cases: Upload non-image file (should show error toast)
- [ ] T021 Test edge cases: Empty name validation (should show inline error)
- [ ] T022 Test edge cases: Cancel during upload (dialog should close, no changes saved)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify existing infrastructure
- **Foundational (Phase 2)**: Depends on Setup - creates shared upload hook
- **User Story 1 (Phase 3)**: Depends on Foundational - implements core upload flow
- **User Story 2 (Phase 4)**: Depends on User Story 1 components being complete
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) complete
- **User Story 2 (P2)**: Depends on US1 components (ExperienceDetailsDialog) existing

### Within User Story 1

- T007 and T008 can run in parallel (different files)
- T009 depends on T007 and T008 (exports require components)
- T010 depends on T007, T008, T009 (integration requires all components)

### Parallel Opportunities

```bash
# Phase 1: All verification tasks can run in parallel
T001, T002, T003, T004

# Phase 3 (US1): Components can be created in parallel
T007, T008
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify dependencies)
2. Complete Phase 2: Foundational (create upload hook)
3. Complete Phase 3: User Story 1 (badge + dialog + integration)
4. **STOP and VALIDATE**: Test upload → save → display flow
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test upload flow → Deploy (MVP!)
3. Add User Story 2 → Test replace/remove → Deploy
4. Polish → Full validation → Final deploy

---

## Key Files Summary

| File | Action | Story |
|------|--------|-------|
| `domains/experience/designer/hooks/useUploadExperienceCover.ts` | CREATE | Foundation |
| `domains/experience/designer/components/ExperienceIdentityBadge.tsx` | CREATE | US1 |
| `domains/experience/designer/components/ExperienceDetailsDialog.tsx` | CREATE | US1 |
| `domains/experience/designer/containers/ExperienceDesignerLayout.tsx` | MODIFY | US1 |

---

## Notes

- No new backend/schema changes required - uses existing `experience.media` field
- MediaPickerField already handles drag-drop, progress, remove overlay
- useUpdateExperience already supports `media` field updates
- All display components (ExperienceListItem, ExperienceSlotItem, etc.) already consume `experience.media?.url`
- Commit after each task or logical group
- Stop at any checkpoint to validate independently

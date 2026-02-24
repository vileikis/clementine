# Tasks: Create Tab Aspect Ratio Clarity

**Input**: Design documents from `/specs/082-create-tab-ar-clarity/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not requested — manual verification via dev server per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (monorepo)**: `apps/clementine-app/src/` is the app root
- All paths below are relative to `apps/clementine-app/src/domains/experience/create/`

---

## Phase 1: Foundational (Shared Component)

**Purpose**: Create the shared SubjectPhotoSection component that both user stories depend on

- [ ] T001 Create SubjectPhotoSection component in `apps/clementine-app/src/domains/experience/create/components/shared-controls/SubjectPhotoSection.tsx` — renders a labeled "Subject Photo" section heading, looks up the selected capture step from `steps` array by `captureStepId`, displays step name and its AR (read from `step.config.aspectRatio` after narrowing `type === 'capture.photo'`). When `captureStepId` is null, shows "None (prompt only)" if `showNoneOption` is true, otherwise hides. Uses SourceImageSelector dropdown for step selection. Props: `captureStepId: string | null`, `steps: ExperienceStep[]`, `onCaptureStepChange: (id: string | null) => void`, `showNoneOption?: boolean`, `error?: string`.
- [ ] T002 Update barrel export in `apps/clementine-app/src/domains/experience/create/components/shared-controls/index.ts` — add `SubjectPhotoSection` export

**Checkpoint**: SubjectPhotoSection component exists and is exported. Ready for integration into config forms.

---

## Phase 2: User Story 1 — Distinguish Input AR from Output AR (Priority: P1) 🎯 MVP

**Goal**: Reorganize all three config forms (AI Image, AI Video, Photo) into two clearly labeled sections — "Subject Photo" (capture step + its AR) and "Output" (output AR + model/prompt) — so creators can instantly distinguish input AR from output AR.

**Independent Test**: Open the Create tab for each outcome type (AI Image, AI Video, Photo). Verify two labeled sections appear. Verify changing output AR only affects output, and capture step info is displayed separately.

### Implementation for User Story 1

- [ ] T003 [P] [US1] Reorganize AIImageConfigForm in `apps/clementine-app/src/domains/experience/create/components/ai-image-config/AIImageConfigForm.tsx` — replace flat 2-column grid with SubjectPhotoSection (for image-to-image task; hidden for text-to-image when captureStepId is null) + "Output" section (heading `<h3>` + AspectRatioSelector at top + PromptComposer below). Remove `controls.aspectRatio` and `controls.onAspectRatioChange` from PromptComposer props — ControlRow auto-hides AR when not passed. Remove the `handleGenAspectRatioChange` handler (no longer needed). Remove the empty `<div />` slot used for text-to-image layout.
- [ ] T004 [P] [US1] Reorganize AIVideoConfigForm in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx` — replace flat 2-column grid with SubjectPhotoSection + "Output" section (heading + AspectRatioSelector with `VIDEO_ASPECT_RATIO_OPTIONS` at top + PromptComposer + FrameGenerationSection(s) below).
- [ ] T005 [P] [US1] Reorganize PhotoConfigForm in `apps/clementine-app/src/domains/experience/create/components/photo-config/PhotoConfigForm.tsx` — replace flat 2-column grid with SubjectPhotoSection + "Output" section (heading + AspectRatioSelector). Use section headings with `text-sm font-semibold text-muted-foreground` for design system token compliance.

**Checkpoint**: All three config forms display two labeled sections. Output AR is separate from capture step info. PromptComposer no longer shows AR control (AI Image). This is the MVP — test all three outcome types.

---

## Phase 3: User Story 2 — Single Capture Step Without Dropdown (Priority: P2)

**Goal**: When only one capture step exists, the Subject Photo section shows it as static text (step name + AR) instead of a dropdown. No hidden or space-occupying empty elements.

**Independent Test**: Create an experience with exactly one capture step, open Create tab — verify static text display. Add a second capture step — verify dropdown appears.

### Implementation for User Story 2

- [ ] T006 [US2] Enhance SubjectPhotoSection in `apps/clementine-app/src/domains/experience/create/components/shared-controls/SubjectPhotoSection.tsx` — add conditional rendering: when exactly 1 capture step exists, display step name + AR as static text (e.g., Camera icon + step name + AR badge) instead of SourceImageSelector dropdown. When multiple capture steps exist, keep the SourceImageSelector dropdown. When 0 capture steps, show helper text "Add a Photo Capture step to use as source image". Ensure no hidden/empty elements occupy space in any case.

**Checkpoint**: Single capture step shows as static content. Multiple steps show dropdown. No layout artifacts.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Validation, cleanup, and final verification

- [ ] T007 Run validation gates — execute `pnpm app:check` (format + lint) and `pnpm app:type-check` (TypeScript) from `apps/clementine-app/`
- [ ] T008 Manual verification per `specs/082-create-tab-ar-clarity/quickstart.md` — test all scenarios: AI Image, AI Video, Photo types; single vs. multiple capture steps; text-to-image (no source); output AR changes; verify PromptComposer no longer shows AR inside it

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately
- **US1 (Phase 2)**: Depends on Phase 1 completion (needs SubjectPhotoSection)
- **US2 (Phase 3)**: Depends on Phase 2 completion (enhances SubjectPhotoSection used by all forms)
- **Polish (Phase 4)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 1). No dependencies on US2.
- **User Story 2 (P2)**: Depends on US1 being complete (SubjectPhotoSection must be integrated into forms first).

### Within Each User Story

- US1: T003, T004, T005 are all [P] — they modify different files and can run in parallel
- US2: Single task (T006) modifying SubjectPhotoSection

### Parallel Opportunities

- T003, T004, T005 can all run in parallel (3 different form files)
- T001 and T002 are sequential (create component, then update barrel export)

---

## Parallel Example: User Story 1

```bash
# After Phase 1 (T001, T002) completes, launch all 3 form modifications in parallel:
Task: "T003 [US1] Reorganize AIImageConfigForm"
Task: "T004 [US1] Reorganize AIVideoConfigForm"
Task: "T005 [US1] Reorganize PhotoConfigForm"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (T001–T002)
2. Complete Phase 2: User Story 1 (T003–T005 in parallel)
3. **STOP and VALIDATE**: Test all 3 outcome types in dev server
4. Deploy/demo if ready — two-section layout with clear AR separation

### Incremental Delivery

1. Complete Foundational → SubjectPhotoSection ready
2. Complete US1 → Two-section layout for all forms (MVP!)
3. Complete US2 → Smart single-step display (polish)
4. Complete Polish → Validated, lint-clean, type-checked

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This is a **UI-only feature** — no schema, backend, or data model changes
- PromptComposer AR hiding is achieved by simply **not passing** the `controls.aspectRatio` prop — no ControlRow code changes needed
- All design system tokens used: `text-muted-foreground` for section headings per `standards/frontend/design-system.md`

# Tasks: Event Frame Overlay Configuration

**Input**: Design documents from `/specs/027-output-config/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/server-actions.md, research.md, quickstart.md

**Tests**: Not explicitly requested - minimal testing per Constitution Principle IV.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app monorepo**: `web/src/` for Next.js application
- Feature module: `web/src/features/events/`
- Route: `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/overlays/`

---

## Phase 1: Setup (Data Layer)

**Purpose**: Add overlay types, schemas, and constants to extend the Event data model

- [X] T001 [P] Add overlay types (`OverlayAspectRatio`, `FrameEntry`, `EventOverlayConfig`) to `web/src/features/events/types/event.types.ts`
- [X] T002 [P] Add overlay Zod schemas (`frameEntrySchema`, `overlayAspectRatioSchema`, `eventOverlayConfigSchema`, `updateEventOverlayInputSchema`) to `web/src/features/events/schemas/events.schemas.ts`
- [X] T003 [P] Add overlay constants (`OVERLAY_ASPECT_RATIOS`, `DEFAULT_EVENT_OVERLAY`) to `web/src/features/events/constants.ts`
- [X] T004 [P] Add `"frames"` destination type to storage upload in `web/src/lib/storage/actions.ts` and `ImageUploadField`

---

## Phase 2: Foundational (Backend Infrastructure)

**Purpose**: Server-side infrastructure that MUST be complete before UI implementation

**⚠️ CRITICAL**: No user story UI work can begin until this phase is complete

- [X] T005 Add `updateEventOverlay` repository function to `web/src/features/events/repositories/events.repository.ts`
- [X] T006 Add `updateEventOverlayAction` server action to `web/src/features/events/actions/events.actions.ts`
- [X] T007 Update Event schema normalization to handle optional `overlay` field in `web/src/features/events/repositories/events.repository.ts`

**Checkpoint**: Backend ready - UI implementation can now begin

---

## Phase 3: User Story 1 - Upload Frame Overlay (Priority: P1) 🎯 MVP

**Goal**: Event organizers can upload and enable frame overlay images for each aspect ratio

**Independent Test**: Upload a frame image for square aspect ratio, enable it, and verify the frame appears in preview

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `FrameCard` component (upload, enable toggle, status indicators) in `web/src/features/events/components/overlay/FrameCard.tsx`
- [X] T009 [P] [US1] Create `OverlayPreview` component (frame compositing over placeholder) in `web/src/features/events/components/overlay/OverlayPreview.tsx`
- [X] T010 [US1] Create `OverlaySection` component (form state management with useReducer) in `web/src/features/events/components/overlay/OverlaySection.tsx`
- [X] T011 [US1] Create barrel export for overlay components in `web/src/features/events/components/overlay/index.ts`
- [X] T012 [US1] Create overlays page route in `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/overlays/page.tsx`
- [X] T013 [US1] Wire up upload flow: `ImageUploadField` → `uploadImage` action → `updateEventOverlayAction` with frameUrl

**Checkpoint**: User Story 1 complete - organizers can upload frames and see them in preview

---

## Phase 4: User Story 2 - Toggle Frame On/Off (Priority: P2)

**Goal**: Event organizers can toggle frames on/off without losing the uploaded image

**Independent Test**: Upload a frame, enable it, disable it, verify URL preserved, re-enable and verify frame reappears

### Implementation for User Story 2

- [X] T014 [US2] Add enable/disable toggle logic to `FrameCard` component with visual disabled state indicator in `web/src/features/events/components/overlay/FrameCard.tsx`
- [X] T015 [US2] Update `OverlayPreview` to conditionally show frame based on enabled state in `web/src/features/events/components/overlay/OverlayPreview.tsx`
- [X] T016 [US2] Add autosave on toggle change using `updateEventOverlayAction` in `web/src/features/events/components/overlay/OverlaySection.tsx`

**Checkpoint**: User Story 2 complete - toggle preserves frame URL, preview reflects enabled state

---

## Phase 5: User Story 3 - Preview with Aspect Ratio Switching (Priority: P2)

**Goal**: Event organizers can switch preview between square and story aspect ratios

**Independent Test**: Upload frames for both aspect ratios, switch preview between them, verify correct frame displays

### Implementation for User Story 3

- [X] T017 [US3] Add aspect ratio switcher UI to `OverlayPreview` component in `web/src/features/events/components/overlay/OverlayPreview.tsx`
- [X] T018 [US3] Add selected aspect ratio state management to `OverlaySection` in `web/src/features/events/components/overlay/OverlaySection.tsx`
- [X] T019 [US3] Add placeholder images for square (1:1) and story (9:16) preview modes in `web/public/placeholders/` (handled by fallback gradient)

**Checkpoint**: User Story 3 complete - preview supports both aspect ratios with switching

---

## Phase 6: User Story 4 - Remove Frame (Priority: P3)

**Goal**: Event organizers can remove a frame entirely (clears URL and disables)

**Independent Test**: Upload a frame, remove it, verify URL cleared and aspect ratio shows as unconfigured

### Implementation for User Story 4

- [X] T020 [US4] Add remove button/action to `FrameCard` component in `web/src/features/events/components/overlay/FrameCard.tsx`
- [X] T021 [US4] Implement remove handler that sets `frameUrl: null` and `enabled: false` in `web/src/features/events/components/overlay/OverlaySection.tsx`

**Checkpoint**: User Story 4 complete - full CRUD operations for frame overlays

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Mobile responsiveness, error handling, and validation

- [X] T022 [P] Add mobile-first responsive layout (stacked on mobile, side-by-side on desktop) to overlays page in `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/overlays/page.tsx`
- [X] T023 [P] Add error handling (upload failures, save errors) with toast notifications in `web/src/features/events/components/overlay/OverlaySection.tsx`
- [X] T024 [P] Add loading states during upload and save operations in `web/src/features/events/components/overlay/FrameCard.tsx`
- [X] T025 Add broken image fallback handling in preview in `web/src/features/events/components/overlay/OverlayPreview.tsx`

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T026 Run `pnpm lint` and fix all errors/warnings (3 warnings in existing code, no errors in new code)
- [X] T027 Run `pnpm type-check` and resolve all TypeScript errors (all resolved)
- [ ] T028 Verify feature in local dev server (`pnpm dev`)
- [ ] T029 Test all user stories manually per quickstart.md checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately, all tasks parallelizable
- **Phase 2 (Foundational)**: Depends on Phase 1 (types/schemas) - BLOCKS all UI work
- **User Stories (Phase 3-6)**: All depend on Phase 2 completion
  - US1 (P1): Foundation for all other stories
  - US2 (P2): Enhances US1 toggle behavior
  - US3 (P2): Enhances US1 preview behavior
  - US4 (P3): Adds cleanup functionality
- **Phase 7 (Polish)**: Depends on US1-US4 completion

### User Story Dependencies

- **User Story 1 (P1)**: Core MVP - upload, enable, preview
- **User Story 2 (P2)**: Depends on US1 `FrameCard` and `OverlayPreview` components
- **User Story 3 (P2)**: Depends on US1 `OverlayPreview` component
- **User Story 4 (P3)**: Depends on US1 `FrameCard` and `OverlaySection` components

### Within Each User Story

- Components marked [P] can be built in parallel
- `OverlaySection` integrates other components, so depends on `FrameCard` and `OverlayPreview`
- Page route depends on all components being ready

### Parallel Opportunities

**Phase 1** (all parallel):
```
T001, T002, T003, T004 → Can all run simultaneously
```

**Phase 3 - US1**:
```
T008 (FrameCard) ║ T009 (OverlayPreview) → T010 (OverlaySection) → T011 (barrel) → T012 (page) → T013 (wiring)
```

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all setup tasks together:
Task: "Add overlay types to web/src/features/events/types/event.types.ts"
Task: "Add overlay Zod schemas to web/src/features/events/schemas/events.schemas.ts"
Task: "Add overlay constants to web/src/features/events/constants.ts"
Task: "Add frames destination to web/src/lib/storage/actions.ts"
```

## Parallel Example: User Story 1 Components

```bash
# Launch component creation in parallel:
Task: "Create FrameCard component in web/src/features/events/components/overlay/FrameCard.tsx"
Task: "Create OverlayPreview component in web/src/features/events/components/overlay/OverlayPreview.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types, schemas, constants)
2. Complete Phase 2: Foundational (repository, server action)
3. Complete Phase 3: User Story 1 (upload, enable, preview)
4. **STOP and VALIDATE**: Test upload → enable → preview flow
5. Deploy/demo if ready - delivers core value

### Incremental Delivery

1. Complete Setup + Foundational → Backend ready
2. Add User Story 1 → Test independently → Deploy (MVP!)
3. Add User Story 2 → Test toggle behavior → Deploy
4. Add User Story 3 → Test aspect ratio switching → Deploy
5. Add User Story 4 → Test frame removal → Deploy
6. Add Polish → Final validation → Release

### Estimated Task Distribution

| Phase | Tasks | Parallel? |
|-------|-------|-----------|
| Setup | 4 | Yes (all) |
| Foundational | 3 | Sequential |
| US1 (MVP) | 6 | Partial |
| US2 | 3 | Sequential |
| US3 | 3 | Sequential |
| US4 | 2 | Sequential |
| Polish | 8 | Partial |
| **Total** | **29** | |

---

## Notes

- [P] tasks = different files, no dependencies between them
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Mobile-first: start with mobile layout, enhance for desktop
- Follow existing patterns from `EventThemeEditor` and `WelcomePreview`
- Use `PreviewShell` for consistent preview experience
- Store frame URLs as full public URLs per Firebase Architecture Standards

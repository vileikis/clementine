# Tasks: Experience Editor Tabs (Design & Settings)

**Input**: Design documents from `/specs/018-exp-settings-routes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No explicit tests requested in feature specification. Following minimal testing strategy per constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Next.js App Router at `web/src/app/`, feature modules at `web/src/features/`
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend existing types and schemas to support new preview media fields

- [ ] T001 [P] Add `ExperiencePreviewType` type and extend `Experience` interface with `previewMediaUrl` and `previewType` fields in `web/src/features/experiences/types/experiences.types.ts`
- [ ] T002 [P] Add `PREVIEW_MEDIA` constraints to `EXPERIENCE_CONSTRAINTS` in `web/src/features/experiences/constants.ts`
- [ ] T003 Add `experiencePreviewTypeSchema` and `updateExperienceSettingsInputSchema` to `web/src/features/experiences/schemas/experiences.schemas.ts`
- [ ] T004 Update `experienceSchema` with optional `previewMediaUrl` and `previewType` fields in `web/src/features/experiences/schemas/experiences.schemas.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create server action for settings updates that all stories depend on

**⚠️ CRITICAL**: Route restructuring cannot begin until this phase is complete

- [ ] T005 Create `updateExperienceSettingsAction` server action in `web/src/features/experiences/actions/experiences.ts`
- [ ] T006 Export `updateExperienceSettingsAction` from `web/src/features/experiences/actions/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Edit Experience Design (Priority: P1) 🎯 MVP

**Goal**: Create nested route structure with Design tab as default, preserving all existing editor functionality

**Independent Test**: Navigate to `/{companySlug}/exps/{expId}` and verify redirect to `/design`, then confirm all step editor functionality works

### Implementation for User Story 1

- [ ] T007 [US1] Create shared layout with ExperienceTabs at `web/src/app/(workspace)/[companySlug]/exps/[expId]/layout.tsx`
- [ ] T008 [US1] Create design route page at `web/src/app/(workspace)/[companySlug]/exps/[expId]/design/page.tsx` that renders ExperienceEditorClient
- [ ] T009 [US1] Update base page to redirect to /design at `web/src/app/(workspace)/[companySlug]/exps/[expId]/page.tsx`
- [ ] T010 [US1] Update ExperienceCard href to point to /design route in `web/src/features/experiences/components/ExperienceCard.tsx`

**Checkpoint**: User Story 1 complete - Design tab works with redirect from base URL

---

## Phase 4: User Story 2 - Edit Experience Settings (Priority: P2)

**Goal**: Add Settings tab with form for editing name, description, and preview media

**Independent Test**: Navigate to `/{companySlug}/exps/{expId}/settings`, update each field, verify changes persist

### Implementation for User Story 2

- [ ] T011 [P] [US2] Create settings folder and barrel export at `web/src/features/experiences/components/settings/index.ts`
- [ ] T012 [US2] Create ExperienceSettingsForm component with useReducer pattern in `web/src/features/experiences/components/settings/ExperienceSettingsForm.tsx`
- [ ] T013 [US2] Add name input field with validation to ExperienceSettingsForm
- [ ] T014 [US2] Add description textarea field to ExperienceSettingsForm
- [ ] T015 [US2] Add preview media upload using StepMediaUpload pattern to ExperienceSettingsForm
- [ ] T016 [US2] Add save button with loading state and toast notifications to ExperienceSettingsForm
- [ ] T017 [US2] Export settings components from `web/src/features/experiences/components/index.ts`
- [ ] T018 [US2] Create settings route page at `web/src/app/(workspace)/[companySlug]/exps/[expId]/settings/page.tsx`

**Checkpoint**: User Story 2 complete - Settings tab works with form save functionality

---

## Phase 5: User Story 3 - View Preview Media in Experience List (Priority: P3)

**Goal**: Display preview media thumbnails on experience cards when available

**Independent Test**: Create experiences with and without preview media, verify cards display correctly

### Implementation for User Story 3

- [ ] T019 [US3] Add preview media thumbnail section to ExperienceCard in `web/src/features/experiences/components/ExperienceCard.tsx`
- [ ] T020 [US3] Add fallback state (icon/placeholder) when no preview media exists in ExperienceCard
- [ ] T021 [US3] Add loading state for preview media images using Next.js Image optimization in ExperienceCard

**Checkpoint**: All user stories complete - Experience list shows preview thumbnails

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Mobile testing, edge cases, and validation loop

- [ ] T022 [P] Test mobile responsive layout (320px viewport) for Settings form
- [ ] T023 [P] Test mobile responsive layout for tab navigation (touch targets ≥44px)
- [ ] T024 [P] Test edge cases: empty name validation, large file upload rejection, upload failure toast
- [ ] T025 Test navigation between tabs with real-time updates reflecting correctly

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T026 Run `pnpm lint` and fix all errors/warnings
- [ ] T027 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T028 Verify feature in local dev server (`pnpm dev`)
- [ ] T029 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS route creation
- **User Story 1 (Phase 3)**: Depends on Foundational - creates route structure
- **User Story 2 (Phase 4)**: Depends on Phase 2 (uses server action) - can run parallel with US1 after T005
- **User Story 3 (Phase 5)**: Depends on Phase 1 (uses preview types) - can run parallel after Setup
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Creates route structure for US2
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses settings action
- **User Story 3 (P3)**: Can start after Setup (Phase 1) - Only needs Experience type updates

### Within Each User Story

- Route/layout files before page files
- Components before pages that use them
- Server actions before client components that call them

### Parallel Opportunities

**Phase 1 (Setup)**:
- T001 and T002 can run in parallel (different files)

**Phase 4 (User Story 2)**:
- T011 can run in parallel with other US2 tasks (barrel export)

**Phase 6 (Polish)**:
- T022, T023, T024 can run in parallel (independent tests)

---

## Parallel Example: Setup Phase

```bash
# Launch all type/constant updates together:
Task: "Add ExperiencePreviewType type in web/src/features/experiences/types/experiences.types.ts"
Task: "Add PREVIEW_MEDIA constraints in web/src/features/experiences/constants.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test redirect and existing editor functionality
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test Design tab → Deploy/Demo (MVP!)
3. Add User Story 2 → Test Settings form → Deploy/Demo
4. Add User Story 3 → Test card thumbnails → Deploy/Demo
5. Each story adds value without breaking previous stories

### Suggested Order (Single Developer)

1. T001-T004 (Setup) - Types and schemas
2. T005-T006 (Foundational) - Server action
3. T007-T010 (US1) - Route structure
4. T011-T018 (US2) - Settings form
5. T019-T021 (US3) - Card thumbnails
6. T022-T029 (Polish) - Testing and validation

---

## Task Summary

| Phase | Task Count | User Story |
|-------|------------|------------|
| Setup | 4 | - |
| Foundational | 2 | - |
| User Story 1 | 4 | P1 - Design Tab |
| User Story 2 | 8 | P2 - Settings Tab |
| User Story 3 | 3 | P3 - Card Thumbnails |
| Polish | 8 | - |
| **Total** | **29** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- ExperienceTabs component already exists - no need to create it
- Reuse StepMediaUpload pattern from steps module for preview media upload
- Follow ThemeEditor useReducer pattern for settings form state
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

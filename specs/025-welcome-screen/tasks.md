# Tasks: Welcome Screen Customization

**Input**: Design documents from `/specs/025-welcome-screen/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/welcome-api.md, quickstart.md

**Tests**: Not explicitly requested in spec. Skipping test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Next.js monorepo with `web/` workspace
- **Feature path**: `web/src/features/events/`
- **Welcome components**: `web/src/features/events/components/welcome/`
- **Shared components**: `web/src/components/shared/`
- **Hooks**: `web/src/hooks/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and data layer foundation

- [x] T001 Add ExperienceLayout type and EventWelcome interface in `web/src/features/events/types/events.types.ts`
- [x] T002 Add DEFAULT_EVENT_WELCOME constant in `web/src/features/events/types/events.types.ts`
- [x] T003 [P] Add experienceLayoutSchema, eventWelcomeSchema, updateEventWelcomeSchema in `web/src/features/events/schemas/events.schemas.ts`
- [x] T004 [P] Export UpdateEventWelcomeInput type from schemas in `web/src/features/events/schemas/events.schemas.ts`
- [x] T005 Update Event interface to include welcome field in `web/src/features/events/types/events.types.ts`
- [x] T006 Re-export new types from `web/src/features/events/types/index.ts`
- [x] T007 Re-export new schemas from `web/src/features/events/schemas/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Add updateEventWelcome repository function with dot-notation updates in `web/src/features/events/repositories/events.repository.ts`
- [x] T009 Add updateEventWelcomeAction server action in `web/src/features/events/actions/events.actions.ts`
- [x] T010 Re-export updateEventWelcomeAction from `web/src/features/events/actions/index.ts`
- [x] T011 Update normalizeEvent helper to handle missing welcome field with DEFAULT_EVENT_WELCOME fallback in `web/src/features/events/repositories/events.repository.ts`
- [x] T012 Update createEvent function to include welcome: DEFAULT_EVENT_WELCOME in `web/src/features/events/repositories/events.repository.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Customize Welcome Content (Priority: P1) 🎯 MVP

**Goal**: Event creator can customize title and description for the welcome screen

**Independent Test**: Edit title/description fields and verify they persist and appear in preview

### Implementation for User Story 1

- [x] T013 [US1] Create `components/welcome/` folder and barrel export in `web/src/features/events/components/welcome/index.ts`
- [x] T014 [US1] Create WelcomeSection component that receives form prop in `web/src/features/events/components/welcome/WelcomeSection.tsx`
- [x] T015 [US1] Add title input field with 100 character max and character counter in `web/src/features/events/components/welcome/WelcomeSection.tsx`
- [x] T016 [US1] Add description textarea with 500 character max and character counter in `web/src/features/events/components/welcome/WelcomeSection.tsx`
- [x] T017 [US1] Create WelcomePreview component that receives welcome + event props in `web/src/features/events/components/welcome/WelcomePreview.tsx`
- [x] T018 [US1] Add title display with event.name fallback and description in WelcomePreview in `web/src/features/events/components/welcome/WelcomePreview.tsx`
- [x] T019 [US1] Re-export welcome components from `web/src/features/events/components/welcome/index.ts`

**Checkpoint**: Title and description customization works independently

---

## Phase 4: User Story 2 - Upload Welcome Hero Media (Priority: P1)

**Goal**: Event creator can upload image or video as hero media for the welcome screen

**Independent Test**: Upload an image/video and verify it displays as hero element in preview

### Implementation for User Story 2

- [x] T020 [US2] Add ImageUploadField for welcome media with destination="welcome" in `web/src/features/events/components/welcome/WelcomeSection.tsx`
- [x] T021 [US2] Implement media upload handler that sets mediaUrl and auto-detects mediaType via form.setValue
- [x] T022 [US2] Add hero media display (image or video) in WelcomePreview in `web/src/features/events/components/welcome/WelcomePreview.tsx`
- [x] T023 [US2] Handle media removal and fallback to themed background when no media set
- [x] T024 [US2] Add video autoplay/loop/muted attributes for video hero media

**Checkpoint**: Media upload and display works independently

---

## Phase 5: User Story 3 - Choose Experience Layout (Priority: P2)

**Goal**: Event creator can choose list or grid layout for experience cards

**Independent Test**: Toggle between list/grid layouts and verify preview updates

### Implementation for User Story 3

- [x] T025 [US3] Add layout toggle (segmented control or radio group) for list/grid selection in `web/src/features/events/components/welcome/WelcomeSection.tsx`
- [x] T026 [US3] Create ExperienceCards component in `web/src/features/events/components/welcome/ExperienceCards.tsx`
- [x] T027 [US3] Implement list layout (vertical stack) in ExperienceCards
- [x] T028 [US3] Implement grid layout (two-column grid) in ExperienceCards
- [x] T029 [US3] Filter experiences to show only enabled ones (EventExperienceLink.enabled === true)
- [x] T030 [US3] Add empty state message when no experiences are linked or all disabled
- [x] T031 [US3] Re-export ExperienceCards from `web/src/features/events/components/welcome/index.ts`

**Checkpoint**: Layout selection works independently

---

## Phase 6: User Story 4 - Preview Welcome Screen with Theme (Priority: P2)

**Goal**: Event creator sees live preview with event theme applied

**Independent Test**: Make changes to welcome settings and verify preview updates with correct theme styling

### Implementation for User Story 4

- [x] T032 [US4] Wrap WelcomePreview content with PreviewShell component (enableViewportSwitcher, enableFullscreen) in `web/src/features/events/components/welcome/WelcomePreview.tsx`
- [x] T033 [US4] Wrap preview content with ThemeProvider and ThemedBackground using event.theme in `web/src/features/events/components/welcome/WelcomePreview.tsx`
- [x] T034 [US4] Apply theme text colors to title and description in preview in `web/src/features/events/components/welcome/WelcomePreview.tsx`
- [x] T035 [US4] Apply theme button styles to experience cards in preview in `web/src/features/events/components/welcome/ExperienceCards.tsx`
- [x] T036 [US4] Preview updates automatically via welcomeValues prop from EventGeneralTab's form.watch()

**Checkpoint**: Themed preview works independently

---

## Phase 7: User Story 5 - Autosave Changes (Priority: P2)

**Goal**: Event creator's changes are saved automatically without manual save action

**Independent Test**: Edit a field, wait for save indicator, refresh page to verify persistence

### Implementation for User Story 5

- [x] T037 [US5] Integrate useAutoSave hook with React Hook Form in EventGeneralTab in `web/src/features/events/components/EventGeneralTab.tsx`
- [x] T038 [US5] Configure useAutoSave with 500ms debounce, fieldsToCompare for all welcome fields in `web/src/features/events/components/EventGeneralTab.tsx`
- [x] T039 [US5] Add toast notifications for save success (sonner) in `web/src/features/events/components/EventGeneralTab.tsx`
- [x] T040 [US5] Add toast notifications for save errors with retry context in `web/src/features/events/components/EventGeneralTab.tsx`
- [x] T041 [US5] Pass handleBlur from useAutoSave to WelcomeSection via onBlur prop

**Checkpoint**: Autosave works independently

---

## Phase 8: Integration & Polish

**Purpose**: Set up EventGeneralTab with two-column layout, form state lifting, and final polish

- [x] T042 Set up useForm with eventWelcomeSchema and DEFAULT_EVENT_WELCOME in EventGeneralTab in `web/src/features/events/components/EventGeneralTab.tsx`
- [x] T043 Add two-column grid layout (left: sections, right: sticky preview) in EventGeneralTab in `web/src/features/events/components/EventGeneralTab.tsx`
- [x] T044 Import WelcomeSection and pass form, event, onBlur props in `web/src/features/events/components/EventGeneralTab.tsx`
- [x] T045 Import WelcomePreview and pass welcomeValues (form.watch()) and event props in `web/src/features/events/components/EventGeneralTab.tsx`
- [x] T046 Verify section order in left column: Welcome → Experiences → Extras
- [x] T047 Add mobile-responsive layout (single column on mobile, two-column on lg:) with proper spacing

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [x] T048 Run `pnpm lint` and fix all errors/warnings
- [x] T049 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T050 Verify feature in local dev server (`pnpm dev`)
- [ ] T051 Test all acceptance scenarios from spec.md manually
- [ ] T052 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 (both P1) can proceed in parallel - create WelcomeSection and WelcomePreview
  - US3 and US4 (both P2) can proceed in parallel - layout toggle and theme integration
- **Integration (Phase 7-8)**: Depends on US1-US4 completion
  - Phase 7 (US5) and Phase 8 should be done together - both modify EventGeneralTab
  - Sets up form state, two-column layout, useAutoSave integration

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Uses components from US1/US2 but independently testable
- **User Story 4 (P2)**: Requires WelcomePreview from US1 - Theme integration happens in WelcomePreview.tsx
- **User Story 5 (P2)**: Requires Phase 8 setup - useAutoSave is integrated at EventGeneralTab level

### Within Each User Story

- Component skeleton before field implementations
- Form fields before preview display
- Core functionality before polish

### Parallel Opportunities

- T003, T004: Schema definitions can run in parallel
- T006, T007: Barrel export updates can run in parallel
- US1 and US2: Both P1 stories can be worked on simultaneously
- US3, US4, US5: All P2 stories can be worked on in parallel (with coordination on shared files)

---

## Parallel Example: Foundational Phase

```bash
# After Setup is complete, launch foundational tasks:
Task: "Add updateEventWelcome repository function"
Task: "Add updateEventWelcomeAction server action"
# These modify different files and can run in parallel
```

## Parallel Example: P1 User Stories

```bash
# After Foundational is complete, launch both P1 stories:
# Developer A: User Story 1 (title/description)
Task: "Create WelcomeSection component skeleton"
Task: "Add title input field"
Task: "Add description textarea"

# Developer B: User Story 2 (hero media) - can work on separate branch
# Then merge when US1 skeleton is ready
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (types and schemas)
2. Complete Phase 2: Foundational (repository and actions)
3. Complete Phase 3: User Story 1 (title + description)
4. Complete Phase 4: User Story 2 (hero media)
5. **STOP and VALIDATE**: Test basic welcome customization
6. Deploy/demo if ready - creators can customize welcome content

### Incremental Delivery

1. Setup + Foundational → Data layer ready
2. Add US1 + US2 → Core customization works (MVP!)
3. Add US3 → Layout flexibility
4. Add US4 → Themed preview polish
5. Add US5 → Autosave convenience
6. Integration → Full feature in EventGeneralTab

### Suggested MVP Scope

**User Story 1 + User Story 2** deliver the core value proposition:
- Creators can set custom title and description
- Creators can upload hero media
- Basic preview shows the result

This is a functional MVP that can be shipped and iterated on.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Uses existing useAutoSave hook at EventGeneralTab level - no custom autosave implementation needed
- Uses existing preview-shell and theming modules - no new infrastructure needed
- Form state lifted to EventGeneralTab - WelcomeSection receives form prop, WelcomePreview receives welcomeValues + event
- Two-column layout at EventGeneralTab level (left: sections, right: sticky preview)

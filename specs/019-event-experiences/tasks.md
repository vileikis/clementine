# Tasks: Event Experiences & Extras (General Tab)

**Input**: Design documents from `/specs/019-event-experiences/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec - following minimal testing strategy per constitution

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` - Next.js application
- **Features**: `web/src/features/[module]/` - Feature modules
- **Routes**: `web/src/app/(workspace)/` - App Router pages

---

## Phase 1: Setup (Data Layer Foundation)

**Purpose**: Establish data model types, schemas, and constants

- [x] T001 [P] Add `ExtraSlotFrequency` type and update `EventExperienceLink` interface in `web/src/features/events/types/event.types.ts`
- [x] T002 [P] Add `EventExtras` interface in `web/src/features/events/types/event.types.ts`
- [x] T003 Update `Event` interface to include `extras` field in `web/src/features/events/types/event.types.ts`
- [x] T004 [P] Add `extraSlotFrequencySchema` and update `eventExperienceLinkSchema` in `web/src/features/events/schemas/events.schemas.ts`
- [x] T005 [P] Add `eventExtrasSchema` and update `eventSchema` in `web/src/features/events/schemas/events.schemas.ts`
- [x] T006 [P] Add input schemas for experience actions (add, update, remove) in `web/src/features/events/schemas/events.schemas.ts`
- [x] T007 [P] Add input schemas for extras actions (set, update, remove) in `web/src/features/events/schemas/events.schemas.ts`
- [x] T008 [P] Add `EXTRA_SLOTS` constant with slot metadata in `web/src/features/events/constants.ts`
- [x] T009 [P] Add `EXTRA_FREQUENCIES` constant with frequency options in `web/src/features/events/constants.ts`
- [x] T010 [P] Add `DEFAULT_EVENT_EXTRAS` constant in `web/src/features/events/constants.ts`
- [x] T011 Run `pnpm type-check` to verify type definitions are correct

---

## Phase 2: Foundational (Repository & Actions)

**Purpose**: Core infrastructure that MUST be complete before UI work can begin

**CRITICAL**: No user story UI work can begin until this phase is complete

- [x] T012 Update `createEvent` function to include default extras in `web/src/features/events/repositories/events.repository.ts`
- [x] T013 [P] Add `addEventExperience` repository function in `web/src/features/events/repositories/events.repository.ts`
- [x] T014 [P] Add `updateEventExperience` repository function in `web/src/features/events/repositories/events.repository.ts`
- [x] T015 [P] Add `removeEventExperience` repository function in `web/src/features/events/repositories/events.repository.ts`
- [x] T016 [P] Add `setEventExtra` repository function in `web/src/features/events/repositories/events.repository.ts`
- [x] T017 [P] Add `updateEventExtra` repository function in `web/src/features/events/repositories/events.repository.ts`
- [x] T018 [P] Add `removeEventExtra` repository function in `web/src/features/events/repositories/events.repository.ts`
- [x] T019 [P] Implement `addEventExperienceAction` server action in `web/src/features/events/actions/events.actions.ts`
- [x] T020 [P] Implement `updateEventExperienceAction` server action in `web/src/features/events/actions/events.actions.ts`
- [x] T021 [P] Implement `removeEventExperienceAction` server action in `web/src/features/events/actions/events.actions.ts`
- [x] T022 [P] Implement `setEventExtraAction` server action in `web/src/features/events/actions/events.actions.ts`
- [x] T023 [P] Implement `updateEventExtraAction` server action in `web/src/features/events/actions/events.actions.ts`
- [x] T024 [P] Implement `removeEventExtraAction` server action in `web/src/features/events/actions/events.actions.ts`
- [x] T025 Update barrel export in `web/src/features/events/actions/index.ts` to export new actions
- [x] T026 Create `useExperienceDetails` hook in `web/src/features/experiences/hooks/useExperienceDetails.ts`
- [x] T027 Update barrel export in `web/src/features/experiences/hooks/index.ts` to export new hook
- [x] T028 Update feature export in `web/src/features/experiences/index.ts` to export `useExperienceDetails`
- [x] T029 Run `pnpm type-check` and `pnpm lint` to verify foundational layer

**Checkpoint**: Foundation ready - UI implementation can now begin

---

## Phase 3: User Story 1 & 2 - Add & Toggle Experiences (Priority: P1)

**Goal**: Event creators can attach company experiences to events and toggle them enabled/disabled

**Independent Test**: Create an event, add experiences from company library, toggle enabled/disabled, verify state persists

### Implementation for User Stories 1 & 2

- [x] T030 [P] [US1] Create `general/` directory and barrel export in `web/src/features/events/components/general/index.ts`
- [x] T031 [P] [US1] Create `AddExperienceCard` component in `web/src/features/events/components/general/AddExperienceCard.tsx`
- [x] T032 [P] [US1] Create `EventExperienceCard` component with toggle in `web/src/features/events/components/general/EventExperienceCard.tsx`
- [x] T033 [US1] Create `ExperiencePickerDrawer` component in `web/src/features/events/components/general/ExperiencePickerDrawer.tsx`
- [x] T034 [US1] Create `ExperiencesSection` component in `web/src/features/events/components/general/ExperiencesSection.tsx`
- [x] T035 [US1] Update barrel export in `web/src/features/events/components/general/index.ts` for experiences components

**Checkpoint**: Can add experiences to event, toggle enabled/disabled - User Stories 1 & 2 complete

---

## Phase 4: User Story 3 & 4 - Edit & Remove Experiences (Priority: P2)

**Goal**: Event creators can edit experience labels and remove experiences from events

**Independent Test**: Click experience card to open edit drawer, modify label, save, remove with confirmation

### Implementation for User Stories 3 & 4

- [ ] T036 [US3] Create `EventExperienceDrawer` component in `web/src/features/events/components/general/EventExperienceDrawer.tsx`
- [ ] T037 [US3] Update `EventExperienceCard` to open edit drawer on click in `web/src/features/events/components/general/EventExperienceCard.tsx`
- [ ] T038 [US3] Update barrel export in `web/src/features/events/components/general/index.ts` for edit drawer

**Checkpoint**: Can edit experience labels and remove experiences - User Stories 3 & 4 complete

---

## Phase 5: User Story 5 & 6 - Configure Extras Slots (Priority: P2)

**Goal**: Event creators can add experiences to pre-entry gate and pre-reward extra slots

**Independent Test**: Click "+" on empty slot, select experience, configure frequency, save, verify slot shows configuration

### Implementation for User Stories 5 & 6

- [ ] T039 [P] [US5] Create `ExtraSlotCard` component in `web/src/features/events/components/general/ExtraSlotCard.tsx`
- [ ] T040 [US5] Create `ExtraSlotDrawer` component in `web/src/features/events/components/general/ExtraSlotDrawer.tsx`
- [ ] T041 [US5] Create `ExtrasSection` component in `web/src/features/events/components/general/ExtrasSection.tsx`
- [ ] T042 [US5] Update barrel export in `web/src/features/events/components/general/index.ts` for extras components

**Checkpoint**: Can configure both extra slots - User Stories 5 & 6 complete

---

## Phase 6: User Story 7 & 8 - Toggle & Edit Extras (Priority: P3)

**Goal**: Event creators can toggle extras enabled/disabled and edit extra configuration

**Independent Test**: Toggle extra enabled/disabled without removing, edit label and frequency

### Implementation for User Stories 7 & 8

- [ ] T043 [US7] Add toggle functionality to `ExtraSlotCard` component in `web/src/features/events/components/general/ExtraSlotCard.tsx`
- [ ] T044 [US8] Add edit mode to `ExtraSlotDrawer` component in `web/src/features/events/components/general/ExtraSlotDrawer.tsx`

**Checkpoint**: Can toggle and edit extras - User Stories 7 & 8 complete

---

## Phase 7: Tab Assembly & Route Integration

**Purpose**: Wire up the General tab and route

- [ ] T045 Create `EventGeneralTab` component in `web/src/features/events/components/EventGeneralTab.tsx`
- [ ] T046 Update barrel export in `web/src/features/events/components/index.ts` to export `EventGeneralTab`
- [ ] T047 Create route page in `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/general/page.tsx`
- [ ] T048 Update tab navigation in `web/src/features/events/components/EventDetailsHeader.tsx` - rename "Experiences" to "General" and update href
- [ ] T049 Delete old route at `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/experiences/page.tsx`
- [ ] T050 Delete old component `web/src/features/events/components/EventExperiencesTab.tsx`

**Checkpoint**: General tab is accessible and renders correctly

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T051 Verify responsive behavior on mobile viewport (320px) - touch targets meet 44x44px minimum
- [ ] T052 Verify empty states render correctly (no experiences in library, no attached experiences)
- [ ] T053 Verify disabled state styling (muted/grayed appearance) for experiences and extras
- [ ] T054 Handle edge case: deleted experience shows "Experience not found" with remove option

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T055 Run `pnpm lint` and fix all errors/warnings
- [ ] T056 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T057 Verify feature in local dev server (`pnpm dev`) - navigate to General tab
- [ ] T058 Manual testing: Add experience, toggle, edit label, remove with confirmation
- [ ] T059 Manual testing: Configure both extra slots with different frequencies
- [ ] T060 Manual testing: Toggle extras enabled/disabled, edit configuration

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all UI work
- **Phase 3 (US1 & US2)**: Depends on Phase 2 completion
- **Phase 4 (US3 & US4)**: Depends on Phase 3 (needs experience cards to click)
- **Phase 5 (US5 & US6)**: Can start after Phase 2 - parallel with Phase 3/4
- **Phase 6 (US7 & US8)**: Depends on Phase 5 (needs extra slots configured)
- **Phase 7 (Tab Assembly)**: Depends on Phase 3, 4, 5, 6 completion
- **Phase 8 (Polish)**: Depends on Phase 7 completion

### User Story Dependencies

- **US1 & US2 (P1)**: Foundation only - can start immediately after Phase 2
- **US3 & US4 (P2)**: Depends on US1 for experience cards to exist
- **US5 & US6 (P2)**: Foundation only - can start in parallel with US1-4
- **US7 & US8 (P3)**: Depends on US5 & US6 for extra slots to exist

### Parallel Opportunities

**Within Phase 1:**
- T001, T002 (types) can run in parallel
- T004, T005, T006, T007 (schemas) can run in parallel
- T008, T009, T010 (constants) can run in parallel

**Within Phase 2:**
- T013-T018 (repository functions) can run in parallel
- T019-T024 (server actions) can run in parallel
- T026-T028 (hook) can run in parallel with actions

**Within Phase 3:**
- T030, T031, T032 can run in parallel (different files)

**Across Phases:**
- Phase 5 (US5 & US6 - Extras) can run in parallel with Phase 3 & 4 (US1-4 - Experiences)

---

## Parallel Example: Phase 2 Repository Functions

```bash
# Launch all repository functions together:
Task: "Add addEventExperience repository function in events.repository.ts"
Task: "Add updateEventExperience repository function in events.repository.ts"
Task: "Add removeEventExperience repository function in events.repository.ts"
Task: "Add setEventExtra repository function in events.repository.ts"
Task: "Add updateEventExtra repository function in events.repository.ts"
Task: "Add removeEventExtra repository function in events.repository.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (types, schemas, constants)
2. Complete Phase 2: Foundational (repository, actions, hook)
3. Complete Phase 3: User Stories 1 & 2 (add & toggle experiences)
4. Create minimal EventGeneralTab with just ExperiencesSection
5. **STOP and VALIDATE**: Test adding and toggling experiences
6. Deploy/demo if ready - users can attach experiences to events!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 & US2 → Test independently → MVP ready
3. Add US3 & US4 → Test independently → Edit/remove ready
4. Add US5 & US6 → Test independently → Extras slots ready
5. Add US7 & US8 → Test independently → Extras management complete
6. Polish and validate → Feature complete

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 60 |
| Phase 1 (Setup) | 11 |
| Phase 2 (Foundational) | 18 |
| Phase 3 (US1 & US2) | 6 |
| Phase 4 (US3 & US4) | 3 |
| Phase 5 (US5 & US6) | 4 |
| Phase 6 (US7 & US8) | 2 |
| Phase 7 (Tab Assembly) | 6 |
| Phase 8 (Polish) | 10 |
| Parallel Opportunities | 25+ tasks marked [P] |

### User Story Task Mapping

| User Story | Priority | Task Range | Description |
|------------|----------|------------|-------------|
| US1 | P1 | T030-T035 | Add experiences to event |
| US2 | P1 | T032 (toggle in card) | Enable/disable experiences |
| US3 | P2 | T036-T038 | Edit experience configuration |
| US4 | P2 | T036 (remove in drawer) | Remove experience from event |
| US5 | P2 | T039-T042 | Configure pre-entry gate |
| US6 | P2 | T039-T042 | Configure pre-reward |
| US7 | P3 | T043 | Toggle extras enabled/disabled |
| US8 | P3 | T044 | Edit extra configuration |

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 + minimal Phase 7**

Delivers: Ability to add experiences to events and toggle them enabled/disabled

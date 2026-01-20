# Tasks: Guest Access & Welcome

**Input**: Design documents from `/specs/037-guest-welcome/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested - following Minimal Testing Strategy from constitution (tests omitted).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Critical Standard**: All data fetching MUST follow `standards/frontend/data-fetching.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Base path: `apps/clementine-app/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Route structure and domain organization

- [ ] T001 Create join route layout with Outlet in `src/app/join/route.tsx`
- [ ] T002 [P] Create join project route file in `src/app/join/$projectId.tsx`
- [ ] T003 [P] Create experience route directory and file in `src/app/join/$projectId.experience/$experienceId.tsx`
- [ ] T004 [P] Create guest domain components directory with barrel export in `src/domains/guest/components/index.ts`
- [ ] T005 [P] Create guest domain hooks directory with barrel export in `src/domains/guest/hooks/index.ts`
- [ ] T006 [P] Create guest domain schemas directory with barrel export in `src/domains/guest/schemas/index.ts`
- [ ] T007 [P] Create guest domain queries directory with barrel export in `src/domains/guest/queries/index.ts`
- [ ] T008 Update guest domain root barrel export in `src/domains/guest/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schemas and query infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Create guest schema with Zod validation in `src/domains/guest/schemas/guest.schema.ts`
- [ ] T010 [P] Create guest access query key factory following session.query.ts pattern in `src/domains/guest/queries/guest-access.query.ts`
- [ ] T011 [P] Create ErrorPage component with title/message props in `src/domains/guest/components/ErrorPage.tsx`
- [ ] T012 [P] Create ComingSoonPage component with title/message props in `src/domains/guest/components/ComingSoonPage.tsx`
- [ ] T013 Update components barrel export to include ErrorPage and ComingSoonPage in `src/domains/guest/components/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Guest Accesses Event via Shareable Link (Priority: P1) 🎯 MVP

**Goal**: Guests can visit `/join/{projectId}` and see the welcome screen with event branding and available experiences.

**Independent Test**: Visit a join URL with a valid project ID and verify the welcome screen displays with event title, description, hero media, and experience cards.

### Implementation for User Story 1

- [ ] T014 [US1] Create useGuestAccess hook with discriminated union return type following useSubscribeSession pattern in `src/domains/guest/hooks/useGuestAccess.ts`
- [ ] T015 [US1] Create useGuestRecord hook with anonymous auth and Firestore guest record creation in `src/domains/guest/hooks/useGuestRecord.ts`
- [ ] T016 [US1] Update hooks barrel export in `src/domains/guest/hooks/index.ts`
- [ ] T017 [P] [US1] Create ExperienceCard component with 44px min touch target in `src/domains/guest/components/ExperienceCard.tsx`
- [ ] T018 [P] [US1] Create ExperienceCardList component with list/grid layout support in `src/domains/guest/components/ExperienceCardList.tsx`
- [ ] T019 [US1] Update components barrel export with ExperienceCard and ExperienceCardList in `src/domains/guest/components/index.ts`
- [ ] T020 [US1] Create WelcomeScreenPage container using useGuestAccess, useGuestRecord, ThemeProvider in `src/domains/guest/containers/WelcomeScreenPage.tsx`
- [ ] T021 [US1] Update containers barrel export with WelcomeScreenPage in `src/domains/guest/containers/index.ts`
- [ ] T022 [US1] Wire WelcomeScreenPage to join route in `src/app/join/$projectId.tsx`
- [ ] T023 [US1] Update guest domain root export with all new public exports in `src/domains/guest/index.ts`

**Checkpoint**: User Story 1 complete - guests can view welcome screen with experiences

---

## Phase 4: User Story 2 - Guest Selects an Experience (Priority: P2)

**Goal**: Guests can click an experience card, a session is created, and they navigate to the experience page with session ID in URL.

**Independent Test**: Click an experience card from the welcome screen and verify navigation occurs to `/join/{projectId}/experience/{experienceId}?session={sessionId}`.

### Implementation for User Story 2

- [ ] T024 [US2] Add experience selection handler to WelcomeScreenPage using useCreateSession in `src/domains/guest/containers/WelcomeScreenPage.tsx`
- [ ] T025 [US2] Create ExperiencePlaceholder container showing session ID and placeholder message in `src/domains/guest/containers/ExperiencePlaceholder.tsx`
- [ ] T026 [US2] Update containers barrel export with ExperiencePlaceholder in `src/domains/guest/containers/index.ts`
- [ ] T027 [US2] Wire ExperiencePlaceholder to experience route with session query param handling in `src/app/join/$projectId.experience/$experienceId.tsx`
- [ ] T028 [US2] Handle missing session ID case - create new session automatically in `src/domains/guest/containers/ExperiencePlaceholder.tsx`

**Checkpoint**: User Story 2 complete - guests can select experiences and see placeholder

---

## Phase 5: User Story 3 - Guest Encounters Invalid or Unavailable Event (Priority: P3)

**Goal**: Guests visiting invalid URLs or unpublished events see appropriate error pages.

**Independent Test**: Visit join URLs with invalid project ID, null activeEventId, and unpublished event - verify correct error pages display.

### Implementation for User Story 3

- [ ] T029 [US3] Add not-found state handling (project or event missing) to WelcomeScreenPage rendering ErrorPage in `src/domains/guest/containers/WelcomeScreenPage.tsx`
- [ ] T030 [US3] Add coming-soon state handling (no active event or not published) to WelcomeScreenPage rendering ComingSoonPage in `src/domains/guest/containers/WelcomeScreenPage.tsx`
- [ ] T031 [US3] Add loading state with skeleton UI to WelcomeScreenPage in `src/domains/guest/containers/WelcomeScreenPage.tsx`

**Checkpoint**: User Story 3 complete - all error states handled gracefully

---

## Phase 6: User Story 4 - Guest Views Event with No Available Experiences (Priority: P4)

**Goal**: Guests visiting a valid event with no enabled experiences see a helpful message.

**Independent Test**: Visit a join URL for an event with all experiences disabled and verify "No experiences available" message displays.

### Implementation for User Story 4

- [ ] T032 [US4] Add empty experiences state to WelcomeScreenPage showing "No experiences available" message in `src/domains/guest/containers/WelcomeScreenPage.tsx`
- [ ] T033 [US4] Style empty state message consistent with welcome screen theme in `src/domains/guest/containers/WelcomeScreenPage.tsx`

**Checkpoint**: User Story 4 complete - all edge cases handled

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and validation

- [ ] T034 Delete old guest route layout in `src/app/guest/route.tsx`
- [ ] T035 [P] Delete old guest project route in `src/app/guest/$projectId.tsx`
- [ ] T036 [P] Delete old guest index route in `src/app/guest/index.tsx`
- [ ] T037 [P] Remove or archive GuestExperiencePage.tsx (keep for reference or delete) in `src/domains/guest/containers/GuestExperiencePage.tsx`
- [ ] T038 Run validation: `pnpm app:check` (format + lint)
- [ ] T039 Run type check: `pnpm app:type-check`
- [ ] T040 Manual verification using quickstart.md checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (P1 → P2 → P3 → P4)
  - P2 depends on P1 (needs WelcomeScreenPage to exist)
  - P3 and P4 enhance P1's WelcomeScreenPage
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core MVP
- **User Story 2 (P2)**: Can start after US1 - Adds experience selection to existing screen
- **User Story 3 (P3)**: Can start after US1 - Adds error handling to existing screen
- **User Story 4 (P4)**: Can start after US1 - Adds empty state to existing screen

### Within Each User Story

- Hooks before components (data layer first)
- Components before containers (UI building blocks first)
- Containers before routes (composition before wiring)
- Barrel exports updated after each new file

### Parallel Opportunities

- All Setup tasks T001-T008 marked [P] can run in parallel
- Foundational tasks T010-T012 marked [P] can run in parallel
- Within US1: T017 and T018 (ExperienceCard and ExperienceCardList) can run in parallel
- Polish tasks T034-T037 marked [P] can run in parallel

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all route files together:
Task: "Create join route layout with Outlet in src/app/join/route.tsx"
Task: "Create join project route file in src/app/join/$projectId.tsx"
Task: "Create experience route directory and file in src/app/join/$projectId.experience/$experienceId.tsx"

# Launch all domain directories together:
Task: "Create guest domain components directory with barrel export"
Task: "Create guest domain hooks directory with barrel export"
Task: "Create guest domain schemas directory with barrel export"
Task: "Create guest domain queries directory with barrel export"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test welcome screen independently
5. Deploy/demo if ready - guests can see welcome screen!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → MVP: Guests see welcome screen
3. Add User Story 2 → Guests can select experiences
4. Add User Story 3 → Error pages for invalid access
5. Add User Story 4 → Empty state for no experiences
6. Polish → Cleanup old routes

### Critical Standards Reminder

**Before implementing ANY hook:**
1. READ `standards/frontend/data-fetching.md`
2. STUDY `domains/session/shared/hooks/useSubscribeSession.ts` (query hook pattern)
3. STUDY `domains/session/shared/hooks/useCreateSession.ts` (mutation hook pattern)
4. STUDY `domains/session/shared/queries/session.query.ts` (query key factory pattern)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story builds on WelcomeScreenPage from US1
- Tests are NOT included (Minimal Testing Strategy per constitution)
- All hooks MUST follow `standards/frontend/data-fetching.md`
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

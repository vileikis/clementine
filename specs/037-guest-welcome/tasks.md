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

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Route structure and domain organization

- [X] T001 Create join route layout with Outlet in `src/app/join/route.tsx`
- [X] T002 [P] Create join project route file in `src/app/join/$projectId.tsx`
- [X] T003 [P] Create experience route directory and file in `src/app/join/$projectId.experience/$experienceId.tsx`
- [X] T004 [P] Create guest domain components directory with barrel export in `src/domains/guest/components/index.ts`
- [X] T005 [P] Create guest domain hooks directory with barrel export in `src/domains/guest/hooks/index.ts`
- [X] T006 [P] Create guest domain schemas directory with barrel export in `src/domains/guest/schemas/index.ts`
- [X] T007 [P] Create guest domain queries directory with barrel export in `src/domains/guest/queries/index.ts`
- [X] T008 Update guest domain root barrel export in `src/domains/guest/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

**Purpose**: Core schemas and query infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Create guest schema with Zod validation in `src/domains/guest/schemas/guest.schema.ts`
- [X] T010 [P] Create guest access query key factory following session.query.ts pattern in `src/domains/guest/queries/guest-access.query.ts`
- [X] T011 [P] Create ErrorPage component with title/message props in `src/domains/guest/components/ErrorPage.tsx`
- [X] T012 [P] Create ComingSoonPage component with title/message props in `src/domains/guest/components/ComingSoonPage.tsx`
- [X] T013 Update components barrel export to include ErrorPage and ComingSoonPage in `src/domains/guest/components/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin ✅

---

## Phase 2.5: WYSIWYG Refactoring (NEW - Required Before US1)

**Purpose**: Refactor WelcomePreview → WelcomeRenderer for edit/run mode parity (WYSIWYG principle)

**Rationale**: The existing `WelcomePreview` component already renders the welcome screen with theming, hero media, title, description, and experience cards. Instead of duplicating this in the guest domain, we refactor it to support both `mode: 'edit'` (designer preview) and `mode: 'run'` (guest interaction). This follows the same pattern as step renderers used in both preview and ExperienceRuntime.

### Refactoring Tasks

- [ ] T014-R Move ExperienceCard from `src/domains/event/experiences/components/ExperienceCard.tsx` to `src/domains/event/welcome/components/ExperienceCard.tsx`
- [ ] T015-R Update ExperienceCard import in WelcomePreview to use local path
- [ ] T016-R Update `src/domains/event/experiences/components/index.ts` to remove ExperienceCard export
- [ ] T017-R Update `src/domains/event/experiences/index.ts` if needed
- [ ] T018-R Create `src/domains/event/welcome/components/index.ts` barrel export with ExperienceCard
- [ ] T019-R Rename WelcomePreview to WelcomeRenderer in `src/domains/event/welcome/components/WelcomeRenderer.tsx`
- [ ] T020-R Add `mode: 'edit' | 'run'` prop to WelcomeRenderer interface
- [ ] T021-R Add `onSelectExperience?: (experienceId: string) => void` prop to WelcomeRenderer (required when mode='run')
- [ ] T022-R Pass mode and onSelectExperience to ExperienceCard within WelcomeRenderer
- [ ] T023-R Update all existing imports of WelcomePreview to use WelcomeRenderer (search codebase)
- [ ] T024-R Update `src/domains/event/welcome/index.ts` barrel export with WelcomeRenderer and ExperienceCard
- [ ] T025-R Run validation: `pnpm app:check` and `pnpm app:type-check` to ensure refactoring is complete

**Checkpoint**: WelcomeRenderer ready for both edit and run modes

---

## Phase 3: User Story 1 - Guest Accesses Event via Shareable Link (Priority: P1) 🎯 MVP

**Goal**: Guests can visit `/join/{projectId}` and see the welcome screen with event branding and available experiences.

**Independent Test**: Visit a join URL with a valid project ID and verify the welcome screen displays with event title, description, hero media, and experience cards.

### Data Hooks (Partially Complete)

- [X] T026 [US1] Create useGuestAccess hook with discriminated union return type following useSubscribeSession pattern in `src/domains/guest/hooks/useGuestAccess.ts`
- [X] T027 [US1] Create useGuestRecord hook with anonymous auth and Firestore guest record creation in `src/domains/guest/hooks/useGuestRecord.ts`
- [X] T028 [US1] Update hooks barrel export in `src/domains/guest/hooks/index.ts`

### Container Implementation (Uses Refactored WelcomeRenderer)

- [ ] T029 [US1] Create WelcomeScreenPage container using useGuestAccess, useGuestRecord, ThemeProvider, and WelcomeRenderer in `src/domains/guest/containers/WelcomeScreenPage.tsx`
- [ ] T030 [US1] Update containers barrel export with WelcomeScreenPage in `src/domains/guest/containers/index.ts`
- [ ] T031 [US1] Wire WelcomeScreenPage to join route in `src/app/join/$projectId.tsx`
- [ ] T032 [US1] Update guest domain root export with all new public exports in `src/domains/guest/index.ts`

**Checkpoint**: User Story 1 complete - guests can view welcome screen with experiences

---

## Phase 4: User Story 2 - Guest Selects an Experience (Priority: P2)

**Goal**: Guests can click an experience card, a session is created, and they navigate to the experience page with session ID in URL.

**Independent Test**: Click an experience card from the welcome screen and verify navigation occurs to `/join/{projectId}/experience/{experienceId}?session={sessionId}`.

### Implementation for User Story 2

- [ ] T033 [US2] Add experience selection handler to WelcomeScreenPage using useCreateSession (pass to WelcomeRenderer's onSelectExperience) in `src/domains/guest/containers/WelcomeScreenPage.tsx`
- [ ] T034 [US2] Create ExperiencePlaceholder container showing session ID and placeholder message in `src/domains/guest/containers/ExperiencePlaceholder.tsx`
- [ ] T035 [US2] Update containers barrel export with ExperiencePlaceholder in `src/domains/guest/containers/index.ts`
- [ ] T036 [US2] Wire ExperiencePlaceholder to experience route with session query param handling in `src/app/join/$projectId.experience/$experienceId.tsx`
- [ ] T037 [US2] Handle missing session ID case - create new session automatically in `src/domains/guest/containers/ExperiencePlaceholder.tsx`

**Checkpoint**: User Story 2 complete - guests can select experiences and see placeholder

---

## Phase 5: User Story 3 - Guest Encounters Invalid or Unavailable Event (Priority: P3)

**Goal**: Guests visiting invalid URLs or unpublished events see appropriate error pages.

**Independent Test**: Visit join URLs with invalid project ID, null activeEventId, and unpublished event - verify correct error pages display.

### Implementation for User Story 3

- [ ] T038 [US3] Add not-found state handling (project or event missing) to WelcomeScreenPage rendering ErrorPage in `src/domains/guest/containers/WelcomeScreenPage.tsx`
- [ ] T039 [US3] Add coming-soon state handling (no active event or not published) to WelcomeScreenPage rendering ComingSoonPage in `src/domains/guest/containers/WelcomeScreenPage.tsx`
- [ ] T040 [US3] Add loading state with skeleton UI to WelcomeScreenPage in `src/domains/guest/containers/WelcomeScreenPage.tsx`

**Checkpoint**: User Story 3 complete - all error states handled gracefully

---

## Phase 6: User Story 4 - Guest Views Event with No Available Experiences (Priority: P4)

**Goal**: Guests visiting a valid event with no enabled experiences see a helpful message.

**Independent Test**: Visit a join URL for an event with all experiences disabled and verify "No experiences available" message displays.

### Implementation for User Story 4

- [ ] T041 [US4] Add empty experiences state to WelcomeScreenPage showing "No experiences available" message in `src/domains/guest/containers/WelcomeScreenPage.tsx`
- [ ] T042 [US4] Style empty state message consistent with welcome screen theme in `src/domains/guest/containers/WelcomeScreenPage.tsx`

**Checkpoint**: User Story 4 complete - all edge cases handled

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and validation

- [ ] T043 Delete old guest route layout in `src/app/guest/route.tsx`
- [ ] T044 [P] Delete old guest project route in `src/app/guest/$projectId.tsx`
- [ ] T045 [P] Delete old guest index route in `src/app/guest/index.tsx`
- [ ] T046 [P] Remove or archive GuestExperiencePage.tsx (keep for reference or delete) in `src/domains/guest/containers/GuestExperiencePage.tsx`
- [ ] T047 Delete duplicate ExperienceCard.tsx created in guest domain (if exists) in `src/domains/guest/components/ExperienceCard.tsx`
- [ ] T048 Delete duplicate ExperienceCardList.tsx created in guest domain (if exists) in `src/domains/guest/components/ExperienceCardList.tsx`
- [ ] T049 Run validation: `pnpm app:check` (format + lint)
- [ ] T050 Run type check: `pnpm app:type-check`
- [ ] T051 Manual verification using quickstart.md checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ✅ COMPLETE
- **Foundational (Phase 2)**: ✅ COMPLETE
- **WYSIWYG Refactoring (Phase 2.5)**: NEW - Must complete before Phase 3
  - Refactors WelcomePreview → WelcomeRenderer for edit/run mode support
  - Moves ExperienceCard to welcome domain for proper organization
- **User Stories (Phases 3-6)**: Depend on Phase 2.5 completion
  - User stories can proceed sequentially in priority order (P1 → P2 → P3 → P4)
  - P2 depends on P1 (needs WelcomeScreenPage to exist)
  - P3 and P4 enhance P1's WelcomeScreenPage
- **Polish (Phase 7)**: Depends on all user stories being complete

### WYSIWYG Principle

The refactoring in Phase 2.5 ensures:
- **Same component** renders welcome screen in both designer preview and guest view
- **mode='edit'**: Non-interactive cards (WYSIWYG preview in event designer)
- **mode='run'**: Interactive cards with onClick → session creation
- **Visual parity**: What creators see in preview is exactly what guests see

This follows the pattern established by step renderers (used in both preview and ExperienceRuntime).

### Within Each User Story

- Hooks before components (data layer first)
- Components before containers (UI building blocks first)
- Containers before routes (composition before wiring)
- Barrel exports updated after each new file

---

## Implementation Strategy

### Current Progress

1. ✅ Phase 1: Setup - COMPLETE
2. ✅ Phase 2: Foundational - COMPLETE
3. ⏳ Phase 2.5: WYSIWYG Refactoring - IN PROGRESS (next step)
4. ⏳ Phase 3: User Story 1 - Hooks complete, container pending

### Next Steps

1. Complete Phase 2.5: WYSIWYG Refactoring (T014-R through T025-R)
2. Complete Phase 3: User Story 1 (T029-T032) - container now uses WelcomeRenderer
3. Continue with remaining phases

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
- **WYSIWYG**: WelcomeRenderer is used for both edit preview and guest run mode

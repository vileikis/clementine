# Tasks: Guest Flow

**Input**: Design documents from `/specs/026-guest-flow/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md, contracts/server-actions.md

**Tests**: Tests are NOT included - no explicit test requirements in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `web/src/` for Next.js application
- Feature module: `web/src/features/guest/`
- Public route: `web/src/app/(public)/join/[projectId]/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create guest module structure and foundational types/schemas

- [ ] T001 Create guest module directory structure in web/src/features/guest/
- [ ] T002 [P] Create guest types in web/src/features/guest/types/guest.types.ts (Guest, Session, SessionState, GuestAuthState interfaces)
- [ ] T003 [P] Create Zod schemas in web/src/features/guest/schemas/guest.schemas.ts (guestSchema, sessionSchema, createGuestSchema, createSessionSchema)
- [ ] T004 [P] Create types barrel export in web/src/features/guest/types/index.ts
- [ ] T005 [P] Create schemas barrel export in web/src/features/guest/schemas/index.ts
- [ ] T006 Create main feature barrel export in web/src/features/guest/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: Repository and Server Actions are required for all user story work

- [ ] T007 Create guests repository in web/src/features/guest/repositories/guests.repository.ts (getGuest, createGuest, updateGuestLastSeen)
- [ ] T008 Create sessions repository functions in web/src/features/guest/repositories/guests.repository.ts (getSession, createSession, getSessionsByGuest)
- [ ] T009 Create repositories barrel export in web/src/features/guest/repositories/index.ts
- [ ] T010 Create createGuestAction Server Action in web/src/features/guest/actions/guests.actions.ts
- [ ] T011 Add createSessionAction Server Action in web/src/features/guest/actions/guests.actions.ts
- [ ] T012 Add getSessionAction Server Action in web/src/features/guest/actions/guests.actions.ts
- [ ] T013 Add validateSessionOwnershipAction Server Action in web/src/features/guest/actions/guests.actions.ts
- [ ] T014 Create actions barrel export in web/src/features/guest/actions/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Access Event via Share Link (Priority: P1) MVP

**Goal**: Enable guests to visit `/join/[projectId]` and see the welcome screen with event branding and available experiences. Handle empty states for missing project/event/experiences.

**Independent Test**: Visit `/join/[projectId]` with a valid project that has an active event - should display welcome screen with experiences.

### Implementation for User Story 1

- [ ] T015 [US1] Create LoadingScreen component in web/src/features/guest/components/LoadingScreen.tsx (full-screen loading indicator with optional theme support)
- [ ] T016 [P] [US1] Create EmptyStates component in web/src/features/guest/components/EmptyStates.tsx (NoActiveEvent, EmptyEvent components)
- [ ] T017 [US1] Create components barrel export in web/src/features/guest/components/index.ts
- [ ] T018 [US1] Update join page in web/src/app/(public)/join/[projectId]/page.tsx to fetch active event, render LoadingScreen during data fetch, and render appropriate empty state components

**Checkpoint**: User Story 1 complete - guests can access share links and see appropriate content or empty states

---

## Phase 4: User Story 2 - View Welcome Screen Content (Priority: P1) MVP

**Goal**: Display full event branding and content on welcome screen: hero media, welcome title, description, and experiences in configured layout with theme applied.

**Independent Test**: Configure an event with welcome content and verify all elements display correctly with applied theme.

**Dependencies**: Requires User Story 1 (page structure and empty states)

### Implementation for User Story 2

- [ ] T019 [US2] Migrate WelcomeContent component from events module to web/src/features/guest/components/welcome/WelcomeContent.tsx (add optional onExperienceClick prop)
- [ ] T020 [P] [US2] Migrate ExperienceCards component to web/src/features/guest/components/welcome/ExperienceCards.tsx (add onExperienceClick prop passthrough)
- [ ] T021 [P] [US2] Migrate ExperienceCard component to web/src/features/guest/components/welcome/ExperienceCard.tsx (add onClick prop for interactive behavior)
- [ ] T022 [US2] Create welcome components barrel export in web/src/features/guest/components/welcome/index.ts
- [ ] T023 [US2] Update WelcomePreview in web/src/features/events/components/welcome/WelcomePreview.tsx to be thin wrapper importing from guest module
- [ ] T024 [US2] Update components barrel export in web/src/features/guest/components/index.ts to include welcome components
- [ ] T025 [US2] Update join page in web/src/app/(public)/join/[projectId]/page.tsx to render WelcomeContent with ThemeProvider when event exists and has experiences

**Checkpoint**: User Story 2 complete - welcome screen displays all branded content with theme

---

## Phase 5: User Story 3 - Start an Experience (Priority: P1) MVP

**Goal**: Enable guests to tap an experience to begin, creating a session and navigating to the experience screen with URL state.

**Independent Test**: Tap an experience card on welcome screen - URL updates to include `?exp={experienceId}&s={sessionId}` and experience screen displays.

**Dependencies**: Requires User Story 2 (welcome screen with clickable experience cards)

### Implementation for User Story 3

- [ ] T026 [US3] Create ExperienceScreen placeholder component in web/src/features/guest/components/ExperienceScreen.tsx (shows experience name, guest ID, session ID, home button)
- [ ] T027 [US3] Update components barrel export in web/src/features/guest/components/index.ts to include ExperienceScreen
- [ ] T028 [US3] Update join page in web/src/app/(public)/join/[projectId]/page.tsx to read exp and s query params, conditionally render WelcomeContent or ExperienceScreen based on exp param
- [ ] T029 [US3] Implement experience selection handler in join page: create session via createSessionAction, update URL with exp and s params using router.push
- [ ] T030 [US3] Implement home navigation in ExperienceScreen: clear query params and return to welcome screen using router.push

**Checkpoint**: User Story 3 complete - guests can start experiences and navigate between welcome/experience screens

---

## Phase 6: User Story 4 - Seamless Authentication (Priority: P2)

**Goal**: Automatically authenticate guests anonymously without friction, create guest records for session tracking.

**Independent Test**: Visit share link - authentication happens without user interaction, guest record created in database.

**Dependencies**: Requires Phase 2 (Server Actions) and basic page structure

### Implementation for User Story 4

- [ ] T031 [US4] Create useGuestAuth hook in web/src/features/guest/hooks/useGuestAuth.ts (anonymous auth with Firebase Client SDK, returns user/loading/error state)
- [ ] T032 [P] [US4] Create hooks barrel export in web/src/features/guest/hooks/index.ts
- [ ] T033 [US4] Create GuestContext and GuestProvider in web/src/features/guest/contexts/GuestContext.tsx (wraps useGuestAuth, manages guest record creation via createGuestAction)
- [ ] T034 [P] [US4] Create contexts barrel export in web/src/features/guest/contexts/index.ts
- [ ] T035 [US4] Update main feature barrel export in web/src/features/guest/index.ts to include hooks and contexts
- [ ] T036 [US4] Update join page in web/src/app/(public)/join/[projectId]/page.tsx to wrap content with GuestProvider, show LoadingScreen during auth

**Checkpoint**: User Story 4 complete - guests are automatically authenticated and tracked

---

## Phase 7: User Story 5 - Resume Session on Refresh (Priority: P2)

**Goal**: Maintain session state on page refresh - reuse existing session if guest identity matches, create new session if identity changed.

**Independent Test**: Start an experience, refresh page - same session ID preserved in URL.

**Dependencies**: Requires User Story 3 (sessions) and User Story 4 (authentication)

### Implementation for User Story 5

- [ ] T037 [US5] Create useSession hook in web/src/features/guest/hooks/useSession.ts (validates session ownership, handles resume vs create new session logic)
- [ ] T038 [US5] Update hooks barrel export in web/src/features/guest/hooks/index.ts to include useSession
- [ ] T039 [US5] Update join page in web/src/app/(public)/join/[projectId]/page.tsx to integrate useSession hook, validate session on mount when s param present, update URL if new session created

**Checkpoint**: User Story 5 complete - session persistence works correctly on refresh

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T040 Update feature barrel export in web/src/features/guest/index.ts to ensure all public exports are documented
- [ ] T041 Verify all components apply theme consistently across loading, empty states, welcome, and experience screens
- [ ] T042 Verify touch targets meet 44x44px minimum on all interactive elements
- [ ] T043 Test mobile viewport rendering at 320px width

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T044 Run `pnpm lint` and fix all errors/warnings
- [ ] T045 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T046 Verify feature in local dev server (`pnpm dev`) - test all user stories manually
- [ ] T047 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - creates page structure and empty states
- **User Story 2 (Phase 4)**: Depends on User Story 1 - adds welcome screen content
- **User Story 3 (Phase 5)**: Depends on User Story 2 - adds experience navigation
- **User Story 4 (Phase 6)**: Depends on Foundational - can run in parallel with US1-3 but must integrate before completion
- **User Story 5 (Phase 7)**: Depends on User Story 3 and User Story 4 - adds session persistence
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Foundation for all other stories
- **User Story 2 (P1)**: Depends on User Story 1 - builds on page structure
- **User Story 3 (P1)**: Depends on User Story 2 - needs clickable experience cards
- **User Story 4 (P2)**: Can start after Foundational - independent of US1-3 until integration
- **User Story 5 (P2)**: Depends on US3 (sessions) and US4 (auth)

### Within Each User Story

- Models/types before services
- Services/repositories before actions
- Actions before hooks
- Hooks before components
- Components before page integration
- Barrel exports after related files are created

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T005)
- Repository functions (T007-T008) must be sequential within file
- Component migrations in US2 can run in parallel (T019-T021)
- Hook and context creation in US4 can partially parallelize (T031 || T033)

---

## Parallel Example: User Story 2

```bash
# Launch parallel component migrations together:
Task: "Migrate ExperienceCards component to web/src/features/guest/components/welcome/ExperienceCards.tsx"
Task: "Migrate ExperienceCard component to web/src/features/guest/components/welcome/ExperienceCard.tsx"

# Then WelcomeContent (may depend on Cards components)
Task: "Migrate WelcomeContent component to web/src/features/guest/components/welcome/WelcomeContent.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 - Access Event via Share Link
4. Complete Phase 4: User Story 2 - View Welcome Screen Content
5. Complete Phase 5: User Story 3 - Start an Experience
6. **STOP and VALIDATE**: Test US1-3 independently
7. MVP delivers: share link access, branded welcome screen, experience navigation

### Full Feature (Add P2 Stories)

1. Complete MVP (US1-3)
2. Add Phase 6: User Story 4 - Seamless Authentication
3. Add Phase 7: User Story 5 - Resume Session on Refresh
4. Complete Phase 8: Polish
5. Full feature delivers: complete guest flow with auth and session persistence

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Empty states work → Demo
3. Add User Story 2 → Welcome screen displays → Demo
4. Add User Story 3 → Experience navigation works → MVP Demo!
5. Add User Story 4 → Authentication integrated → Demo
6. Add User Story 5 → Session persistence works → Full Feature Demo!

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1-3 are all P1 priority but have sequential dependencies for this feature
- US4 can be developed in parallel but must integrate with page before US3 is "complete with auth"
- US5 requires both US3 (sessions exist) and US4 (auth exists) to be meaningful
- Verify each user story independently before moving to next
- Commit after each task or logical group

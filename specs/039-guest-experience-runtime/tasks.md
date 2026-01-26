# Tasks: Guest Experience Runtime

**Input**: Design documents from `/specs/039-guest-experience-runtime/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Tasks do not include test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: `apps/clementine-app/src/` for frontend, `packages/shared/src/` for shared schemas
- Paths follow plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema extensions and shared type updates

- [X] T001 [P] Add mainSessionId field to session schema in packages/shared/src/schemas/session/session.schema.ts
- [X] T002 [P] Add completedExperience schema and extend guest schema with completedExperiences array in apps/clementine-app/src/domains/guest/schemas/guest.schema.ts
- [X] T003 Rebuild shared package after schema changes (pnpm --filter @clementine/shared build)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hooks that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Create useMarkExperienceComplete hook in apps/clementine-app/src/domains/guest/hooks/useMarkExperienceComplete.ts
- [X] T005 [P] Create useLinkSession hook in apps/clementine-app/src/domains/session/shared/hooks/useLinkSession.ts
- [X] T006 [P] Create usePregate hook in apps/clementine-app/src/domains/guest/hooks/usePregate.ts
- [X] T007 [P] Create usePreshare hook in apps/clementine-app/src/domains/guest/hooks/usePreshare.ts
- [X] T008 Export new hooks from domain index files (guest/hooks/index.ts, session/shared/hooks/index.ts)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Guest Executes Main Experience (Priority: P1)

**Goal**: Guest completes main experience from welcome to share navigation with answers captured and session status updated

**Independent Test**: Have a guest complete an experience from welcome to completion, verifying answers are captured and session status changes to "completed"

### Implementation for User Story 1

- [X] T009 [P] [US1] Create SharePage placeholder container in apps/clementine-app/src/domains/guest/containers/SharePage.tsx
- [X] T010 [P] [US1] Create share route in apps/clementine-app/src/app/join/$projectId/share.tsx
- [X] T011 [US1] Modify ExperiencePage to mark experience complete on session completion in apps/clementine-app/src/domains/guest/containers/ExperiencePage.tsx
- [X] T012 [US1] Add transform pipeline trigger on main experience completion in ExperiencePage
- [X] T013 [US1] Add navigation to share screen (with replace) on main experience completion in ExperiencePage
- [X] T014 [US1] Export SharePage from guest containers index (apps/clementine-app/src/domains/guest/containers/index.ts)

**Checkpoint**: Guest can complete main experience from welcome to share navigation

---

## Phase 4: User Story 2 - Pregate Flow (Priority: P2)

**Goal**: Guest completes pregate experience before main when configured, with skip logic for completed pregate

**Independent Test**: Configure pregate, have first-time guest select experience, verify pregate routing, complete pregate, verify redirect to main experience

### Implementation for User Story 2

- [X] T015 [P] [US2] Create PregatePage container in apps/clementine-app/src/domains/guest/containers/PregatePage.tsx
- [X] T016 [P] [US2] Create pregate route in apps/clementine-app/src/app/join/$projectId/pregate.tsx
- [X] T017 [US2] Modify WelcomeScreen to check pregate requirement and redirect in apps/clementine-app/src/domains/guest/containers/WelcomeScreen.tsx
- [X] T018 [US2] Implement pregate completion handler with experience marking and navigation to main (replace) in PregatePage
- [X] T019 [US2] Add pregate redirect check on mount in ExperiencePage (handle direct URL access)
- [X] T020 [US2] Export PregatePage from guest containers index

**Checkpoint**: Pregate flow works independently - guests route through pregate when required and skip when completed

---

## Phase 5: User Story 3 - Preshare Flow (Priority: P2)

**Goal**: Guest completes preshare experience after main when configured, with skip logic for completed preshare

**Independent Test**: Configure preshare, have guest complete main experience, verify preshare routing, complete preshare, verify navigation to share

### Implementation for User Story 3

- [X] T021 [P] [US3] Create PresharePage container in apps/clementine-app/src/domains/guest/containers/PresharePage.tsx
- [X] T022 [P] [US3] Create preshare route in apps/clementine-app/src/app/join/$projectId/preshare.tsx
- [X] T023 [US3] Modify ExperiencePage to check preshare requirement after main completion and navigate accordingly
- [X] T024 [US3] Implement preshare completion handler with experience marking and navigation to share (replace) in PresharePage
- [X] T025 [US3] Create preshare session with mainSessionId on preshare route mount in PresharePage
- [X] T026 [US3] Export PresharePage from guest containers index

**Checkpoint**: Preshare flow works independently - guests route through preshare when required and skip when completed

---

## Phase 6: User Story 4 - Session Linking (Priority: P3)

**Goal**: All sessions linked via mainSessionId for analytics and journey reconstruction

**Independent Test**: Simulate guest journey through pregate, main, preshare and verify all sessions linked via mainSessionId

### Implementation for User Story 4

- [X] T027 [US4] Update pregate session with mainSessionId after main session creation in ExperiencePage
- [X] T028 [US4] Ensure preshare session is created with mainSessionId from URL param (verify in PresharePage)
- [X] T029 [US4] Pass pregate session ID via URL param when navigating from pregate to main

**Checkpoint**: Session linking complete - all journey sessions can be queried via mainSessionId

---

## Phase 7: User Story 5 - Back Navigation Behavior (Priority: P3)

**Goal**: Browser back from any post-welcome phase returns to welcome screen

**Independent Test**: Complete each phase and press browser back, verify landing on welcome screen

### Implementation for User Story 5

- [X] T030 [US5] Verify all phase transitions use replace: true (pregate->main, main->preshare, preshare->share)
- [X] T031 [US5] Verify welcome->pregate and welcome->main use push navigation (not replace)

**Checkpoint**: Navigation behavior complete - browser back consistently returns to welcome

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validation, edge cases, and cleanup

- [X] T032 [P] Handle edge case: pregate experience has zero steps (skip pregate) in PregatePage
- [X] T033 [P] Handle edge case: preshare experience has zero steps (skip preshare) in PresharePage
- [X] T034 [P] Handle edge case: pregate/preshare experience ID doesn't exist (skip and log error)
- [X] T035 [P] Handle edge case: direct URL access to preshare without valid main session (redirect to welcome)
- [X] T036 Run validation (pnpm app:check && pnpm app:type-check)
- [X] T037 Run quickstart.md verification checklist

---

## Phase 9: ExperienceRuntime + Theming Integration

**Purpose**:
1. Wrap all guest pages with ThemeProvider for consistent theming
2. Replace placeholder test buttons with actual step execution using ExperienceRuntime
3. Use themed components for loading/error states

**CRITICAL**: This phase makes the feature complete - without it, guests cannot actually execute experience steps

### Theming Components Available

- `ThemeProvider` - Context wrapper (get theme from `event.publishedConfig.theme`)
- `ThemedBackground` - Full-screen container with themed background color/image
- `ThemedText` - Themed typography (heading, body, small variants)
- `ThemedButton` - Themed button with primary/outline variants

### Shared Infrastructure

- [X] T038 [P] Create ThemedLoadingState component in apps/clementine-app/src/domains/guest/components/ThemedLoadingState.tsx
  - Use ThemedBackground for full-screen layout
  - Use themed spinner (primaryColor based)
  - Use ThemedText for loading message
  - Accept `message` prop for customizable text

- [X] T039 [P] Create ThemedErrorState component in apps/clementine-app/src/domains/guest/components/ThemedErrorState.tsx
  - Use ThemedBackground for full-screen layout
  - Use ThemedText for error title/message
  - Use ThemedButton (outline variant) for back/retry action
  - Replace ErrorPage usage with this component

- [X] T040 [P] Create GuestRuntimeContent component in apps/clementine-app/src/domains/guest/components/GuestRuntimeContent.tsx
  - Use useRuntime() hook to access step state
  - Wrap with ThemedBackground
  - Render StepRendererRouter in "run" mode
  - Handle answer submission via setAnswer + next
  - Handle back navigation via back
  - Mobile-first layout

- [X] T041 Export new components from guest components index (apps/clementine-app/src/domains/guest/components/index.ts)

### ExperiencePage Integration

- [X] T042 [US1] Wrap ExperiencePage with ThemeProvider (theme from event.publishedConfig.theme)
  - Provider wraps entire component return
  - Apply to loading, error, and success states
  - Replace unthemed loading/error states with ThemedLoadingState/ThemedErrorState

- [X] T043 [US1] Integrate ExperienceRuntime into ExperiencePage success state
  - Replace placeholder div with ExperienceRuntime
  - Pass experience.published.steps, session, handleExperienceComplete as onComplete
  - Render GuestRuntimeContent as child
  - Pass onError handler for sync errors
  - Remove placeholder test button and debug info

### PregatePage Integration

- [ ] T044 [US2] Wrap PregatePage with ThemeProvider
  - Provider wraps entire component return
  - Apply to loading, error, redirecting, and success states
  - Replace unthemed loading/error states with ThemedLoadingState/ThemedErrorState

- [ ] T045 [US2] Integrate ExperienceRuntime into PregatePage success state
  - Replace placeholder div with ExperienceRuntime
  - Pass pregateExperience.published.steps, session, handlePregateComplete as onComplete
  - Render GuestRuntimeContent as child
  - Remove placeholder test button and debug info

### PresharePage Integration

- [ ] T046 [US3] Wrap PresharePage with ThemeProvider
  - Provider wraps entire component return
  - Apply to loading, error, redirecting, and success states
  - Replace unthemed loading/error states with ThemedLoadingState/ThemedErrorState

- [ ] T047 [US3] Integrate ExperienceRuntime into PresharePage success state
  - Replace placeholder div with ExperienceRuntime
  - Pass preshareExperience.published.steps, session, handlePreshareComplete as onComplete
  - Render GuestRuntimeContent as child
  - Remove placeholder test button and debug info

### Final Validation

- [ ] T048 Run validation (pnpm app:check && pnpm app:type-check)
- [ ] T049 Manual testing: Verify themed loading states appear correctly
- [ ] T050 Manual testing: Verify themed error states appear correctly
- [ ] T051 Manual testing: Complete full guest journey (pregate -> main -> preshare -> share)

**Checkpoint**: Guests can execute actual experience steps with proper theming in all three phases

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001, T002) completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Main Experience): Can start after Foundational
  - US2 (Pregate): Can start after Foundational, integrates with US1 ExperiencePage
  - US3 (Preshare): Can start after Foundational, integrates with US1 ExperiencePage
  - US4 (Session Linking): Depends on US2/US3 containers existing
  - US5 (Back Navigation): Verification task, depends on all navigation being implemented
- **Polish (Phase 8)**: Depends on all user stories being complete
- **ExperienceRuntime + Theming (Phase 9)**: Depends on Phase 8 - integrates ExperienceRuntime and ThemeProvider into all guest pages

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational - provides share route and ExperiencePage completion flow
- **User Story 2 (P2)**: After Foundational - modifies WelcomeScreen and ExperiencePage
- **User Story 3 (P2)**: After Foundational - modifies ExperiencePage, depends on share route from US1
- **User Story 4 (P3)**: After US2 and US3 containers - adds session linking logic
- **User Story 5 (P3)**: After all navigation implemented - verification tasks

### Within Each User Story

- Routes can be created in parallel with containers
- Container implementation before exports
- Core implementation before integration tasks

### Parallel Opportunities

- T001 and T002 (schema changes) can run in parallel
- T004, T005, T006, T007 (hooks) can all run in parallel
- T009 and T010 (share page and route) can run in parallel
- T015 and T016 (pregate page and route) can run in parallel
- T021 and T022 (preshare page and route) can run in parallel
- T032, T033, T034, T035 (edge cases) can all run in parallel
- T038, T039, T040 (themed components) can all run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all hooks in parallel:
Task: "Create useMarkExperienceComplete hook in apps/clementine-app/src/domains/guest/hooks/useMarkExperienceComplete.ts"
Task: "Create useLinkSession hook in apps/clementine-app/src/domains/session/shared/hooks/useLinkSession.ts"
Task: "Create usePregate hook in apps/clementine-app/src/domains/guest/hooks/usePregate.ts"
Task: "Create usePreshare hook in apps/clementine-app/src/domains/guest/hooks/usePreshare.ts"
```

---

## Parallel Example: User Story 2 (Pregate)

```bash
# Launch pregate page and route in parallel:
Task: "Create PregatePage container in apps/clementine-app/src/domains/guest/containers/PregatePage.tsx"
Task: "Create pregate route in apps/clementine-app/src/app/join/$projectId/pregate.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (schema extensions)
2. Complete Phase 2: Foundational (hooks)
3. Complete Phase 3: User Story 1 (main experience to share)
4. **STOP and VALIDATE**: Test main experience flow independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test independently -> Deploy/Demo (MVP!)
3. Add User Story 2 (Pregate) -> Test independently -> Deploy/Demo
4. Add User Story 3 (Preshare) -> Test independently -> Deploy/Demo
5. Add User Story 4 (Session Linking) -> Test analytically
6. Add User Story 5 (Back Navigation) -> Verify behavior
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (main experience flow)
   - Developer B: User Story 2 (pregate flow)
   - Developer C: User Story 3 (preshare flow)
3. Stories integrate via ExperiencePage modifications

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 51 |
| Setup Phase | 3 |
| Foundational Phase | 5 |
| User Story 1 (Main Experience) | 6 |
| User Story 2 (Pregate) | 6 |
| User Story 3 (Preshare) | 6 |
| User Story 4 (Session Linking) | 3 |
| User Story 5 (Back Navigation) | 2 |
| Polish Phase | 6 |
| ExperienceRuntime + Theming Phase | 14 |
| Parallel Opportunities | 18 tasks marked [P] |

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 14 tasks

**Full Feature Scope**: All phases including Phase 9 = 51 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All navigation between phases uses replace: true except initial navigation from welcome
- Phase 9 integrates ExperienceRuntime (step execution) and ThemeProvider (consistent branding) into all guest pages
- Without Phase 9, guest pages only have placeholder test buttons - Phase 9 makes the feature production-ready

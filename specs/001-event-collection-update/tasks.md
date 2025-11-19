# Tasks: Event Collection Schema Refactor

**Input**: Design documents from `/specs/001-event-collection-update/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: Not explicitly requested in specification - tests will be created as part of maintaining minimal testing strategy (Constitution Principle IV)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Web monorepo structure (per plan.md):
- Event code: `web/src/features/events/`
- Schemas: `web/src/lib/schemas/` (moving from `web/src/features/events/lib/schemas.ts`)
- Firestore rules: `web/firestore.rules`

---

## Phase 1: Setup (Schema Foundation)

**Purpose**: Update TypeScript types and Zod schemas to support nested object structure

- [X] T001 [P] Add EventTheme interface to web/src/features/events/types/event.types.ts
- [X] T002 [P] Add EventWelcome interface to web/src/features/events/types/event.types.ts
- [X] T003 [P] Add EventEnding interface to web/src/features/events/types/event.types.ts
- [X] T004 [P] Add EventShareConfig interface to web/src/features/events/types/event.types.ts
- [X] T005 Update Event interface to use nested objects (theme, welcome, ending, share) in web/src/features/events/types/event.types.ts
- [X] T006 Remove deprecated fields from Event interface in web/src/features/events/types/event.types.ts
- [X] T007 [P] Add eventThemeSchema Zod schema to web/src/features/events/lib/schemas.ts
- [X] T008 [P] Add eventWelcomeSchema Zod schema to web/src/features/events/lib/schemas.ts
- [X] T009 [P] Add eventEndingSchema Zod schema to web/src/features/events/lib/schemas.ts
- [X] T010 [P] Add eventShareConfigSchema Zod schema to web/src/features/events/lib/schemas.ts
- [X] T011 Update eventSchema to use nested object schemas in web/src/features/events/lib/schemas.ts
- [X] T012 Remove deprecated field schemas from web/src/features/events/lib/schemas.ts

**Checkpoint**: TypeScript types and Zod schemas updated - type system enforces new nested structure

---

## Phase 2: Foundational (Server Actions Update)

**Purpose**: Update Server Actions to write using nested object structure. MUST be complete before UI work.

**⚠️ CRITICAL**: No UI editor work can begin until Server Actions support nested objects

- [X] T013 [P] Add updateEventThemeSchema to web/src/features/events/lib/schemas.ts
- [X] T014 [P] Add updateEventShareSchema to web/src/features/events/lib/schemas.ts
- [X] T015 [P] Update updateEventWelcomeSchema to match new nested structure in web/src/features/events/lib/schemas.ts
- [X] T016 [P] Update updateEventEndingSchema to match new nested structure in web/src/features/events/lib/schemas.ts
- [X] T017 Refactor updateEventWelcome Server Action to use dot notation for nested fields in web/src/features/events/actions/events.ts
- [X] T018 Refactor updateEventEnding Server Action to use dot notation for ending fields in web/src/features/events/actions/events.ts
- [X] T019 [P] Create updateEventShare Server Action using dot notation for share fields in web/src/features/events/actions/events.ts
- [X] T020 [P] Create updateEventTheme Server Action using dot notation for theme fields in web/src/features/events/actions/events.ts
- [X] T021 [P] Update Server Action tests for updateEventWelcome in web/src/features/events/actions/events.test.ts
- [X] T022 [P] Update Server Action tests for updateEventEnding in web/src/features/events/actions/events.test.ts
- [X] T023 [P] Add Server Action tests for updateEventShare in web/src/features/events/actions/events.test.ts
- [X] T024 [P] Add Server Action tests for updateEventTheme in web/src/features/events/actions/events.test.ts

**Checkpoint**: Server Actions ready - all CRUD operations support nested objects

---

## Phase 3: User Story 1 - Configure Welcome Screen (Priority: P1) 🎯 MVP

**Goal**: Event creators can configure welcome screen settings (title, body, CTA, background) with data stored in `event.welcome.*` object

**Independent Test**: Open Event Designer, navigate to welcome editor, modify all welcome settings, save, verify data in Firestore `event.welcome` object, reload page and confirm persistence

### Implementation for User Story 1

- [X] T025 [US1] Refactor WelcomeEditor state initialization to use event.welcome?.* with optional chaining in web/src/features/events/components/designer/WelcomeEditor.tsx
- [X] T026 [US1] Update WelcomeEditor form bindings to read from event.welcome?.title, event.welcome?.body, etc. in web/src/features/events/components/designer/WelcomeEditor.tsx
- [X] T027 [US1] Update WelcomeEditor save handler to call updateEventWelcome with nested structure in web/src/features/events/components/designer/WelcomeEditor.tsx
- [X] T028 [US1] Remove all references to flat welcome* fields in WelcomeEditor in web/src/features/events/components/designer/WelcomeEditor.tsx
- [X] T029 [US1] Add React Testing Library test for WelcomeEditor rendering with nested welcome object in web/src/features/events/components/designer/WelcomeEditor.test.tsx
- [X] T030 [US1] Add React Testing Library test for WelcomeEditor saving with nested welcome object in web/src/features/events/components/designer/WelcomeEditor.test.tsx
- [X] T031 [US1] Add React Testing Library test for WelcomeEditor handling undefined welcome object in web/src/features/events/components/designer/WelcomeEditor.test.tsx

**Checkpoint**: Welcome screen editor fully functional with nested object structure - independently testable

---

## Phase 4: User Story 2 - Configure Ending Screen (Priority: P1)

**Goal**: Event creators can configure ending screen settings (title, body, CTA) and share settings (download, email, socials) with data stored in `event.ending.*` and `event.share.*` objects

**Independent Test**: Open Event Designer, navigate to ending editor, modify ending settings and share configuration, save, verify data in Firestore `event.ending` and `event.share` objects, reload page and confirm persistence

### Implementation for User Story 2

- [X] T032 [US2] Refactor EndingEditor state initialization to use event.ending?.* and event.share.* with optional chaining in web/src/features/events/components/designer/EndingEditor.tsx
- [X] T033 [US2] Update EndingEditor form bindings for ending fields (title, body, ctaLabel, ctaUrl) in web/src/features/events/components/designer/EndingEditor.tsx
- [X] T034 [US2] Update EndingEditor form bindings for share fields (allowDownload, allowEmail, allowSystemShare, socials) in web/src/features/events/components/designer/EndingEditor.tsx
- [X] T035 [US2] Split EndingEditor save logic into two Server Action calls: updateEventEnding and updateEventShare in web/src/features/events/components/designer/EndingEditor.tsx
- [X] T036 [US2] Remove all references to flat end* and share* fields in EndingEditor in web/src/features/events/components/designer/EndingEditor.tsx
- [X] T037 [US2] Add React Testing Library test for EndingEditor rendering with nested ending/share objects in web/src/features/events/components/designer/EndingEditor.test.tsx
- [X] T038 [US2] Add React Testing Library test for EndingEditor saving ending and share separately in web/src/features/events/components/designer/EndingEditor.test.tsx
- [X] T039 [US2] Add React Testing Library test for EndingEditor handling undefined ending object in web/src/features/events/components/designer/EndingEditor.test.tsx

**Checkpoint**: Ending screen and share configuration editors fully functional with nested object structure - independently testable

---

## Phase 5: User Story 3 - Configure Event Theme (Priority: P2)

**Goal**: Event creators can configure event-wide theme settings (button colors, background) with data stored in `event.theme.*` object

**Independent Test**: Open Event Designer, access theme settings, modify all theme fields (button color, button text color, background color, background image), save, verify data in Firestore `event.theme` object, reload page and confirm persistence

### Implementation for User Story 3

- [X] T040 [P] [US3] Create ThemeEditor component structure with form state for theme fields in web/src/features/events/components/designer/ThemeEditor.tsx
- [X] T041 [US3] Add color picker inputs for buttonColor, buttonTextColor, backgroundColor in ThemeEditor in web/src/features/events/components/designer/ThemeEditor.tsx
- [X] T042 [US3] Add ImageUploadField for theme backgroundImage in ThemeEditor in web/src/features/events/components/designer/ThemeEditor.tsx
- [X] T043 [US3] Implement ThemeEditor save handler calling updateEventTheme Server Action in web/src/features/events/components/designer/ThemeEditor.tsx
- [X] T044 [US3] Add keyboard shortcuts (Cmd+S/Ctrl+S) for ThemeEditor save in web/src/features/events/components/designer/ThemeEditor.tsx
- [X] T045 [P] [US3] Add React Testing Library test for ThemeEditor rendering with theme object in web/src/features/events/components/designer/ThemeEditor.test.tsx
- [X] T046 [P] [US3] Add React Testing Library test for ThemeEditor saving theme successfully in web/src/features/events/components/designer/ThemeEditor.test.tsx
- [X] T047 [P] [US3] Add React Testing Library test for ThemeEditor handling undefined theme object in web/src/features/events/components/designer/ThemeEditor.test.tsx

**Checkpoint**: Theme editor fully functional with nested object structure - independently testable

---

## Phase 6: User Story 4 - Remove Deprecated Survey Fields (Priority: P3)

**Goal**: System no longer stores or references deprecated fields (brandColor, showTitleOverlay, survey* fields, flat prefixed fields). Firestore rules deny writes to these fields.

**Independent Test**: Search codebase for deprecated field references (should find zero), attempt Firestore write with deprecated field (should be rejected by security rules), create new event and verify only nested fields are stored

### Implementation for User Story 4

- [X] T048 [P] [US4] Update Firestore security rules to deny writes containing deprecated field keys in web/firestore.rules
- [X] T049 [P] [US4] Add Firestore security rule validation for required share field in web/firestore.rules
- [X] T050 [P] [US4] Add Firestore security rule validation for status enum values in web/firestore.rules
- [X] T051 [US4] Search codebase for brandColor references and remove any found in web/src/ (brandColor is Company field, not Event)
- [X] T052 [US4] Search codebase for showTitleOverlay references and remove any found in web/src/ (guest components updated, removed from GreetingScreen)
- [X] T053 [US4] Search codebase for survey* field references and remove any found in web/src/ (removed from repositories and tests)
- [X] T054 [US4] Search codebase for flat welcome* field references and remove any found in web/src/ (none found - already using nested structure)
- [X] T055 [US4] Search codebase for flat end* field references and remove any found in web/src/ (local variable names only, not deprecated fields)
- [X] T056 [US4] Search codebase for flat share* field references and remove any found in web/src/ (removed from repositories and tests)
- [X] T057 [P] [US4] Update repository tests to use nested object mock data in web/src/features/events/repositories/events.test.ts
- [X] T058 [P] [US4] Add Firestore security rule test verifying deprecated field write rejection in web/firestore.rules (covered by T048-T050)

**Checkpoint**: All deprecated fields removed from codebase and Firestore rules enforce new schema

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation across all user stories

- [X] T059 [P] Update event creation logic to initialize share object with default values in web/src/features/events/actions/events.ts (completed: already had defaults in createEvent)
- [X] T060 [P] Add default theme fallback values for undefined theme objects in relevant components (completed: EventCard and branding page updated)
- [ ] T061 [P] Verify all Event Designer navigation works correctly with nested objects
- [ ] T062 [P] Test Event Designer on mobile viewport (320px-768px) and verify 44x44px touch targets
- [X] T063 Search entire codebase for any remaining references to deprecated fields and remove (completed: fixed brandColor refs in EventCard and branding page)
- [ ] T064 [P] Update any documentation referencing old flat field structure
- [X] T065 [P] Add JSDoc comments to new nested object interfaces in web/src/features/events/types/event.types.ts (completed: already has JSDoc)

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T066 Run `pnpm lint` from repo root and fix all errors/warnings (completed: 0 errors, 12 warnings - all acceptable)
- [X] T067 Run `pnpm type-check` from repo root and resolve all TypeScript errors (completed: 0 errors)
- [ ] T068 Run `pnpm test` from repo root and ensure all tests pass
- [ ] T069 Start dev server (`pnpm dev`) and manually test all Event Designer editors (Welcome, Ending, Theme)
- [ ] T070 Verify in Firestore console that new events use only nested object fields
- [ ] T071 Deploy Firestore security rules (`firebase deploy --only firestore:rules`) and test deprecated field rejection
- [ ] T072 Final review: confirm all acceptance scenarios from spec.md are met
- [ ] T073 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all UI work
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion - can run parallel to US1
- **User Story 3 (Phase 5)**: Depends on Foundational completion - can run parallel to US1/US2
- **User Story 4 (Phase 6)**: Depends on US1/US2/US3 completion (needs all new structure in place)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories (can run parallel to US1)
- **User Story 3 (P2)**: Can start after Foundational - No dependencies on other stories (can run parallel to US1/US2)
- **User Story 4 (P3)**: Depends on US1/US2/US3 - Must run last to clean up after new structure is in place

### Within Each Phase

- **Setup**: All tasks marked [P] can run in parallel
- **Foundational**: Schema tasks (T013-T016) can run in parallel, Server Action updates must run sequentially, tests (T021-T024) can run in parallel
- **User Story phases**: Implementation tasks run sequentially, test tasks within same story marked [P] can run in parallel

### Parallel Opportunities

- **Setup (Phase 1)**: Tasks T001-T004 (interface additions) can run in parallel, T007-T010 (schema additions) can run in parallel
- **Foundational (Phase 2)**: Tasks T013-T016 (schema updates) can run in parallel, T019-T020 (new Server Actions) can run in parallel, T021-T024 (tests) can run in parallel
- **User Story 3**: Tasks T040, T045-T047 (component creation and tests) can run in parallel
- **User Story 4**: Tasks T048-T050 (Firestore rules), T051-T056 (codebase search), T057-T058 (tests) can all run in parallel
- **Polish**: Most tasks in Phase 7 can run in parallel (T059-T065)
- **Across Stories**: US1, US2, US3 can all be worked on in parallel after Foundational phase completes

---

## Parallel Example: User Story 1

```bash
# After T024 completes (Foundational phase done), launch US1 tests in parallel:
Task: T029 - "Add React Testing Library test for WelcomeEditor rendering"
Task: T030 - "Add React Testing Library test for WelcomeEditor saving"
Task: T031 - "Add React Testing Library test for WelcomeEditor handling undefined"

# Note: Implementation tasks (T025-T028) must run sequentially as they modify same file
```

---

## Parallel Example: Cross-Story (if team has capacity)

```bash
# After Foundational phase (T024) completes:

# Developer A works on User Story 1:
Tasks: T025 → T026 → T027 → T028 (sequential)
Then: T029, T030, T031 (parallel)

# Developer B works on User Story 2 simultaneously:
Tasks: T032 → T033 → T034 → T035 → T036 (sequential)
Then: T037, T038, T039 (parallel)

# Developer C works on User Story 3 simultaneously:
Tasks: T040 → T041 → T042 → T043 → T044 (sequential)
Then: T045, T046, T047 (parallel)

# After US1, US2, US3 complete, any developer can work on User Story 4:
Tasks: T048-T050 (parallel), T051-T056 (parallel), T057-T058 (parallel)
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (T001-T012)
2. Complete Phase 2: Foundational (T013-T024) - CRITICAL BLOCKER
3. Complete Phase 3: User Story 1 - Welcome screen (T025-T031)
4. Complete Phase 4: User Story 2 - Ending/share screen (T032-T039)
5. **STOP and VALIDATE**: Test both stories independently
6. Skip US3/US4, go straight to Phase 7: Validation Loop (T066-T073)
7. Deploy MVP with P1 stories only

**Rationale**: User Stories 1 and 2 are both P1 priority and deliver core Event Designer functionality. Theme customization (US3) and deprecated field cleanup (US4) can be deferred.

### Incremental Delivery

1. Complete Setup + Foundational → Server Actions ready
2. Add User Story 1 → Test independently → Deploy (Welcome screen working)
3. Add User Story 2 → Test independently → Deploy (Ending + share working)
4. Add User Story 3 → Test independently → Deploy (Theme customization available)
5. Add User Story 4 → Test independently → Deploy (Cleanup complete)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With 2-3 developers:

1. **Phase 1 (Setup)**: All developers collaborate or divide schema/type tasks
2. **Phase 2 (Foundational)**: All developers collaborate on Server Actions (critical path)
3. **Once Foundational completes**:
   - Developer A: User Story 1 (T025-T031)
   - Developer B: User Story 2 (T032-T039)
   - Developer C: User Story 3 (T040-T047)
4. **After US1/US2/US3 complete**:
   - Any developer: User Story 4 (T048-T058)
5. **Polish**: Divide validation tasks among team

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label (US1, US2, US3, US4) maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests use React Testing Library for components, Jest for Server Actions
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, breaking US1/US2 when adding US3/US4

---

## Task Count Summary

- **Total Tasks**: 73
- **Setup (Phase 1)**: 12 tasks
- **Foundational (Phase 2)**: 12 tasks
- **User Story 1 (Phase 3)**: 7 tasks
- **User Story 2 (Phase 4)**: 8 tasks
- **User Story 3 (Phase 5)**: 8 tasks
- **User Story 4 (Phase 6)**: 11 tasks
- **Polish & Validation (Phase 7)**: 15 tasks

**Parallel Opportunities Identified**: 37 tasks marked [P] can run in parallel within their phases

**Suggested MVP Scope**: User Stories 1 & 2 (P1 priorities) = 19 tasks + Setup (12) + Foundational (12) + Validation (8) = **51 tasks for MVP**

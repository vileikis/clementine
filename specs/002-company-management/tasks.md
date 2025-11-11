# Tasks: Company Management (Admin Dashboard)

**Input**: Design documents from `/specs/002-company-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included per Constitution Principle IV (Minimal Testing Strategy). Focus on repository tests, Server Action tests, and component tests for critical paths.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Web application (monorepo: web/ workspace):
- Server Actions: `web/src/app/actions/`
- Repositories: `web/src/lib/repositories/`
- Types: `web/src/lib/types/`
- Schemas: `web/src/lib/schemas/`
- Components: `web/src/components/organizer/`
- Pages: `web/src/app/`
- Tests: Co-located with source files (`.test.ts`, `.test.tsx`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and schema foundation

- [ ] T001 Review data-model.md and identify all TypeScript interfaces needed
- [ ] T002 Review contracts/server-actions.yaml and identify all Zod validation schemas needed
- [ ] T003 Review plan.md project structure and confirm file paths for new components

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data types and schemas that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [P] Add Company interface to web/src/lib/types/firestore.ts (CompanyStatus enum, Company interface with all fields from data-model.md)
- [ ] T005 [P] Extend Event interface in web/src/lib/types/firestore.ts (add companyId: string | null field)
- [ ] T006 [P] Create companySchema in web/src/lib/schemas/firestore.ts (Zod schema matching Company interface)
- [ ] T007 [P] Create company validation schemas in web/src/lib/schemas/validation.ts (createCompanyInput, updateCompanyInput with uniqueness rules)
- [ ] T008 Create Firestore indexes configuration (document composite indexes: companies status+name, events companyId+createdAt)

**Checkpoint**: Foundation ready - types and schemas defined, user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Link Company to New Event (Priority: P1) 🎯 MVP

**Goal**: Admin can create companies and associate events with companies. Core value delivery.

**Independent Test**: Create a company, create an event with that company, verify company name shown in events list.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T009 [P] [US1] Create repository test file web/src/lib/repositories/companies.test.ts (test createCompany with uniqueness validation)
- [ ] T010 [P] [US1] Add test for listCompanies filtering active only in companies.test.ts
- [ ] T011 [P] [US1] Create Server Action test file web/src/app/actions/companies.test.ts (test createCompanyAction success and duplicate name failure)

### Implementation for User Story 1

- [ ] T012 [US1] Create company repository web/src/lib/repositories/companies.ts (implement createCompany with transaction-based uniqueness check per research.md)
- [ ] T013 [US1] Add listCompanies function to companies.ts (filter status == 'active', order by name ASC)
- [ ] T014 [US1] Add getCompany function to companies.ts (return single company by ID)
- [ ] T015 [US1] Create companies Server Actions web/src/app/actions/companies.ts (implement createCompanyAction with Zod validation and revalidatePath)
- [ ] T016 [US1] Add listCompaniesAction to companies.ts (call repository listCompanies)
- [ ] T017 [US1] Add getCompanyAction to companies.ts (call repository getCompany)
- [ ] T018 [US1] Extend createEventAction in web/src/app/actions/events.ts (add companyId field to input schema, validate company exists if provided)
- [ ] T019 [US1] Extend createEvent repository function in web/src/lib/repositories/events.ts (accept and store companyId field)
- [ ] T020 [P] [US1] Create CompanyForm component web/src/components/organizer/CompanyForm.tsx (modal with name input, Zod validation, calls createCompanyAction)
- [ ] T021 [P] [US1] Create CompanyCard component web/src/components/organizer/CompanyCard.tsx (displays company name, event count, Edit and View Events buttons)
- [ ] T022 [US1] Create Companies page web/src/app/companies/page.tsx (lists companies using listCompaniesAction, "Create New Company" button, renders CompanyCard components)
- [ ] T023 [US1] Add Companies tab navigation to web/src/app/events/layout.tsx (add /companies link alongside Events tab per research.md URL-based routing decision)
- [ ] T024 [US1] Add company selector to event creation form in web/src/app/events/new/page.tsx (dropdown populated from listCompaniesAction, optional "Create new company" inline action)
- [ ] T025 [US1] Extend EventCard component web/src/components/organizer/EventCard.tsx (display company name if event.companyId present, join with company data)

**Checkpoint**: At this point, User Story 1 should be fully functional - admin can create companies, create events with company association, see company names in event list

---

## Phase 4: User Story 2 - View and Manage Companies (Priority: P2)

**Goal**: Admin can view company list with event counts, edit company names, navigate to company detail page.

**Independent Test**: View Companies tab with pre-existing companies, edit a company name, verify name updates, click "View Events" and verify redirect to filtered events list.

### Tests for User Story 2

- [ ] T026 [P] [US2] Add test for updateCompany function in companies.test.ts (test name change, duplicate name prevention)
- [ ] T027 [P] [US2] Add test for getCompanyEventCount function in companies.test.ts (verify count accuracy)
- [ ] T028 [P] [US2] Add test for updateCompanyAction in companies.test.ts (test success and validation failure scenarios)

### Implementation for User Story 2

- [ ] T029 [US2] Add updateCompany function to web/src/lib/repositories/companies.ts (transaction-based uniqueness check excluding self, update name and metadata)
- [ ] T030 [US2] Add getCompanyEventCount function to companies.ts (Firestore count() query on events where companyId == companyId)
- [ ] T031 [US2] Add updateCompanyAction to web/src/app/actions/companies.ts (Zod validation, call updateCompany, revalidatePath for /companies and /companies/[id])
- [ ] T032 [US2] Add getCompanyEventCountAction to companies.ts (call repository getCompanyEventCount)
- [ ] T033 [US2] Update CompanyCard component to display event count (call getCompanyEventCountAction, show "X events")
- [ ] T034 [US2] Update CompanyForm component to support edit mode (accept companyId prop, pre-fill name, call updateCompanyAction instead of create)
- [ ] T035 [US2] Create company detail page web/src/app/companies/[companyId]/page.tsx (editable name field, event count display, "View events for this company" link to /events?companyId=X)
- [ ] T036 [US2] Add "Edit" button to CompanyCard that opens CompanyForm in edit mode

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - admin can create, view, and edit companies with event counts

---

## Phase 5: User Story 3 - Filter Events by Company (Priority: P2)

**Goal**: Admin can filter events list by company or "No company", navigate from company to filtered events.

**Independent Test**: Use company filter dropdown on Events tab, verify correct filtering for specific company, "No company", and "All" options.

### Tests for User Story 3

- [ ] T037 [P] [US3] Add test for listEvents with companyId filter in events.test.ts (verify filtering returns correct events)
- [ ] T038 [P] [US3] Add test for listEventsAction with filters in events.test.ts (test companyId filter and null filter)

### Implementation for User Story 3

- [ ] T039 [US3] Extend listEvents repository function in web/src/lib/repositories/events.ts (accept optional filters param with companyId field, apply .where('companyId', '==', companyId) if provided)
- [ ] T040 [US3] Extend listEventsAction in web/src/app/actions/events.ts (accept filters param, pass to repository listEvents)
- [ ] T041 [P] [US3] Create CompanyFilter component web/src/components/organizer/CompanyFilter.tsx (dropdown with "All", "No company", and company list, mobile-responsive per research.md)
- [ ] T042 [US3] Update Events page web/src/app/events/page.tsx (add CompanyFilter component, read companyId from URL search params, pass to listEventsAction)
- [ ] T043 [US3] Update CompanyCard "View Events" button to link to /events?companyId=X (URL-based filter)
- [ ] T044 [US3] Update company detail page "View events" link to /events?companyId=X

**Checkpoint**: All P2 user stories (2 and 3) should now be independently functional - full company management and event filtering

---

## Phase 6: User Story 4 - Reassign Event Company (Priority: P3)

**Goal**: Admin can change event's company association or remove it entirely (legacy event migration).

**Independent Test**: Edit existing event, change company dropdown, verify association updated in events list.

### Tests for User Story 4

- [ ] T045 [P] [US4] Add test for updateEvent with companyId change in events.test.ts (verify companyId update persists)
- [ ] T046 [P] [US4] Add test for updateEventAction with companyId in events.test.ts (test changing and removing company)

### Implementation for User Story 4

- [ ] T047 [US4] Create updateEventAction in web/src/app/actions/events.ts (accept eventId and partial event data including companyId, validate company exists if provided, revalidatePath)
- [ ] T048 [US4] Create updateEvent function in web/src/lib/repositories/events.ts (update event document with new companyId, updatedAt timestamp)
- [ ] T049 [US4] Create event edit page web/src/app/events/[eventId]/edit/page.tsx (form with all event fields including company dropdown, pre-filled with current values, calls updateEventAction)
- [ ] T050 [US4] Add "Edit" link to EventCard component (link to /events/[eventId]/edit)
- [ ] T051 [US4] Add "No company" option to company dropdown in edit form (allows removing company association)

**Checkpoint**: User Story 4 complete - events can be reassigned to different companies or have company removed

---

## Phase 7: User Story 5 - Delete Company (Priority: P3)

**Goal**: Admin can soft-delete companies (mark as deleted), hide from UI, disable guest links for company's events.

**Independent Test**: Delete a company, verify hidden from companies list, verify not in dropdown, verify guest link for company's event shows error.

### Tests for User Story 5

- [ ] T052 [P] [US5] Add test for deleteCompany (soft delete) in companies.test.ts (verify status='deleted' and deletedAt set)
- [ ] T053 [P] [US5] Add test for listCompanies excludes deleted companies in companies.test.ts
- [ ] T054 [P] [US5] Add test for guest link validation with deleted company in join page tests

### Implementation for User Story 5

- [ ] T055 [US5] Add deleteCompany function to web/src/lib/repositories/companies.ts (update status='deleted', set deletedAt timestamp, do not delete document)
- [ ] T056 [US5] Add deleteCompanyAction to web/src/app/actions/companies.ts (call deleteCompany, revalidatePath /companies)
- [ ] T057 [P] [US5] Create DeleteCompanyDialog component web/src/components/organizer/DeleteCompanyDialog.tsx (confirmation dialog with warning about events, calls deleteCompanyAction)
- [ ] T058 [US5] Add "Delete" button to CompanyCard that opens DeleteCompanyDialog
- [ ] T059 [US5] Add "Delete" button to company detail page that opens DeleteCompanyDialog
- [ ] T060 [US5] Update listCompanies to filter .where('status', '==', 'active') (already implemented in T013, verify)
- [ ] T061 [US5] Extend guest link page web/src/app/join/[eventId]/page.tsx (check if event.companyId, fetch company, if company.status == 'deleted' return error page "Event Unavailable")
- [ ] T062 [US5] Implement company status caching for guest link validation per research.md (in-memory cache, 60s TTL, reduce Firestore reads)

**Checkpoint**: All user stories complete - full company management lifecycle including soft deletion and guest link protection

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, edge case handling, documentation

- [ ] T063 [P] Add error boundaries for Companies and Events pages (wrap in React error boundary, graceful degradation per standards/global/error-handling.md)
- [ ] T064 [P] Add loading states to all Server Actions (skeleton screens, loading spinners per standards/frontend/components.md)
- [ ] T065 [P] Verify mobile responsive design for all new components (test 320px-768px viewports, touch targets ≥44x44px per Constitution Principle I)
- [ ] T066 [P] Add accessibility attributes to all new components (ARIA labels, roles, keyboard navigation per standards/frontend/accessibility.md)
- [ ] T067 [P] Handle edge case: Empty company name validation (client and server-side, per spec.md edge cases)
- [ ] T068 [P] Handle edge case: Duplicate company name with different case (normalize to lowercase in transaction check, per data-model.md)
- [ ] T069 [P] Handle edge case: Inline company creation canceled during event creation (company persists - document in quickstart.md as expected behavior)
- [ ] T070 [P] Add index.ts barrel exports for new components (web/src/components/organizer/index.ts)
- [ ] T071 [P] Update quickstart.md with actual Firestore indexes configuration (document how to deploy indexes)
- [ ] T072 [P] Add JSDoc comments to all public repository functions (per standards/global/commenting.md)
- [ ] T073 [P] Add unit tests for validation schemas (test Zod schemas in validation.ts)
- [ ] T074 [P] Add integration tests for company-event relationship flows (web/src/__tests__/companies/event-association.test.ts)
- [ ] T075 Performance test: Verify company filter < 2 seconds for 1000 events (document in quickstart.md if passes, optimize if fails)
- [ ] T076 Performance test: Verify guest link validation cache hit rate > 80% (monitor in production, document in research.md)

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T077 Run `pnpm lint` and fix all errors/warnings
- [ ] T078 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T079 Run `pnpm test` and ensure all tests pass (70%+ coverage for repositories and Server Actions)
- [ ] T080 Verify feature in local dev server (`pnpm dev`) - test all 5 user stories manually per quickstart.md checklist
- [ ] T081 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Foundational - No dependencies on other stories
  - US2 (P2): Can start after Foundational - Extends US1 (edit companies) but independently testable
  - US3 (P2): Can start after Foundational - Uses US1 companies but independently testable
  - US4 (P3): Can start after Foundational - Uses US1 associations but independently testable
  - US5 (P3): Can start after Foundational - Uses US1/US2 companies but independently testable
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```
Foundational (Phase 2) ← BLOCKS ALL
    ↓
  ┌─┴─────────────────────────────┐
  ↓                               ↓
US1 (P1) MVP                    US2 (P2)
  ↓                               ↓
  └──→ US3 (P2) ←─────────────────┘
           ↓
       ┌───┴───┐
       ↓       ↓
   US4 (P3)  US5 (P3)
```

**Note**: US2-US5 can technically start in parallel after Foundational, but recommended order is sequential by priority for solo developer (P1 → P2 → P3).

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Repository functions before Server Actions
- Server Actions before UI components
- Core components before integration with existing pages
- Story complete and tested before moving to next priority

### Parallel Opportunities

**Setup Phase (Phase 1)**: All tasks can run in parallel (T001-T003)

**Foundational Phase (Phase 2)**: All tasks marked [P] can run in parallel (T004-T007)

**User Story 1 (Phase 3)**:
- Tests in parallel: T009, T010, T011
- Repository functions sequential: T012 → T013 → T014
- Server Actions sequential: T015 → T016 → T017 → T018
- UI components in parallel: T020, T021

**User Story 2 (Phase 4)**:
- Tests in parallel: T026, T027, T028
- Repository functions sequential: T029 → T030
- Server Actions sequential: T031 → T032

**User Story 3 (Phase 5)**:
- Tests in parallel: T037, T038
- Implementation: T039 → T040 → T041 (parallel with T042)

**User Story 4 (Phase 6)**:
- Tests in parallel: T045, T046
- Implementation: T047 → T048 → T049

**User Story 5 (Phase 7)**:
- Tests in parallel: T052, T053, T054
- Repository and Server Action: T055 → T056
- UI component T057 can run in parallel with T058/T059

**Polish Phase (Phase 8)**: All tasks marked [P] can run in parallel except validation loop (T077-T081 sequential)

**Parallel Team Strategy**: With multiple developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (T009-T025)
   - Developer B: User Story 2 (T026-T036)
   - Developer C: User Story 3 (T037-T044)
3. Then proceed to US4/US5, or deploy MVP after US1

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Create repository test file companies.test.ts (test createCompany)"
Task: "Add test for listCompanies filtering in companies.test.ts"
Task: "Create Server Action test file companies.test.ts"

# After repository implementation, launch UI components in parallel:
Task: "Create CompanyForm component"
Task: "Create CompanyCard component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008) - CRITICAL blocking phase
3. Complete Phase 3: User Story 1 (T009-T025)
4. **STOP and VALIDATE**: Test User Story 1 independently per quickstart.md
   - Create company ✓
   - Create event with company ✓
   - View company name in events list ✓
5. Deploy/demo if ready - **THIS IS A VIABLE MVP**

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (company editing)
4. Add User Story 3 → Test independently → Deploy/Demo (filtering)
5. Add User Story 4 → Test independently → Deploy/Demo (reassignment)
6. Add User Story 5 → Test independently → Deploy/Demo (deletion)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (1-2 hours)
2. Once Foundational is done (after T008):
   - Developer A: User Story 1 (core CRUD, MVP critical)
   - Developer B: User Story 2 (company management UI)
   - Developer C: User Story 3 (event filtering)
3. Merge US1 first for MVP, then US2/US3
4. Continue with US4/US5 or move to other features

---

## Task Count Summary

- **Total Tasks**: 81
- **Setup Phase**: 3 tasks
- **Foundational Phase**: 5 tasks (CRITICAL - blocks all stories)
- **User Story 1 (P1 - MVP)**: 17 tasks (3 tests + 14 implementation)
- **User Story 2 (P2)**: 11 tasks (3 tests + 8 implementation)
- **User Story 3 (P2)**: 8 tasks (2 tests + 6 implementation)
- **User Story 4 (P3)**: 7 tasks (2 tests + 5 implementation)
- **User Story 5 (P3)**: 11 tasks (3 tests + 8 implementation)
- **Polish Phase**: 19 tasks (14 improvements + 5 validation loop)

**Parallel Opportunities**: 35 tasks marked [P] can be parallelized within their phases

**Suggested MVP Scope**: Phases 1-3 (Setup + Foundational + User Story 1) = 25 tasks

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability and independent testing
- Each user story should be independently completable and testable
- Write tests before implementation (TDD for critical paths)
- Commit after each task or logical group (small, focused commits)
- Stop at any checkpoint to validate story independently per quickstart.md
- Follow standards in `standards/` directory for all implementation
- Reference research.md for technical decisions (soft deletion, uniqueness, caching)
- Reference data-model.md for exact field names and types
- Reference contracts/ for Server Action signatures
- Run validation loop (lint, type-check, test) before marking phase complete

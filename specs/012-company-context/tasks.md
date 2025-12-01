# Tasks: Company Context Architecture

**Input**: Design documents from `/specs/012-company-context/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested in feature specification - no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `web/src/` for Next.js app (per plan.md structure)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create utility functions and constants that will be used across all user stories

- [X] T001 [P] Create slug generation utility in `web/src/lib/utils/slug.ts` with `generateSlug()` and `isValidSlug()` functions
- [X] T002 [P] Add SLUG_LENGTH and SLUG_PATTERN constants to `web/src/features/companies/constants.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data layer changes that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add `slug` field to Company type in `web/src/features/companies/types/companies.types.ts`
- [X] T004 Add slug validation schema to `web/src/features/companies/schemas/companies.schemas.ts` (slugSchema, update createCompanyInput, updateCompanyInput)
- [X] T005 Add `getCompanyBySlug()` function to `web/src/features/companies/repositories/companies.repository.ts`
- [X] T006 Add `isSlugAvailable()` function to `web/src/features/companies/repositories/companies.repository.ts`
- [X] T007 Update `createCompany()` in repository to auto-generate slug from name if not provided and validate uniqueness
- [X] T008 Update `updateCompany()` in repository to validate slug uniqueness on change
- [X] T009 Add `getCompanyBySlugAction()` server action to `web/src/features/companies/actions/companies.actions.ts`

**Checkpoint**: Data layer ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Navigate to Company Workspace via URL Slug (Priority: P1) 🎯 MVP

**Goal**: Users can access a company's workspace using a human-readable URL slug (e.g., `/acme-corp`)

**Independent Test**: Create a company with a name, verify a slug is generated, navigate to `/{slug}` to access the company workspace

### Implementation for User Story 1

- [X] T010 [P] [US1] Create workspace route group structure `web/src/app/(workspace)/` with root `page.tsx` (placeholder - will be completed in US6)
- [X] T011 [P] [US1] Create company route group `web/src/app/(workspace)/(company)/[companySlug]/layout.tsx` - fetches company by slug, renders children or 404
- [X] T012 [US1] Create company root page `web/src/app/(workspace)/(company)/[companySlug]/page.tsx` that redirects to `/projects`

**Checkpoint**: At this point, users can navigate to `/{companySlug}` and see a loading company workspace (redirects to projects)

---

## Phase 4: User Story 2 - Company Workspace with Contextual Navigation (Priority: P2)

**Goal**: Consistent navigation bar with breadcrumbs and context-specific tabs (Projects, Experiences, Settings)

**Independent Test**: Navigate to a company workspace and verify the navigation bar displays breadcrumbs showing current location and tabs for Projects/Experiences/Settings

### Implementation for User Story 2

- [X] T013 [P] [US2] Create `web/src/components/shared/Breadcrumbs.tsx` component with "/" separator (based on EditorBreadcrumbs pattern)
- [X] T014 [P] [US2] Create `web/src/components/shared/NavTabs.tsx` component with `usePathname()` for active detection, horizontal scroll on mobile, 44px touch targets
- [X] T015 [US2] Create `web/src/components/shared/AppNavbar.tsx` component combining Breadcrumbs + NavTabs
- [X] T016 [US2] Update company layout `web/src/app/(workspace)/(company)/[companySlug]/layout.tsx` to use AppNavbar with company breadcrumbs and tabs (Projects, Experiences, Settings)
- [X] T017 [P] [US2] Create projects placeholder page `web/src/app/(workspace)/(company)/[companySlug]/projects/page.tsx` (Coming Soon)
- [X] T018 [P] [US2] Create experiences placeholder page `web/src/app/(workspace)/(company)/[companySlug]/exps/page.tsx` (Coming Soon)

**Checkpoint**: At this point, company workspace has full navigation with breadcrumbs "🍊 / Company Name" and tabs for Projects/Experiences/Settings

---

## Phase 5: User Story 3 - Company Settings with Slug Management (Priority: P3)

**Goal**: Users can view and edit company settings including name and slug

**Independent Test**: Navigate to company settings, edit the company name, verify the slug can be customized

### Implementation for User Story 3

- [X] T019 [US3] Update `web/src/features/companies/components/CompanyForm.tsx` to include slug input field with validation feedback
- [X] T020 [US3] Create settings page `web/src/app/(workspace)/(company)/[companySlug]/settings/page.tsx` using updated CompanyForm
- [X] T021 [US3] Update company actions to handle slug changes with uniqueness validation in `web/src/features/companies/actions/companies.actions.ts`

**Checkpoint**: At this point, users can view and edit company settings including slug management

---

## Phase 6: User Story 4 - Project Context Navigation (Priority: P4)

**Goal**: Navigate into a project's workspace with project-specific navigation (Events, Distribute, Results) - no layout stacking

**Independent Test**: Navigate from company to a project and verify isolated project navigation appears (no company navbar stacking)

### Implementation for User Story 4

- [X] T022 [US4] Create project route group `web/src/app/(workspace)/(project)/[companySlug]/[projectId]/layout.tsx` with project-specific AppNavbar (breadcrumbs: 🍊 / Company / Project, tabs: Events, Distribute, Results)
- [X] T023 [US4] Create project root page `web/src/app/(workspace)/(project)/[companySlug]/[projectId]/page.tsx` that redirects to `/events`
- [X] T024 [P] [US4] Create events placeholder page `web/src/app/(workspace)/(project)/[companySlug]/[projectId]/events/page.tsx` (Coming Soon)
- [X] T025 [P] [US4] Create distribute placeholder page `web/src/app/(workspace)/(project)/[companySlug]/[projectId]/distribute/page.tsx` (Coming Soon)
- [X] T026 [P] [US4] Create results placeholder page `web/src/app/(workspace)/(project)/[companySlug]/[projectId]/results/page.tsx` (Coming Soon)

**Checkpoint**: At this point, project navigation works independently with no layout stacking from company context

---

## Phase 7: User Story 5 - Event and Experience Context Navigation (Priority: P5)

**Goal**: Event and experience editors have isolated navigation contexts (no navbar stacking)

**Independent Test**: Navigate to event and experience routes and verify each has isolated navigation appropriate to its context

### Implementation for User Story 5

- [X] T027 [US5] Create event route group `web/src/app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/layout.tsx` with event-specific AppNavbar (breadcrumbs: 🍊 / Company / Project / Event, tabs: Experiences, Theme)
- [X] T028 [US5] Create event root page `web/src/app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/page.tsx` that redirects to `/experiences`
- [X] T029 [P] [US5] Create event experiences placeholder page `web/src/app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/experiences/page.tsx` (Coming Soon)
- [X] T030 [P] [US5] Create theme placeholder page `web/src/app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/theme/page.tsx` (Coming Soon)
- [X] T031 [US5] Create experience route group `web/src/app/(workspace)/(experience)/[companySlug]/exps/[expId]/layout.tsx` with breadcrumbs only (🍊 / Company / experiences / Experience Name), no tabs
- [X] T032 [US5] Create experience placeholder page `web/src/app/(workspace)/(experience)/[companySlug]/exps/[expId]/page.tsx` (Coming Soon)

**Checkpoint**: At this point, all context levels (company, project, event, experience) have isolated navigation

---

## Phase 8: User Story 6 - Companies List at Root (Priority: P6)

**Goal**: Root URL (`/`) displays list of all companies with navigation to each via slug

**Independent Test**: Visit `/` and verify the companies list is displayed with navigation links to each company via their slug

### Implementation for User Story 6

- [X] T033 [US6] Update root page `web/src/app/(workspace)/page.tsx` to display companies list (reuse existing companies list logic)
- [X] T034 [US6] Update `web/src/features/companies/components/CompanyCard.tsx` to link to `/{slug}` instead of by ID

**Checkpoint**: At this point, users can see all companies at `/` and navigate to any via slug

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T035 Mobile responsiveness verification across all navigation components (breadcrumbs collapse, tabs scroll, 44px touch targets)
- [X] T036 Verify old `(admin)` routes still work (parallel operation during transition)

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T037 Run `pnpm lint` and fix all errors/warnings
- [X] T038 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T039 Verify feature in local dev server (`pnpm dev`)
- [ ] T040 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Phase 2
  - US2 (P2): Depends on US1 (needs company layout)
  - US3 (P3): Depends on US2 (needs navigation structure)
  - US4 (P4): Can start after Phase 2 (independent of US1-3)
  - US5 (P5): Can start after Phase 2 (independent of US1-4)
  - US6 (P6): Depends on US1 (needs slug support in cards)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundational only → MVP candidate
- **US2 (P2)**: Foundational + US1 company layout
- **US3 (P3)**: Foundational + US2 navigation
- **US4 (P4)**: Foundational only (can parallel with US1-3)
- **US5 (P5)**: Foundational only (can parallel with US1-4)
- **US6 (P6)**: Foundational + US1 slug support

### Parallel Opportunities

- T001, T002 (Setup) can run in parallel
- T005, T006 (Repository additions) can run in parallel after T003, T004
- T010, T011 (US1 route structure) can run in parallel
- T013, T014 (US2 navigation components) can run in parallel
- T017, T018 (US2 placeholder pages) can run in parallel
- T024, T025, T026 (US4 placeholder pages) can run in parallel
- T029, T030 (US5 event placeholders) can run in parallel
- US4, US5 can run in parallel with US1-3 (independent route groups)

---

## Parallel Example: Phase 1 + 2 Kickoff

```bash
# Launch Setup tasks together:
Task: "Create slug utility in web/src/lib/utils/slug.ts"
Task: "Add slug constants to web/src/features/companies/constants.ts"

# After Setup, launch repository additions together:
Task: "Add getCompanyBySlug() to repository"
Task: "Add isSlugAvailable() to repository"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test slug-based navigation works
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Slug navigation works → Deploy/Demo (MVP!)
3. Add US2 → Full company navigation → Deploy/Demo
4. Add US3 → Settings management → Deploy/Demo
5. Add US4, US5 (can be parallel) → Project/Event/Experience navigation → Deploy/Demo
6. Add US6 → Companies list at root → Deploy/Demo
7. Polish → Mobile verification, validation loop → Complete

### Suggested MVP Scope

**User Story 1 alone** provides:
- Company slug generation and validation
- URL-friendly company access (`/acme-corp`)
- Foundation for all other navigation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable after foundational phase
- No test tasks included (not requested in spec)
- Placeholder pages use "Coming Soon" pattern from research.md
- Old (admin) routes preserved for parallel operation during transition

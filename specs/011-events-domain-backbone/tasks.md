# Tasks: Events Domain Backbone

**Input**: Design documents from `/specs/011-events-domain-backbone/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: This is a foundational/infrastructure feature (not user-story based). Tasks are organized by implementation phase following the domain structure, schemas, UI components, and routing architecture.

**Tests**: Schema validation tests included as per spec requirements. No E2E tests (deferred to future when editors are implemented).

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- All paths relative to `apps/clementine-app/`
- Source: `src/`
- Routes: `src/app/workspace/$workspaceSlug.projects/$projectId.events/`
- Domains: `src/domains/`

---

## Phase 1: Setup (Domain Structure)

**Purpose**: Create the foundational folder structure for the event domain

- [ ] T001 Create event domain folder structure at src/domains/event/
- [ ] T002 [P] Create designer subdomain folders (components, containers) at src/domains/event/designer/
- [ ] T003 [P] Create welcome subdomain folders (components, containers) at src/domains/event/welcome/
- [ ] T004 [P] Create theme subdomain folders (components, containers) at src/domains/event/theme/
- [ ] T005 [P] Create settings subdomain folders (components, containers) at src/domains/event/settings/
- [ ] T006 [P] Create shared folders (schemas, hooks, types) at src/domains/event/shared/

**Checkpoint**: Domain folder structure is ready for implementation

---

## Phase 2: Schemas (Data Model)

**Purpose**: Implement Zod schemas for event configuration with Firestore-safe patterns

### Schema Implementation

- [ ] T007 [P] Create ProjectEventConfig schema at src/domains/event/shared/schemas/project-event-config.schema.ts
- [ ] T008 [P] Create ProjectEventFull schema at src/domains/event/shared/schemas/project-event-full.schema.ts
- [ ] T009 Create schema barrel export at src/domains/event/shared/schemas/index.ts
- [ ] T010 Create types barrel export at src/domains/event/shared/types/index.ts

### Schema Tests

- [ ] T011 [P] Unit test for projectEventConfigSchema validation at src/domains/event/shared/schemas/__tests__/project-event-config.schema.test.ts
- [ ] T012 [P] Unit test for projectEventFullSchema validation at src/domains/event/shared/schemas/__tests__/project-event-full.schema.test.ts

**Acceptance Criteria** (from spec.md):
- [ ] All optional fields use `.nullable().default(null)` or `.default([])`
- [ ] Schemas include `passthrough()` for evolution
- [ ] TypeScript types exported from both schemas
- [ ] Cross-reference comments added to both schema files
- [ ] `draftVersion` defaults to 1 (not 0)

**Checkpoint**: Schemas are fully implemented, tested, and Firestore-safe

---

## Phase 3: EventDesignerPage Component

**Purpose**: Implement the designer shell with vertical tabs layout and outlet

### Component Implementation

- [ ] T013 Create EventDesignerPage container at src/domains/event/designer/containers/EventDesignerPage.tsx
- [ ] T014 Create designer barrel export at src/domains/event/designer/index.ts
- [ ] T015 Create domain-level barrel export at src/domains/event/index.ts

**Acceptance Criteria** (from spec.md):
- [ ] `EventDesignerPage` created with 2-column layout
- [ ] Vertical tabs render correctly (Welcome, Theme, Settings)
- [ ] Active tab highlights correctly using `useMatchRoute()`
- [ ] Outlet renders child routes
- [ ] Uses theme tokens (`bg-accent`, `text-accent-foreground`) - no hard-coded colors
- [ ] Mobile-first design (vertical tabs work on 320px viewport)

**Checkpoint**: EventDesignerPage component is fully functional with tabs and outlet

---

## Phase 4: Route Files

**Purpose**: Implement TanStack Router file-based routes for event designer and tabs

### Route Implementation

- [ ] T016 Update $eventId.tsx route loader to use projectEventFullSchema at src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx
- [ ] T017 Update $eventId.tsx component to render EventDesignerPage (replace body section) at src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx
- [ ] T018 [P] Create index route redirect to welcome at src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.index.tsx
- [ ] T019 [P] Create welcome tab route with WIP placeholder at src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.welcome.tsx
- [ ] T020 [P] Create theme tab route with WIP placeholder at src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.theme.tsx
- [ ] T021 [P] Create settings tab route with WIP placeholder at src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.settings.tsx

**Acceptance Criteria** (from spec.md):
- [ ] All route files created
- [ ] Index route redirects to welcome using `beforeLoad`
- [ ] All tab routes show WIP placeholders
- [ ] Navigation between tabs works
- [ ] URL updates correctly
- [ ] Top nav breadcrumb shows project + event names

**Checkpoint**: All routes are implemented and navigation works correctly

---

## Phase 5: Integration & Testing

**Purpose**: Ensure all components work together and meet acceptance criteria

### Manual Testing

- [ ] T022 Test navigation to event page auto-redirects to /welcome
- [ ] T023 Test tab navigation (click Welcome → Theme → Settings → Welcome)
- [ ] T024 Test active tab highlighting changes correctly
- [ ] T025 Test route loader fetches event data without schema validation errors
- [ ] T026 Test EventDesignerPage renders with correct layout on desktop (1920x1080)
- [ ] T027 Test EventDesignerPage renders correctly on mobile (320px viewport)
- [ ] T028 Test Outlet renders child route content for each tab

### Standards Compliance Review

- [ ] T029 Verify domain structure follows DDD principles (project-structure.md)
- [ ] T030 Verify schemas follow Firestore-safe patterns (zod-validation.md)
- [ ] T031 Verify routes follow TanStack Router conventions (routing.md)
- [ ] T032 Verify component uses design system tokens (design-system.md)
- [ ] T033 Verify component uses TanStack Router Link (component-libraries.md)

**Checkpoint**: All features work end-to-end, standards compliance verified

---

## Phase 6: Polish & Validation

**Purpose**: Final validation, cleanup, and documentation

- [ ] T034 Run `pnpm check` (format + lint) - ensure all pass
- [ ] T035 Run `pnpm type-check` - ensure no TypeScript errors
- [ ] T036 Run schema validation tests - ensure all pass
- [ ] T037 Verify existing `@domains/project/events/schemas/project-event.schema.ts` remains unchanged
- [ ] T038 Remove any console.log or debugger statements
- [ ] T039 Verify no hard-coded colors (all using theme tokens)
- [ ] T040 Review quickstart.md to ensure implementation matches guide

**Checkpoint**: Code is clean, validated, and ready for commit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Schemas (Phase 2)**: Depends on Phase 1 (folders must exist)
- **Component (Phase 3)**: Depends on Phase 2 (imports schemas for types)
- **Routes (Phase 4)**: Depends on Phase 2 (imports schemas) and Phase 3 (imports EventDesignerPage)
- **Testing (Phase 5)**: Depends on Phases 1-4 (all implementation complete)
- **Polish (Phase 6)**: Depends on Phase 5 (testing complete)

### Parallel Opportunities Within Phases

**Phase 1 (Setup)**:
- Tasks T002-T006 can run in parallel (independent folder creation)

**Phase 2 (Schemas)**:
- T007-T008 can run in parallel (independent schema files)
- T011-T012 can run in parallel (independent test files)

**Phase 4 (Routes)**:
- T018-T021 can run in parallel (independent route files)

**Phase 5 (Testing)**:
- T022-T028 should run sequentially (manual testing steps)
- T029-T033 can run in parallel (independent standard reviews)

**Phase 6 (Polish)**:
- T034-T036 should run sequentially (validation gates)
- T037-T040 can run in parallel (review tasks)

---

## Execution Strategy

### Sequential (Recommended for Solo Developer)

```bash
# Phase 1: Setup (5-10 minutes)
# Create all folders sequentially or in parallel

# Phase 2: Schemas (30-45 minutes)
# Create schemas, then write tests
T007 → T008 → T009 → T010 → T011 → T012

# Phase 3: Component (30-45 minutes)
T013 → T014 → T015

# Phase 4: Routes (45-60 minutes)
T016 → T017 → T018 → T019 → T020 → T021

# Phase 5: Testing (30 minutes)
T022 → T023 → ... → T033

# Phase 6: Polish (15 minutes)
T034 → T035 → ... → T040
```

### Parallel (If Multiple Developers)

```bash
# Phase 1: Setup
Dev 1: T001, T002, T003
Dev 2: T004, T005, T006

# Phase 2: Schemas
Dev 1: T007 → T011 (ProjectEventConfig + test)
Dev 2: T008 → T012 (ProjectEventFull + test)
Dev 1 or 2: T009 → T010 (barrel exports)

# Phase 3: Component
Dev 1: T013 → T014 → T015

# Phase 4: Routes
Dev 1: T016 → T017 (update existing route)
Dev 2: T018 → T019 → T020 → T021 (new routes in parallel)

# Phase 5: Testing
Dev 1: T022-T028 (manual testing)
Dev 2: T029-T033 (standards review)

# Phase 6: Polish
Dev 1: T034-T036 (validation)
Dev 2: T037-T040 (review)
```

---

## File Path Reference

| Task | File Path |
|------|-----------|
| T007 | `src/domains/event/shared/schemas/project-event-config.schema.ts` |
| T008 | `src/domains/event/shared/schemas/project-event-full.schema.ts` |
| T009 | `src/domains/event/shared/schemas/index.ts` |
| T010 | `src/domains/event/shared/types/index.ts` |
| T011 | `src/domains/event/shared/schemas/__tests__/project-event-config.schema.test.ts` |
| T012 | `src/domains/event/shared/schemas/__tests__/project-event-full.schema.test.ts` |
| T013 | `src/domains/event/designer/containers/EventDesignerPage.tsx` |
| T014 | `src/domains/event/designer/index.ts` |
| T015 | `src/domains/event/index.ts` |
| T016-T017 | `src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx` |
| T018 | `src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.index.tsx` |
| T019 | `src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.welcome.tsx` |
| T020 | `src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.theme.tsx` |
| T021 | `src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.settings.tsx` |

---

## Success Metrics

**MVP Scope**: All 6 phases (this is the complete Phase 1 foundation)

**Task Breakdown**:
- Total tasks: 40
- Setup tasks: 6
- Schema tasks: 6 (4 implementation + 2 tests)
- Component tasks: 3
- Route tasks: 6
- Testing tasks: 12
- Polish tasks: 7

**Parallel Opportunities**: 15 tasks can run in parallel (marked with [P])

**Estimated Effort** (solo developer):
- Phase 1: 10 minutes
- Phase 2: 45 minutes
- Phase 3: 45 minutes
- Phase 4: 60 minutes
- Phase 5: 30 minutes
- Phase 6: 15 minutes
- **Total**: ~3-3.5 hours

**Independent Test Criteria**:
1. Navigate to `/workspace/{slug}/projects/{projectId}/events/{eventId}` → auto-redirects to `/welcome`
2. Click tabs → URL updates, content changes, active tab highlights
3. Event data loads from Firestore with no validation errors
4. All schemas validate Firestore documents correctly
5. TypeScript compiles with no errors
6. All validation gates pass (`pnpm check`, `pnpm type-check`)

**Out of Scope** (Future Phases):
- ❌ Welcome editor implementation (WIP placeholder only)
- ❌ Theme editor implementation (WIP placeholder only)
- ❌ Settings editor implementation (WIP placeholder only)
- ❌ Draft/publish workflow UI (schema ready, UI later)
- ❌ Real-time collaborative editing (schema ready, implementation later)

---

## Standards & References

- **Zod Validation**: `apps/clementine-app/standards/global/zod-validation.md`
- **Project Structure**: `apps/clementine-app/standards/global/project-structure.md`
- **Client-First Architecture**: `apps/clementine-app/standards/global/client-first-architecture.md`
- **Routing**: `apps/clementine-app/standards/frontend/routing.md`
- **Component Libraries**: `apps/clementine-app/standards/frontend/component-libraries.md`
- **Design System**: `apps/clementine-app/standards/frontend/design-system.md`

See `quickstart.md` for detailed implementation examples and troubleshooting guide.

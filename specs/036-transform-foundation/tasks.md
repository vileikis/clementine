# Tasks: Transform Pipeline Foundation & Schema

**Input**: Design documents from `/specs/036-transform-foundation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested - schema validation handled by Zod, manual validation via quickstart checklist.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Shared Package**: `packages/shared/src/`
- **App**: `apps/clementine-app/src/`
- **Functions**: `functions/src/`
- **Firebase**: `firebase/`

---

## Phase 1: Setup (Shared Kernel Infrastructure)

**Purpose**: Create shared kernel directory structure and barrel exports

- [X] T001 Create schema directories in shared package: `mkdir -p packages/shared/src/schemas/{session,job,experience,event,project,workspace}`
- [X] T002 [P] Create master barrel export in `packages/shared/src/schemas/index.ts`
- [X] T003 [P] Update root export in `packages/shared/src/index.ts` to export from schemas

---

## Phase 2: Foundational (Schema Migration - Blocking)

**Purpose**: Move existing schemas to shared kernel - MUST complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### 2.1 Move Workspace Schema

- [X] T004 [P] Move workspace schema from `packages/shared/src/entities/workspace/workspace.schema.ts` to `packages/shared/src/schemas/workspace/workspace.schema.ts`
- [X] T005 [P] Create barrel export in `packages/shared/src/schemas/workspace/index.ts`

### 2.2 Move Project Schema

- [X] T006 [P] Move project schema from `packages/shared/src/entities/project/project.schema.ts` to `packages/shared/src/schemas/project/project.schema.ts`
- [X] T007 [P] Create barrel export in `packages/shared/src/schemas/project/index.ts`

### 2.3 Move Event Schemas

- [X] T008 [P] Copy event config schema from `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts` to `packages/shared/src/schemas/event/project-event-config.schema.ts`
- [X] T009 [P] Copy full event schema from `apps/clementine-app/src/domains/event/shared/schemas/project-event-full.schema.ts` to `packages/shared/src/schemas/event/project-event.schema.ts` (update imports to use local config schema)
- [X] T010 Create barrel export in `packages/shared/src/schemas/event/index.ts`

### 2.4 Cleanup Old Locations

- [X] T011 Remove old entities directory `packages/shared/src/entities/`
- [X] T012 Keep session.schemas.ts (media pipeline schemas still needed by functions)

**Checkpoint**: Shared kernel structure ready - user story schemas can now be implemented

---

## Phase 3: User Story 1 - Step Names (Priority: P1) 🎯 MVP

**Goal**: Steps have human-readable names for identification and transform variable mapping

**Independent Test**: Create experience with multiple steps, verify each receives auto-generated name that can be edited

### Implementation for User Story 1

- [X] T013 [US1] Create base step schema with `name` field in `packages/shared/src/schemas/experience/step.schema.ts`
- [X] T014 [US1] Create barrel export in `packages/shared/src/schemas/experience/index.ts`
- [X] T015 [US1] Implement `generateStepName()` helper function in `apps/clementine-app/src/domains/experience/steps/helpers/step-name.helpers.ts`
- [X] T016 [US1] Implement `ensureStepHasName()` lazy migration helper in `apps/clementine-app/src/domains/experience/steps/helpers/step-name.helpers.ts`
- [X] T017 [US1] Update step discriminated union in `apps/clementine-app/src/domains/experience/steps/schemas/step.schema.ts` to add `name` field to all 8 step schemas
- [X] T018 [US1] Update step creation logic to call `generateStepName()` when adding new steps (in experience designer component/hook)
- [X] T019 [US1] Update experience loading to apply `ensureStepHasName()` for lazy migration of existing steps

**Checkpoint**: Steps now have names - can independently verify by creating/editing experiences

---

## Phase 4: User Story 2 - Transform Configuration (Priority: P1)

**Goal**: Experience schema supports optional transform configuration slot

**Independent Test**: Create/update experience with transform=null (works normally) or with valid transform config (persists correctly)

### Implementation for User Story 2

- [X] T020 [P] [US2] Create transform schema with TransformConfig, TransformNode, VariableMapping, OutputFormat in `packages/shared/src/schemas/experience/transform.schema.ts`
- [X] T021 [US2] Create experience schema with `transform` field in ExperienceConfig in `packages/shared/src/schemas/experience/experience.schema.ts`
- [X] T022 [US2] Update experience barrel export in `packages/shared/src/schemas/experience/index.ts` to export transform schema
- [X] T023 [US2] Create app domain re-export in `apps/clementine-app/src/domains/experience/shared/schemas/index.ts` that re-exports from @clementine/shared
- [X] T024 [US2] Remove old experience schema from `apps/clementine-app/src/domains/experience/shared/schemas/experience.schema.ts`
- [X] T025 [US2] Update all app imports that used old experience schema to use domain re-export

**Checkpoint**: Experience schema has transform slot - can independently verify by loading/saving experiences

---

## Phase 5: User Story 3 - Job Tracking (Priority: P2)

**Goal**: Job document schema tracks transform pipeline executions

**Independent Test**: Create job document with all required fields, verify status can be updated

### Implementation for User Story 3

- [X] T026 [P] [US3] Create job schema with all snapshot schemas in `packages/shared/src/schemas/job/job.schema.ts`
- [X] T027 [US3] Create barrel export in `packages/shared/src/schemas/job/index.ts`
- [X] T028 [US3] Verify job schema exports correctly from `@clementine/shared`

**Checkpoint**: Job schema defined - can independently verify by validating job objects

---

## Phase 6: User Story 4 - Session Job Tracking (Priority: P2)

**Goal**: Session tracks jobId and jobStatus for transform progress

**Independent Test**: Update session with jobId and jobStatus, verify persistence

### Implementation for User Story 4

- [X] T029 [US4] Create consolidated session schema with `jobStatus` field in `packages/shared/src/schemas/session/session.schema.ts`
- [X] T030 [US4] Create barrel export in `packages/shared/src/schemas/session/index.ts`
- [X] T031 [US4] Create app domain re-export in `apps/clementine-app/src/domains/session/shared/schemas/index.ts` that re-exports from @clementine/shared
- [X] T032 [US4] Remove old session schema from `apps/clementine-app/src/domains/session/shared/schemas/session.schema.ts`
- [X] T033 [US4] Update all app imports that used old session schema to use domain re-export
- [X] T034 [US4] Functions imports preserved (existing session.schemas.ts kept for media pipeline compatibility)

**Checkpoint**: Session has jobStatus field - can independently verify via Firestore operations

---

## Phase 7: User Story 5 - Security Rules (Priority: P3)

**Goal**: Admins can read jobs, only server can write

**Independent Test**: Admin read succeeds, guest read fails, all client writes fail

### Implementation for User Story 5

- [X] T035 [P] [US5] Add jobs collection security rules in `firebase/firestore.rules` (admin read, deny all writes)
- [X] T036 [P] [US5] Add job query indexes in `firebase/firestore.indexes.json`
- [ ] T037 [US5] Deploy security rules via `pnpm fb:deploy:rules`
- [ ] T038 [US5] Deploy indexes via `pnpm fb:deploy:indexes`

**Checkpoint**: Security rules in place - can verify admin read/guest denied

---

## Phase 8: Polish & Validation

**Purpose**: Final cleanup and validation

- [X] T039 [P] Update event domain re-exports - kept in app (complex theme/experience dependencies)
- [X] T040 [P] Event schemas in app preserved (they extend shared schemas with app-specific deps)
- [X] T041 Build shared package: `pnpm --filter @clementine/shared build`
- [X] T042 Build and type-check app: `pnpm --filter @clementine/app type-check`
- [X] T043 Build functions: `pnpm --filter @clementine/functions build`
- [X] T044 Run validation: `pnpm --filter @clementine/app lint`
- [ ] T045 Manual validation: Run quickstart.md checklist to verify all features work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on Foundational + US1 (step schema dependency)
- **User Stories 3-4 (Phases 5-6)**: Depend on Foundational, can run parallel to US1/US2
- **User Story 5 (Phase 7)**: Depends on US3/US4 (needs job schema defined)
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

```
Setup (Phase 1)
    │
    ▼
Foundational (Phase 2) ←── BLOCKING
    │
    ├────────────────┬────────────────┐
    ▼                ▼                ▼
   US1 (P1)      US3 (P2)         US4 (P2)
    │                │                │
    ▼                └────────┬───────┘
   US2 (P1)                   ▼
    │                      US5 (P3)
    │                         │
    └────────────────┬────────┘
                     ▼
               Polish (Phase 8)
```

### Within Each User Story

- Schema files before re-exports
- Shared package before app updates
- App changes before functions changes
- Build validation after each story

### Parallel Opportunities

**Within Phase 2 (Foundational):**
- T004, T006, T008, T009 can all run in parallel (different schema domains)
- T005, T007 can run after their respective schemas

**Within User Stories:**
- T020 (transform schema) can run in parallel with US1 tasks
- T026 (job schema) can run in parallel with US1/US2 tasks
- T035, T036 (security rules) can run in parallel

---

## Parallel Example: Foundation + Early Stories

```bash
# After Phase 1 Setup completes, launch all schema migrations in parallel:
Task: "Move workspace schema to packages/shared/src/schemas/workspace/workspace.schema.ts"
Task: "Move project schema to packages/shared/src/schemas/project/project.schema.ts"
Task: "Copy event config schema to packages/shared/src/schemas/event/project-event-config.schema.ts"
Task: "Copy full event schema to packages/shared/src/schemas/event/project-event.schema.ts"

# Once Foundational completes, US1 and early US3/US4 schema work can parallel:
Task: "Create base step schema with name field in packages/shared/src/schemas/experience/step.schema.ts"
Task: "Create job schema with all snapshot schemas in packages/shared/src/schemas/job/job.schema.ts"
Task: "Create consolidated session schema with jobStatus field in packages/shared/src/schemas/session/session.schema.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Step Names)
4. Complete Phase 4: User Story 2 (Transform Config)
5. **STOP and VALIDATE**: Build all packages, type-check
6. Steps have names, experiences support transform - core foundation ready

### Full Feature Delivery

1. MVP + User Story 3 (Job Schema)
2. + User Story 4 (Session Job Tracking)
3. + User Story 5 (Security Rules)
4. Complete Phase 8: Polish & Validation
5. Deploy to staging for integration testing

### Schema-Only Focus

This feature is schema-only. No UI implementation, no backend processing logic.
All tasks focus on:
- Zod schema definitions
- File organization (shared kernel)
- Import/export updates
- Security rules
- Type safety

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Schemas must be created before re-exports
- Build shared package after creating schemas
- Verify type-checking passes after each major change
- This is a schema-only feature - no UI or processing logic
- Lazy migration handles existing steps without names
- Commit after each phase or logical group

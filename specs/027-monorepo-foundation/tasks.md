# Tasks: Monorepo Foundation

**Input**: Design documents from `/specs/027-monorepo-foundation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No unit tests for this infrastructure setup (per constitution - manual verification via curl)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This feature uses pnpm monorepo structure:
- **Shared package**: `packages/shared/`
- **Functions**: `functions/`
- **Web**: `web/` (unchanged)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and workspace configuration

- [X] T001 Update pnpm-workspace.yaml to add `packages/*` pattern
- [X] T002 [P] Create packages/shared/ directory structure with src/schemas/ folders
- [X] T003 [P] Create functions/src/ directory structure
- [X] T004 [P] Create functions/scripts/ directory for deploy script

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create packages/shared/package.json with @clementine/shared name, zod dependency, and dual ESM/CJS exports
- [X] T006 [P] Create packages/shared/tsconfig.json with strict mode and dual output configuration
- [X] T007 [P] Create functions/package.json with @clementine/functions name, firebase dependencies, and workspace:* for @clementine/shared
- [X] T008 [P] Create functions/tsconfig.json for Node.js target with CommonJS output
- [X] T009 Run `pnpm install` to verify workspace resolution and install all dependencies

**Checkpoint**: Foundation ready - workspace configured, dependencies installed

---

## Phase 3: User Story 1 - Developer Imports Shared Types (Priority: P1) 🎯 MVP

**Goal**: Create shared Zod schemas package that can be imported from both web and functions workspaces

**Independent Test**: Import a type (e.g., `SessionProcessing`) in both web and functions, verify TypeScript compilation succeeds

### Implementation for User Story 1

- [X] T010 [US1] Define inputAssetSchema in packages/shared/src/schemas/session.schemas.ts
- [X] T011 [US1] Define processingErrorSchema in packages/shared/src/schemas/session.schemas.ts
- [X] T012 [US1] Define processingStateSchema in packages/shared/src/schemas/session.schemas.ts
- [X] T013 [US1] Define sessionOutputsSchema in packages/shared/src/schemas/session.schemas.ts
- [X] T014 [US1] Define sessionProcessingSchema in packages/shared/src/schemas/session.schemas.ts
- [X] T015 [P] [US1] Create barrel export in packages/shared/src/schemas/index.ts
- [X] T016 [P] [US1] Create package entry point in packages/shared/src/index.ts
- [X] T017 [US1] Build shared package with `pnpm --filter @clementine/shared build`
- [X] T018 [US1] Verify type import works in functions by creating functions/src/index.ts with SessionProcessing import

**Checkpoint**: Shared types package complete and importable from functions workspace

---

## Phase 4: User Story 2 - Developer Deploys Functions (Priority: P2)

**Goal**: Create deployment infrastructure with hello world function and deploy script

**Independent Test**: Run deploy script and verify the function endpoint responds with expected JSON

### Implementation for User Story 2

- [X] T019 [US2] Implement helloWorld HTTP function in functions/src/index.ts using Firebase Functions v2 SDK
- [X] T020 [US2] Add shared type usage in helloWorld to verify integration (return mock SessionProcessing data)
- [X] T021 [US2] Update firebase.json to add functions configuration (source, codebase, predeploy, ignore)
- [X] T022 [US2] Create functions/scripts/deploy.sh with fail-fast behavior (set -e)
- [X] T023 [US2] Add build steps to deploy.sh: build shared package, then firebase deploy
- [X] T024 [US2] Make deploy.sh executable with chmod +x
- [X] T025 [US2] Build functions package with `pnpm --filter @clementine/functions build`
- [ ] T026 [US2] Deploy functions using ./functions/scripts/deploy.sh
- [ ] T027 [US2] Verify deployment by curling the helloWorld endpoint URL

**Checkpoint**: Functions deployed and responding at production URL

---

## Phase 5: User Story 3 - Developer Runs Local Development (Priority: P3)

**Goal**: Configure Firebase emulators for local function testing

**Independent Test**: Start emulator, make request to local endpoint, verify response

### Implementation for User Story 3

- [X] T028 [US3] Update firebase.json to add functions emulator configuration (port 5001)
- [X] T029 [US3] Add serve script to functions/package.json for local development
- [ ] T030 [US3] Test local emulator by running `pnpm --filter @clementine/functions serve`
- [ ] T031 [US3] Verify local endpoint responds correctly via curl to localhost:5001

**Checkpoint**: Local development environment working with emulator

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T032 [P] Add lib/ to functions/.gitignore for compiled output
- [X] T033 [P] Update root package.json with functions-related scripts (optional convenience commands)
- [X] T034 Review and verify all TypeScript strict mode settings across workspaces

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T035 Run `pnpm --filter @clementine/shared build` and verify no errors
- [X] T036 Run `pnpm --filter @clementine/functions build` and verify no errors
- [ ] T037 Verify production endpoint with curl returns expected JSON
- [ ] T038 Commit changes after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories should proceed sequentially in priority order (P1 → P2 → P3)
  - US2 depends on US1 (needs shared types)
  - US3 can technically start after Phase 2 but makes more sense after US2
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (needs working shared types for hello world function)
- **User Story 3 (P3)**: Can start after Foundational, but benefits from US2 (hello world function to test)

### Within Each User Story

- Schemas defined before barrel exports
- Barrel exports before package build
- Package build before dependent workspace usage
- Configuration before deployment

### Parallel Opportunities

- T002, T003, T004 can run in parallel (different directories)
- T006, T007, T008 can run in parallel (different package configs)
- T015, T016 can run in parallel (different files)
- T032, T033 can run in parallel (different files)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all directory creation tasks together:
Task: "Create packages/shared/ directory structure with src/schemas/ folders"
Task: "Create functions/src/ directory structure"
Task: "Create functions/scripts/ directory for deploy script"
```

## Parallel Example: Phase 2 Foundational

```bash
# Launch all tsconfig and package.json tasks together:
Task: "Create packages/shared/tsconfig.json with strict mode and dual output configuration"
Task: "Create functions/package.json with @clementine/functions name..."
Task: "Create functions/tsconfig.json for Node.js target with CommonJS output"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T009)
3. Complete Phase 3: User Story 1 (T010-T018)
4. **STOP and VALIDATE**: Verify shared types work in functions workspace
5. Can demo type sharing capability

### Incremental Delivery

1. Complete Setup + Foundational → Workspace configured
2. Add User Story 1 → Shared types working → Demo type imports
3. Add User Story 2 → Functions deployed → Demo live endpoint
4. Add User Story 3 → Local dev working → Demo full dev workflow
5. Each story adds value without breaking previous stories

### Full Implementation (Recommended)

Since this is infrastructure setup, complete all stories before moving to subsequent pipeline stages:
1. Phase 1-2: Setup + Foundational (~30 min)
2. Phase 3: Shared types package (~1 hr)
3. Phase 4: Deployment infrastructure (~1 hr)
4. Phase 5: Local development (~30 min)
5. Phase 6: Polish + Validation (~30 min)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No unit tests for this feature (infrastructure setup, manual verification)
- Use curl to verify endpoints work
- Commit after each phase or logical group
- Stop at any checkpoint to validate story independently

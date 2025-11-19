# Tasks: Remove Scenes Dependency

**Input**: Design documents from `/specs/001-remove-scenes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No explicit test tasks - this is a code removal feature. Validation comes from build/lint/type-check passing.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Web monorepo (pnpm workspace):
- Main application: `web/src/`
- Firestore rules: `firestore.rules` (repository root)
- Tests co-located with source files

---

## Phase 1: Setup (No Prerequisites)

**Purpose**: Verify project structure and understand current scene usage

- [ ] T001 Review quickstart.md phases 1-9 for complete removal strategy
- [ ] T002 Verify feature branch `001-remove-scenes` is checked out and working directory is clean

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational blockers for this feature - proceed directly to user stories after setup

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Event Creator Manages Experiences Without Scene Confusion (Priority: P1) 🎯 MVP

**Goal**: Remove all scene-related admin UI, server actions, and data layer code so event creators never encounter scene references

**Independent Test**: Navigate Event Builder (Content/Distribution/Results tabs), create/edit experiences, verify zero scene-related UI elements or console errors

### Implementation for User Story 1

#### Remove Admin UI (Phase 1 from quickstart.md)

- [X] T003 [US1] Delete scene admin page at `web/src/app/(studio)/events/[eventId]/scene/page.tsx` (entire directory)

#### Remove Scene Actions (Phase 2 from quickstart.md)

- [X] T004 [US1] Delete scene server actions file `web/src/features/events/actions/scenes.ts` (updateSceneAction, uploadReferenceImageAction, removeReferenceImageAction)
- [X] T005 [US1] Verify getImageUrlAction is not needed (or move to shared storage utilities if used by experiences)

#### Remove Scene Repositories (Phase 3 from quickstart.md)

- [X] T006 [P] [US1] Delete scene repository file `web/src/features/events/repositories/scenes.ts`
- [X] T007 [P] [US1] Delete scene repository test file `web/src/features/events/repositories/scenes.test.ts`
- [X] T008 [US1] Update events repository `web/src/features/events/repositories/events.ts` - remove scene imports
- [X] T009 [US1] Update events repository tests `web/src/features/events/repositories/events.test.ts` - remove scene test cases

#### Remove Scene Types and Schemas (Phase 4 from quickstart.md)

- [X] T010 [US1] Update event schemas `web/src/features/events/lib/schemas.ts` - remove sceneSchema export and currentSceneId from eventSchema
- [X] T011 [US1] Update event types `web/src/features/events/types/event.types.ts` - remove Scene type and currentSceneId from Event type
- [X] T012 [US1] Update events feature exports `web/src/features/events/index.ts` - remove scene type/schema exports
- [X] T013 [US1] Update firestore types `web/src/lib/types/firestore.ts` - remove scene type references if present

#### Update Event Actions (Phase 5 from quickstart.md)

- [X] T014 [US1] Update event actions `web/src/features/events/actions/events.ts` - remove currentSceneId from event creation/update logic
- [ ] T015 [US1] Update event action tests `web/src/features/events/actions/events.test.ts` - remove scene-related test cases and fixtures

**Checkpoint**: Event Builder should load without scene references, TypeScript compilation should have significantly fewer errors

---

## Phase 4: User Story 2 - Guest Completes Event Flow Without Scene Logic (Priority: P1)

**Goal**: Remove scene-based navigation from guest flow so guests complete events without scene dependencies

**Independent Test**: Complete full guest journey from event link → welcome → photo capture → AI transformation → ending → share, verify zero scene errors

### Implementation for User Story 2

#### Remove Scene Navigation (Phase 6 from quickstart.md)

- [ ] T016 [US2] Update guest flow container `web/src/features/guest/components/GuestFlowContainer.tsx` - remove currentSceneId state, props, and scene-based navigation logic

#### Clean Up Session References (Phase 7 from quickstart.md)

- [ ] T017 [P] [US2] Review sessions repository `web/src/features/sessions/lib/repository.ts` - remove scene references
- [ ] T018 [P] [US2] Review sessions repository tests `web/src/features/sessions/lib/repository.test.ts` - remove scene test cases
- [ ] T019 [P] [US2] Review sessions actions `web/src/features/sessions/lib/actions.ts` - remove scene references
- [ ] T020 [P] [US2] Review sessions validation `web/src/features/sessions/lib/validation.ts` - remove scene validation logic
- [ ] T021 [P] [US2] Review session types `web/src/features/sessions/types/session.types.ts` - remove scene references

**Checkpoint**: Guest flow should complete without scene logic, navigation works based solely on experiences

---

## Phase 5: User Story 3 - Developer Works with Clean Experience-Based Architecture (Priority: P2)

**Goal**: Complete code cleanup, update Firestore rules, ensure zero scene references remain in codebase

**Independent Test**: Run codebase search for "scene" (case-insensitive), verify zero matches except comments; build passes with zero TypeScript errors

### Implementation for User Story 3

#### Clean Up Experience Components (Phase 7 from quickstart.md)

- [ ] T022 [P] [US3] Review prompt editor `web/src/features/experiences/components/photo/PromptEditor.tsx` - remove scene references (likely comments/docs)
- [ ] T023 [P] [US3] Review reference image uploader `web/src/features/experiences/components/photo/RefImageUploader.tsx` - remove scene references (likely comments/docs)
- [ ] T024 [P] [US3] Review mode selector `web/src/features/experiences/components/photo/ModeSelector.tsx` - remove scene references

#### Clean Up Storage and AI Utilities (Phase 7 from quickstart.md)

- [ ] T025 [US3] Review storage upload utilities `web/src/lib/storage/upload.ts` - verify uploadReferenceImage function is experience-agnostic (or refactor if scene-specific)
- [ ] T026 [US3] Review AI provider utilities `web/src/lib/ai/providers/google-ai.ts` - remove scene references (likely comments)

#### Update Firestore Security Rules (Phase 8 from quickstart.md)

- [ ] T027 [US3] Update Firestore rules `firestore.rules` - add explicit deny rule for `/events/{eventId}/scenes/{sceneId}` paths

#### Update Event Validation Logic

- [ ] T028 [US3] Update event validation `web/src/features/events/lib/validation.ts` - remove scene validation logic

**Checkpoint**: Codebase search for "scene" returns zero active code matches, Firestore rules deny scene access

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T029 Run comprehensive codebase search: `grep -ri "scene" web/src --include="*.ts" --include="*.tsx"` - verify zero matches (excluding comments)
- [ ] T030 Search for remaining scene imports: `grep -rn "scenes" web/src --include="*.ts" --include="*.tsx"` - verify zero import statements remain

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T031 Run `pnpm lint` and fix all errors/warnings (expected: zero unused imports for scenes)
- [ ] T032 Run `pnpm type-check` and resolve all TypeScript errors (expected: zero errors related to Scene types or currentSceneId)
- [ ] T033 Run `pnpm test` and ensure all tests pass (expected: all remaining tests pass after scene tests removed)
- [ ] T034 Run `pnpm build` to verify production build succeeds (expected: clean build with zero errors)
- [ ] T035 Verify feature in local dev server (`pnpm dev`) - manually test Event Builder and guest flow
- [ ] T036 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: N/A - no blocking infrastructure for this feature
- **User Stories (Phase 3+)**: Can proceed immediately after setup
  - **User Story 1 (P1)**: Admin UI and data layer removal - can start immediately
  - **User Story 2 (P1)**: Guest flow cleanup - **depends on US1 T010-T013** (types/schemas must be removed first)
  - **User Story 3 (P2)**: Code cleanup and rules - **depends on US1 and US2** (core removals must be complete)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - removes admin UI, actions, repositories, types, schemas
- **User Story 2 (P1)**: Depends on US1 tasks T010-T013 (types/schemas removed) to avoid TypeScript errors in guest flow
- **User Story 3 (P2)**: Depends on US1 and US2 being complete (ensures core scene logic removed before final cleanup)

### Within Each User Story

**User Story 1**:
1. Remove UI first (T003) - highest level
2. Remove actions (T004-T005) - depends on UI removal
3. Remove repositories in parallel (T006-T009) - after actions removed
4. Remove types/schemas (T010-T013) - after repositories (lowest level)
5. Update event actions (T014-T015) - after schemas updated

**User Story 2**:
1. Update guest flow (T016) - after US1 types removed
2. Clean up session references in parallel (T017-T021) - independent files

**User Story 3**:
1. Clean up experience components in parallel (T022-T024) - independent files
2. Clean up storage/AI utilities (T025-T026) - sequential (may depend on each other)
3. Update Firestore rules (T027) - after all code removals complete
4. Update validation logic (T028) - after schemas updated

### Parallel Opportunities

**Within User Story 1**:
- Tasks T006, T007 (scene repository files) can run in parallel
- Tasks T010, T011, T012, T013 (types/schemas in different files) can be done in parallel if experienced with TypeScript

**Within User Story 2**:
- Tasks T017, T018, T019, T020, T021 (session files) can all run in parallel

**Within User Story 3**:
- Tasks T022, T023, T024 (experience components) can run in parallel

**Between User Stories**:
- User Story 1 and User Story 2 can be worked on by different developers once US1 reaches checkpoint (T013 complete)
- User Story 3 should start only after US1 and US2 complete

---

## Parallel Example: User Story 1 (Types & Schemas Removal)

```bash
# Launch type/schema removal tasks together (all different files):
Task T010: "Update event schemas web/src/features/events/lib/schemas.ts"
Task T011: "Update event types web/src/features/events/types/event.types.ts"
Task T012: "Update events feature exports web/src/features/events/index.ts"
Task T013: "Update firestore types web/src/lib/types/firestore.ts"
```

## Parallel Example: User Story 2 (Session Cleanup)

```bash
# Launch all session cleanup tasks together (all different files):
Task T017: "Review sessions repository web/src/features/sessions/lib/repository.ts"
Task T018: "Review sessions repository tests web/src/features/sessions/lib/repository.test.ts"
Task T019: "Review sessions actions web/src/features/sessions/lib/actions.ts"
Task T020: "Review sessions validation web/src/features/sessions/lib/validation.ts"
Task T021: "Review session types web/src/features/sessions/types/session.types.ts"
```

## Parallel Example: User Story 3 (Component Cleanup)

```bash
# Launch experience component cleanup together (all different files):
Task T022: "Review prompt editor web/src/features/experiences/components/photo/PromptEditor.tsx"
Task T023: "Review reference image uploader web/src/features/experiences/components/photo/RefImageUploader.tsx"
Task T024: "Review mode selector web/src/features/experiences/components/photo/ModeSelector.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 3: User Story 1 (T003-T015)
3. **STOP and VALIDATE**: Run validation loop (T031-T034)
4. Manual test: Create event, edit experiences, verify no scene references in UI or console

**Result**: Event Builder is clean of scene references, admin experience improved

### Incremental Delivery

1. **After US1**: Event creators have clean admin experience (MVP delivered!)
2. **Add US2** (T016-T021): Guest flow works without scene logic
3. **Add US3** (T022-T028): Codebase fully cleaned, Firestore rules updated
4. **Polish** (T029-T036): Final validation and deployment

### Parallel Team Strategy

With two developers:

1. **Both**: Complete Setup (Phase 1)
2. **Developer A**: User Story 1 (T003-T015)
3. Once A reaches T013 checkpoint:
   - **Developer A**: Continue with T014-T015
   - **Developer B**: Start User Story 2 (T016-T021) in parallel
4. Once A and B complete:
   - **Either developer**: User Story 3 (T022-T028)
5. **Both**: Final validation loop (T029-T036)

---

## Task Count Summary

- **Total Tasks**: 36
- **User Story 1 (P1)**: 13 tasks (T003-T015) - Admin UI, actions, repositories, types, schemas
- **User Story 2 (P1)**: 6 tasks (T016-T021) - Guest flow navigation cleanup
- **User Story 3 (P2)**: 7 tasks (T022-T028) - Code cleanup and Firestore rules
- **Setup**: 2 tasks (T001-T002)
- **Polish & Validation**: 8 tasks (T029-T036)

### Parallel Opportunities

- **User Story 1**: 6 parallelizable tasks (T006-T007, T010-T013)
- **User Story 2**: 5 parallelizable tasks (T017-T021)
- **User Story 3**: 3 parallelizable tasks (T022-T024)
- **Total parallelizable**: 14 tasks (39% of total)

### Independent Test Criteria

- **US1**: Navigate Event Builder, create/edit experiences, verify zero scene UI/errors
- **US2**: Complete guest journey (welcome → capture → transform → share), verify zero scene errors
- **US3**: Search codebase for "scene", verify zero active code matches; build passes with zero errors

### Suggested MVP Scope

**Minimum**: User Story 1 only (T001-T015 + validation loop)
- Delivers clean admin experience
- Removes majority of scene code (13 tasks)
- Event Builder works without scene references

**Recommended**: User Stories 1 + 2 (T001-T021 + validation loop)
- Delivers clean admin + guest experience
- Covers both P1 priorities
- Full user-facing experience is scene-free

---

## Notes

- This is a **code removal** feature - no new functionality, only simplification
- Tests are **not required** - validation comes from build/lint/type-check passing
- Follow **top-down removal order** (UI → Actions → Data → Types → Rules) per research.md
- Each user story should be **independently testable** via manual navigation or automated validation
- **Backward compatibility**: Application will ignore legacy `currentSceneId` field in old Firestore documents
- Commit after each logical group of tasks (e.g., after completing repository removal, after schemas updated)
- Stop at any checkpoint to validate story independently before proceeding
- Final validation loop (T031-T036) is **mandatory** per Constitution Principle V

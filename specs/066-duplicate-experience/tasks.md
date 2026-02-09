# Tasks: Duplicate Experience

**Input**: Design documents from `/specs/066-duplicate-experience/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `apps/clementine-app/src/` unless otherwise noted.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the shared lib directory and utility function that all user stories depend on.

- [ ] T001 [P] Create `generateDuplicateName` utility function in `domains/experience/shared/lib/generate-duplicate-name.ts`. Implement: if name ends with `" (Copy)"` return unchanged, else append `" (Copy)"`. If result exceeds 100 chars, truncate original name to fit. Export the function. See `contracts/duplicate-experience.md` for examples.
- [ ] T002 [P] Add `duplicateExperienceInputSchema` to `domains/experience/shared/schemas/experience.input.schemas.ts`. Schema: `z.object({ workspaceId: z.string().min(1), experienceId: z.string().min(1) })`. Export the schema and its inferred type.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the mutation hook that powers the duplicate action. MUST be complete before UI work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Create `useDuplicateExperience` mutation hook in `domains/experience/shared/hooks/useDuplicateExperience.ts`. Follow the `useCreateExperience` pattern: validate input with `duplicateExperienceInputSchema`, open Firestore `runTransaction`, `transaction.get()` the source document (throw if not found or `status !== 'active'`), generate name via `generateDuplicateName()`, create new doc ref with `doc(experiencesRef)`, deep-copy configs with `structuredClone()`, `transaction.set()` the new document per field mapping in `data-model.md` (new id, `serverTimestamp()` for createdAt/updatedAt, reset publish fields to null, set `sourceExperienceId` to source.id, copy profile/media/draft/published). On success: invalidate `experienceKeys.lists()` filtered by workspaceId. On error: `Sentry.captureException`. Return `{ workspaceId, experienceId: newRef.id, name }`.
- [ ] T004 Add `export * from './useDuplicateExperience'` to `domains/experience/shared/hooks/index.ts` barrel export.

**Checkpoint**: Mutation hook is ready. UI integration can now begin.

---

## Phase 3: User Story 1 — Duplicate an Experience from the List (Priority: P1) 🎯 MVP

**Goal**: Creator clicks "Duplicate" in context menu → new experience appears in list with "(Copy)" name, toast confirms.

**Independent Test**: Duplicate any experience from the list. Verify: new experience appears with "{name} (Copy)", draft config matches source, experience is not published, toast shows "Duplicated as {name}".

### Implementation for User Story 1

- [ ] T005 [US1] Refactor `ExperienceListItem` in `domains/experience/library/components/ExperienceListItem.tsx`. Replace the `renderMenuItems` render prop and raw `DropdownMenu` with the shared `ContextDropdownMenu` component. Change props interface: replace `renderMenuItems?: () => React.ReactNode` with `menuSections?: MenuSection[]` (import `MenuSection` from `@/shared/components/ContextDropdownMenu`). Render `ContextDropdownMenu` with `trigger` as the existing ghost button with `MoreVertical` icon and `sections={menuSections}`. Remove the `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuTrigger` imports. Keep all other component behavior unchanged.
- [ ] T006 [US1] Wire up duplicate action in `domains/experience/library/containers/ExperiencesPage.tsx`. Import `useDuplicateExperience` hook, `Copy` and `Pencil` icons from lucide-react, `toast` from sonner, and `MenuSection` type. Call `useDuplicateExperience()` to get the mutation. Create a `handleDuplicate` async function that calls `duplicateExperience.mutateAsync({ workspaceId, experienceId: exp.id })`, then on success calls `toast.success(\`Duplicated as "\${result.name}"\`)`, on catch calls `toast.error("Couldn't duplicate experience")`. Build `menuSections` array with two sections: first section has Rename (`{ key: 'rename', label: 'Rename', icon: Pencil, onClick: () => setRenameExperience(exp) }`) and Duplicate (`{ key: 'duplicate', label: 'Duplicate', icon: Copy, onClick: () => handleDuplicate(exp), disabled: duplicateExperience.isPending }`); second section has Delete (`{ key: 'delete', label: 'Delete', icon: Trash2, onClick: () => setDeleteExperienceTarget(exp), destructive: true }`). Pass `menuSections` to `ExperienceListItem` instead of `renderMenuItems`. Remove `DropdownMenuItem` and `DropdownMenuSeparator` imports if no longer used.

**Checkpoint**: User Story 1 is fully functional. Creator can duplicate any experience from the list with one click.

---

## Phase 4: User Story 2 — Duplicate Naming with "(Copy)" Suffix (Priority: P2)

**Goal**: Naming logic correctly appends "(Copy)" when absent and preserves it when already present.

**Independent Test**: Duplicate "Photo Booth" → "Photo Booth (Copy)". Duplicate "Photo Booth (Copy)" → "Photo Booth (Copy)" (no double). Duplicate "My Event (Copy) Special" → "My Event (Copy) Special (Copy)".

### Implementation for User Story 2

- [ ] T007 [US2] Verify and refine `generateDuplicateName` in `domains/experience/shared/lib/generate-duplicate-name.ts`. Confirm the function correctly handles all naming scenarios from the contract: (1) "Photo Booth" → "Photo Booth (Copy)", (2) "Photo Booth (Copy)" → "Photo Booth (Copy)" unchanged, (3) "My Event (Copy) Special" → "My Event (Copy) Special (Copy)" — only strip trailing suffix, (4) 100-char name → truncate original to 93 chars + " (Copy)". Ensure the suffix check is case-sensitive and matches only trailing `" (Copy)"` exactly. Test manually in dev server.

**Checkpoint**: Naming logic is verified for all edge cases.

---

## Phase 5: User Story 3 — Duplicate Failure Handling (Priority: P3)

**Goal**: Failed duplication shows error toast, list remains unchanged, no orphaned data.

**Independent Test**: Simulate failure (e.g., disconnect network, delete source experience in another tab). Verify error toast "Couldn't duplicate experience" appears and no new experience is created.

### Implementation for User Story 3

- [ ] T008 [US3] Verify error handling in `useDuplicateExperience` hook in `domains/experience/shared/hooks/useDuplicateExperience.ts`. Confirm: (1) If source document doesn't exist or has `status !== 'active'`, the transaction throws a descriptive error. (2) The `onError` callback calls `Sentry.captureException` with tags `{ domain: 'experience/library', action: 'duplicate-experience' }`. (3) The error surfaces to the caller so the catch block in `ExperiencesPage` can show the toast. Test by attempting to duplicate a deleted experience.
- [ ] T009 [US3] Verify concurrency protection in `domains/experience/library/containers/ExperiencesPage.tsx`. Confirm the `disabled: duplicateExperience.isPending` prop on the Duplicate menu action correctly disables the action while a duplication is in progress. Test by triggering a duplicate and verifying the menu action is disabled until completion.

**Checkpoint**: Error handling verified for all failure cases.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and cleanup across all stories.

- [ ] T010 Run `pnpm check` (format + lint) from `apps/clementine-app/` and fix any issues.
- [ ] T011 Run `pnpm type-check` from `apps/clementine-app/` and fix any TypeScript errors.
- [ ] T012 Manual smoke test in dev server (`pnpm dev`): duplicate an experience, verify it appears in list, verify name, verify draft config, verify not published, verify toast messages.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001 and T002 can run in parallel immediately.
- **Foundational (Phase 2)**: T003 depends on T001 (naming utility) and T002 (input schema). T004 depends on T003.
- **User Story 1 (Phase 3)**: T005 and T006 depend on Phase 2 completion. T006 depends on T005 (component refactor must happen first).
- **User Story 2 (Phase 4)**: T007 depends on T001 only (can run after Phase 1).
- **User Story 3 (Phase 5)**: T008 depends on T003, T009 depends on T006.
- **Polish (Phase 6)**: Depends on all user stories being complete.

### Parallel Opportunities

```text
Parallel batch 1: T001 + T002 (different files, no dependencies)
Sequential:       T003 (depends on T001, T002)
Sequential:       T004 (depends on T003)
Sequential:       T005 (depends on T004 — needs hook exported)
Sequential:       T006 (depends on T005 — needs refactored component)
Can overlap:      T007 can start after T001, independent of T005/T006
Sequential:       T008, T009 (verification tasks, depend on implementation)
Parallel batch 2: T010 + T011 (independent validation commands)
Sequential:       T012 (final smoke test after all validation passes)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001 + T002 in parallel
2. Complete Phase 2: T003 → T004
3. Complete Phase 3: T005 → T006
4. **STOP and VALIDATE**: Duplicate an experience, verify it works end-to-end
5. Run T010 + T011 for code quality

### Incremental Delivery

1. T001 + T002 → Utilities ready
2. T003 + T004 → Mutation hook ready
3. T005 + T006 → **MVP: Duplicate works end-to-end** ✅
4. T007 → Naming edge cases verified
5. T008 + T009 → Error handling verified
6. T010 + T011 + T012 → Polish and validate

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 (naming) is mostly a verification task since the utility is created in Phase 1
- US3 (errors) is mostly verification — error handling is built into the hook in Phase 2
- Commit after each phase for clean git history
- The `ExperienceListItem` refactor (T005) is the only breaking change — update both the component and its consumer in the same commit

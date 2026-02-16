# Tasks: Experience Loading Refactor — Scalable Connect & Fetch

**Input**: Design documents from `/specs/071-exp-connect-scale/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/hooks.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story. US1 and US2 are independent and can run in parallel.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `apps/clementine-app/src/`:

- **Hook (new)**: `domains/project-config/experiences/hooks/usePaginatedExperiencesForSlot.ts`
- **WelcomeEditorPage**: `domains/project-config/welcome/containers/WelcomeEditorPage.tsx`
- **ConnectExperienceDrawer**: `domains/project-config/experiences/components/ConnectExperienceDrawer.tsx`
- **Barrel exports**: `domains/project-config/experiences/index.ts`
- **Old hook (cleanup)**: `domains/project-config/experiences/hooks/useExperiencesForSlot.ts`

---

## Phase 1: User Story 1 — Welcome Editor Fetch by IDs (Priority: P1) — MVP

**Goal**: WelcomeEditorPage fetches only the connected experiences by their IDs instead of loading all workspace experiences. Uses the existing `useExperiencesByIds` hook from `@/domains/experience/shared`.

**Independent Test**: Open the Welcome Editor for a project with 2–3 connected experiences in a workspace with many more. Verify only the connected experiences appear in the preview, the page loads quickly, and empty projects show no experience cards.

### Implementation for User Story 1

- [x] T001 [P] [US1] Refactor WelcomeEditorPage to fetch connected experiences by ID in `apps/clementine-app/src/domains/project-config/welcome/containers/WelcomeEditorPage.tsx`

  **Details:**
  1. Remove the `useExperiencesForSlot` import (line 26–28) and its usage (lines 60–63 fetching `availableExperiences`)
  2. Remove `useExperiencesForSlot` from the import at `../hooks` (if re-exported) or from `@/domains/project-config/experiences`
  3. Add import: `import { useExperiencesByIds } from '@/domains/experience/shared'`
  4. Add `mainExperienceIds` useMemo:
     ```typescript
     const mainExperienceIds = useMemo(
       () => mainExperiences.map((exp) => exp.experienceId),
       [mainExperiences],
     )
     ```
  5. Call the hook:
     ```typescript
     const { data: connectedExperiences = [] } = useExperiencesByIds(
       workspace?.id ?? '',
       mainExperienceIds,
     )
     ```
  6. Update `mainExperienceDetails` useMemo to use `connectedExperiences` instead of `availableExperiences`:
     ```typescript
     const mainExperienceDetails: ExperienceCardData[] = useMemo(() => {
       const experienceMap = new Map(
         connectedExperiences.map((exp) => [exp.id, exp]),
       )
       return mainExperiences
         .map((ref) => experienceMap.get(ref.experienceId))
         .filter((exp): exp is NonNullable<typeof exp> => exp !== undefined)
         .map((exp) => ({
           id: exp.id,
           name: exp.name,
           thumbnailUrl: exp.media?.url ?? null,
         }))
     }, [mainExperiences, connectedExperiences])
     ```
  7. All props to `WelcomeRenderer` and `WelcomeConfigPanel` remain unchanged
  8. Verify: `pnpm app:type-check` passes

**Checkpoint**: Welcome Editor preview shows correct experience cards fetched by ID. Empty projects show empty state. No all-experiences query fires.

---

## Phase 2: User Story 2 + 3 — Paginated Drawer with Load More (Priority: P1 + P2)

**Goal**: ConnectExperienceDrawer loads experiences in configurable page-sized batches with a "Load More" button. Default page size is 20, configurable via code (US3 — DX concern).

**Independent Test**: Open the Connect Experience drawer in a workspace with more than 20 experiences. Verify the first page loads, "Load More" appears, clicking it appends the next batch, and search filters across all loaded pages. Verify the button hides when all pages are loaded.

### Implementation for User Story 2

- [x] T002 [P] [US2] Create `usePaginatedExperiencesForSlot` hook in `apps/clementine-app/src/domains/project-config/experiences/hooks/usePaginatedExperiencesForSlot.ts`

  **Details:**
  1. Create the new file with the hook following the contract in `contracts/hooks.md`
  2. Define query key factory:
     ```typescript
     const paginatedSlotExperiencesKeys = {
       all: ['experiences', 'slot', 'paginated'] as const,
       list: (workspaceId: string, slot: SlotType) =>
         [...paginatedSlotExperiencesKeys.all, workspaceId, slot] as const,
     }
     ```
  3. Implement using `useInfiniteQuery` from `@tanstack/react-query`:
     - `queryFn` receives `{ pageParam }` — a `DocumentSnapshot | null` cursor
     - Build Firestore query: `where('status', '==', 'active')`, `where('profile', 'in', SLOT_PROFILES[slot])`, `orderBy('createdAt', 'desc')`, `limit(pageSize)`
     - If `pageParam` is not null, add `startAfter(pageParam)` to the query
     - Execute with `getDocs` (not `onSnapshot` — no real-time needed)
     - Convert docs with `convertFirestoreDoc(docSnapshot, experienceSchema)`
     - Return `{ experiences: Experience[], lastDoc: DocumentSnapshot | null }`
  4. Configure `getNextPageParam`: return `lastPage.lastDoc` if `lastPage.experiences.length === pageSize`, else `undefined`
  5. Set `initialPageParam: null as DocumentSnapshot | null`
  6. Set `enabled: !!workspaceId`
  7. Return a flattened result object:
     ```typescript
     {
       experiences: data?.pages.flatMap((page) => page.experiences) ?? [],
       isLoading,
       isFetchingNextPage,
       hasNextPage: hasNextPage ?? false,
       fetchNextPage,
     }
     ```
  8. Default `pageSize` to 20 when not provided (US3 — configurable page size)
  9. Export `paginatedSlotExperiencesKeys` for cache invalidation
  10. Verify: `pnpm app:type-check` passes

- [x] T003 [P] [US2] Add barrel export for new hook in `apps/clementine-app/src/domains/project-config/experiences/index.ts`

  **Details:**
  1. Add line: `export * from './hooks/usePaginatedExperiencesForSlot'`
  2. Keep existing `useExperiencesForSlot` export (removed in cleanup phase)

- [x] T004 [US2] Update ConnectExperienceDrawer to use paginated hook and add Load More UI in `apps/clementine-app/src/domains/project-config/experiences/components/ConnectExperienceDrawer.tsx`

  **Details:**
  1. Replace `useExperiencesForSlot` import with `usePaginatedExperiencesForSlot` from `../hooks/usePaginatedExperiencesForSlot`
  2. Add `pageSize?: number` to `ConnectExperienceDrawerProps` interface (with JSDoc: `/** Number of experiences to load per page. Default: 20 */`)
  3. Replace the hook call:
     ```typescript
     // Before:
     const { data: experiences = [], isLoading } = useExperiencesForSlot(workspaceId, slot)

     // After:
     const {
       experiences,
       isLoading,
       isFetchingNextPage,
       hasNextPage,
       fetchNextPage,
     } = usePaginatedExperiencesForSlot(workspaceId, slot, { pageSize })
     ```
  4. Update `filteredExperiences` useMemo to use `experiences` (already works — same type)
  5. Add "Load More" button after the experience list `<div className="space-y-2">` block:
     ```tsx
     {hasNextPage && (
       <div className="flex justify-center py-3">
         <Button
           variant="outline"
           size="sm"
           onClick={() => fetchNextPage()}
           disabled={isFetchingNextPage}
           className="gap-2"
         >
           {isFetchingNextPage ? (
             <>
               <Loader2 className="h-4 w-4 animate-spin" />
               Loading...
             </>
           ) : (
             'Load More'
           )}
         </Button>
       </div>
     )}
     ```
  6. Add `Loader2` to the lucide-react import
  7. Ensure empty states still work: zero results on first page shows "No compatible experiences", zero search results shows "No experiences found"
  8. The "Load More" button should appear OUTSIDE the search filter — it's based on `hasNextPage` (server-side), not filtered results
  9. Verify: `pnpm app:type-check` passes

**Checkpoint**: Drawer loads first page on open. "Load More" appends next batch. Button hides when all loaded. Search works across loaded pages. Assigned experiences show "in use" badge. Custom pageSize works when passed via prop.

---

## Phase 3: Polish & Cleanup

**Purpose**: Remove dead code and run validation gates

- [x] T005 Remove `useExperiencesForSlot` hook and its barrel export now that it has zero consumers

  **Details:**
  1. Verify no imports remain: search for `useExperiencesForSlot` across the codebase
  2. Delete file: `apps/clementine-app/src/domains/project-config/experiences/hooks/useExperiencesForSlot.ts`
  3. Remove barrel export from `apps/clementine-app/src/domains/project-config/experiences/index.ts`: delete the line `export * from './hooks/useExperiencesForSlot'`
  4. Also remove `slotExperiencesQuery` and `slotExperiencesKeys` exports if they were only used by that hook
  5. Verify: `pnpm app:type-check` passes with no broken imports

- [x] T006 Run validation gates: `pnpm app:check` and `pnpm app:type-check` from `apps/clementine-app/`

  **Details:**
  1. Run `pnpm app:check` (format + lint fixes)
  2. Run `pnpm app:type-check` (TypeScript strict mode)
  3. Fix any issues found
  4. Verify dev server starts: `pnpm app:dev`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: No dependencies — can start immediately
- **Phase 2 (US2+US3)**: No dependencies — can start immediately (parallel with Phase 1)
  - T004 depends on T002 (hook must exist before drawer can use it)
  - T003 can run in parallel with T002
- **Phase 3 (Polish)**: Depends on Phase 1 AND Phase 2 completion
  - T005 depends on both T001 and T004 (both old consumers must be migrated)
  - T006 depends on T005

### User Story Dependencies

- **User Story 1 (P1)**: Independent — no dependencies on other stories
- **User Story 2 (P1)**: Independent — no dependencies on other stories
- **User Story 3 (P2)**: Delivered as part of US2 (pageSize parameter on hook + prop on drawer)

### Parallel Opportunities

- **T001 and T002+T003**: Can run in parallel (different files, different domains)
- **T002 and T003**: Can run in parallel (different files)

---

## Parallel Example: Full Feature

```
# Phase 1 + 2 can run in parallel:

Agent A (US1):
  T001: Refactor WelcomeEditorPage

Agent B (US2):
  T002: Create usePaginatedExperiencesForSlot hook
  T003: Update barrel exports (parallel with T002)
  T004: Update ConnectExperienceDrawer (after T002)

# Phase 3 (after both agents complete):
  T005: Remove useExperiencesForSlot
  T006: Validation gates
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001: WelcomeEditorPage refactor
2. **STOP and VALIDATE**: Open Welcome Editor, verify preview works correctly
3. This alone delivers significant value — removes the all-experiences query from the editor

### Incremental Delivery

1. T001 → Welcome Editor fixed (MVP)
2. T002 + T003 + T004 → Drawer paginated (full feature)
3. T005 + T006 → Dead code removed, validation clean

### Single Developer (Sequential)

1. T001 → T002 → T003 → T004 → T005 → T006

---

## Notes

- US3 (configurable page size) is baked into US2 — the `pageSize` option on the hook and prop on the drawer. No separate phase needed.
- `useExperiencesByIds` (reused in US1) already handles empty arrays, missing docs, and disabled state — no edge case code needed in WelcomeEditorPage.
- The new `usePaginatedExperiencesForSlot` hook is the first `useInfiniteQuery` usage in the codebase — it establishes the pattern for future paginated queries.
- Firestore composite index for `status + profile + createdAt` already exists (used by the old hook).

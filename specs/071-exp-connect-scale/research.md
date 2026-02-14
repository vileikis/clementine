# Research: Experience Loading Refactor — Scalable Connect & Fetch

**Branch**: `071-exp-connect-scale` | **Date**: 2026-02-14

## R1: WelcomeEditorPage — Fetch Connected Experiences by ID

### Decision
Reuse the existing `useExperiencesByIds` hook from `@/domains/experience/shared` to fetch only the connected experiences in WelcomeEditorPage.

### Rationale
- **Hook already exists**: `useExperiencesByIds(workspaceId, experienceIds, options?)` wraps `experiencesByIdsQuery` which uses Firestore `documentId() in [ids]` — exactly what we need.
- **Already proven in production**: Used by `GuestLayout` for the same purpose (fetching connected experiences by ID).
- **No real-time needed**: WelcomeEditorPage only needs the current state of connected experiences. The project itself already has a real-time listener via `useProject`, so when experiences are added/removed from the project config, the IDs update, triggering a re-fetch of the experience details.
- **Performance**: Fetches 1–10 experiences instead of potentially hundreds. Single batch query.

### Alternatives Considered
1. **Create a new hook with real-time listener** — Rejected. Over-engineering. Experience name/thumbnail changes are rare during an active editing session. The `useExperiencesByIds` cache will be refreshed whenever the component re-renders with new IDs.
2. **Inline the query in WelcomeEditorPage** — Rejected. `useExperiencesByIds` already exists with proper caching, enabled logic, and batch query handling.

### Implementation Details
- Import `useExperiencesByIds` from `@/domains/experience/shared`
- Extract `mainExperienceIds` from `mainExperiences.map(exp => exp.experienceId)` via `useMemo`
- Pass `workspace.id` (with empty string fallback) and `mainExperienceIds` to the hook
- Derive `mainExperienceDetails: ExperienceCardData[]` from the fetched experiences (same mapping logic, different source)
- Remove `useExperiencesForSlot` import and usage from WelcomeEditorPage

### Edge Cases
- **Empty IDs array**: `useExperiencesByIds` returns `[]` immediately when `experienceIds.length === 0` — no query fired.
- **Missing experience**: Firestore `in` query silently omits missing docs. Existing `.filter()` logic handles `undefined` entries.
- **Workspace not loaded**: Hook disables itself when `workspaceId` is falsy (via `enabled` option).

---

## R2: ConnectExperienceDrawer — Paginated Loading with Load More

### Decision
Create a new `usePaginatedExperiencesForSlot` hook using TanStack Query's `useInfiniteQuery` with Firestore cursor-based pagination (`startAfter` + `limit`).

### Rationale
- **First pagination in codebase**: No existing patterns to follow, so this establishes the pattern.
- **`useInfiniteQuery` is ideal**: TanStack Query 5.66.5 has full support. It manages page accumulation, `fetchNextPage`, `hasNextPage`, and `isFetchingNextPage` — exactly matching the "Load More" UX.
- **Firestore cursor pagination**: `startAfter(lastDoc)` + `limit(pageSize)` is the standard Firestore approach. Efficient, consistent ordering, no offset-based skipping.
- **No real-time for paginated drawer**: The drawer is a transient UI — opened, selection made, closed. Real-time updates add complexity with no meaningful UX benefit. Manual refetch on drawer re-open is sufficient.

### Alternatives Considered
1. **`useInfiniteQuery` with `onSnapshot`** — Rejected. Managing multiple real-time listeners across pages is complex and unnecessary for a transient selection drawer.
2. **Client-side pagination of full dataset** — Rejected. Defeats the purpose — still loads all experiences from Firestore.
3. **Server-side search with pagination** — Rejected (out of scope). Firestore doesn't support full-text search. Would require Algolia/Typesense integration. Client-side search on loaded pages is acceptable.

### Implementation Details

#### New Hook: `usePaginatedExperiencesForSlot`

**Signature:**
```typescript
function usePaginatedExperiencesForSlot(
  workspaceId: string | undefined,
  slot: SlotType,
  options?: { pageSize?: number }
)
```

**Returns:** TanStack Query infinite query result with flattened experiences array:
```typescript
{
  experiences: Experience[]         // All loaded experiences (flattened from pages)
  isLoading: boolean               // Initial load
  isFetchingNextPage: boolean      // Loading more
  hasNextPage: boolean             // More pages available
  fetchNextPage: () => void        // Load next page
}
```

**Firestore query:**
```typescript
query(
  collection(firestore, `workspaces/${workspaceId}/experiences`),
  where('status', '==', 'active'),
  where('profile', 'in', SLOT_PROFILES[slot]),
  orderBy('createdAt', 'desc'),
  limit(pageSize),
  ...(cursor ? [startAfter(cursor)] : []),
)
```

**Page param:** The last `DocumentSnapshot` from the previous page. TanStack Query's `getNextPageParam` checks if the returned page has fewer items than `pageSize` to determine `hasNextPage`.

#### ConnectExperienceDrawer Changes

- Replace `useExperiencesForSlot` with `usePaginatedExperiencesForSlot`
- Add "Load More" button at the bottom of the experience list
- Show loading spinner during `isFetchingNextPage`
- Hide button when `!hasNextPage`
- Client-side search filters across `experiences` (all loaded pages, flattened)

### Edge Cases
- **Zero results on first page**: Empty state shown, no "Load More" button.
- **Fewer items than page size on first page**: `hasNextPage` is `false`, no "Load More" button.
- **Search with "Load More"**: Search filters loaded pages client-side. "Load More" remains visible based on `hasNextPage` (server-side), not search results. This means unloaded pages may contain matches.
- **Drawer re-open**: Query is cached by TanStack Query. Stale data shows immediately, refetch can happen in background if configured.

---

## R3: Page Size Configuration

### Decision
Default page size of 20. Configurable via `options.pageSize` parameter on the hook. Not exposed in UI.

### Rationale
- **20 is a reasonable default**: Covers most workspaces. Not too many for initial load, not too few for browsing.
- **Code-level config**: Consumer passes `{ pageSize: N }` to the hook. Simple, no UI needed.
- **Consistent with spec**: P2 user story explicitly states "DX concern, not user-facing UI."

### Alternatives Considered
1. **Constants file / environment variable** — Rejected. Over-engineering for a hook parameter.
2. **Dynamic page size based on viewport** — Rejected. Unnecessary complexity for a drawer.

---

## R4: Cleanup of `useExperiencesForSlot`

### Decision
Keep `useExperiencesForSlot` but remove its usage from `WelcomeEditorPage`. It will eventually be replaced entirely by the paginated version, but for this feature we only modify its consumers.

### Rationale
- **Minimal blast radius**: Don't delete the hook yet. It may have other future uses or the paginated version may need iteration.
- **Focus on consumer changes**: WelcomeEditorPage stops using it. ConnectExperienceDrawer switches to the paginated version.
- **Clean removal later**: Once both consumers are migrated, the old hook can be safely deleted.

### Post-Design Note
After migration, `useExperiencesForSlot` will have zero consumers. It should be deleted in a follow-up or as part of this feature's cleanup task.

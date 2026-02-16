# Hook Contracts: Experience Loading Refactor

**Branch**: `071-exp-connect-scale` | **Date**: 2026-02-14

## Contract 1: `usePaginatedExperiencesForSlot` (NEW)

**File**: `apps/clementine-app/src/domains/project-config/experiences/hooks/usePaginatedExperiencesForSlot.ts`

### Signature

```typescript
interface UsePaginatedExperiencesForSlotOptions {
  /** Number of experiences to load per page. Default: 20 */
  pageSize?: number
}

interface UsePaginatedExperiencesForSlotResult {
  /** All loaded experiences (flattened across pages) */
  experiences: Experience[]
  /** True during initial load */
  isLoading: boolean
  /** True while fetching the next page */
  isFetchingNextPage: boolean
  /** True if more pages are available */
  hasNextPage: boolean
  /** Trigger loading the next page */
  fetchNextPage: () => void
}

function usePaginatedExperiencesForSlot(
  workspaceId: string | undefined,
  slot: SlotType,
  options?: UsePaginatedExperiencesForSlotOptions,
): UsePaginatedExperiencesForSlotResult
```

### Behavior

1. **Initial load**: Fetches `pageSize` experiences matching `SLOT_PROFILES[slot]`, ordered by `createdAt desc`.
2. **Load more**: `fetchNextPage()` fetches the next `pageSize` using `startAfter(lastDoc)`.
3. **Has next page**: Determined by whether the last page returned exactly `pageSize` items.
4. **Disabled**: Returns empty state when `workspaceId` is `undefined`.
5. **No real-time**: Uses `getDocs` (one-time fetch), not `onSnapshot`.
6. **Cache**: Uses TanStack Query infinite query caching with key `['experiences', 'slot', 'paginated', workspaceId, slot]`.

### Query Key

```typescript
const paginatedSlotExperiencesKeys = {
  all: ['experiences', 'slot', 'paginated'] as const,
  list: (workspaceId: string, slot: SlotType) =>
    [...paginatedSlotExperiencesKeys.all, workspaceId, slot] as const,
}
```

---

## Contract 2: `useExperiencesByIds` (EXISTING — No Changes)

**File**: `apps/clementine-app/src/domains/experience/shared/hooks/useExperiencesByIds.ts`

### Signature (unchanged)

```typescript
function useExperiencesByIds(
  workspaceId: string,
  experienceIds: string[],
  options?: { enabled?: boolean },
): UseQueryResult<Experience[]>
```

### New Consumer

`WelcomeEditorPage` will call this hook with:
- `workspaceId`: `workspace.id` (with empty string fallback when workspace is loading)
- `experienceIds`: `mainExperiences.map(exp => exp.experienceId)` (via `useMemo`)

---

## Contract 3: `ConnectExperienceDrawer` Props (MODIFIED)

**File**: `apps/clementine-app/src/domains/project-config/experiences/components/ConnectExperienceDrawer.tsx`

### Props Changes

```typescript
export interface ConnectExperienceDrawerProps {
  // Existing (unchanged)
  open: boolean
  onOpenChange: (open: boolean) => void
  slot: SlotType
  workspaceId: string
  workspaceSlug: string
  assignedExperienceIds: string[]
  onSelect: (experienceId: string) => void

  // New (optional)
  /** Number of experiences to load per page. Default: 20 */
  pageSize?: number
}
```

### Behavior Changes

- **Data source**: Switches from `useExperiencesForSlot` to `usePaginatedExperiencesForSlot`
- **Load More button**: Appears at bottom of list when `hasNextPage` is `true`
- **Loading indicator**: Shows spinner during `isFetchingNextPage`
- **Search**: Client-side filter across all loaded pages (unchanged behavior, different scope)
- **Empty state**: Unchanged — "No compatible experiences" / "No experiences found" messages

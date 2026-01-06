# Data Model: Event Designer - Global Changes Tracker

**Feature**: 014-event-designer-global-changes-tracker
**Date**: 2026-01-06
**Status**: Complete

## Overview

This feature introduces a **client-side only** state management layer for tracking save operations in the event designer. No database schema changes are required. All entities are TypeScript interfaces for in-memory state.

## Entities

### 1. EventDesignerStore

**Purpose**: Global Zustand store for event designer UI state

**Type**: Client-side state (Zustand store)

**Location**: `apps/clementine-app/app/domains/event/designer/stores/useEventDesignerStore.ts`

**Schema**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `pendingSaves` | `number` | Yes | `0` | Count of ongoing save operations. Increments when save starts, decrements when save completes (success or error). |
| `lastCompletedAt` | `number \| null` | Yes | `null` | Timestamp (milliseconds) when all saves completed. Only set when `pendingSaves` reaches 0. Used to trigger 3-second success indicator. |

**Actions**:

| Action | Signature | Description |
|--------|-----------|-------------|
| `startSave` | `() => void` | Increment `pendingSaves` by 1. Called when mutation transitions to `isPending`. |
| `completeSave` | `() => void` | Decrement `pendingSaves` by 1. If counter reaches 0, set `lastCompletedAt` to `Date.now()`. |
| `resetSaveState` | `() => void` | Reset store to initial state (`pendingSaves: 0`, `lastCompletedAt: null`). Called on component unmount. |

**Validation Rules**:
- `pendingSaves` must never go negative (defensive check in `completeSave`)
- `lastCompletedAt` only updates when `pendingSaves === 0` (ensures all saves complete before showing success)

**State Transitions**:

```
Initial: { pendingSaves: 0, lastCompletedAt: null }

startSave() → { pendingSaves: 1, lastCompletedAt: null }
startSave() → { pendingSaves: 2, lastCompletedAt: null }
completeSave() → { pendingSaves: 1, lastCompletedAt: null } (still pending)
completeSave() → { pendingSaves: 0, lastCompletedAt: Date.now() } (all done)

After 3 seconds (component logic): checkmark expires

resetSaveState() → { pendingSaves: 0, lastCompletedAt: null }
```

**Derived State** (computed in component):

| Derived Field | Type | Computation | Description |
|---------------|------|-------------|-------------|
| `isSaving` | `boolean` | `pendingSaves > 0` | True when any save is in progress |
| `showSuccess` | `boolean` | `pendingSaves === 0 && lastCompletedAt !== null && (Date.now() - lastCompletedAt < 3000)` | True for 3 seconds after all saves complete (requires timer in component) |

**Relationships**: None (client-side only, no backend persistence)

---

### 2. SaveStatus (Derived State)

**Purpose**: UI state for status indicators component

**Type**: Derived from `EventDesignerStore` + component-level timer state

**Location**: `apps/clementine-app/app/domains/event/designer/components/DesignerStatusIndicators.tsx`

**Schema** (component state):

| Field | Type | Description |
|-------|------|-------------|
| `isSaving` | `boolean` | Derived from `pendingSaves > 0` |
| `showSuccess` | `boolean` | Component state managed by `useState` + `useEffect` timer |

**State Logic**:

```typescript
const { pendingSaves, lastCompletedAt } = useEventDesignerStore()
const [showSuccess, setShowSuccess] = useState(false)

const isSaving = pendingSaves > 0

useEffect(() => {
  if (lastCompletedAt === null) {
    setShowSuccess(false)
    return
  }

  const elapsed = Date.now() - lastCompletedAt

  if (elapsed < 3000) {
    setShowSuccess(true)
    const timer = setTimeout(() => setShowSuccess(false), 3000 - elapsed)
    return () => clearTimeout(timer) // Cleanup
  } else {
    setShowSuccess(false)
  }
}, [lastCompletedAt])
```

**UI Rendering**:

| Condition | Rendered Component |
|-----------|-------------------|
| `isSaving === true` | `<Loader2>` spinner icon |
| `isSaving === false && showSuccess === true` | `<Check>` checkmark icon |
| `isSaving === false && showSuccess === false` | Nothing (null) |

---

### 3. MutationTrackingState (Internal to useTrackedMutation)

**Purpose**: Track previous mutation state to detect transitions

**Type**: Component-level ref state (not persisted)

**Location**: `apps/clementine-app/app/domains/event/designer/hooks/useTrackedMutation.ts`

**Schema** (internal ref):

| Field | Type | Description |
|-------|------|-------------|
| `prevIsPending` | `React.MutableRefObject<boolean>` | Previous value of `mutation.isPending`. Used to detect state transitions. |

**State Transitions**:

```
// Mutation starts
mutation.isPending: false → true
prevIsPending.current: false
Detect transition → call startSave()
Update prevIsPending.current: true

// Mutation completes (success or error)
mutation.isPending: true → false
prevIsPending.current: true
Detect transition → call completeSave()
Update prevIsPending.current: false
```

**Validation Rules**:
- Only call `startSave()` on `false → true` transition (prevents double-counting on re-renders)
- Only call `completeSave()` on `true → false` transition
- Always update ref after comparison

---

## Data Flow

### 1. Save Operation Lifecycle

```
User Action (e.g., toggle share option)
  ↓
Domain Hook (useUpdateShareOptions.mutate())
  ↓
TanStack Query Mutation
  ↓
mutation.isPending: false → true
  ↓
useTrackedMutation detects transition
  ↓
Calls useEventDesignerStore.startSave()
  ↓
Store: pendingSaves increments (0 → 1)
  ↓
UI: DesignerStatusIndicators sees isSaving === true
  ↓
Render: <Loader2> spinner appears
  ↓
Firestore transaction completes
  ↓
mutation.isPending: true → false
  ↓
useTrackedMutation detects transition
  ↓
Calls useEventDesignerStore.completeSave()
  ↓
Store: pendingSaves decrements (1 → 0), lastCompletedAt = Date.now()
  ↓
UI: DesignerStatusIndicators sees showSuccess === true (via useEffect timer)
  ↓
Render: <Check> checkmark appears
  ↓
After 3 seconds (setTimeout cleanup)
  ↓
UI: showSuccess → false
  ↓
Render: Nothing (indicator hidden)
```

### 2. Multiple Concurrent Saves

```
User uploads 1:1 overlay → Save 1 starts → pendingSaves: 0 → 1
User uploads 9:16 overlay → Save 2 starts → pendingSaves: 1 → 2
User toggles Instagram → Save 3 starts → pendingSaves: 2 → 3

Spinner shows (pendingSaves > 0)

Save 1 completes → pendingSaves: 3 → 2 (spinner stays)
Save 2 completes → pendingSaves: 2 → 1 (spinner stays)
Save 3 completes → pendingSaves: 1 → 0, lastCompletedAt = Date.now()

Spinner → Checkmark transition
After 3 seconds: Checkmark → Hidden
```

### 3. Save Error Handling

```
User action → Save starts → pendingSaves: 0 → 1 → Spinner shows
Network error occurs
mutation.isPending: true → false (error state)
completeSave() called → pendingSaves: 1 → 0
No lastCompletedAt update (only on success via TanStack Query onSuccess)
Spinner hides immediately (isSaving === false)
Toast notification shows error message (existing behavior)
```

---

## Integration with Existing Data Model

### No Database Changes

This feature does NOT modify the existing Firestore schema:

**Existing Event Schema** (unchanged):
```typescript
{
  draftConfig: ProjectEventConfig | null,      // Still updated via existing hooks
  publishedConfig: ProjectEventConfig | null,  // Still updated on publish
  draftVersion: number,                         // Still incremented on save
  publishedVersion: number | null,              // Still set on publish
  publishedAt: number | null                    // Still updated on publish
}
```

**Integration Points**:
- `useUpdateOverlays` and `useUpdateShareOptions` still call `updateEventConfigField()`
- Firestore transactions still increment `draftVersion`
- TanStack Query cache invalidation still occurs
- **NEW**: Mutations wrapped with `useTrackedMutation` report state to store

---

## TypeScript Interfaces

### EventDesignerStore

```typescript
interface EventDesignerStore {
  // State
  pendingSaves: number
  lastCompletedAt: number | null

  // Actions
  startSave: () => void
  completeSave: () => void
  resetSaveState: () => void
}
```

### useTrackedMutation

```typescript
function useTrackedMutation<TData, TError, TVariables>(
  mutation: UseMutationResult<TData, TError, TVariables>
): UseMutationResult<TData, TError, TVariables>
```

**Generic Parameters**:
- `TData`: Mutation success data type
- `TError`: Mutation error type
- `TVariables`: Mutation variables type

**Returns**: Same mutation result (passthrough)

---

## Validation

### Store Actions

**startSave**:
- ✅ Increment is atomic (Zustand `set` is synchronous)
- ✅ No validation needed (always safe to increment)

**completeSave**:
- ✅ Decrement checks `newCount >= 0` (defensive programming)
- ✅ Only sets `lastCompletedAt` when `newCount === 0`

**resetSaveState**:
- ✅ Always resets to valid initial state

### Mutation Tracking

**useTrackedMutation**:
- ✅ Detects transitions, not current state (prevents double-counting)
- ✅ Works with React Strict Mode (double useEffect calls handled correctly)
- ✅ Cleanup not needed (no timers, refs are stable)

### Component State

**DesignerStatusIndicators**:
- ✅ Timer cleanup on unmount (prevents memory leaks)
- ✅ Timer cleanup on dependency change (prevents stale timers)
- ✅ Handles rapid state changes (timer resets correctly)

---

## Testing Strategy

### Unit Tests

**Store Tests** (`stores/useEventDesignerStore.test.ts` - collocated):
- ✅ startSave increments counter
- ✅ completeSave decrements counter
- ✅ completeSave sets lastCompletedAt when counter reaches 0
- ✅ completeSave does NOT set lastCompletedAt when counter > 0
- ✅ resetSaveState clears all state

**Tracking Hook Tests** (`hooks/useTrackedMutation.test.ts` - collocated):
- ✅ Detects idle → pending transition, calls startSave
- ✅ Detects pending → idle transition, calls completeSave
- ✅ Does NOT double-count on re-renders (useRef check)
- ✅ Works with React Strict Mode double mounting

**Component Tests** (`components/DesignerStatusIndicators.test.tsx` - collocated):
- ✅ Shows spinner when pendingSaves > 0
- ✅ Shows checkmark when lastCompletedAt within 3 seconds
- ✅ Hides checkmark after 3 seconds
- ✅ Cleans up timer on unmount
- ✅ Shows nothing when idle

### Integration Tests

**Manual Testing** (in EventDesignerLayout):
- ✅ Single save: spinner → checkmark → hidden
- ✅ Multiple concurrent saves: spinner stays until all complete
- ✅ Save error: spinner disappears, no checkmark
- ✅ New save during checkmark: checkmark → spinner immediately

---

## Performance Considerations

### Store Updates
- Zustand updates are synchronous and batched by React
- No performance concerns (simple counter increment/decrement)

### Component Re-renders
- `useEventDesignerStore` only triggers re-render when subscribed state changes
- Derived state (`isSaving`) computed in component (no extra renders)
- Timer uses `setTimeout` (no `setInterval` polling)

### Memory
- Timer cleanup in `useEffect` prevents memory leaks
- Ref (`prevIsPending`) has no memory overhead
- Store state is minimal (2 fields)

### Scale
- Handles 10+ concurrent saves efficiently (just counter increments)
- No N+1 problems (no loops or nested operations)

---

## Future Enhancements

### Per-Field Tracking

Add field-level save state to store:

```typescript
interface FieldSaveState {
  fieldPath: string                 // 'sharing.download', 'overlays.1:1'
  status: 'idle' | 'pending' | 'success' | 'error'
  startedAt: number
  completedAt: number | null
}

interface EventDesignerStore {
  // Existing
  pendingSaves: number
  lastCompletedAt: number | null

  // New
  fieldSaves: FieldSaveState[]

  // New actions
  startFieldSave: (fieldPath: string) => void
  completeFieldSave: (fieldPath: string, status: 'success' | 'error') => void
}
```

**Use cases**:
- Show spinner next to specific field being saved
- Highlight recently saved fields (green glow animation)
- Show which fields failed to save

### Save Analytics

Track save performance metrics:

```typescript
interface SaveMetrics {
  totalSaves: number
  avgDuration: number
  slowSaves: number
  failedSaves: number
  concurrentSavesPeak: number
}
```

**Use cases**:
- Debug slow saves
- Identify performance bottlenecks
- Monitor error rates

---

## Conclusion

This data model introduces minimal client-side state (2 fields, 3 actions) with clean separation of concerns. No backend changes required. All logic is testable and follows existing patterns (Zustand for state, TanStack Query for mutations).

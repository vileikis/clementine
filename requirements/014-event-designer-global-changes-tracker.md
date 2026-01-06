# 014: Event Designer - Global Changes Tracker

**Status**: Draft
**Created**: 2026-01-06
**Domain**: Events (Event Designer - Global State)
**Depends On**: 012-event-settings-sharing-and-publish.md, 013-event-settings-overlays.md

## Overview

Implement a global state management system to track real-time saving status across all event configuration changes. This enhances user experience by providing clear visual feedback about ongoing saves, successful saves, and unpublished changes.

**Key Features**:
1. **Unpublished changes indicator** - Shows when draft differs from published version
2. **Saving status indicator** - Shows real-time saving progress with spinner
3. **Success confirmation** - Shows checkmark for 3 seconds after successful save
4. **Reference counting** - Handles multiple concurrent saves gracefully
5. **Global state store** - Zustand store tracks all mutation states

## Goals & Objectives

### Primary Goals
1. ✅ Provide real-time visual feedback for all save operations
2. ✅ Track multiple concurrent saves without race conditions
3. ✅ Show unpublished changes status clearly
4. ✅ Improve user confidence through clear status indicators
5. ✅ Maintain clean separation of concerns (tracking logic separate from domain logic)

### Success Criteria
- Users can see when saves are in progress (spinner)
- Users receive confirmation when saves complete (checkmark for 3s)
- Multiple concurrent saves are handled correctly (no race conditions)
- Unpublished changes badge shows when draft ≠ published
- All existing mutation hooks work with zero breaking changes
- Status indicators are positioned logically in top nav bar

## Current System

### Existing Implementation

**Event Schema**: `@domains/event/shared/schemas/project-event-full.schema.ts`

```typescript
{
  draftConfig: ProjectEventConfig | null,      // Work in progress
  publishedConfig: ProjectEventConfig | null,  // Live for guests
  draftVersion: number,                         // Increments on each save
  publishedVersion: number | null,              // Set on publish
  publishedAt: number | null                    // Publish timestamp
}
```

**Mutation Pattern**: Domain-specific hooks use `updateEventConfigField`

Example hooks:
- `@domains/event/settings/hooks/useUpdateOverlays.ts`
- `@domains/event/settings/hooks/useUpdateShareOptions.ts`

Both hooks:
1. Validate updates with Zod schema
2. Transform to dot notation (e.g., `'sharing.download'`)
3. Call `updateEventConfigField(projectId, eventId, updates)`
4. Increment `draftVersion` via Firestore transaction
5. Invalidate TanStack Query cache
6. Report errors to Sentry

**Change Detection**: `@domains/event/designer/containers/EventDesignerLayout.tsx`

```typescript
const hasUnpublishedChanges = useMemo(() => {
  if (event.publishedVersion === null) return true // Never published
  return event.draftVersion !== null && event.draftVersion > event.publishedVersion
}, [event.draftVersion, event.publishedVersion])
```

**Current UI**:
```
TopNavBar Layout:
[left slot: "New changes" badge] ... [right slot: Preview | Publish]
```

### Limitations

1. **No save progress feedback** - Users don't know if save is in progress
2. **No save confirmation** - No visual confirmation that save succeeded
3. **Multiple saves unclear** - With auto-save, multiple fields can save simultaneously
4. **Status location** - Change indicator is far from Publish button

## Proposed Changes

### New UI Layout

**TopNavBar right slot** (left to right):
```
[Saving spinner OR Success checkmark] [Unpublished changes badge] [Preview] [Publish]
```

**Visual States**:

1. **Idle (no changes)**: Nothing shown
   ```
   [Preview] [Publish (disabled)]
   ```

2. **Saving in progress**:
   ```
   [⏳ Spinner] [🟡 New changes] [Preview] [Publish (disabled)]
   ```

3. **Save complete (3 seconds)**:
   ```
   [✅ Checkmark] [🟡 New changes] [Preview] [Publish (enabled)]
   ```

4. **Multiple saves (1 done, 2 pending)**:
   ```
   [⏳ Spinner] [🟡 New changes] [Preview] [Publish (disabled)]
   ```
   *(Spinner stays until ALL saves complete)*

5. **All saves complete (3 seconds)**:
   ```
   [✅ Checkmark] [🟡 New changes] [Preview] [Publish (enabled)]
   ```

6. **After 3 seconds (checkmark expires)**:
   ```
   [🟡 New changes] [Preview] [Publish (enabled)]
   ```

### Behavior Rules

**Unpublished Changes Badge**:
- ✅ Always visible when `draftVersion > publishedVersion`
- ✅ Stays visible even during saves
- ✅ Positioned next to Publish button (visual grouping)

**Saving Indicator**:
- ✅ Shows spinner while ANY save is pending
- ✅ Counts concurrent saves (reference counting)
- ✅ Only shows checkmark when ALL saves complete
- ✅ Checkmark displays for exactly 3 seconds
- ✅ New save replaces checkmark with spinner immediately

**Error Handling**:
- ✅ Toast notifications handle error messaging
- ✅ Spinner removes on error (no error icon in top bar)
- ✅ Counter decrements whether save succeeds or fails

## Technical Implementation

### 1. Zustand Store

**File**: `@domains/event/designer/stores/useEventDesignerStore.ts`

**Purpose**: Global state for event designer (saves tracking, future features)

**Store Schema**:
```typescript
interface EventDesignerStore {
  // Save tracking state
  pendingSaves: number           // Count of ongoing saves (0 = idle)
  lastCompletedAt: number | null // Timestamp when all saves completed

  // Actions
  startSave: () => void          // Increment counter
  completeSave: () => void       // Decrement counter, set timestamp if done
  resetSaveState: () => void     // Clear state (route changes, cleanup)
}
```

**Implementation**:
```typescript
import { create } from 'zustand'

interface EventDesignerStore {
  pendingSaves: number
  lastCompletedAt: number | null
  startSave: () => void
  completeSave: () => void
  resetSaveState: () => void
}

export const useEventDesignerStore = create<EventDesignerStore>((set) => ({
  // Initial state
  pendingSaves: 0,
  lastCompletedAt: null,

  // Start a save operation (increment counter)
  startSave: () =>
    set((state) => ({
      pendingSaves: state.pendingSaves + 1,
    })),

  // Complete a save operation (decrement counter, set timestamp if all done)
  completeSave: () =>
    set((state) => {
      const newCount = state.pendingSaves - 1
      return {
        pendingSaves: newCount,
        // Only set timestamp when ALL saves complete (count reaches 0)
        lastCompletedAt: newCount === 0 ? Date.now() : state.lastCompletedAt,
      }
    }),

  // Reset state (used on route changes or manual cleanup)
  resetSaveState: () =>
    set({
      pendingSaves: 0,
      lastCompletedAt: null,
    }),
}))
```

**Derived State** (conceptual overview):

> **⚠️ Note**: This is pseudo-code showing the conceptual logic. The actual implementation uses `useEffect` + `setTimeout` to ensure accurate timing. See `DesignerStatusIndicators` component (Section 4) for the real implementation.

```typescript
// Conceptual (not actual implementation)
const { pendingSaves, lastCompletedAt } = useEventDesignerStore()

const isSaving = pendingSaves > 0
const showSuccess =
  pendingSaves === 0 &&
  lastCompletedAt !== null &&
  Date.now() - lastCompletedAt < 3000 // Would need timer for accurate 3s
```

**Why not use this directly?**
- `Date.now()` doesn't trigger re-renders after 3 seconds
- Need `setTimeout` to schedule re-render when checkmark should disappear
- Actual implementation handles edge cases (component unmount, rapid changes)

---

### 2. Mutation Tracking Utility

**File**: `@domains/event/designer/hooks/useTrackedMutation.ts`

**Purpose**: Wrapper hook that tracks TanStack Query mutation state transitions

**Implementation**:
```typescript
import { useEffect, useRef } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import { useEventDesignerStore } from '../stores/useEventDesignerStore'

/**
 * Tracks TanStack Query mutation state and reports to global store
 *
 * Monitors state transitions:
 * - idle → pending: Increment save counter
 * - pending → idle: Decrement save counter
 *
 * Works with success AND error states (both transition to idle)
 *
 * @param mutation - TanStack Query mutation result
 * @returns Same mutation result (passthrough)
 *
 * @example
 * ```typescript
 * // Inside domain hook
 * export function useUpdateOverlays(projectId: string, eventId: string) {
 *   const mutation = useMutation({ ... })
 *   return useTrackedMutation(mutation)
 * }
 * ```
 */
export function useTrackedMutation<TData, TError, TVariables>(
  mutation: UseMutationResult<TData, TError, TVariables>
): UseMutationResult<TData, TError, TVariables> {
  const { startSave, completeSave } = useEventDesignerStore()
  const prevIsPending = useRef(mutation.isPending)

  useEffect(() => {
    // Detect state transitions
    if (mutation.isPending && !prevIsPending.current) {
      // Transition: idle → pending (save started)
      startSave()
    } else if (!mutation.isPending && prevIsPending.current) {
      // Transition: pending → idle (save completed or failed)
      completeSave()
    }

    // Update ref for next comparison
    prevIsPending.current = mutation.isPending
  }, [mutation.isPending, startSave, completeSave])

  // Passthrough mutation (no modification)
  return mutation
}
```

**Key Features**:
- ✅ Detects state transitions (not just current state)
- ✅ Prevents double-counting on re-renders
- ✅ Works with success AND error states
- ✅ Zero breaking changes (passthrough wrapper)
- ✅ Clean separation of concerns

---

### 3. Integration into Domain Hooks

**Update existing mutation hooks to use tracking**

**File**: `@domains/event/settings/hooks/useUpdateOverlays.ts`

**Before**:
```typescript
export function useUpdateOverlays(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: UpdateOverlaysConfig) => {
      // ... existing logic
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ ... })
    },
    onError: (error) => {
      Sentry.captureException(error, { ... })
    },
  })
}
```

**After**:
```typescript
import { useTrackedMutation } from '@/domains/event/designer/hooks/useTrackedMutation'

export function useUpdateOverlays(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (updates: UpdateOverlaysConfig) => {
      // ... existing logic (unchanged)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ ... })
    },
    onError: (error) => {
      Sentry.captureException(error, { ... })
    },
  })

  return useTrackedMutation(mutation) // ← Add tracking
}
```

**Same pattern for**:
- `@domains/event/settings/hooks/useUpdateShareOptions.ts`
- Any future mutation hooks in event designer

**Benefits**:
- ✅ Zero changes to component code
- ✅ Automatic tracking for all mutations
- ✅ Centralized tracking logic
- ✅ Easy to add/remove tracking

---

### 4. Status Indicators Component

**File**: `@domains/event/designer/components/DesignerStatusIndicators.tsx`

**Purpose**: Renders saving/success indicators for top nav bar

**Implementation**:
```typescript
import { useEffect, useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { useEventDesignerStore } from '../stores/useEventDesignerStore'

/**
 * Designer Status Indicators
 *
 * Shows real-time save status in event designer top bar:
 * - Spinner: When any save is in progress
 * - Checkmark: For 3 seconds after all saves complete
 * - Nothing: When idle
 *
 * Handles multiple concurrent saves via reference counting
 */
export function DesignerStatusIndicators() {
  const { pendingSaves, lastCompletedAt } = useEventDesignerStore()
  const [showSuccess, setShowSuccess] = useState(false)

  const isSaving = pendingSaves > 0

  // Show checkmark for 3 seconds after all saves complete
  useEffect(() => {
    if (lastCompletedAt === null) {
      setShowSuccess(false)
      return
    }

    const elapsed = Date.now() - lastCompletedAt

    if (elapsed < 3000) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 3000 - elapsed)
      return () => clearTimeout(timer)
    } else {
      setShowSuccess(false)
    }
  }, [lastCompletedAt])

  // Don't render anything if idle
  if (!isSaving && !showSuccess) {
    return null
  }

  return (
    <div className="flex items-center">
      {isSaving && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {!isSaving && showSuccess && (
        <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
      )}
    </div>
  )
}
```

**Design Specs**:
- **Spinner**: 16px (h-4 w-4), muted color, rotating animation
- **Checkmark**: 16px (h-4 w-4), green color (accessible contrast)
- **No text**: Icons only (clean, minimal)
- **Smooth transitions**: Icons appear/disappear smoothly

---

### 5. Update EventDesignerLayout

**File**: `@domains/event/designer/containers/EventDesignerLayout.tsx`

**Changes**:

1. Import new component
2. Move unpublished changes badge to right slot
3. Add status indicators before badge
4. Reset store on unmount

**Before (right slot)**:
```tsx
right={
  <>
    <Button variant="outline" disabled>
      Preview
    </Button>
    <Button onClick={handlePublish} disabled={!hasUnpublishedChanges}>
      Publish
    </Button>
  </>
}
```

**After (right slot)**:
```tsx
import { DesignerStatusIndicators } from '../components/DesignerStatusIndicators'
import { useEventDesignerStore } from '../stores/useEventDesignerStore'

// ... inside component
const { resetSaveState } = useEventDesignerStore()

// Reset store on unmount
useEffect(() => {
  return () => resetSaveState()
}, [resetSaveState])

// ... in JSX
right={
  <>
    <DesignerStatusIndicators />
    {hasUnpublishedChanges && (
      <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 dark:bg-yellow-950 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400">
        <div className="h-2 w-2 rounded-full bg-yellow-500" />
        New changes
      </div>
    )}
    <Button variant="outline" disabled>
      Preview
    </Button>
    <Button onClick={handlePublish} disabled={!hasUnpublishedChanges}>
      Publish
    </Button>
  </>
}
```

**Remove from left slot**:
```diff
- left={
-   hasUnpublishedChanges && (
-     <div className="...">New changes</div>
-   )
- }
+ left={undefined}  // or remove prop entirely
```

---

## Flow Examples

### Example 1: Single Save Operation

**Flow**:
1. User changes sharing option (download: false)
2. `useUpdateShareOptions` mutation starts
3. `useTrackedMutation` detects `isPending` transition → calls `startSave()`
4. Store: `pendingSaves = 1`
5. UI: Spinner shows
6. Firestore transaction completes
7. `useTrackedMutation` detects `!isPending` transition → calls `completeSave()`
8. Store: `pendingSaves = 0`, `lastCompletedAt = Date.now()`
9. UI: Checkmark shows
10. After 3 seconds: Checkmark disappears

**Visual Timeline**:
```
[0s]   User toggles download
       → [⏳ Spinner] [🟡 New changes] [Preview] [Publish]

[0.5s] Save completes
       → [✅ Checkmark] [🟡 New changes] [Preview] [Publish]

[3.5s] Checkmark expires
       → [🟡 New changes] [Preview] [Publish]
```

---

### Example 2: Multiple Concurrent Saves

**Flow**:
1. User uploads 1:1 overlay → Save 1 starts → `pendingSaves = 1` → Spinner
2. User uploads 9:16 overlay → Save 2 starts → `pendingSaves = 2` → Spinner
3. User toggles Instagram share → Save 3 starts → `pendingSaves = 3` → Spinner
4. Save 1 completes → `pendingSaves = 2` → Spinner (still pending!)
5. Save 2 completes → `pendingSaves = 1` → Spinner (still pending!)
6. Save 3 completes → `pendingSaves = 0`, set `lastCompletedAt` → Checkmark
7. After 3 seconds → Checkmark disappears

**Visual Timeline**:
```
[0s]   Upload 1:1 overlay
       → [⏳ Spinner] [🟡 New changes] [Preview] [Publish]

[0.2s] Upload 9:16 overlay (while 1:1 still saving)
       → [⏳ Spinner] [🟡 New changes] [Preview] [Publish]

[0.4s] Toggle Instagram (while both overlays still saving)
       → [⏳ Spinner] [🟡 New changes] [Preview] [Publish]

[1s]   1:1 overlay save completes (2 saves still pending)
       → [⏳ Spinner] [🟡 New changes] [Preview] [Publish]

[1.5s] 9:16 overlay save completes (1 save still pending)
       → [⏳ Spinner] [🟡 New changes] [Preview] [Publish]

[2s]   Instagram save completes (ALL done)
       → [✅ Checkmark] [🟡 New changes] [Preview] [Publish]

[5s]   Checkmark expires
       → [🟡 New changes] [Preview] [Publish]
```

---

### Example 3: New Save During Checkmark

**Flow**:
1. Save completes → Checkmark shows (3s timer starts)
2. After 1 second, user makes new change → New save starts
3. Checkmark immediately replaced with spinner
4. New save completes → Checkmark shows again (new 3s timer)

**Visual Timeline**:
```
[0s]   Save completes
       → [✅ Checkmark] [🟡 New changes] [Preview] [Publish]

[1s]   User toggles Facebook (during checkmark display)
       → [⏳ Spinner] [🟡 New changes] [Preview] [Publish]

[1.5s] Facebook save completes
       → [✅ Checkmark] [🟡 New changes] [Preview] [Publish]

[4.5s] Checkmark expires
       → [🟡 New changes] [Preview] [Publish]
```

---

### Example 4: Save Error

**Flow**:
1. Save starts → `pendingSaves = 1` → Spinner shows
2. Save fails (network error, permission denied, etc.)
3. `useTrackedMutation` detects `!isPending` → calls `completeSave()`
4. Store: `pendingSaves = 0` → Spinner removes
5. Toast shows error message
6. No checkmark (only shows on success via `lastCompletedAt` logic)

**Visual Timeline**:
```
[0s]   User makes change
       → [⏳ Spinner] [🟡 New changes] [Preview] [Publish]

[0.5s] Save fails
       → [🟡 New changes] [Preview] [Publish]
       + Toast: "Failed to save. Check your connection."
```

---

## Implementation Phases

### Phase 1: Store Setup
- Create `@domains/event/designer/stores/` folder
- Create `useEventDesignerStore.ts` with Zustand store
- Add state: `pendingSaves`, `lastCompletedAt`
- Add actions: `startSave`, `completeSave`, `resetSaveState`
- Export store

### Phase 2: Tracking Utility
- Create `@domains/event/designer/hooks/` folder (if not exists)
- Create `useTrackedMutation.ts` wrapper hook
- Implement state transition tracking
- Add TypeScript generics for mutation types
- Test with console.log before integration

### Phase 3: Integrate Tracking
- Update `useUpdateOverlays` hook to use `useTrackedMutation`
- Update `useUpdateShareOptions` hook to use `useTrackedMutation`
- Test reference counting with multiple concurrent saves
- Verify error states decrement counter correctly

### Phase 4: Status Indicators Component
- Create `@domains/event/designer/components/` folder
- Create `DesignerStatusIndicators.tsx` component
- Implement spinner/checkmark logic
- Add 3-second timer for checkmark display
- Test with design system tokens (colors, spacing)

### Phase 5: Update EventDesignerLayout
- Import `DesignerStatusIndicators` component
- Move "New changes" badge from left to right slot
- Add status indicators before badge
- Add cleanup logic (reset store on unmount)
- Test layout and spacing

### Phase 6: Testing & Polish
- Test single save operation
- Test multiple concurrent saves
- Test save errors (network, permission)
- Test checkmark timer (3 seconds)
- Test new save during checkmark display
- Verify no memory leaks (cleanup timers)
- Test accessibility (icon labels)

---

## Acceptance Criteria

### Store Functionality
- [ ] `useEventDesignerStore` created with Zustand
- [ ] `pendingSaves` counter increments/decrements correctly
- [ ] `lastCompletedAt` only sets when `pendingSaves` reaches 0
- [ ] `resetSaveState` clears state on route changes

### Mutation Tracking
- [ ] `useTrackedMutation` detects state transitions correctly
- [ ] Saves increment counter when starting
- [ ] Saves decrement counter when completing (success OR error)
- [ ] No double-counting on component re-renders
- [ ] Works with all existing mutation hooks (zero breaking changes)

### UI Components
- [ ] `DesignerStatusIndicators` renders spinner when `pendingSaves > 0`
- [ ] Spinner shows during ALL pending saves (doesn't disappear early)
- [ ] Checkmark shows for exactly 3 seconds after all saves complete
- [ ] Checkmark immediately replaced by spinner if new save starts
- [ ] Nothing renders when idle (no saves, checkmark expired)

### Layout Changes
- [ ] Status indicators positioned before "New changes" badge
- [ ] "New changes" badge moved from left to right slot
- [ ] Order: [Status] [Badge] [Preview] [Publish]
- [ ] Spacing consistent with design system
- [ ] Mobile responsive (if applicable)

### Multiple Concurrent Saves
- [ ] 3 concurrent saves: spinner shows throughout all 3
- [ ] 1st save completes: spinner stays (2 still pending)
- [ ] 2nd save completes: spinner stays (1 still pending)
- [ ] 3rd save completes: checkmark shows
- [ ] After 3 seconds: checkmark disappears

### Error Handling
- [ ] Save error decrements counter (removes spinner)
- [ ] Toast shows error message (existing behavior)
- [ ] No checkmark shows on error
- [ ] Counter doesn't go negative on errors
- [ ] Multiple errors handled correctly

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] No console errors or warnings
- [ ] Store actions properly typed
- [ ] Component props properly typed
- [ ] No memory leaks (timers cleaned up)
- [ ] Follows DDD principles (designer domain owns store)

### Accessibility
- [ ] Icons have accessible labels (sr-only text or aria-label)
- [ ] Color contrast meets WCAG AA standards
- [ ] Spinner has `role="status"` and `aria-live="polite"`
- [ ] Checkmark has `role="status"` and `aria-live="polite"`

### Performance
- [ ] No unnecessary re-renders
- [ ] Store updates are efficient
- [ ] Timer cleanup prevents memory leaks
- [ ] Works smoothly with 10+ concurrent saves

---

## Out of Scope

- ❌ **Per-field save tracking** - Only global state (not individual field spinners)
- ❌ **Save queue visualization** - No list of pending saves
- ❌ **Retry failed saves** - Toast handles errors, no auto-retry
- ❌ **Offline detection** - No offline mode handling
- ❌ **Save history** - No audit log of saves
- ❌ **Undo/redo** - Not part of this PRD
- ❌ **Optimistic updates** - Mutations already handle this
- ❌ **Custom toast positioning** - Use existing toast system
- ❌ **Save analytics** - No tracking of save frequency/duration
- ❌ **Debounce customization** - Domain hooks handle debouncing

---

## Future Considerations

### Enhanced Store Features

**Additional state**:
```typescript
interface EventDesignerStore {
  // Existing
  pendingSaves: number
  lastCompletedAt: number | null

  // Future additions
  saveErrors: string[]              // Recent error messages
  lastErrorAt: number | null        // Last error timestamp
  totalSaves: number                // Session save count
  saveHistory: SaveRecord[]         // Recent saves for debugging
}
```

**Use cases**:
- Show error indicator in top bar
- Display recent save history in dev tools
- Analytics for debugging slow saves
- Session statistics

### Per-Field Tracking

**Future enhancement**: Track which fields are saving

```typescript
interface FieldSaveState {
  fieldPath: string                 // 'sharing.download', 'overlays.1:1'
  status: 'idle' | 'pending' | 'success' | 'error'
  startedAt: number
  completedAt: number | null
}

interface EventDesignerStore {
  fieldSaves: FieldSaveState[]      // Track individual fields
  getFieldStatus: (path: string) => 'idle' | 'pending' | 'success' | 'error'
}
```

**UI enhancements**:
- Show spinner next to field being saved
- Highlight recently saved fields (green glow)
- Show which fields failed to save

### Save Queue Visualization

**Future component**: `SaveQueuePanel`

```tsx
<SaveQueuePanel>
  <SaveQueueItem field="sharing.download" status="success" />
  <SaveQueueItem field="overlays.1:1" status="pending" progress={45} />
  <SaveQueueItem field="sharing.instagram" status="error" />
</SaveQueuePanel>
```

**Use cases**:
- Debug save issues
- Show users what's happening
- Confidence in auto-save system

### Offline Support

**Future enhancement**: Detect offline state and queue saves

```typescript
interface EventDesignerStore {
  isOffline: boolean                // Network status
  queuedSaves: QueuedSave[]         // Saves to retry when online
  retryQueuedSaves: () => void      // Retry all queued
}
```

**UI changes**:
- Show offline indicator
- Show "Will save when online" message
- Auto-retry when connection restored

### Save Analytics

**Track save performance for debugging**:

```typescript
interface SaveMetrics {
  totalSaves: number
  avgDuration: number               // Average save time (ms)
  slowSaves: number                 // Saves over 1s
  failedSaves: number
  concurrentSavesPeak: number       // Max concurrent saves
}
```

**Use cases**:
- Identify performance issues
- Optimize slow mutations
- Debug race conditions

---

## Key Design Decisions

### 1. Reference Counting vs Boolean State
**Decision**: Use `pendingSaves: number` (counter) instead of `isSaving: boolean`

**Rationale**:
- Handles multiple concurrent saves correctly
- No race conditions when saves overlap
- Accurate state (know exactly how many saves pending)
- Simple increment/decrement logic
- Checkmark only shows when ALL saves done

---

### 2. Zustand vs Context API
**Decision**: Use Zustand for global state management

**Rationale**:
- Simpler API than Context + useReducer
- Better performance (no provider re-renders)
- DevTools support for debugging
- Cleaner actions (no dispatch boilerplate)
- Can persist state if needed (future)

---

### 3. Wrapper Hook vs Manual Integration
**Decision**: Use `useTrackedMutation` wrapper instead of manual `useEffect` in components

**Rationale**:
- Zero breaking changes (components don't change)
- Centralized tracking logic (single source of truth)
- Easier to maintain (update one file)
- Consistent tracking (impossible to forget)
- Clean separation of concerns

---

### 4. State Transitions vs Current State
**Decision**: Track state transitions (`idle → pending`, `pending → idle`) instead of polling current state

**Rationale**:
- Prevents double-counting on re-renders
- More accurate (React strict mode safe)
- Efficient (only runs on actual changes)
- Aligns with React best practices

---

### 5. Success Timer in Component vs Store
**Decision**: 3-second timer in component, not store

**Rationale**:
- Store tracks data, component tracks UI
- Easier to cleanup (component unmount)
- Simpler store logic (no timers)
- Can customize per component if needed

---

### 6. No Error Icon
**Decision**: Don't show error icon in top bar, only remove spinner + show toast

**Rationale**:
- Toast already handles error messaging
- Error icon adds visual clutter
- Most saves succeed (errors are rare)
- Simpler UI (fewer states to manage)

---

### 7. Move Badge to Right
**Decision**: Move "New changes" badge from left to right (before Preview/Publish)

**Rationale**:
- Visual grouping (badge near Publish button)
- Clearer user intent (publish = resolve changes)
- Status indicators group together (save + changes)
- More intuitive layout

---

### 8. Reset Store on Unmount
**Decision**: Call `resetSaveState()` when EventDesignerLayout unmounts

**Rationale**:
- Prevents stale state across routes
- Clean slate for each event
- No lingering spinners/checkmarks
- Better dev experience (predictable state)

---

## References

- **Parent PRD**: `requirements/012-event-settings-sharing-and-publish.md`
- **Related PRD**: `requirements/013-event-settings-overlays.md`
- **Event Schema**: `@domains/event/shared/schemas/project-event-full.schema.ts`
- **Current Layout**: `@domains/event/designer/containers/EventDesignerLayout.tsx`
- **Mutation Hooks**:
  - `@domains/event/settings/hooks/useUpdateOverlays.ts`
  - `@domains/event/settings/hooks/useUpdateShareOptions.ts`
- **Shared Helper**: `@domains/event/shared/lib/updateEventConfigField.ts`
- **Standards**:
  - `@standards/global/project-structure.md` (DDD principles)
  - `@standards/global/client-first-architecture.md`
  - `@standards/frontend/design-system.md` (design tokens)
  - `@standards/frontend/accessibility.md` (ARIA labels, contrast)

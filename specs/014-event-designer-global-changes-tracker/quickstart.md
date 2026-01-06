# Quickstart Guide: Event Designer - Global Changes Tracker

**Feature**: 014-event-designer-global-changes-tracker
**Date**: 2026-01-06
**Audience**: Developers implementing or maintaining this feature

## Overview

This guide provides a quick reference for implementing and using the global changes tracker in the event designer.

## 5-Minute Implementation Overview

### What This Feature Does

1. **Tracks save operations** across all event configuration changes
2. **Shows status indicators** in the designer top navigation bar
3. **Handles concurrent saves** using reference counting
4. **Provides visual feedback** (spinner → checkmark → hidden)

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `useEventDesignerStore` | Zustand store for global save state | `@domains/event/designer/stores/` |
| `useTrackedMutation` | Wrapper hook for mutation tracking | `@domains/event/designer/hooks/` |
| `DesignerStatusIndicators` | UI component for status icons | `@domains/event/designer/components/` |
| `EventDesignerLayout` | Container with integrated indicators | `@domains/event/designer/containers/` |

---

## Getting Started

### Prerequisites

- TanStack Start app running (`pnpm dev` from `apps/clementine-app/`)
- Existing event designer with mutation hooks (`useUpdateOverlays`, `useUpdateShareOptions`)
- Zustand 5.x installed (already in project dependencies)

### Installation

No additional dependencies required. Zustand, TanStack Query, and Lucide React are already installed.

---

## Implementation Steps

### Step 1: Create Zustand Store (5 minutes)

**File**: `apps/clementine-app/app/domains/event/designer/stores/useEventDesignerStore.ts`

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
  pendingSaves: 0,
  lastCompletedAt: null,

  startSave: () =>
    set((state) => ({
      pendingSaves: state.pendingSaves + 1,
    })),

  completeSave: () =>
    set((state) => {
      const newCount = state.pendingSaves - 1
      return {
        pendingSaves: newCount,
        lastCompletedAt: newCount === 0 ? Date.now() : state.lastCompletedAt,
      }
    }),

  resetSaveState: () =>
    set({
      pendingSaves: 0,
      lastCompletedAt: null,
    }),
}))
```

**Don't forget**: Create `stores/index.ts` barrel export!

---

### Step 2: Create Tracking Wrapper Hook (10 minutes)

**File**: `apps/clementine-app/app/domains/event/designer/hooks/useTrackedMutation.ts`

```typescript
import { useEffect, useRef } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import { useEventDesignerStore } from '../stores/useEventDesignerStore'

export function useTrackedMutation<TData, TError, TVariables>(
  mutation: UseMutationResult<TData, TError, TVariables>
): UseMutationResult<TData, TError, TVariables> {
  const { startSave, completeSave } = useEventDesignerStore()
  const prevIsPending = useRef(mutation.isPending)

  useEffect(() => {
    if (mutation.isPending && !prevIsPending.current) {
      startSave()
    } else if (!mutation.isPending && prevIsPending.current) {
      completeSave()
    }
    prevIsPending.current = mutation.isPending
  }, [mutation.isPending, startSave, completeSave])

  return mutation
}
```

**Update `hooks/index.ts`**: Add `export { useTrackedMutation } from './useTrackedMutation'`

---

### Step 3: Create Status Indicators Component (15 minutes)

**File**: `apps/clementine-app/app/domains/event/designer/components/DesignerStatusIndicators.tsx`

```typescript
import { useEffect, useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { useEventDesignerStore } from '../stores/useEventDesignerStore'

export function DesignerStatusIndicators() {
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
      return () => clearTimeout(timer)
    } else {
      setShowSuccess(false)
    }
  }, [lastCompletedAt])

  if (!isSaving && !showSuccess) {
    return null
  }

  return (
    <div role="status" aria-live="polite" className="flex items-center">
      {isSaving && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="sr-only">Saving changes...</span>
        </>
      )}
      {!isSaving && showSuccess && (
        <>
          <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
          <span className="sr-only">Changes saved successfully</span>
        </>
      )}
    </div>
  )
}
```

**Update `components/index.ts`**: Add `export { DesignerStatusIndicators } from './DesignerStatusIndicators'`

---

### Step 4: Integrate into Domain Mutation Hooks (5 minutes per hook)

**File**: `apps/clementine-app/app/domains/event/settings/hooks/useUpdateOverlays.ts`

**Before**:
```typescript
export function useUpdateOverlays(projectId: string, eventId: string) {
  return useMutation({
    mutationFn: async (updates: UpdateOverlaysConfig) => {
      // ... existing logic
    },
  })
}
```

**After**:
```typescript
import { useTrackedMutation } from '@/domains/event/designer/hooks/useTrackedMutation'

export function useUpdateOverlays(projectId: string, eventId: string) {
  const mutation = useMutation({
    mutationFn: async (updates: UpdateOverlaysConfig) => {
      // ... existing logic (unchanged)
    },
  })

  return useTrackedMutation(mutation)
}
```

**Repeat for**: `useUpdateShareOptions.ts` and any other event mutation hooks

---

### Step 5: Update EventDesignerLayout (10 minutes)

**File**: `apps/clementine-app/app/domains/event/designer/containers/EventDesignerLayout.tsx`

**Changes**:

1. **Import new components**:
```typescript
import { DesignerStatusIndicators } from '../components/DesignerStatusIndicators'
import { useEventDesignerStore } from '../stores/useEventDesignerStore'
```

2. **Add cleanup effect**:
```typescript
const { resetSaveState } = useEventDesignerStore()

useEffect(() => {
  return () => resetSaveState()
}, [resetSaveState])
```

3. **Update top nav bar right slot**:
```typescript
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

4. **Remove badge from left slot** (if present):
```typescript
left={undefined}  // Or remove prop entirely
```

---

## Testing Your Implementation

### Manual Testing Checklist

**Single Save**:
1. Navigate to event designer
2. Toggle a share option (e.g., download)
3. ✅ Spinner appears immediately
4. ✅ Checkmark appears after save completes
5. ✅ Checkmark disappears after 3 seconds

**Multiple Concurrent Saves**:
1. Upload 1:1 overlay (don't wait)
2. Upload 9:16 overlay (don't wait)
3. Toggle Instagram share
4. ✅ Spinner stays visible throughout all saves
5. ✅ Checkmark only appears when ALL saves complete
6. ✅ Checkmark disappears after 3 seconds

**Error Handling**:
1. Disconnect wifi/network
2. Make a change
3. ✅ Spinner appears
4. ✅ Spinner disappears when error occurs
5. ✅ Toast shows error message
6. ✅ No checkmark appears

**Route Changes**:
1. Make a save
2. Navigate away during spinner/checkmark
3. Navigate back to designer
4. ✅ No stale indicators (store was reset)

---

## Common Issues & Solutions

### Issue: Store not found error

**Symptom**: `Cannot read property 'startSave' of undefined`

**Solution**: Ensure `stores/index.ts` exports the store:
```typescript
export { useEventDesignerStore } from './useEventDesignerStore'
```

---

### Issue: Double counting on re-renders

**Symptom**: `pendingSaves` increments twice for one save

**Solution**: Verify `useRef` is used correctly in `useTrackedMutation`:
```typescript
const prevIsPending = useRef(mutation.isPending)
```

---

### Issue: Checkmark doesn't disappear after 3 seconds

**Symptom**: Checkmark stays visible indefinitely

**Solution**: Check `useEffect` cleanup in `DesignerStatusIndicators`:
```typescript
return () => clearTimeout(timer)
```

---

### Issue: Spinner doesn't appear

**Symptom**: No visual feedback when saving

**Solution**: Ensure mutation hook is wrapped:
```typescript
return useTrackedMutation(mutation)  // Don't forget this!
```

---

## File Checklist

Before marking feature complete, verify these files exist:

- [x] `stores/useEventDesignerStore.ts`
- [x] `stores/useEventDesignerStore.test.ts` (collocated test)
- [x] `stores/index.ts`
- [x] `hooks/useTrackedMutation.ts`
- [x] `hooks/useTrackedMutation.test.ts` (collocated test)
- [x] `hooks/index.ts` (updated)
- [x] `components/DesignerStatusIndicators.tsx`
- [x] `components/DesignerStatusIndicators.test.tsx` (collocated test)
- [x] `components/index.ts` (updated)
- [x] `containers/EventDesignerLayout.tsx` (updated)
- [x] `settings/hooks/useUpdateOverlays.ts` (updated)
- [x] `settings/hooks/useUpdateShareOptions.ts` (updated)

---

## Next Steps

### After Implementation

1. **Run validation**: `pnpm app:check` (lint, format, type-check)
2. **Write tests**: Store, hook, and component unit tests
3. **Manual QA**: Test all user scenarios from spec
4. **Code review**: Verify standards compliance

### Future Enhancements

See `data-model.md` "Future Enhancements" section for:
- Per-field tracking (show spinner next to specific field)
- Save analytics (track performance metrics)
- Offline support (queue saves when offline)

---

## API Reference

### useEventDesignerStore

```typescript
const {
  pendingSaves,      // number: Count of ongoing saves
  lastCompletedAt,   // number | null: Timestamp when all saves completed
  startSave,         // () => void: Increment counter
  completeSave,      // () => void: Decrement counter
  resetSaveState,    // () => void: Clear state
} = useEventDesignerStore()
```

### useTrackedMutation

```typescript
const trackedMutation = useTrackedMutation(mutation)
// Same API as original mutation (passthrough)
```

### DesignerStatusIndicators

```typescript
<DesignerStatusIndicators />
// No props - reads from store automatically
```

---

## Resources

- **Feature Spec**: `specs/014-event-designer-global-changes-tracker/spec.md`
- **Data Model**: `specs/014-event-designer-global-changes-tracker/data-model.md`
- **Research**: `specs/014-event-designer-global-changes-tracker/research.md`
- **Zustand Docs**: https://github.com/pmndrs/zustand
- **TanStack Query Docs**: https://tanstack.com/query/latest

---

## Support

For questions or issues:
1. Check this quickstart guide
2. Review data-model.md for implementation details
3. Review research.md for design decisions
4. Check existing code for examples

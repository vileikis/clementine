# Research: Event Designer - Global Changes Tracker

**Feature**: 014-event-designer-global-changes-tracker
**Date**: 2026-01-06
**Status**: Complete

## Purpose

This document consolidates research findings for implementing global save state tracking in the event designer. All technical unknowns from the Technical Context have been resolved.

## Research Tasks

### 1. Zustand Store Best Practices for React 19 + TanStack Start

**Decision**: Use Zustand 5.x with minimal configuration

**Rationale**:
- Zustand 5.x is fully compatible with React 19 and TanStack Start
- Simpler API than Context + useReducer (no provider wrapping needed)
- Better performance - no React context re-renders
- Built-in TypeScript support with interface typing
- DevTools integration available for debugging
- Can add persist middleware later if needed (not required for MVP)

**Implementation Pattern**:
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
  startSave: () => set((state) => ({ pendingSaves: state.pendingSaves + 1 })),
  completeSave: () => set((state) => {
    const newCount = state.pendingSaves - 1
    return {
      pendingSaves: newCount,
      lastCompletedAt: newCount === 0 ? Date.now() : state.lastCompletedAt,
    }
  }),
  resetSaveState: () => set({ pendingSaves: 0, lastCompletedAt: null }),
}))
```

**Alternatives Considered**:
- Context API + useReducer: More boilerplate, performance overhead from provider
- Redux Toolkit: Overkill for simple state, adds unnecessary complexity
- Jotai: Atomic state works well but Zustand is already used in project
- TanStack Store: Experimental, less mature than Zustand

**Reference**: Zustand docs - https://github.com/pmndrs/zustand (v5.x compatible with React 19)

---

### 2. TanStack Query Mutation State Tracking

**Decision**: Track state transitions via `useEffect` watching `mutation.isPending`

**Rationale**:
- TanStack Query exposes `isPending` boolean for mutation state
- State transitions (idle → pending, pending → idle) are reliable indicators
- Using `useRef` to track previous state prevents double-counting on re-renders
- Works for both success AND error states (both transition to `!isPending`)
- No need for mutation lifecycle callbacks (`onMutate`, `onSettled`) - cleaner separation

**Implementation Pattern**:
```typescript
export function useTrackedMutation<TData, TError, TVariables>(
  mutation: UseMutationResult<TData, TError, TVariables>
): UseMutationResult<TData, TError, TVariables> {
  const { startSave, completeSave } = useEventDesignerStore()
  const prevIsPending = useRef(mutation.isPending)

  useEffect(() => {
    if (mutation.isPending && !prevIsPending.current) {
      startSave() // Transition: idle → pending
    } else if (!mutation.isPending && prevIsPending.current) {
      completeSave() // Transition: pending → idle
    }
    prevIsPending.current = mutation.isPending
  }, [mutation.isPending, startSave, completeSave])

  return mutation // Passthrough
}
```

**Alternatives Considered**:
- Mutation callbacks (`onMutate`, `onSettled`): Requires modifying domain hooks, less clean separation
- Polling mutation status: Inefficient, could miss fast state changes
- Custom mutation wrapper: Duplicates TanStack Query logic, harder to maintain
- Middleware pattern: TanStack Query doesn't support middleware natively

**Reference**: TanStack Query v5 docs - mutation state and lifecycle

---

### 3. React 19 useEffect Timer Cleanup

**Decision**: Use standard `useEffect` cleanup with `setTimeout` for 3-second checkmark display

**Rationale**:
- React 19 maintains standard useEffect cleanup behavior
- Cleanup function runs on component unmount and dependency changes
- `setTimeout` is reliable for UI timing (3 seconds ± 100ms is acceptable)
- No need for `useLayoutEffect` (visual timing not critical)
- Timer cleanup prevents memory leaks

**Implementation Pattern**:
```typescript
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

**Alternatives Considered**:
- `setInterval`: Less efficient than `setTimeout` for one-off timer
- `requestAnimationFrame`: Overkill for 3-second timer, worse for battery life
- Custom timer hook: Premature abstraction (only used once)
- Web Animations API: Overly complex for simple timer

**Reference**: React 19 docs - useEffect and cleanup functions

---

### 4. Lucide React Icons for Status Indicators

**Decision**: Use Lucide React `Loader2` and `Check` icons

**Rationale**:
- Lucide React is already a project dependency
- `Loader2` has built-in spinning animation (`animate-spin` with Tailwind)
- Icons are tree-shakeable (only import what's needed)
- Consistent with existing icon usage in project
- 16px size (h-4 w-4) is appropriate for status indicators
- SVG format ensures crisp rendering at all DPIs

**Icons Used**:
- `Loader2`: Circular loading spinner (for save in progress)
- `Check`: Checkmark (for save success)

**Implementation**:
```typescript
import { Loader2, Check } from 'lucide-react'

// Usage
{isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
{showSuccess && <Check className="h-4 w-4 text-green-600 dark:text-green-500" />}
```

**Alternatives Considered**:
- Custom SVG icons: Unnecessary when Lucide provides exactly what's needed
- Heroicons: Not currently in project dependencies
- CSS-only spinner: Less flexible, harder to maintain
- Animated GIFs: Poor performance, accessibility issues

**Reference**: Lucide React docs - https://lucide.dev/guide/packages/lucide-react

---

### 5. Accessibility (ARIA) for Dynamic Status Indicators

**Decision**: Use `role="status"` and `aria-live="polite"` for screen reader announcements

**Rationale**:
- `role="status"` indicates status update region
- `aria-live="polite"` announces changes without interrupting user
- `aria-label` provides context for icon-only indicators
- Meets WCAG 2.1 AA requirements for status updates
- TailwindCSS `sr-only` class hides text visually while keeping it for screen readers

**Implementation Pattern**:
```typescript
<div role="status" aria-live="polite" className="flex items-center">
  {isSaving && (
    <>
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <span className="sr-only">Saving changes...</span>
    </>
  )}
  {showSuccess && (
    <>
      <Check className="h-4 w-4 text-green-600" />
      <span className="sr-only">Changes saved successfully</span>
    </>
  )}
</div>
```

**Alternatives Considered**:
- `aria-live="assertive"`: Too intrusive for non-critical status updates
- No ARIA attributes: Fails accessibility requirements
- `aria-busy`: Less semantic than `role="status"` for this use case
- Toast notifications only: Doesn't provide visual persistent status

**Reference**: WCAG 2.1 AA - Status Messages, MDN ARIA live regions

---

### 6. Color Contrast for Status Indicators

**Decision**: Green-600 (light mode) / Green-500 (dark mode) for success checkmark

**Rationale**:
- Green-600 (#16a34a) on white background = 3.37:1 contrast (passes AA for large text/icons)
- Green-500 (#22c55e) on dark background = sufficient contrast for dark mode
- Tailwind theme tokens ensure consistent colors across app
- Muted-foreground for spinner (lower contrast acceptable for non-critical loading state)
- Icons are 16px (large enough for AA compliance with 3:1 contrast)

**Color Mappings**:
- Spinner: `text-muted-foreground` (theme-aware, subtle)
- Success checkmark: `text-green-600 dark:text-green-500` (high contrast, positive)
- Unpublished badge: `bg-yellow-50 dark:bg-yellow-950` + `text-yellow-700 dark:text-yellow-400` (existing pattern)

**Alternatives Considered**:
- Green-700: Too dark, less vibrant
- Green-400: Insufficient contrast in light mode
- Hard-coded hex colors: Violates design system (must use theme tokens)

**Reference**: WCAG 2.1 AA contrast requirements (3:1 for large UI components)

---

### 7. Reference Counting vs Boolean State

**Decision**: Use `pendingSaves: number` (counter) instead of `isSaving: boolean`

**Rationale**:
- Handles multiple concurrent saves correctly (no race conditions)
- Accurate state - know exactly how many saves are pending
- Simple increment/decrement logic (no complex state management)
- Checkmark only shows when ALL saves complete (`pendingSaves === 0`)
- Future-proof for additional tracking (per-field counts, analytics)

**Why Not Boolean**:
- Boolean state would flicker when saves overlap (save 1 completes, save 2 still pending)
- No way to know when ALL saves are done with boolean state
- Race conditions likely if multiple components trigger saves simultaneously

**Reference**: Standard reference counting pattern (semaphore-like)

---

### 8. Wrapper Hook vs Manual Integration

**Decision**: Use `useTrackedMutation` wrapper hook instead of manual `useEffect` in components

**Rationale**:
- Zero breaking changes - components using mutation hooks don't change
- Centralized tracking logic - single source of truth
- Easier to maintain - update one file instead of many
- Consistent tracking - impossible to forget to add tracking
- Clean separation of concerns - tracking logic separate from domain logic
- Easy to add/remove tracking - just wrap/unwrap hook

**Implementation**:
```typescript
// Before
export function useUpdateOverlays(...) {
  return useMutation({ ... })
}

// After
export function useUpdateOverlays(...) {
  const mutation = useMutation({ ... })
  return useTrackedMutation(mutation)
}
```

**Alternatives Considered**:
- Manual `useEffect` in each component: Duplicated code, easy to forget
- Higher-order component: Overly complex for hook-based architecture
- Global mutation observer: TanStack Query doesn't expose this easily
- Custom mutation hook factory: Premature abstraction

**Reference**: React hooks composition patterns

---

## Summary of Decisions

All technical unknowns resolved. Implementation approach:

1. **Store**: Zustand 5.x with typed interface
2. **Tracking**: State transition detection via `useEffect` + `useRef`
3. **Timer**: Standard `useEffect` cleanup with `setTimeout`
4. **Icons**: Lucide React (`Loader2`, `Check`)
5. **Accessibility**: `role="status"`, `aria-live="polite"`, `sr-only` labels
6. **Colors**: Tailwind theme tokens (green-600/green-500 for success)
7. **State Management**: Reference counting (number) instead of boolean
8. **Integration Pattern**: Wrapper hook for clean separation

No deviations from constitution or standards required. All patterns align with existing codebase practices.

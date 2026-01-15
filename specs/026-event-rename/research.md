# Research: Fix Event Rename Dialog Stale Name

**Feature**: 026-event-rename
**Date**: 2026-01-15

## Root Cause Analysis

### Problem Identified

The `RenameProjectEventDialog` component has a state synchronization bug:

**Location**: `apps/clementine-app/src/domains/project/events/components/RenameProjectEventDialog.tsx`

**Issue 1 - Line 66**:
```tsx
const [name, setName] = useState(initialName)
```
`useState` only uses `initialName` as the initial value on first render. When the `initialName` prop changes (after a successful rename updates the parent's data), the state is NOT updated.

**Issue 2 - Line 83**:
```tsx
setName(initialName)
```
After successful rename, this attempts to reset to `initialName`, but `initialName` is the value captured in the closure at render time - the OLD value, not the newly saved name.

### Data Flow

```
1. User opens dialog → useState(initialName) = "Event A"
2. User types "Event B" → name = "Event B"
3. User saves → mutation succeeds → cache invalidated → parent re-renders with event.name = "Event B"
4. handleRename calls setName(initialName) → BUT initialName in closure is still "Event A"
5. Dialog closes with name = "Event A" (stale)
6. User reopens dialog → Component already mounted, useState doesn't re-initialize
7. Input shows "Event A" (stale) instead of "Event B" (current)
```

## Solution Research

### Decision: Use `useEffect` to sync state on dialog open

**Rationale**:
- React's standard pattern for synchronizing state with props
- Only runs when dependencies change (dialog opens)
- Minimal code change
- Preserves all existing functionality

**Alternatives Considered**:

| Alternative | Rejected Because |
|-------------|------------------|
| Key prop on Dialog | Forces remount, loses focus/animation state, heavier |
| Controlled component pattern | Would require significant refactor of parent components |
| Reset state in onOpenChange | More complex, prone to race conditions |
| useReducer | Overkill for simple state sync |

### Implementation Pattern

```tsx
// Sync input state when dialog opens
useEffect(() => {
  if (open) {
    setName(initialName)
  }
}, [open, initialName])
```

**Why this works**:
1. Effect runs when `open` changes to `true`
2. Effect also runs when `initialName` changes while dialog is open
3. Sets `name` to the current `initialName` prop value
4. No closure staleness - `initialName` is evaluated at effect execution time

### Edge Case Handling

| Edge Case | Behavior |
|-----------|----------|
| Dialog opens after rename | `initialName` prop is current (from parent's updated data), effect syncs it |
| External update while open | Effect runs on `initialName` change, syncs new value |
| Cancel without saving | Effect will reset to `initialName` on next open |
| Save fails | State preserved for retry (effect doesn't run since dialog stays open) |
| Rapid open/close | Each open triggers effect, always gets current value |

### Post-Rename Reset Removal

The line `setName(initialName)` in the success handler should be **removed**:
- It's redundant with the `useEffect` sync
- It uses the stale closure value
- The `useEffect` will handle the reset on next dialog open

## Codebase Patterns Review

Reviewed similar dialogs in the codebase for consistency:

- `DeleteProjectEventDialog.tsx` - No editable state, not applicable
- `CreateProjectEventButton.tsx` - Clears form on success, different pattern (creates new items)

No conflicting patterns found. The `useEffect` sync pattern is appropriate for this edit-existing-item dialog.

## Standards Compliance

| Standard | Compliance |
|----------|------------|
| `frontend/state-management.md` | PASS - Using React hooks appropriately |
| `frontend/component-libraries.md` | PASS - shadcn/ui Dialog unchanged |
| `global/code-quality.md` | PASS - Simple, focused fix |

## Conclusion

**Recommended Fix**: Add `useEffect` to sync `name` state with `initialName` prop when dialog opens, and remove the redundant `setName(initialName)` from the success handler.

**Lines to Change**:
1. Add import: `useEffect` (already likely imported or add to existing React import)
2. Add effect after useState declaration
3. Remove `setName(initialName)` from handleRename success path

**Estimated Change**: ~5-7 lines modified

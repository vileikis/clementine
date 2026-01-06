# API Contracts

**Feature**: 014-event-designer-global-changes-tracker

## Overview

This feature **does NOT introduce any new API endpoints or contracts**. It is purely client-side state management using Zustand.

## Why No API Contracts?

This feature tracks save operations initiated by **existing** mutation hooks:
- `useUpdateOverlays` (already calls `updateEventConfigField`)
- `useUpdateShareOptions` (already calls `updateEventConfigField`)

The tracking layer **wraps** these existing mutations without modifying their API contracts.

## Existing API Integration

The feature integrates with existing Firebase operations:

### updateEventConfigField (Existing)

**Location**: `@domains/event/shared/lib/updateEventConfigField.ts`

**Contract** (unchanged):
```typescript
function updateEventConfigField(
  projectId: string,
  eventId: string,
  updates: Record<string, unknown>
): Promise<void>
```

**Usage**: Called by domain mutation hooks to persist changes to Firestore.

**Tracking Integration**: Mutation hooks wrap their `useMutation` calls with `useTrackedMutation`, which monitors TanStack Query's `isPending` state and reports to the Zustand store.

## TypeScript Interface Contracts

The feature defines internal TypeScript interfaces for type safety:

### EventDesignerStore Interface

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

### useTrackedMutation Hook Signature

```typescript
function useTrackedMutation<TData, TError, TVariables>(
  mutation: UseMutationResult<TData, TError, TVariables>
): UseMutationResult<TData, TError, TVariables>
```

**Generic Parameters**:
- `TData`: Mutation success data type (passthrough from original mutation)
- `TError`: Mutation error type (passthrough from original mutation)
- `TVariables`: Mutation variables type (passthrough from original mutation)

**Returns**: Same `UseMutationResult` from TanStack Query (no modifications)

## Future API Considerations

If future enhancements require API endpoints (e.g., save analytics, error logging), contracts would be defined here. Current implementation requires none.

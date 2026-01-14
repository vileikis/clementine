/**
 * Generic Tracked Mutation Hook
 *
 * Wrapper hook that tracks TanStack Query mutation state transitions.
 * Works with any editor store that implements startSave/completeSave.
 */
import { useEffect, useRef } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'

/**
 * Interface for editor store save tracking actions
 */
export interface SaveTrackingStore {
  startSave: () => void
  completeSave: () => void
}

/**
 * Wrapper hook that tracks TanStack Query mutation state transitions.
 *
 * Automatically calls startSave() when mutation begins (isPending: false → true)
 * and completeSave() when mutation ends (isPending: true → false).
 *
 * Returns the original mutation result unchanged (passthrough).
 *
 * @template TData - Mutation success data type
 * @template TError - Mutation error type
 * @template TVariables - Mutation variables type
 * @param mutation - TanStack Query mutation result to track
 * @param store - Editor store with startSave/completeSave actions
 * @returns Same mutation result (no modifications)
 *
 * @example
 * ```tsx
 * // In event domain
 * function useUpdateOverlays() {
 *   const mutation = useMutation({ ... })
 *   const store = useEventDesignerStore()
 *   return useTrackedMutation(mutation, store)
 * }
 *
 * // In experience domain
 * function useUpdateExperienceDraft() {
 *   const mutation = useMutation({ ... })
 *   const store = useExperienceDesignerStore()
 *   return useTrackedMutation(mutation, store)
 * }
 * ```
 */
export function useTrackedMutation<TData, TError, TVariables>(
  mutation: UseMutationResult<TData, TError, TVariables>,
  store: SaveTrackingStore,
): UseMutationResult<TData, TError, TVariables> {
  const { startSave, completeSave } = store
  const prevIsPending = useRef(mutation.isPending)

  useEffect(() => {
    // Detect state transitions (not current state) to prevent double-counting
    if (mutation.isPending && !prevIsPending.current) {
      // Transition: idle → pending
      startSave()
    } else if (!mutation.isPending && prevIsPending.current) {
      // Transition: pending → idle (both success and error)
      completeSave()
    }

    // Update ref after comparison
    prevIsPending.current = mutation.isPending
  }, [mutation.isPending, startSave, completeSave])

  return mutation // Passthrough - no mutation modification
}

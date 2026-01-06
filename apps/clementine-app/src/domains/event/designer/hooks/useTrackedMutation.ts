import { useEffect, useRef } from 'react'
import { useEventDesignerStore } from '../stores/useEventDesignerStore'
import type { UseMutationResult } from '@tanstack/react-query'

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
 * @returns Same mutation result (no modifications)
 *
 * @example
 * ```tsx
 * function useUpdateOverlays() {
 *   const mutation = useMutation({ ... })
 *   return useTrackedMutation(mutation) // Add tracking
 * }
 * ```
 */
export function useTrackedMutation<TData, TError, TVariables>(
  mutation: UseMutationResult<TData, TError, TVariables>,
): UseMutationResult<TData, TError, TVariables> {
  const { startSave, completeSave } = useEventDesignerStore()
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

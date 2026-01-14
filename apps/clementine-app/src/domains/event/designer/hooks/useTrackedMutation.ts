/**
 * Tracked Mutation Hook for Event Designer
 *
 * Domain-specific wrapper around the shared useTrackedMutation hook.
 * Automatically uses the event designer store.
 */
import { useEventDesignerStore } from '../stores'
import type { UseMutationResult } from '@tanstack/react-query'
import { useTrackedMutation as useTrackedMutationBase } from '@/shared/editor-status'

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
  const store = useEventDesignerStore()
  return useTrackedMutationBase(mutation, store)
}

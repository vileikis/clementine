import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateWorkspace } from '../actions/updateWorkspace'
import type { UpdateWorkspaceInput } from '../types/workspace.types'

/**
 * Update workspace name and/or slug (mutation hook)
 *
 * Uses TanStack Query mutation for optimistic updates and cache invalidation.
 * Automatically invalidates workspace queries on success.
 *
 * @returns Mutation object with mutate/mutateAsync functions and state
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateWorkspace()
 *
 * // Fire and forget
 * updateMutation.mutate({ id: 'workspace-1', name: 'New Name' })
 *
 * // Async/await
 * try {
 *   await updateMutation.mutateAsync({ id: 'workspace-1', slug: 'new-slug' })
 * } catch (error) {
 *   // Handle error (slug conflict, validation, etc.)
 * }
 * ```
 */
export function useUpdateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWorkspace,
    onSuccess: (_, variables) => {
      // Invalidate workspace queries to refetch updated data
      // If slug changed, we need to invalidate all workspace queries
      // since the query key is based on the slug
      queryClient.invalidateQueries({
        queryKey: ['workspace'],
      })
    },
  })
}

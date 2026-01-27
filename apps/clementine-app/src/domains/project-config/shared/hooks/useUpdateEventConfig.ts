/**
 * Generic Hook: useUpdateProjectConfig
 *
 * Mutation hook for updating project config fields using dot notation.
 * Wraps updateProjectConfigField helper with TanStack Query for reactivity.
 *
 * Benefits:
 * - Atomic Firestore updates (no race conditions)
 * - Automatic query invalidation (triggers re-render)
 * - Error handling with Sentry
 * - Supports partial updates (single or multiple fields)
 *
 * @param projectId - Project ID
 * @returns TanStack Query mutation
 *
 * @example
 * ```tsx
 * const updateConfig = useUpdateProjectConfig(projectId)
 *
 * // Update single field
 * await updateConfig.mutateAsync({
 *   'sharing.download': false
 * })
 *
 * // Update multiple fields atomically
 * await updateConfig.mutateAsync({
 *   'sharing.download': false,
 *   'sharing.instagram': true,
 *   'sharing.facebook': true
 * })
 * ```
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { updateProjectConfigField } from '../lib/updateProjectConfigField'

/**
 * Hook for updating project configuration with dot notation
 *
 * @deprecated Use domain-specific hooks (useUpdateWelcome, useUpdateTheme, etc.) instead.
 * This generic hook is kept for backward compatibility.
 */
export function useUpdateEventConfig(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      await updateProjectConfigField(projectId, updates)
    },

    // Success: invalidate queries to trigger re-fetch
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project', projectId],
      })
    },

    // Error: report to Sentry
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'project-config/shared',
          action: 'update-project-config',
        },
        extra: {
          errorType: 'project-config-update-failure',
          projectId,
        },
      })
    },
  })
}

// Provide alias for new naming convention
export { useUpdateEventConfig as useUpdateProjectConfig }

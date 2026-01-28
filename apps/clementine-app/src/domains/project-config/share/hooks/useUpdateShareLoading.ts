/**
 * Domain-Specific Hook: useUpdateShareLoading
 *
 * Specialized mutation hook for updating project share loading state configuration.
 * Pushes the complete shareLoading object to Firestore (atomic replacement).
 *
 * @param projectId - Project ID
 * @returns TanStack Query mutation for share loading updates
 *
 * @example
 * ```tsx
 * const updateShareLoading = useUpdateShareLoading(projectId)
 *
 * // Update entire share loading config
 * await updateShareLoading.mutateAsync({
 *   title: 'Creating your experience...',
 *   description: 'This usually takes 30-60 seconds...'
 * })
 * ```
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { shareLoadingConfigSchema } from '@clementine/shared'
import type { ShareLoadingConfig } from '@clementine/shared'
import { updateProjectConfigField } from '@/domains/project-config/shared'
import { useTrackedMutation } from '@/domains/project-config/designer'

/**
 * Hook for updating project share loading config with domain-specific tracking
 */
export function useUpdateShareLoading(projectId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (shareLoading: ShareLoadingConfig) => {
      // Validate with schema
      const validated = shareLoadingConfigSchema.parse(shareLoading)

      // Push entire shareLoading object (atomic replacement)
      await updateProjectConfigField(projectId, { shareLoading: validated })
    },

    // Success: invalidate queries to trigger re-fetch
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project', projectId],
      })
    },

    // Error: report to Sentry for debugging
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'project-config/share',
          action: 'update-share-loading',
        },
        extra: {
          errorType: 'share-loading-update-failure',
          projectId,
        },
      })
    },
  })

  return useTrackedMutation(mutation)
}

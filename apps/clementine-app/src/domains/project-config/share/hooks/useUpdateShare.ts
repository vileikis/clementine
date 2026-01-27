/**
 * Domain-Specific Hook: useUpdateShare
 *
 * Specialized mutation hook for updating project share screen configuration.
 * Pushes the complete share object to Firestore (atomic replacement).
 *
 * @param projectId - Project ID
 * @returns TanStack Query mutation for share updates
 *
 * @example
 * ```tsx
 * const updateShare = useUpdateShare(projectId)
 *
 * // Update entire share config
 * await updateShare.mutateAsync({
 *   title: 'Your photo is ready!',
 *   description: 'Download or share your creation',
 *   cta: { label: 'Visit Website', url: 'https://example.com' }
 * })
 * ```
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import type { ShareConfig } from '@/domains/project-config/shared/schemas'
import {
  shareWriteSchema,
  updateProjectConfigField,
} from '@/domains/project-config/shared'
import { useTrackedMutation } from '@/domains/project-config/designer'

/**
 * Hook for updating project share config with domain-specific tracking
 */
export function useUpdateShare(projectId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (share: ShareConfig) => {
      // Validate with write schema (stricter than read schema)
      const validated = shareWriteSchema.parse(share)

      // Push entire share object (atomic replacement)
      await updateProjectConfigField(projectId, { share: validated })
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
          action: 'update-share',
        },
        extra: {
          errorType: 'share-update-failure',
          projectId,
        },
      })
    },
  })

  return useTrackedMutation(mutation)
}

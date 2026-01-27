/**
 * Domain-Specific Hook: useUpdateShareOptions
 *
 * Specialized mutation hook for updating project sharing options.
 * Wraps updateProjectConfigField with domain-specific error tracking.
 *
 * Why a separate hook?
 * - Better error tracking (Sentry tags: "update-share-options")
 * - Domain-specific semantics (clear intent)
 * - Type safety for sharing fields
 * - Easier debugging and monitoring
 *
 * @param projectId - Project ID
 * @returns TanStack Query mutation for sharing options
 *
 * @example
 * ```tsx
 * const updateShareOptions = useUpdateShareOptions(projectId)
 *
 * // Update single field
 * await updateShareOptions.mutateAsync({
 *   download: false
 * })
 *
 * // Update multiple fields atomically
 * await updateShareOptions.mutateAsync({
 *   download: false,
 *   instagram: true,
 *   facebook: true
 * })
 * ```
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { updateSharingConfigSchema } from '../schemas'
import type { UpdateSharingConfig } from '../schemas'
import {
  prefixKeys,
  updateProjectConfigField,
} from '@/domains/project-config/shared'
import { useTrackedMutation } from '@/domains/project-config/designer'

/**
 * Hook for updating project sharing options with domain-specific tracking
 */
export function useUpdateShareOptions(projectId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (updates: UpdateSharingConfig) => {
      // Validate partial sharing updates
      const validated = updateSharingConfigSchema.parse(updates)

      // Transform to dot notation with 'shareOptions.' prefix
      // Note: Renamed from 'sharing' to 'shareOptions' (FR-017)
      const dotNotationUpdates = prefixKeys(validated, 'shareOptions')

      // Use shared helper for atomic Firestore update
      await updateProjectConfigField(projectId, dotNotationUpdates)
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
          domain: 'project-config/settings',
          action: 'update-share-options',
        },
        extra: {
          errorType: 'sharing-config-update-failure',
          projectId,
        },
      })
    },
  })

  return useTrackedMutation(mutation)
}

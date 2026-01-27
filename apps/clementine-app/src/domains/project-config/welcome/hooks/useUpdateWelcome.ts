/**
 * Domain-Specific Hook: useUpdateWelcome
 *
 * Specialized mutation hook for updating project welcome configuration.
 * Pushes the complete welcome object to Firestore (atomic replacement).
 *
 * @param projectId - Project ID
 * @returns TanStack Query mutation for welcome updates
 *
 * @example
 * ```tsx
 * const updateWelcome = useUpdateWelcome(projectId)
 *
 * // Update entire welcome config
 * await updateWelcome.mutateAsync({
 *   title: 'Welcome to our event!',
 *   description: 'Choose your experience',
 *   media: { mediaAssetId: 'abc123', url: 'https://...' },
 *   layout: 'grid',
 * })
 * ```
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import type { WelcomeConfig } from '@/domains/project-config/shared'
import {
  updateProjectConfigField,
  welcomeConfigSchema,
} from '@/domains/project-config/shared'
import { useTrackedMutation } from '@/domains/project-config/designer'

/**
 * Hook for updating project welcome config with domain-specific tracking
 *
 * Accepts undefined params - mutation will throw if called without valid IDs
 */
export function useUpdateWelcome(projectId: string | undefined) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (welcome: WelcomeConfig) => {
      // Guard against missing params
      if (!projectId) {
        throw new Error('Cannot update welcome: missing projectId')
      }

      // Validate complete welcome object
      const validated = welcomeConfigSchema.parse(welcome)

      // Push entire welcome object (atomic replacement)
      await updateProjectConfigField(projectId, { welcome: validated })
    },

    // Success: invalidate queries to trigger re-fetch
    onSuccess: () => {
      // Safe to use ! here - mutationFn throws if this is undefined
      queryClient.invalidateQueries({
        queryKey: ['project', projectId!],
      })
    },

    // Error: report to Sentry for debugging
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'project-config/welcome',
          action: 'update-welcome',
        },
        extra: {
          errorType: 'welcome-update-failure',
          projectId,
        },
      })
    },
  })

  return useTrackedMutation(mutation)
}

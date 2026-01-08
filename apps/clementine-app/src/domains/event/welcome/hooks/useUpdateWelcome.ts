/**
 * Domain-Specific Hook: useUpdateWelcome
 *
 * Specialized mutation hook for updating event welcome configuration.
 * Pushes the complete welcome object to Firestore (atomic replacement).
 *
 * @param projectId - Project ID
 * @param eventId - Event ID
 * @returns TanStack Query mutation for welcome updates
 *
 * @example
 * ```tsx
 * const updateWelcome = useUpdateWelcome(projectId, eventId)
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
import type { WelcomeConfig } from '@/domains/event/shared'
import {
  updateEventConfigField,
  welcomeConfigSchema,
} from '@/domains/event/shared'
import { useTrackedMutation } from '@/domains/event/designer'

/**
 * Hook for updating event welcome config with domain-specific tracking
 */
export function useUpdateWelcome(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (welcome: WelcomeConfig) => {
      // Validate complete welcome object
      const validated = welcomeConfigSchema.parse(welcome)

      // Push entire welcome object (atomic replacement)
      await updateEventConfigField(projectId, eventId, { welcome: validated })
    },

    // Success: invalidate queries to trigger re-fetch
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-event', projectId, eventId],
      })
    },

    // Error: report to Sentry for debugging
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'event/welcome',
          action: 'update-welcome',
        },
        extra: {
          errorType: 'welcome-update-failure',
          projectId,
          eventId,
        },
      })
    },
  })

  return useTrackedMutation(mutation)
}

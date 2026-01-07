/**
 * Domain-Specific Hook: useUpdateTheme
 *
 * Specialized mutation hook for updating event theme configuration.
 * Pushes the complete theme object to Firestore (atomic replacement).
 *
 * @param projectId - Project ID
 * @param eventId - Event ID
 * @returns TanStack Query mutation for theme updates
 *
 * @example
 * ```tsx
 * const updateTheme = useUpdateTheme(projectId, eventId)
 *
 * // Update entire theme
 * await updateTheme.mutateAsync({
 *   fontFamily: 'Inter',
 *   primaryColor: '#FF0000',
 *   text: { color: '#FFFFFF', alignment: 'center' },
 *   button: { backgroundColor: null, textColor: '#FFFFFF', radius: 'md' },
 *   background: { color: '#1E1E1E', image: null, overlayOpacity: 0.5 },
 * })
 * ```
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import type { Theme } from '@/shared/theming'
import { themeSchema } from '@/shared/theming'
import { updateEventConfigField } from '@/domains/event/shared'
import { useTrackedMutation } from '@/domains/event/designer'

/**
 * Hook for updating event theme with domain-specific tracking
 */
export function useUpdateTheme(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (theme: Theme) => {
      // Validate complete theme object
      const validated = themeSchema.parse(theme)

      // Push entire theme object (atomic replacement)
      await updateEventConfigField(projectId, eventId, { theme: validated })
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
          domain: 'event/theme',
          action: 'update-theme',
        },
        extra: {
          errorType: 'theme-update-failure',
          projectId,
          eventId,
        },
      })
    },
  })

  return useTrackedMutation(mutation)
}

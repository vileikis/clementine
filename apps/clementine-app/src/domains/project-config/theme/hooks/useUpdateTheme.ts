/**
 * Domain-Specific Hook: useUpdateTheme
 *
 * Specialized mutation hook for updating project theme configuration.
 * Pushes the complete theme object to Firestore (atomic replacement).
 *
 * @param projectId - Project ID
 * @returns TanStack Query mutation for theme updates
 *
 * @example
 * ```tsx
 * const updateTheme = useUpdateTheme(projectId)
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
import { updateProjectConfigField } from '@/domains/project-config/shared'
import { useTrackedMutation } from '@/domains/project-config/designer'

/**
 * Hook for updating project theme with domain-specific tracking
 */
export function useUpdateTheme(projectId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (theme: Theme) => {
      // Validate complete theme object
      const validated = themeSchema.parse(theme)

      // Push entire theme object (atomic replacement)
      await updateProjectConfigField(projectId, { theme: validated })
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
          domain: 'project-config/theme',
          action: 'update-theme',
        },
        extra: {
          errorType: 'theme-update-failure',
          projectId,
        },
      })
    },
  })

  return useTrackedMutation(mutation)
}

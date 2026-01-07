/**
 * Domain-Specific Hook: useUpdateTheme
 *
 * Specialized mutation hook for updating event theme configuration.
 * Wraps updateEventConfigField with domain-specific error tracking.
 *
 * @param projectId - Project ID
 * @param eventId - Event ID
 * @returns TanStack Query mutation for theme updates
 *
 * @example
 * ```tsx
 * const updateTheme = useUpdateTheme(projectId, eventId)
 *
 * // Update single field
 * await updateTheme.mutateAsync({
 *   primaryColor: '#FF0000'
 * })
 *
 * // Update nested fields
 * await updateTheme.mutateAsync({
 *   text: { color: '#FFFFFF', alignment: 'center' }
 * })
 * ```
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import type { z } from 'zod'
import { updateThemeSchema } from '@/shared/theming/schemas/theme.schemas'
import { prefixKeys, updateEventConfigField } from '@/domains/event/shared'
import { useTrackedMutation } from '@/domains/event/designer'

type UpdateTheme = z.infer<typeof updateThemeSchema>

/**
 * Flatten nested theme updates to dot notation
 * e.g., { text: { color: '#fff' } } -> { 'text.color': '#fff' }
 */
function flattenThemeUpdates(
  updates: UpdateTheme,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(updates)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(result, flattenThemeUpdates(value as UpdateTheme, fullKey))
    } else {
      result[fullKey] = value
    }
  }

  return result
}

/**
 * Hook for updating event theme with domain-specific tracking
 */
export function useUpdateTheme(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (updates: UpdateTheme) => {
      // Validate partial theme updates
      const validated = updateThemeSchema.parse(updates)

      // Flatten nested updates to dot notation
      const flattened = flattenThemeUpdates(validated)

      // Add 'theme.' prefix for Firestore update
      const dotNotationUpdates = prefixKeys(flattened, 'theme')

      // Use shared helper for atomic Firestore update
      await updateEventConfigField(projectId, eventId, dotNotationUpdates)
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

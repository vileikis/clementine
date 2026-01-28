/**
 * Domain-Specific Hook: useUpdateVariables
 *
 * Specialized mutation hook for updating AI preset variables.
 * Wraps updateAIPresetDraft with domain-specific validation and tracking.
 *
 * Why a separate hook?
 * - Better error tracking (Sentry tags: "update-variables")
 * - Domain-specific semantics (clear intent)
 * - Type safety for variable operations
 * - Easier debugging and monitoring
 *
 * @param workspaceId - Workspace ID
 * @param presetId - AI Preset ID
 * @returns TanStack Query mutation for variables
 *
 * @example
 * ```tsx
 * const updateVariables = useUpdateVariables(workspaceId, presetId)
 *
 * // Replace entire variables array
 * await updateVariables.mutateAsync([
 *   { type: 'text', name: 'style', defaultValue: 'modern', valueMap: null }
 * ])
 * ```
 */
import { useMutation } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { z } from 'zod'
import { presetVariableSchema } from '@clementine/shared'
import { updateAIPresetDraft } from '../lib/updateAIPresetDraft'
import { useAIPresetEditorStore } from '../stores/useAIPresetEditorStore'
import { useTrackedMutation } from '@/shared/editor-status'

/**
 * Schema for variables array updates
 */
const updateVariablesSchema = z.array(presetVariableSchema)

export type UpdateVariablesInput = z.infer<typeof updateVariablesSchema>

/**
 * Hook for updating AI preset variables with domain-specific tracking
 */
export function useUpdateVariables(workspaceId: string, presetId: string) {
  const store = useAIPresetEditorStore()

  const mutation = useMutation({
    mutationFn: async (variables: UpdateVariablesInput) => {
      // Validate variables array
      const validated = updateVariablesSchema.parse(variables)

      // Use shared helper for atomic Firestore update
      await updateAIPresetDraft(workspaceId, presetId, {
        variables: validated,
      })
    },

    // Error: report to Sentry for debugging
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'ai-presets/editor',
          action: 'update-variables',
        },
        extra: {
          errorType: 'variables-update-failure',
          workspaceId,
          presetId,
        },
      })
    },
  })

  return useTrackedMutation(mutation, store)
}

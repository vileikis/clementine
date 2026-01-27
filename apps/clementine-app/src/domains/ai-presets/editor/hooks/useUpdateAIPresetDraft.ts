/**
 * Generic Hook: useUpdateAIPresetDraft
 *
 * Mutation hook for updating AI preset draft fields.
 * Wraps updateAIPresetDraft helper with TanStack Query for reactivity.
 *
 * Benefits:
 * - Atomic Firestore updates (no race conditions)
 * - Automatic query invalidation (triggers re-render)
 * - Error handling with Sentry
 * - Supports partial updates (single or multiple fields)
 *
 * @param workspaceId - Workspace ID
 * @param presetId - AI Preset ID
 * @returns TanStack Query mutation
 *
 * @example
 * ```tsx
 * const updateDraft = useUpdateAIPresetDraft(workspaceId, presetId)
 *
 * // Update single field
 * await updateDraft.mutateAsync({ model: 'gemini-2.5-pro' })
 *
 * // Update multiple fields atomically
 * await updateDraft.mutateAsync({
 *   model: 'gemini-2.5-pro',
 *   aspectRatio: '16:9'
 * })
 * ```
 */
import { useMutation } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { updateAIPresetDraft } from '../lib/updateAIPresetDraft'

/**
 * Hook for updating AI preset draft configuration
 */
export function useUpdateAIPresetDraft(workspaceId: string, presetId: string) {
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      await updateAIPresetDraft(workspaceId, presetId, updates)
    },

    // Error: report to Sentry
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'ai-presets/editor',
          action: 'update-ai-preset-draft',
        },
        extra: {
          errorType: 'ai-preset-draft-update-failure',
          workspaceId,
          presetId,
        },
      })
    },
  })
}

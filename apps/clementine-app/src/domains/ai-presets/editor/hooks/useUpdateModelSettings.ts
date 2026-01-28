/**
 * Domain-Specific Hook: useUpdateModelSettings
 *
 * Specialized mutation hook for updating AI preset model settings.
 * Wraps updateAIPresetDraft with domain-specific validation and tracking.
 *
 * Why a separate hook?
 * - Better error tracking (Sentry tags: "update-model-settings")
 * - Domain-specific semantics (clear intent)
 * - Type safety for model setting fields
 * - Easier debugging and monitoring
 *
 * @param workspaceId - Workspace ID
 * @param presetId - AI Preset ID
 * @returns TanStack Query mutation for model settings
 *
 * @example
 * ```tsx
 * const updateModelSettings = useUpdateModelSettings(workspaceId, presetId)
 *
 * // Update model
 * await updateModelSettings.mutateAsync({ model: 'gemini-2.5-pro' })
 *
 * // Update aspect ratio
 * await updateModelSettings.mutateAsync({ aspectRatio: '16:9' })
 *
 * // Update both atomically
 * await updateModelSettings.mutateAsync({
 *   model: 'gemini-2.5-pro',
 *   aspectRatio: '16:9'
 * })
 * ```
 */
import { useMutation } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { z } from 'zod'
import { aiModelSchema, aspectRatioSchema } from '@clementine/shared'
import { updateAIPresetDraft } from '../lib/updateAIPresetDraft'
import { useAIPresetEditorStore } from '../stores/useAIPresetEditorStore'
import { useTrackedMutation } from '@/shared/editor-status'

/**
 * Schema for model settings updates
 */
const updateModelSettingsSchema = z.object({
  model: aiModelSchema.optional(),
  aspectRatio: aspectRatioSchema.optional(),
})

export type UpdateModelSettingsInput = z.infer<typeof updateModelSettingsSchema>

/**
 * Hook for updating AI preset model settings with domain-specific tracking
 */
export function useUpdateModelSettings(workspaceId: string, presetId: string) {
  const store = useAIPresetEditorStore()

  const mutation = useMutation({
    mutationFn: async (updates: UpdateModelSettingsInput) => {
      // Validate model settings updates
      const validated = updateModelSettingsSchema.parse(updates)

      // Use shared helper for atomic Firestore update
      await updateAIPresetDraft(workspaceId, presetId, validated)
    },

    // Error: report to Sentry for debugging
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'ai-presets/editor',
          action: 'update-model-settings',
        },
        extra: {
          errorType: 'model-settings-update-failure',
          workspaceId,
          presetId,
        },
      })
    },
  })

  return useTrackedMutation(mutation, store)
}

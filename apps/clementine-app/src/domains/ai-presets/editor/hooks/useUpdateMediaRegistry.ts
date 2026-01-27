/**
 * Domain-Specific Hook: useUpdateMediaRegistry
 *
 * Specialized mutation hook for updating AI preset media registry.
 * Wraps updateAIPresetDraft with domain-specific validation and tracking.
 *
 * Why a separate hook?
 * - Better error tracking (Sentry tags: "update-media-registry")
 * - Domain-specific semantics (clear intent)
 * - Type safety for media registry operations
 * - Easier debugging and monitoring
 *
 * @param workspaceId - Workspace ID
 * @param presetId - AI Preset ID
 * @returns TanStack Query mutation for media registry
 *
 * @example
 * ```tsx
 * const updateMediaRegistry = useUpdateMediaRegistry(workspaceId, presetId)
 *
 * // Replace entire registry
 * await updateMediaRegistry.mutateAsync([
 *   { mediaAssetId: 'abc', url: '...', filePath: '...', name: 'style_ref' }
 * ])
 * ```
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { z } from 'zod'
import { presetMediaEntrySchema } from '@clementine/shared'
import { updateAIPresetDraft } from '../lib/updateAIPresetDraft'
import { useAIPresetEditorStore } from '../stores/useAIPresetEditorStore'
import { useTrackedMutation } from '@/shared/editor-status'

/**
 * Schema for media registry updates
 */
const updateMediaRegistrySchema = z.array(presetMediaEntrySchema)

export type UpdateMediaRegistryInput = z.infer<typeof updateMediaRegistrySchema>

/**
 * Hook for updating AI preset media registry with domain-specific tracking
 */
export function useUpdateMediaRegistry(workspaceId: string, presetId: string) {
  const queryClient = useQueryClient()
  const store = useAIPresetEditorStore()

  const mutation = useMutation({
    mutationFn: async (mediaRegistry: UpdateMediaRegistryInput) => {
      // Validate media registry
      const validated = updateMediaRegistrySchema.parse(mediaRegistry)

      // Use shared helper for atomic Firestore update
      await updateAIPresetDraft(workspaceId, presetId, {
        mediaRegistry: validated,
      })
    },

    // Success: invalidate queries to trigger re-fetch
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['aiPreset', workspaceId, presetId],
      })
      queryClient.invalidateQueries({
        queryKey: ['aiPresets', workspaceId],
      })
    },

    // Error: report to Sentry for debugging
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'ai-presets/editor',
          action: 'update-media-registry',
        },
        extra: {
          errorType: 'media-registry-update-failure',
          workspaceId,
          presetId,
        },
      })
    },
  })

  return useTrackedMutation(mutation, store)
}

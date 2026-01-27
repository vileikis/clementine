/**
 * useUpdateAIPreset Hook
 *
 * Mutation hook for updating AI preset fields.
 * Supports partial updates with save tracking via useTrackedMutation.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { updateAIPresetInputSchema } from '../schemas/ai-preset-editor.schemas'
import { useAIPresetEditorStore } from '../stores/useAIPresetEditorStore'
import type { UpdateAIPresetInput } from '../schemas/ai-preset-editor.schemas'
import { useTrackedMutation } from '@/shared/editor-status'
import { firestore } from '@/integrations/firebase/client'

/**
 * Update AI preset mutation with save tracking
 *
 * Supports partial updates - only sends changed fields.
 * Uses transaction with serverTimestamp to prevent Zod parse errors.
 * Automatically tracks save state via useTrackedMutation.
 *
 * @param workspaceId - Workspace ID for the preset collection
 * @param presetId - AI preset ID to update
 * @returns Mutation result with presetId on success
 *
 * @example
 * ```tsx
 * const updatePreset = useUpdateAIPreset(workspaceId, presetId)
 *
 * // Update name
 * updatePreset.mutate({ name: 'New Name' })
 *
 * // Update multiple fields
 * updatePreset.mutate({
 *   model: 'gemini-2.5-pro',
 *   aspectRatio: '16:9',
 * })
 * ```
 */
export function useUpdateAIPreset(workspaceId: string, presetId: string) {
  const queryClient = useQueryClient()
  const store = useAIPresetEditorStore()

  const mutation = useMutation({
    mutationFn: async (input: UpdateAIPresetInput) => {
      const validated = updateAIPresetInputSchema.parse(input)

      return await runTransaction(firestore, async (transaction) => {
        const presetRef = doc(
          firestore,
          `workspaces/${workspaceId}/aiPresets`,
          presetId,
        )

        // Read preset to validate it exists (all reads must happen before writes)
        const presetDoc = await transaction.get(presetRef)
        if (!presetDoc.exists()) {
          throw new Error(`Preset ${presetId} not found`)
        }

        // Update only the provided fields plus timestamp
        transaction.update(presetRef, {
          ...validated,
          updatedAt: serverTimestamp(),
        })

        return { presetId }
      })
    },
    onSuccess: () => {
      // Invalidate both single preset and list queries
      queryClient.invalidateQueries({
        queryKey: ['aiPreset', workspaceId, presetId],
      })
      queryClient.invalidateQueries({
        queryKey: ['aiPresets', workspaceId],
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'ai-presets',
          action: 'update-ai-preset',
        },
        extra: {
          presetId,
          errorType: 'preset-update-failure',
        },
      })
    },
  })

  // Wrap mutation with save tracking
  return useTrackedMutation(mutation, store)
}

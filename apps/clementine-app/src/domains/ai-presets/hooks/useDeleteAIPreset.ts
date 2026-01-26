/**
 * useDeleteAIPreset Hook
 *
 * Mutation hook for soft-deleting AI presets.
 * Sets status to "deleted" and records deletedAt timestamp.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { deleteAIPresetInputSchema } from '../schemas/ai-preset.input.schemas'
import type { DeleteAIPresetInput } from '../schemas/ai-preset.input.schemas'
import { firestore } from '@/integrations/firebase/client'

/**
 * Delete AI preset mutation (admin-only operation)
 *
 * Soft-deletes the preset (sets status to "deleted").
 * Uses Firestore transaction to atomically update status and deletedAt.
 * Security enforced via Firestore rules.
 *
 * @param workspaceId - Workspace ID for the preset collection
 * @returns Mutation result with presetId on success
 */
export function useDeleteAIPreset(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeleteAIPresetInput) => {
      const validated = deleteAIPresetInputSchema.parse(input)

      return await runTransaction(firestore, async (transaction) => {
        const presetRef = doc(
          firestore,
          `workspaces/${workspaceId}/aiPresets`,
          validated.presetId,
        )

        // Read preset to validate it exists (all reads must happen before writes)
        const presetDoc = await transaction.get(presetRef)
        if (!presetDoc.exists()) {
          throw new Error(`Preset ${validated.presetId} not found`)
        }

        // Soft delete preset
        transaction.update(presetRef, {
          status: 'deleted',
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        return { presetId: validated.presetId, workspaceId }
      })
    },
    onSuccess: () => {
      // Invalidate presets list (deleted preset will disappear)
      queryClient.invalidateQueries({
        queryKey: ['aiPresets', workspaceId],
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'ai-presets',
          action: 'delete-ai-preset',
        },
        extra: {
          errorType: 'preset-deletion-failure',
        },
      })
    },
  })
}

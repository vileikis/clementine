/**
 * useRenameAIPreset Hook
 *
 * Mutation hook for renaming AI presets.
 * Uses transaction with serverTimestamp to prevent Zod parse errors.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { renameAIPresetInputSchema } from '../schemas/ai-preset.input.schemas'
import type { RenameAIPresetInput } from '../schemas/ai-preset.input.schemas'
import { firestore } from '@/integrations/firebase/client'

/**
 * Rename AI preset mutation (admin-only operation)
 *
 * Updates the preset name with real-time sync.
 * Uses transaction to ensure serverTimestamp() resolves before returning,
 * preventing Zod parse errors from real-time listeners.
 * Security enforced via Firestore rules.
 *
 * @param workspaceId - Workspace ID for the preset collection
 * @returns Mutation result with presetId and new name on success
 */
export function useRenameAIPreset(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RenameAIPresetInput) => {
      const validated = renameAIPresetInputSchema.parse(input)

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

        // Update preset name and timestamp
        transaction.update(presetRef, {
          name: validated.name,
          updatedAt: serverTimestamp(),
        })

        return { presetId: validated.presetId, name: validated.name }
      })
    },
    onSuccess: () => {
      // Invalidate presets list to reflect new name
      queryClient.invalidateQueries({
        queryKey: ['aiPresets', workspaceId],
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'ai-presets',
          action: 'rename-ai-preset',
        },
        extra: {
          errorType: 'preset-rename-failure',
        },
      })
    },
  })
}

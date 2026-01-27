/**
 * useUpdateAIPreset Hook
 *
 * Mutation hook for updating AI preset top-level fields (name, description).
 * For draft config fields, use section-specific hooks instead:
 * - useUpdateModelSettings (model, aspectRatio)
 * - useUpdateMediaRegistry (mediaRegistry)
 * - useUpdateVariables (variables) - Phase 6
 * - useUpdatePromptTemplate (promptTemplate) - Phase 8
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { z } from 'zod'
import { useAIPresetEditorStore } from '../stores/useAIPresetEditorStore'
import { useTrackedMutation } from '@/shared/editor-status'
import { firestore } from '@/integrations/firebase/client'

/**
 * Schema for top-level preset updates (outside of draft config)
 */
const updateAIPresetSchema = z
  .object({
    /** Preset display name (1-100 chars) */
    name: z.string().min(1).max(100).optional(),

    /** Optional description (max 500 chars) */
    description: z.string().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export type UpdateAIPresetInput = z.infer<typeof updateAIPresetSchema>

/**
 * Update AI preset top-level fields (name, description)
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
 * // Update description
 * updatePreset.mutate({ description: 'New description' })
 * ```
 */
export function useUpdateAIPreset(workspaceId: string, presetId: string) {
  const queryClient = useQueryClient()
  const store = useAIPresetEditorStore()

  const mutation = useMutation({
    mutationFn: async (input: UpdateAIPresetInput) => {
      const validated = updateAIPresetSchema.parse(input)

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
          domain: 'ai-presets/editor',
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

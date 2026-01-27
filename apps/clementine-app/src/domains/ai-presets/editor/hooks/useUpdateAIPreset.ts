/**
 * useUpdateAIPreset Hook
 *
 * Mutation hook for updating AI preset fields.
 * Supports partial updates with save tracking via useTrackedMutation.
 *
 * Draft/Published Model (Phase 5.5):
 * - Top-level fields (name, description) are written directly to preset
 * - Draft config fields are written to preset.draft.* using dot notation
 * - draftVersion is incremented on each update that includes draft changes
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
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
 * Draft/Published Workflow:
 * - Draft config fields (model, aspectRatio, etc.) are written to preset.draft.*
 * - Top-level fields (name, description) remain at preset root
 * - draftVersion is incremented when draft fields are updated
 *
 * @param workspaceId - Workspace ID for the preset collection
 * @param presetId - AI preset ID to update
 * @returns Mutation result with presetId on success
 *
 * @example
 * ```tsx
 * const updatePreset = useUpdateAIPreset(workspaceId, presetId)
 *
 * // Update name (top-level)
 * updatePreset.mutate({ name: 'New Name' })
 *
 * // Update draft config fields
 * updatePreset.mutate({
 *   draft: {
 *     model: 'gemini-2.5-pro',
 *     aspectRatio: '16:9',
 *   }
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

        // Build update object
         
        const updates: Record<string, any> = {
          updatedAt: serverTimestamp(),
        }

        // Add top-level fields
        if (validated.name !== undefined) {
          updates.name = validated.name
        }
        if (validated.description !== undefined) {
          updates.description = validated.description
        }

        // Add draft config fields using dot notation
        if (validated.draft) {
          const { draft } = validated
          if (draft.model !== undefined) {
            updates['draft.model'] = draft.model
          }
          if (draft.aspectRatio !== undefined) {
            updates['draft.aspectRatio'] = draft.aspectRatio
          }
          if (draft.mediaRegistry !== undefined) {
            updates['draft.mediaRegistry'] = draft.mediaRegistry
          }
          if (draft.variables !== undefined) {
            updates['draft.variables'] = draft.variables
          }
          if (draft.promptTemplate !== undefined) {
            updates['draft.promptTemplate'] = draft.promptTemplate
          }

          // Increment draftVersion when draft fields are updated
          updates.draftVersion = increment(1)
        }

        transaction.update(presetRef, updates)

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

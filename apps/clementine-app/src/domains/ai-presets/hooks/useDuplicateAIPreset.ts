/**
 * useDuplicateAIPreset Hook
 *
 * Mutation hook for duplicating AI presets.
 * Creates a copy with "Copy of [original name]" as the new name.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { duplicateAIPresetInputSchema } from '../schemas/ai-preset.input.schemas'
import type { DuplicateAIPresetInput } from '../schemas/ai-preset.input.schemas'
import { firestore } from '@/integrations/firebase/client'
import { useAuth } from '@/domains/auth'

/**
 * Duplicate AI preset mutation (admin-only operation)
 *
 * Creates a copy of an existing preset with all configuration.
 * New name defaults to "Copy of [original name]".
 * Security enforced via Firestore rules.
 *
 * @param workspaceId - Workspace ID for the preset collection
 * @returns Mutation result with new presetId on success
 */
export function useDuplicateAIPreset(workspaceId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: DuplicateAIPresetInput) => {
      const validated = duplicateAIPresetInputSchema.parse(input)

      const presetsRef = collection(
        firestore,
        `workspaces/${workspaceId}/aiPresets`,
      )

      // Read the original preset
      const originalRef = doc(presetsRef, validated.presetId)
      const originalDoc = await getDoc(originalRef)

      if (!originalDoc.exists()) {
        throw new Error(`Preset ${validated.presetId} not found`)
      }

      const originalData = originalDoc.data()

      // Use transaction to create the duplicate
      return await runTransaction(firestore, (transaction) => {
        const newPresetRef = doc(presetsRef)

        const duplicateName =
          validated.newName ?? `Copy of ${originalData.name}`

        transaction.set(newPresetRef, {
          ...originalData,
          id: newPresetRef.id,
          name: duplicateName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          deletedAt: null,
          createdBy: user?.uid ?? '',
        })

        return Promise.resolve({
          presetId: newPresetRef.id,
          workspaceId,
        })
      })
    },
    onSuccess: () => {
      // Invalidate presets list
      queryClient.invalidateQueries({
        queryKey: ['aiPresets', workspaceId],
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'ai-presets',
          action: 'duplicate-ai-preset',
        },
        extra: {
          errorType: 'preset-duplication-failure',
        },
      })
    },
  })
}

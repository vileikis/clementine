/**
 * useCreateAIPreset Hook
 *
 * Mutation hook for creating new AI presets.
 * Uses transaction with serverTimestamp to prevent Zod parse errors from real-time listeners.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { createAIPresetInputSchema } from '../schemas/ai-preset.input.schemas'
import type { CreateAIPresetInput } from '../schemas/ai-preset.input.schemas'
import { firestore } from '@/integrations/firebase/client'
import { useAuth } from '@/domains/auth'

/**
 * Create AI preset mutation (admin-only operation)
 *
 * Creates a new AI preset with default values.
 * Uses transaction to ensure serverTimestamp() resolves before returning,
 * preventing Zod parse errors from real-time listeners.
 * Security enforced via Firestore rules.
 *
 * @param workspaceId - Workspace ID for the preset collection
 * @returns Mutation result with presetId on success
 */
export function useCreateAIPreset(workspaceId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateAIPresetInput = {}) => {
      const validated = createAIPresetInputSchema.parse(input)

      const presetsRef = collection(
        firestore,
        `workspaces/${workspaceId}/aiPresets`,
      )

      // ALWAYS use transaction with serverTimestamp()
      return await runTransaction(firestore, (transaction) => {
        const newPresetRef = doc(presetsRef)

        transaction.set(newPresetRef, {
          id: newPresetRef.id,
          name: validated.name ?? 'Untitled preset',
          description: null,
          status: 'active',
          mediaRegistry: [],
          variables: [],
          promptTemplate: '',
          model: 'gemini-2.5-flash',
          aspectRatio: '1:1',
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
          action: 'create-ai-preset',
        },
        extra: {
          errorType: 'preset-creation-failure',
        },
      })
    },
  })
}

/**
 * usePublishAIPreset Hook
 *
 * Mutation hook for publishing AI preset draft to live configuration.
 * Copies draft → published and updates version tracking fields.
 */
import { useMutation } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import type { AIPreset } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'

interface PublishAIPresetParams {
  workspaceId: string
  preset: AIPreset
  userId: string
}

interface PublishAIPresetResult {
  presetId: string
  publishedVersion: number
}

/**
 * Publish AI preset draft to live configuration
 *
 * Workflow:
 * 1. Copies preset.draft → preset.published
 * 2. Sets publishedVersion = draftVersion
 * 3. Sets publishedAt = serverTimestamp
 * 4. Sets publishedBy = current user UID
 *
 * @returns Mutation that publishes the preset draft
 *
 * @example
 * ```tsx
 * const publishPreset = usePublishAIPreset()
 *
 * const handlePublish = async () => {
 *   await publishPreset.mutateAsync({
 *     workspaceId,
 *     preset,
 *     userId: user.uid,
 *   })
 *   toast.success('Preset published')
 * }
 * ```
 */
export function usePublishAIPreset() {
  return useMutation({
    mutationFn: async ({
      workspaceId,
      preset,
      userId,
    }: PublishAIPresetParams): Promise<PublishAIPresetResult> => {
      return await runTransaction(firestore, async (transaction) => {
        const presetRef = doc(
          firestore,
          `workspaces/${workspaceId}/aiPresets`,
          preset.id,
        )

        // Read preset to get current draft and version
        const presetDoc = await transaction.get(presetRef)
        if (!presetDoc.exists()) {
          throw new Error(`Preset ${preset.id} not found`)
        }

        const currentData = presetDoc.data()
        const currentDraft = currentData.draft
        const currentDraftVersion = currentData.draftVersion ?? 1

        if (!currentDraft) {
          throw new Error('Preset has no draft to publish')
        }

        // Copy draft to published and update version tracking
        transaction.update(presetRef, {
          published: currentDraft,
          publishedVersion: currentDraftVersion,
          publishedAt: serverTimestamp(),
          publishedBy: userId,
          updatedAt: serverTimestamp(),
        })

        return {
          presetId: preset.id,
          publishedVersion: currentDraftVersion,
        }
      })
    },
    onError: (error, { workspaceId, preset }) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'ai-presets',
          action: 'publish-ai-preset',
        },
        extra: {
          workspaceId,
          presetId: preset.id,
          errorType: 'preset-publish-failure',
        },
      })
    },
  })
}

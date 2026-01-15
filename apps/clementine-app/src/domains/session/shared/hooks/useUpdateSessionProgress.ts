/**
 * useUpdateSessionProgress Hook
 *
 * Mutation hook for updating session progress during experience execution.
 * Updates current step index, answers array, and captured media.
 */
import { useMutation } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

import { updateSessionProgressInputSchema } from '../types/session-api.types'
import type { UpdateSessionProgressInput } from '../types/session-api.types'
import type { Answer, CapturedMedia } from '../schemas/session.schema'
import { firestore } from '@/integrations/firebase/client'

/**
 * Input type for update mutation with projectId
 */
interface UpdateProgressInput extends UpdateSessionProgressInput {
  projectId: string
}

/**
 * Hook for updating session progress
 *
 * Features:
 * - Validates input with Zod schema
 * - Merges answers/capturedMedia arrays with existing data
 * - Updates serverTimestamp on each write
 * - No query invalidation needed (useSubscribeSession uses onSnapshot)
 * - Captures errors to Sentry
 *
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function RuntimeEngine({ session }) {
 *   const updateProgress = useUpdateSessionProgress()
 *
 *   const handleStepComplete = (stepId: string, stepType: string, value: unknown) => {
 *     const answer = { stepId, stepType, value, answeredAt: Date.now() }
 *     updateProgress.mutate({
 *       projectId: session.projectId,
 *       sessionId: session.id,
 *       currentStepIndex: currentStepIndex + 1,
 *       answers: [answer],
 *     })
 *   }
 * }
 * ```
 */
export function useUpdateSessionProgress() {
  return useMutation<void, Error, UpdateProgressInput>({
    mutationFn: async (input) => {
      // Validate input (excluding projectId which is not in the schema)
      const { projectId, ...progressInput } = input
      const validated = updateSessionProgressInputSchema.parse(progressInput)

      const sessionRef = doc(
        firestore,
        `projects/${projectId}/sessions/${validated.sessionId}`,
      )

      await runTransaction(firestore, async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef)

        if (!sessionDoc.exists()) {
          throw new Error(`Session ${validated.sessionId} not found`)
        }

        const existingData = sessionDoc.data()

        // Build update object
        const updates: Record<string, unknown> = {
          updatedAt: serverTimestamp(),
        }

        // Update currentStepIndex if provided
        if (validated.currentStepIndex !== undefined) {
          updates.currentStepIndex = validated.currentStepIndex
        }

        // Merge answers array if provided (replace by stepId, append new)
        if (validated.answers && validated.answers.length > 0) {
          const existingAnswers: Answer[] = existingData.answers ?? []
          const newStepIds = new Set(validated.answers.map((a) => a.stepId))
          // Keep answers for steps not being updated, then add new ones
          const mergedAnswers = [
            ...existingAnswers.filter((a) => !newStepIds.has(a.stepId)),
            ...validated.answers,
          ]
          updates.answers = mergedAnswers
        }

        // Merge capturedMedia array if provided (replace by stepId, append new)
        if (validated.capturedMedia && validated.capturedMedia.length > 0) {
          const existingMedia: CapturedMedia[] =
            existingData.capturedMedia ?? []
          const newStepIds = new Set(
            validated.capturedMedia.map((m) => m.stepId),
          )
          // Keep media for steps not being updated, then add new ones
          const mergedMedia = [
            ...existingMedia.filter((m) => !newStepIds.has(m.stepId)),
            ...validated.capturedMedia,
          ]
          updates.capturedMedia = mergedMedia
        }

        // Set resultMedia if provided
        if (validated.resultMedia) {
          updates.resultMedia = validated.resultMedia
        }

        transaction.update(sessionRef, updates)
      })
    },
    onError: (error, { sessionId }) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'session',
          action: 'update-session-progress',
        },
        extra: { sessionId },
      })
    },
  })
}

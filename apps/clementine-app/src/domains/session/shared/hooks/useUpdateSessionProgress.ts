/**
 * useUpdateSessionProgress Hook
 *
 * Mutation hook for updating session progress during experience execution.
 * Updates current step index, answers array, and captured media.
 *
 * Uses direct updateDoc (no transaction) since the runtime store is the
 * source of truth during execution.
 */
import { useMutation } from '@tanstack/react-query'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

import type { UpdateData } from 'firebase/firestore'
import type { Answer, CapturedMedia, Session } from '../schemas/session.schema'

import { firestore } from '@/integrations/firebase/client'

/**
 * Input type for update mutation
 */
interface UpdateProgressInput {
  projectId: string
  sessionId: string
  currentStepIndex?: number
  answers?: Answer[]
  capturedMedia?: CapturedMedia[]
}

/**
 * Hook for updating session progress
 *
 * Features:
 * - Direct updateDoc (no transaction overhead)
 * - Type-safe updates with UpdateData<Session>
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
 *       answers: [...existingAnswers, answer],
 *     })
 *   }
 * }
 * ```
 */
export function useUpdateSessionProgress() {
  return useMutation<void, Error, UpdateProgressInput>({
    mutationFn: async ({
      projectId,
      sessionId,
      currentStepIndex,
      answers,
      capturedMedia,
    }) => {
      const sessionRef = doc(
        firestore,
        `projects/${projectId}/sessions/${sessionId}`,
      )

      const updates: UpdateData<Session> = {
        updatedAt: serverTimestamp(),
      }

      if (currentStepIndex !== undefined) {
        updates.currentStepIndex = currentStepIndex
      }
      if (answers) {
        updates.answers = answers
      }
      if (capturedMedia) {
        updates.capturedMedia = capturedMedia
      }

      await updateDoc(sessionRef, updates)
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

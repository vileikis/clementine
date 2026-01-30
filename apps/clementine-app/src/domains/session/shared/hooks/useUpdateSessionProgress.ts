/**
 * useUpdateSessionProgress Hook
 *
 * Mutation hook for updating session progress during experience execution.
 * Updates answers array and captured media.
 *
 * Uses transaction for consistency.
 */
import { useMutation } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

import type { UpdateData } from 'firebase/firestore'
import type { Answer, CapturedMedia, Session } from '../schemas'

import { firestore } from '@/integrations/firebase/client'

/**
 * Input type for update mutation
 */
interface UpdateProgressInput {
  projectId: string
  sessionId: string
  answers?: Answer[]
  capturedMedia?: CapturedMedia[]
}

/**
 * Hook for updating session progress
 *
 * Features:
 * - Uses transaction for consistency
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
 *       answers: [...existingAnswers, answer],
 *     })
 *   }
 * }
 * ```
 */
export function useUpdateSessionProgress() {
  return useMutation<void, Error, UpdateProgressInput>({
    mutationFn: async ({ projectId, sessionId, answers, capturedMedia }) => {
      const sessionRef = doc(
        firestore,
        `projects/${projectId}/sessions/${sessionId}`,
      )

      // eslint-disable-next-line @typescript-eslint/require-await -- callback must be async for TypeScript inference
      await runTransaction(firestore, async (transaction) => {
        const updates: UpdateData<Session> = {
          updatedAt: serverTimestamp(),
        }

        if (answers) {
          // Cast to satisfy Firestore types (MultiSelectOption[] is not recognized by UpdateData)
          updates.answers = answers as UpdateData<Session>['answers']
        }
        if (capturedMedia) {
          updates.capturedMedia = capturedMedia
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

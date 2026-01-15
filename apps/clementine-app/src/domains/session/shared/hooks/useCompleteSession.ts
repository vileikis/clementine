/**
 * useCompleteSession Hook
 *
 * Mutation hook for marking a session as completed.
 * Sets status to 'completed' and records completedAt timestamp.
 */
import { useMutation } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

import { firestore } from '@/integrations/firebase/client'

/**
 * Input for completing a session
 */
interface CompleteSessionInput {
  projectId: string
  sessionId: string
}

/**
 * Hook for completing a session
 *
 * Features:
 * - Updates status to 'completed'
 * - Sets completedAt and updatedAt timestamps
 * - No query invalidation needed (useSubscribeSession uses onSnapshot)
 * - Captures errors to Sentry
 *
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function RuntimeEngine({ session, onComplete }) {
 *   const completeSession = useCompleteSession()
 *
 *   const handleExperienceComplete = async () => {
 *     await completeSession.mutateAsync({
 *       projectId: session.projectId,
 *       sessionId: session.id,
 *     })
 *     onComplete?.()
 *   }
 * }
 * ```
 */
export function useCompleteSession() {
  return useMutation<void, Error, CompleteSessionInput>({
    mutationFn: async ({ projectId, sessionId }) => {
      const sessionRef = doc(
        firestore,
        `projects/${projectId}/sessions/${sessionId}`,
      )

      await runTransaction(firestore, async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef)

        if (!sessionDoc.exists()) {
          throw new Error(`Session ${sessionId} not found`)
        }

        transaction.update(sessionRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      })
    },
    onError: (error, { sessionId }) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'session',
          action: 'complete-session',
        },
        extra: { sessionId },
      })
    },
  })
}

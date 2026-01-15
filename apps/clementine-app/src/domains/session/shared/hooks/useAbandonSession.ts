/**
 * useAbandonSession Hook
 *
 * Mutation hook for marking a session as abandoned.
 * Used when user closes preview/experience before completion.
 */
import { useMutation } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

import { firestore } from '@/integrations/firebase/client'

/**
 * Input for abandoning a session
 */
interface AbandonSessionInput {
  projectId: string
  sessionId: string
}

/**
 * Hook for abandoning a session
 *
 * Features:
 * - Updates status to 'abandoned'
 * - Sets updatedAt timestamp
 * - No query invalidation needed (useSubscribeSession uses onSnapshot)
 * - Captures errors to Sentry
 *
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function PreviewModal({ session, onClose }) {
 *   const abandonSession = useAbandonSession()
 *
 *   const handleClose = async () => {
 *     if (session.status === 'active') {
 *       await abandonSession.mutateAsync({
 *         projectId: session.projectId,
 *         sessionId: session.id,
 *       })
 *     }
 *     onClose()
 *   }
 * }
 * ```
 */
export function useAbandonSession() {
  return useMutation<void, Error, AbandonSessionInput>({
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

        // Only abandon if still active
        const currentStatus = sessionDoc.data().status
        if (currentStatus !== 'active') {
          // Session already completed or abandoned, no-op
          return
        }

        transaction.update(sessionRef, {
          status: 'abandoned',
          updatedAt: serverTimestamp(),
        })
      })
    },
    onError: (error, { sessionId }) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'session',
          action: 'abandon-session',
        },
        extra: { sessionId },
      })
    },
  })
}

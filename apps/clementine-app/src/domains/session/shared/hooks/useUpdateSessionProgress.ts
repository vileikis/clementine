/**
 * useUpdateSessionProgress Hook
 *
 * Mutation hook for updating session progress during experience execution.
 * Updates the unified responses array.
 *
 * Uses transaction for consistency.
 */
import { useMutation } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

import type { UpdateData } from 'firebase/firestore'
import type { SessionResponse } from '@clementine/shared'
import type { Session } from '../schemas'

import { firestore } from '@/integrations/firebase/client'

/**
 * Input type for update mutation
 */
interface UpdateProgressInput {
  projectId: string
  sessionId: string
  /** Unified responses array */
  responses: SessionResponse[]
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
 *   const handleStepComplete = (response: SessionResponse) => {
 *     updateProgress.mutate({
 *       projectId: session.projectId,
 *       sessionId: session.id,
 *       responses: [...existingResponses, response],
 *     })
 *   }
 * }
 * ```
 */
export function useUpdateSessionProgress() {
  return useMutation<void, Error, UpdateProgressInput>({
    mutationFn: async ({ projectId, sessionId, responses }) => {
      const sessionRef = doc(
        firestore,
        `projects/${projectId}/sessions/${sessionId}`,
      )

      // eslint-disable-next-line @typescript-eslint/require-await -- callback must be async for TypeScript inference
      await runTransaction(firestore, async (transaction) => {
        const updates: UpdateData<Session> = {
          updatedAt: serverTimestamp(),
          responses: responses as UpdateData<Session>['responses'],
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

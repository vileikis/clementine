/**
 * useLinkSession Hook
 *
 * Mutation hook for linking a session to a main session via mainSessionId.
 * Used to link pregate/preshare sessions to the main experience session
 * for analytics and journey reconstruction.
 *
 * Path: /projects/{projectId}/sessions/{sessionId}
 */
import { useMutation } from '@tanstack/react-query'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { firestore } from '@/integrations/firebase/client'

export interface LinkSessionInput {
  /** Project ID */
  projectId: string
  /** Session ID to update (pregate or preshare session) */
  sessionId: string
  /** Main session ID to link to */
  mainSessionId: string
}

/**
 * Hook for linking a session to a main session
 *
 * Features:
 * - Updates session's mainSessionId field
 * - Updates updatedAt timestamp
 * - Captures errors to Sentry
 *
 * Used when:
 * - Main session is created after pregate → update pregate session with mainSessionId
 * - Preshare session is created → mainSessionId is set on creation (not via this hook)
 *
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function ExperiencePage({ pregateSessionId }) {
 *   const linkSession = useLinkSession()
 *
 *   // After creating main session, link pregate session
 *   useEffect(() => {
 *     if (pregateSessionId && mainSessionId) {
 *       linkSession.mutate({
 *         projectId,
 *         sessionId: pregateSessionId,
 *         mainSessionId,
 *       })
 *     }
 *   }, [pregateSessionId, mainSessionId])
 * }
 * ```
 */
export function useLinkSession() {
  return useMutation<void, Error, LinkSessionInput>({
    mutationFn: async ({ projectId, sessionId, mainSessionId }) => {
      const sessionRef = doc(
        firestore,
        'projects',
        projectId,
        'sessions',
        sessionId,
      )

      await updateDoc(sessionRef, {
        mainSessionId,
        updatedAt: serverTimestamp(),
      })
    },
    onError: (error, input) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'session',
          action: 'link-session',
        },
        extra: {
          projectId: input.projectId,
          sessionId: input.sessionId,
          mainSessionId: input.mainSessionId,
        },
      })
    },
  })
}

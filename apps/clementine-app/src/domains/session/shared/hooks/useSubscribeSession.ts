/**
 * useSubscribeSession Hook
 *
 * Fetches a session with real-time updates using Firestore onSnapshot.
 *
 * Pattern: Combines Firebase onSnapshot (real-time) with TanStack Query (caching)
 * Reference: Follows same pattern as useProject and useWorkspaceExperience hooks
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, onSnapshot } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

import { sessionSchema } from '../schemas'
import { sessionKeys, sessionQuery } from '../queries/session.query'
import type { Session } from '../schemas'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Hook for subscribing to real-time session updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - TanStack Query cache integration
 * - Automatic subscription cleanup
 * - Returns null if document doesn't exist (no error thrown)
 *
 * Data Flow:
 * 1. useQuery fetches initial data (or uses cache)
 * 2. onSnapshot listener updates cache via setQueryData
 * 3. Component re-renders with new data
 *
 * @param projectId - Project containing the session (null disables subscription)
 * @param sessionId - Session to subscribe to (null disables subscription)
 * @returns TanStack Query result with session or null
 *
 * @example
 * ```tsx
 * function PreviewContent({ projectId, sessionId }) {
 *   const { data: session, isLoading, error } = useSubscribeSession(projectId, sessionId)
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error message={error.message} />
 *   if (!session) return <NotFound />
 *
 *   return <RuntimeEngine session={session} />
 * }
 * ```
 */
export function useSubscribeSession(
  projectId: string | null,
  sessionId: string | null,
) {
  const queryClient = useQueryClient()

  // Set up real-time listener
  useEffect(() => {
    if (!projectId || !sessionId) {
      return
    }

    const sessionRef = doc(
      firestore,
      `projects/${projectId}/sessions/${sessionId}`,
    )

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          queryClient.setQueryData<Session | null>(
            sessionKeys.detail(projectId, sessionId),
            null,
          )
          return
        }

        const session = convertFirestoreDoc(snapshot, sessionSchema)
        queryClient.setQueryData<Session>(
          sessionKeys.detail(projectId, sessionId),
          session,
        )
      },
      (error) => {
        Sentry.captureException(error, {
          tags: {
            domain: 'session',
            action: 'subscribe-session',
          },
          extra: { sessionId },
        })
      },
    )

    return () => unsubscribe()
  }, [projectId, sessionId, queryClient])

  return useQuery({
    ...sessionQuery(projectId ?? '', sessionId ?? ''),
    enabled: !!projectId && !!sessionId,
  })
}

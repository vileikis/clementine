/**
 * useSubscribeSession Hook
 *
 * Subscribes to real-time session updates using Firestore onSnapshot.
 * Returns the current session state and connection status.
 */
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

import { sessionSchema } from '../schemas/session.schema'
import type { Session } from '../schemas/session.schema'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreData } from '@/shared/utils/firestore-utils'

/**
 * Return type for useSubscribeSession hook
 */
export interface UseSubscribeSessionResult {
  /** Current session data, or null if loading/not found */
  session: Session | null
  /** True while initial data is loading */
  isLoading: boolean
  /** Error if subscription failed */
  error: Error | null
}

/**
 * Hook for subscribing to real-time session updates
 *
 * Features:
 * - Real-time Firestore updates via onSnapshot
 * - Uses convertFirestoreData for consistent type conversion
 * - Validates incoming data with Zod schema
 * - Handles loading and error states
 * - Cleans up subscription on unmount or session change
 *
 * @param projectId - Project containing the session
 * @param sessionId - Session to subscribe to (null disables subscription)
 * @returns Session data, loading state, and error state
 *
 * @example
 * ```tsx
 * function PreviewContent({ projectId, sessionId }) {
 *   const { session, isLoading, error } = useSubscribeSession(projectId, sessionId)
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
): UseSubscribeSessionResult {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(!!sessionId)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Reset state when sessionId changes
    if (!projectId || !sessionId) {
      setSession(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    const sessionRef = doc(
      firestore,
      `projects/${projectId}/sessions/${sessionId}`,
    )

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        setIsLoading(false)

        if (!snapshot.exists()) {
          setSession(null)
          return
        }

        try {
          const data = snapshot.data()
          // Convert Firestore types (Timestamps, DocumentReferences, etc.)
          const converted = convertFirestoreData(data)
          const validated = sessionSchema.parse(converted)
          setSession(validated)
        } catch (parseError) {
          const err =
            parseError instanceof Error
              ? parseError
              : new Error('Failed to parse session data')
          setError(err)
          Sentry.captureException(err, {
            tags: {
              domain: 'session',
              action: 'subscribe-session',
            },
            extra: { sessionId },
          })
        }
      },
      (snapshotError) => {
        setIsLoading(false)
        setError(snapshotError)
        Sentry.captureException(snapshotError, {
          tags: {
            domain: 'session',
            action: 'subscribe-session',
          },
          extra: { sessionId },
        })
      },
    )

    return unsubscribe
  }, [projectId, sessionId])

  return { session, isLoading, error }
}

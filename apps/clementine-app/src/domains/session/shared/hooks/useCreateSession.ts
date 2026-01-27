/**
 * useCreateSession Hook
 *
 * Mutation hook for creating a new session when an experience execution begins.
 * Used in preview mode (admin testing) and guest mode (public execution).
 */
import { useMutation } from '@tanstack/react-query'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

import { createSessionInputSchema } from '../types/session-api.types'
import type { WithFieldValue } from 'firebase/firestore'
import type { Session } from '../schemas'
import type { CreateSessionInput } from '../types/session-api.types'
import { auth, firestore } from '@/integrations/firebase/client'

/**
 * Result returned on successful session creation
 */
export interface CreateSessionResult {
  /** Created session document ID */
  sessionId: string
  /** Created session document */
  session: Session
}

/**
 * Hook for creating a new session
 *
 * Features:
 * - Validates input with Zod schema
 * - Creates document in transaction with serverTimestamp()
 * - Initializes with status: 'active'
 * - No query invalidation needed (useSubscribeSession uses onSnapshot)
 * - Captures errors to Sentry
 *
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function PreviewModal({ experience, projectId, workspaceId }) {
 *   const createSession = useCreateSession()
 *
 *   useEffect(() => {
 *     createSession.mutateAsync({
 *       projectId,
 *       workspaceId,
 *       experienceId: experience.id,
 *       mode: 'preview',
 *       configSource: 'draft',
 *     })
 *   }, [])
 * }
 * ```
 */
export function useCreateSession() {
  return useMutation<CreateSessionResult, Error, CreateSessionInput>({
    mutationFn: async (input) => {
      // Validate input
      const validated = createSessionInputSchema.parse(input)

      const sessionsRef = collection(
        firestore,
        `projects/${validated.projectId}/sessions`,
      )

      // Create in transaction to ensure serverTimestamp() resolves correctly
      // eslint-disable-next-line @typescript-eslint/require-await -- callback must be async for TypeScript inference
      return await runTransaction(firestore, async (transaction) => {
        const newRef = doc(sessionsRef)
        const now = Date.now()
        const currentUser = auth.currentUser

        const newSession: WithFieldValue<Session> = {
          id: newRef.id,
          projectId: validated.projectId,
          workspaceId: validated.workspaceId,
          experienceId: validated.experienceId,
          mode: validated.mode,
          configSource: validated.configSource,
          status: 'active',
          answers: [],
          capturedMedia: [],
          resultMedia: null,
          jobId: null,
          jobStatus: null,
          mainSessionId: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          completedAt: null,
          // Track creator for security rules
          createdBy: currentUser?.uid ?? null,
        }

        transaction.set(newRef, newSession)

        // Return a client-side copy with estimated timestamps
        // The real timestamps will be available from the subscription
        const clientSession: Session = {
          ...newSession,
          createdAt: now,
          updatedAt: now,
        } as Session

        return {
          sessionId: newRef.id,
          session: clientSession,
        }
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'session',
          action: 'create-session',
        },
      })
    },
  })
}

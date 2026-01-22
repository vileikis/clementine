/**
 * useInitSession Hook
 *
 * Session orchestration hook for the experience page.
 * Handles session lifecycle: subscribing to existing session or creating new one.
 *
 * Logic:
 * - If initialSessionId provided → subscribe to it
 * - If subscription returns null (not found) → create new session
 * - If no initialSessionId → create new session
 * - Returns ready state with session data
 *
 * Used by ExperiencePage to manage session state without duplicating
 * the session creation logic that was previously in both WelcomeScreenPage
 * and ExperiencePlaceholder.
 */
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useCreateSession } from './useCreateSession'
import { useSubscribeSession } from './useSubscribeSession'
import type { Session } from '../schemas'

/**
 * Discriminated union for session initialization states
 */
export type InitSessionState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; session: Session; sessionId: string }

export interface UseInitSessionOptions {
  /** Project ID */
  projectId: string
  /** Workspace ID */
  workspaceId: string
  /** Event ID */
  eventId: string
  /** Experience ID */
  experienceId: string
  /** Initial session ID from URL (may be undefined) */
  initialSessionId?: string
  /** Whether to enable session initialization (default: true) */
  enabled?: boolean
}

/**
 * Hook for initializing a session for the experience page
 *
 * Handles the complete session lifecycle:
 * 1. If initialSessionId exists, subscribe to that session
 * 2. If session doesn't exist or no initialSessionId, create a new one
 * 3. Return session data when ready
 *
 * @param options - Session initialization options
 * @returns Discriminated union state with loading, error, or ready status
 *
 * @example
 * ```tsx
 * function ExperiencePage({ experienceId, sessionId }) {
 *   const { project, event } = useGuestContext()
 *
 *   const sessionState = useInitSession({
 *     projectId: project.id,
 *     workspaceId: project.workspaceId,
 *     eventId: event.id,
 *     experienceId,
 *     initialSessionId: sessionId,
 *   })
 *
 *   if (sessionState.status === 'loading') return <Loading />
 *   if (sessionState.status === 'error') return <Error />
 *
 *   // sessionState.status === 'ready'
 *   return <ExperienceRuntime session={sessionState.session} />
 * }
 * ```
 */
export function useInitSession({
  projectId,
  workspaceId,
  eventId,
  experienceId,
  initialSessionId,
  enabled = true,
}: UseInitSessionOptions): InitSessionState {
  const createSession = useCreateSession()
  const creatingSessionRef = useRef(false)

  // Track the current session ID (starts with initialSessionId, may be updated after creation)
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    initialSessionId,
  )

  // Subscribe to session (only when we have a session ID and hook is enabled)
  const {
    data: session,
    isLoading: subscriptionLoading,
    isFetched: subscriptionFetched,
    error: subscriptionError,
  } = useSubscribeSession(
    enabled ? projectId : null,
    enabled ? (currentSessionId ?? null) : null,
  )

  // Create session if needed
  useEffect(() => {
    async function createMissingSession() {
      // Skip if hook is disabled or already creating
      if (!enabled || creatingSessionRef.current || createSession.isPending) {
        return
      }

      // Case 1: No initial session ID - create new session
      if (!currentSessionId) {
        creatingSessionRef.current = true

        try {
          const result = await createSession.mutateAsync({
            projectId,
            workspaceId,
            eventId,
            experienceId,
            mode: 'guest',
            configSource: 'published',
          })

          setCurrentSessionId(result.sessionId)
        } catch {
          toast.error('Failed to start experience. Please try again.')
        } finally {
          creatingSessionRef.current = false
        }
        return
      }

      // Case 2: Initial session ID provided but session not found
      // Wait for subscription to complete first
      if (subscriptionFetched && !session && !subscriptionLoading) {
        creatingSessionRef.current = true

        try {
          const result = await createSession.mutateAsync({
            projectId,
            workspaceId,
            eventId,
            experienceId,
            mode: 'guest',
            configSource: 'published',
          })

          setCurrentSessionId(result.sessionId)
        } catch {
          toast.error('Failed to start experience. Please try again.')
        } finally {
          creatingSessionRef.current = false
        }
      }
    }

    void createMissingSession()
  }, [
    enabled,
    currentSessionId,
    subscriptionFetched,
    subscriptionLoading,
    session,
    projectId,
    workspaceId,
    eventId,
    experienceId,
    createSession,
  ])

  // Handle subscription error
  if (subscriptionError) {
    return { status: 'error', error: subscriptionError }
  }

  // Handle creation error
  if (createSession.error) {
    return { status: 'error', error: createSession.error }
  }

  // Return ready state when we have a session
  if (session && currentSessionId) {
    return {
      status: 'ready',
      session,
      sessionId: currentSessionId,
    }
  }

  // Default to loading
  return { status: 'loading' }
}

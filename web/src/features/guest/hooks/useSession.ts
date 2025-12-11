"use client"

import { useState, useEffect, useCallback } from "react"
import {
  validateSessionOwnershipAction,
  createSessionAction,
} from "../actions"
import type { Session } from "../types"

interface UseSessionOptions {
  /** Project ID */
  projectId: string
  /** Experience ID from URL params */
  experienceId: string | null
  /** Session ID from URL params */
  sessionId: string | null
  /** Event ID for creating new sessions */
  eventId: string
  /** Guest ID from context */
  guestId: string | null
  /** Callback when session ID changes (for URL update) */
  onSessionChange?: (newSessionId: string) => void
}

interface UseSessionResult {
  /** Current session (validated or newly created) */
  session: Session | null
  /** True while validating or creating session */
  loading: boolean
  /** Error if session validation/creation failed */
  error: Error | null
  /** Create a new session for an experience */
  createNewSession: (experienceId: string) => Promise<Session | null>
}

/**
 * Hook for session management with ownership validation.
 *
 * When sessionId is provided:
 * 1. Validates that the session belongs to the current guest
 * 2. If valid, returns the session
 * 3. If invalid (different guest or not found), creates a new session
 *
 * When sessionId is not provided:
 * - Does not create a session automatically
 * - Use createNewSession to create one on experience selection
 */
export function useSession({
  projectId,
  experienceId,
  sessionId,
  eventId,
  guestId,
  onSessionChange,
}: UseSessionOptions): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Create a new session
  const createNewSession = useCallback(
    async (expId: string): Promise<Session | null> => {
      if (!guestId) {
        setError(new Error("Guest not authenticated"))
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const result = await createSessionAction({
          projectId,
          guestId,
          experienceId: expId,
          eventId,
        })

        if (result.success) {
          setSession(result.data)
          onSessionChange?.(result.data.id)
          return result.data
        } else {
          setError(new Error(result.error.message))
          return null
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to create session")
        setError(err)
        return null
      } finally {
        setLoading(false)
      }
    },
    [projectId, guestId, eventId, onSessionChange]
  )

  // Validate and resume session on mount
  useEffect(() => {
    async function validateAndResumeSession() {
      // No session to validate
      if (!sessionId || !experienceId) {
        setSession(null)
        return
      }

      // No guest yet - wait for auth
      if (!guestId) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await validateSessionOwnershipAction(
          projectId,
          sessionId,
          guestId
        )

        if (result.success && result.data.valid && result.data.session) {
          // Session is valid - resume it
          setSession(result.data.session)
        } else {
          // Session invalid or not found - create new one
          console.log("Session invalid, creating new session")
          await createNewSession(experienceId)
        }
      } catch (e) {
        console.error("Error validating session:", e)
        // Try to create new session on error
        await createNewSession(experienceId)
      } finally {
        setLoading(false)
      }
    }

    validateAndResumeSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, sessionId, experienceId, guestId])

  return {
    session,
    loading,
    error,
    createNewSession,
  }
}

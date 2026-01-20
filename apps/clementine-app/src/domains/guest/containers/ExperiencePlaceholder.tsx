/**
 * ExperiencePlaceholder Container
 *
 * Placeholder page shown after guest selects an experience and before
 * the full experience runtime is implemented (E7 scope).
 *
 * Handles:
 * - Displaying session ID from URL
 * - Creating a new session if none exists in URL
 * - Navigation back to welcome screen
 *
 * User Story: US2 - Guest Selects an Experience
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { useGuestAccess } from '../hooks/useGuestAccess'
import { useGuestRecord } from '../hooks/useGuestRecord'
import { ComingSoonPage, ErrorPage } from '../components'
import { useCreateSession } from '@/domains/session/shared'

export interface ExperiencePlaceholderProps {
  /** Project ID from URL params */
  projectId: string
  /** Experience ID from URL params */
  experienceId: string
  /** Session ID from URL query params (may be undefined) */
  sessionId?: string
}

/**
 * Placeholder for experience runtime (E7 scope)
 *
 * Shows:
 * - Session ID confirmation
 * - "Experience loading" message
 * - Back to welcome screen link
 *
 * If no session ID is provided, automatically creates a new session.
 *
 * @example
 * ```tsx
 * // In route file
 * function JoinExperiencePage() {
 *   const { projectId, experienceId } = Route.useParams()
 *   const { session } = Route.useSearch()
 *   return (
 *     <ExperiencePlaceholder
 *       projectId={projectId}
 *       experienceId={experienceId}
 *       sessionId={session}
 *     />
 *   )
 * }
 * ```
 */
export function ExperiencePlaceholder({
  projectId,
  experienceId,
  sessionId: initialSessionId,
}: ExperiencePlaceholderProps) {
  const navigate = useNavigate()
  const access = useGuestAccess(projectId)
  const guestRecord = useGuestRecord(projectId)
  const createSession = useCreateSession()
  const creatingSessionRef = useRef(false)

  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    initialSessionId,
  )

  // Handle missing session ID - create new session automatically
  useEffect(() => {
    async function createMissingSession() {
      // Skip if already have a session, still loading, or already creating
      if (
        currentSessionId ||
        access.status !== 'ready' ||
        creatingSessionRef.current
      ) {
        return
      }

      creatingSessionRef.current = true

      try {
        const { project, event } = access
        const result = await createSession.mutateAsync({
          projectId: project.id,
          workspaceId: project.workspaceId,
          eventId: event.id,
          experienceId,
          mode: 'guest',
          configSource: 'published',
        })

        // Update session ID in state and URL
        setCurrentSessionId(result.sessionId)
        void navigate({
          to: '/join/$projectId/experience/$experienceId',
          params: { projectId, experienceId },
          search: { session: result.sessionId },
          replace: true, // Replace current history entry
        })
      } catch {
        toast.error('Failed to start experience. Please go back and try again.')
      } finally {
        creatingSessionRef.current = false
      }
    }

    void createMissingSession()
  }, [
    currentSessionId,
    access,
    projectId,
    experienceId,
    createSession,
    navigate,
  ])

  // Handle not-found state
  if (access.status === 'not-found') {
    return <ErrorPage message="This experience doesn't exist" />
  }

  // Handle coming-soon state
  if (access.status === 'coming-soon') {
    return <ComingSoonPage message="This experience isn't ready yet." />
  }

  // Show loading state
  if (
    access.status === 'loading' ||
    guestRecord.isLoading ||
    !currentSessionId
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Starting your experience...</p>
        </div>
      </div>
    )
  }

  // Main placeholder content
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-foreground">
          Experience Starting...
        </h1>
        <p className="mt-4 text-muted-foreground">
          Your experience session has been created. The full experience runtime
          will be available in Epic E7.
        </p>

        {/* Session info for debugging/verification */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-left text-sm">
          <p className="font-medium text-foreground">Session Details</p>
          <p className="mt-2 text-muted-foreground">
            <span className="font-mono text-xs break-all">
              {currentSessionId}
            </span>
          </p>
        </div>

        {/* Back to welcome link */}
        <Link
          to="/join/$projectId"
          params={{ projectId }}
          className="mt-6 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to welcome screen
        </Link>
      </div>
    </div>
  )
}

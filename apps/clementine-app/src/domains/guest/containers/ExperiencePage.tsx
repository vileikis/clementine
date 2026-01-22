/**
 * ExperiencePage Container
 *
 * Experience page that handles session lifecycle via useInitSession.
 * Uses GuestContext for project/event/experience data and manages session creation.
 *
 * Responsibilities:
 * - Get project/event/experience data from GuestContext
 * - Wait for experiences to load (lazy-loaded by GuestLayout)
 * - Initialize session via useInitSession (create or subscribe)
 * - Update URL with session ID when created
 * - Display session info (placeholder until E7 runtime)
 *
 * User Story: US2 - Guest Selects an Experience
 */
import { useEffect, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { useGuestContext } from '../contexts'
import { ErrorPage } from '../components'
import { useInitSession } from '@/domains/session/shared'

export interface ExperiencePageProps {
  /** Experience ID from URL params */
  experienceId: string
  /** Session ID from URL query params (may be undefined) */
  sessionId?: string
}

/**
 * Experience page with session management
 *
 * This component:
 * 1. Gets project/event/experience data from GuestContext (provided by GuestLayout)
 * 2. Waits for experiences to load (lazy-loaded)
 * 3. Validates that the experienceId is enabled for this event
 * 4. Uses useInitSession to create or subscribe to a session
 * 5. Updates the URL with session ID when a new session is created
 *
 * The full Experience object is available from context for use with
 * ExperienceRuntime (experience.published contains steps and transform config).
 *
 * @example
 * ```tsx
 * // In route file: src/app/join/$projectId/experience/$experienceId.tsx
 * function JoinExperiencePage() {
 *   const { experienceId } = Route.useParams()
 *   const { session } = Route.useSearch()
 *   return <ExperiencePage experienceId={experienceId} sessionId={session} />
 * }
 * ```
 */
export function ExperiencePage({
  experienceId,
  sessionId: initialSessionId,
}: ExperiencePageProps) {
  const navigate = useNavigate()
  const { project, event, experiences, experiencesLoading } = useGuestContext()
  const urlUpdatedRef = useRef(false)

  // Find the experience from context
  const experience = experiences.find((exp) => exp.id === experienceId)

  // Also validate that the experience is enabled for this event
  const enabledExperiences = event.publishedConfig?.experiences?.main ?? []
  const isExperienceEnabled = enabledExperiences.some(
    (ref) => ref.experienceId === experienceId && ref.enabled,
  )

  // Experience is valid if it exists in context AND is enabled in publishedConfig
  const isExperienceValid = !!experience && isExperienceEnabled

  // Only initialize session if experience is valid and loaded
  const sessionState = useInitSession({
    projectId: project.id,
    workspaceId: project.workspaceId,
    eventId: event.id,
    experienceId,
    initialSessionId,
    enabled: isExperienceValid && !experiencesLoading,
  })

  // Update URL with session ID when session is created (if not already in URL)
  useEffect(() => {
    if (
      sessionState.status === 'ready' &&
      sessionState.sessionId !== initialSessionId &&
      !urlUpdatedRef.current
    ) {
      urlUpdatedRef.current = true
      void navigate({
        to: '/join/$projectId/experience/$experienceId',
        params: { projectId: project.id, experienceId },
        search: { session: sessionState.sessionId },
        replace: true,
      })
    }
  }, [sessionState, initialSessionId, navigate, project.id, experienceId])

  // Show loading state while experiences are loading
  if (experiencesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading experience...</p>
        </div>
      </div>
    )
  }

  // Handle invalid experience (not found or not enabled for this event)
  if (!isExperienceValid) {
    return (
      <ErrorPage
        title="Experience Not Available"
        message="This experience is not available. Please go back and select a different one."
      />
    )
  }

  // Handle error state
  if (sessionState.status === 'error') {
    return (
      <ErrorPage
        title="Error"
        message="Failed to start experience. Please go back and try again."
      />
    )
  }

  // Show loading state while session is initializing
  if (sessionState.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Starting your experience...</p>
        </div>
      </div>
    )
  }

  // sessionState.status === 'ready'
  const { session, sessionId } = sessionState

  // Placeholder content (full runtime will be in E7)
  // Note: experience.published is now available for ExperienceRuntime integration
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
            <span className="font-mono text-xs break-all">{sessionId}</span>
          </p>
          <p className="mt-2 text-muted-foreground text-xs">
            Status: {session.status}
          </p>
          <p className="mt-2 text-muted-foreground text-xs">
            Experience: {experience.name}
          </p>
        </div>

        {/* Back to welcome link */}
        <Link
          to="/join/$projectId"
          params={{ projectId: project.id }}
          className="mt-6 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to welcome screen
        </Link>
      </div>
    </div>
  )
}

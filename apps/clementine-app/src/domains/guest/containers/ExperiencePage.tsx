/**
 * ExperiencePage Container
 *
 * Experience page that handles session lifecycle via useInitSession.
 * Uses GuestContext for project/event/experience data and manages session creation.
 *
 * Responsibilities:
 * - Get project/event/experience data from GuestContext
 * - Wait for experiences to load (lazy-loaded by GuestLayout)
 * - Redirect to pregate if needed (handles direct URL access)
 * - Initialize session via useInitSession (create or subscribe)
 * - Link pregate session to main session after creation
 * - Update URL with session ID when created
 * - Handle experience completion (mark complete, trigger transform, navigate)
 * - Navigate to preshare or share on completion
 *
 * User Stories:
 * - US1: Guest Executes Main Experience
 * - US2: Guest Completes Pregate Before Main Experience (redirect logic)
 * - US3: Guest Completes Preshare After Main Experience (navigation)
 * - US4: Session Progress Tracking and Linking
 */
import { useEffect, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { useGuestContext } from '../contexts'
import { ErrorPage } from '../components'
import { useMarkExperienceComplete, usePregate, usePreshare } from '../hooks'
import { useInitSession, useLinkSession } from '@/domains/session/shared'

export interface ExperiencePageProps {
  /** Experience ID from URL params */
  experienceId: string
  /** Session ID from URL query params (may be undefined) */
  sessionId?: string
  /** Pregate session ID from URL query params (for session linking) */
  pregateSessionId?: string
}

/**
 * Trigger transform pipeline for main experience session
 * Fire-and-forget: errors are logged but don't block navigation
 */
async function triggerTransformPipeline(params: {
  projectId: string
  sessionId: string
  stepId: string
}): Promise<void> {
  const { projectId, sessionId, stepId } = params

  try {
    const functionsBaseUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL
    if (!functionsBaseUrl) {
      console.warn('VITE_FIREBASE_FUNCTIONS_URL not configured')
      return
    }

    const url = `${functionsBaseUrl}/startTransformPipeline?projectId=${projectId}`
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, stepId }),
    })
  } catch (error) {
    // Log but don't throw - fire-and-forget
    console.error('Failed to trigger transform pipeline:', error)
  }
}

/**
 * Experience page with session management
 *
 * This component:
 * 1. Gets project/event/experience data from GuestContext (provided by GuestLayout)
 * 2. Waits for experiences to load (lazy-loaded)
 * 3. Redirects to pregate if needed (handles direct URL access)
 * 4. Validates that the experienceId is enabled for this event
 * 5. Uses useInitSession to create or subscribe to a session
 * 6. Links pregate session to main session after creation
 * 7. Updates the URL with session ID when a new session is created
 * 8. Handles completion flow (mark complete, transform, navigation)
 *
 * The full Experience object is available from context for use with
 * ExperienceRuntime (experience.published contains steps and transform config).
 *
 * @example
 * ```tsx
 * // In route file: src/app/join/$projectId/experience/$experienceId.tsx
 * function JoinExperiencePage() {
 *   const { experienceId } = Route.useParams()
 *   const { session, pregate } = Route.useSearch()
 *   return (
 *     <ExperiencePage
 *       experienceId={experienceId}
 *       sessionId={session}
 *       pregateSessionId={pregate}
 *     />
 *   )
 * }
 * ```
 */
export function ExperiencePage({
  experienceId,
  sessionId: initialSessionId,
  pregateSessionId,
}: ExperiencePageProps) {
  const navigate = useNavigate()
  const { project, event, guest, experiences, experiencesLoading } =
    useGuestContext()
  const urlUpdatedRef = useRef(false)
  const pregateLinkedRef = useRef(false)

  // Hooks for pregate/preshare logic
  const experiencesConfig = event.publishedConfig?.experiences ?? null
  const { needsPregate } = usePregate(guest, experiencesConfig)
  const { needsPreshare } = usePreshare(guest, experiencesConfig)
  const markExperienceComplete = useMarkExperienceComplete()
  const linkSession = useLinkSession()

  // Check pregate requirement BEFORE any other logic
  // This handles direct URL access to experience without completing pregate
  const shouldRedirectToPregate = needsPregate()

  // Redirect to pregate if needed (handles direct URL access)
  useEffect(() => {
    if (shouldRedirectToPregate && !experiencesLoading) {
      void navigate({
        to: '/join/$projectId/pregate',
        params: { projectId: project.id },
        search: { experience: experienceId },
        replace: true,
      })
    }
  }, [
    shouldRedirectToPregate,
    experiencesLoading,
    navigate,
    project.id,
    experienceId,
  ])

  // If redirecting to pregate, don't render anything
  if (shouldRedirectToPregate && !experiencesLoading) {
    return null
  }

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
        search: { session: sessionState.sessionId, pregate: pregateSessionId },
        replace: true,
      })
    }
  }, [
    sessionState,
    initialSessionId,
    navigate,
    project.id,
    experienceId,
    pregateSessionId,
  ])

  // Link pregate session to main session after main session is created
  useEffect(() => {
    if (
      sessionState.status === 'ready' &&
      pregateSessionId &&
      !pregateLinkedRef.current
    ) {
      pregateLinkedRef.current = true
      const { sessionId: mainSessionId } = sessionState
      linkSession.mutate({
        projectId: project.id,
        sessionId: pregateSessionId,
        mainSessionId,
      })
    }
  }, [sessionState, pregateSessionId, linkSession, project.id])

  /**
   * Handle experience completion
   * Called when guest finishes all steps in the experience
   */
  const handleExperienceComplete = async () => {
    if (sessionState.status !== 'ready') return

    const { sessionId } = sessionState

    // 1. Mark experience as complete in guest record
    await markExperienceComplete.mutateAsync({
      projectId: project.id,
      guestId: guest.id,
      experienceId,
      sessionId,
    })

    // 2. Trigger transform pipeline if experience has transform config
    // Find transform step in experience
    const transformStep = experience?.published?.steps?.find(
      (step) => step.type === 'transform.pipeline',
    )
    if (transformStep) {
      // Fire-and-forget - don't await
      void triggerTransformPipeline({
        projectId: project.id,
        sessionId,
        stepId: transformStep.id,
      })
    }

    // 3. Navigate to preshare or share
    if (needsPreshare()) {
      // Navigate to preshare with main session ID (replace to hide main from history)
      void navigate({
        to: '/join/$projectId/preshare',
        params: { projectId: project.id },
        search: { session: sessionId },
        replace: true,
      })
    } else {
      // Navigate directly to share (replace to hide main from history)
      void navigate({
        to: '/join/$projectId/share',
        params: { projectId: project.id },
        search: { session: sessionId },
        replace: true,
      })
    }
  }

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
  // The handleExperienceComplete function will be passed to ExperienceRuntime as onComplete
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
          {pregateSessionId && (
            <p className="mt-2 text-muted-foreground text-xs">
              Linked from pregate: {pregateSessionId.slice(0, 8)}...
            </p>
          )}
        </div>

        {/* Temporary: Complete button for testing flow */}
        <button
          type="button"
          onClick={() => void handleExperienceComplete()}
          disabled={markExperienceComplete.isPending}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {markExperienceComplete.isPending
            ? 'Completing...'
            : 'Complete Experience (Test)'}
        </button>

        {/* Back to welcome link */}
        <Link
          to="/join/$projectId"
          params={{ projectId: project.id }}
          className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to welcome screen
        </Link>
      </div>
    </div>
  )
}

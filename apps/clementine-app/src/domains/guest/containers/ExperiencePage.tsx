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
 * - Handle experience completion (mark complete, navigate)
 * - Navigate to preshare or share on completion
 *
 * User Stories:
 * - US1: Guest Executes Main Experience
 * - US2: Guest Completes Pregate Before Main Experience (redirect logic)
 * - US3: Guest Completes Preshare After Main Experience (navigation)
 * - US4: Session Progress Tracking and Linking
 */
import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { useGuestContext } from '../contexts'
import {
  GuestRuntimeContent,
  ThemedErrorState,
  ThemedLoadingState,
} from '../components'
import { useMarkExperienceComplete, usePregate, usePreshare } from '../hooks'
import { useInitSession, useLinkSession } from '@/domains/session/shared'
import { ExperienceRuntime } from '@/domains/experience/runtime'
import { ThemeProvider, ThemedBackground } from '@/shared/theming'
import { DEFAULT_THEME } from '@/domains/event/theme/constants'

export interface ExperiencePageProps {
  /** Experience ID from URL params */
  experienceId: string
  /** Session ID from URL query params (may be undefined) */
  sessionId?: string
  /** Pregate session ID from URL query params (for session linking) */
  pregateSessionId?: string
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

    // 2. Navigate to preshare or share
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

  // Get theme from event config (with fallback to default)
  const theme = event.publishedConfig?.theme ?? DEFAULT_THEME

  // Handle error for runtime (logs but doesn't block)
  const handleRuntimeError = (error: Error) => {
    console.error('ExperienceRuntime error:', error)
  }

  // Helper to navigate back to welcome
  const navigateToWelcome = () =>
    navigate({
      to: '/join/$projectId',
      params: { projectId: project.id },
    })

  // Determine content to render based on state
  const renderContent = () => {
    // Show loading state while experiences are loading
    if (experiencesLoading) {
      return <ThemedLoadingState message="Loading experience..." />
    }

    // Handle invalid experience (not found or not enabled for this event)
    if (!isExperienceValid) {
      return (
        <ThemedErrorState
          title="Experience Not Available"
          message="This experience is not available. Please go back and select a different one."
          actionLabel="Go Back"
          onAction={navigateToWelcome}
        />
      )
    }

    // Handle error state
    if (sessionState.status == 'error') {
      return (
        <ThemedErrorState
          title="Error"
          message="Failed to start experience. Please go back and try again."
          actionLabel="Go Back"
          onAction={navigateToWelcome}
        />
      )
    }

    // Show loading state while session is initializing
    if (sessionState.status === 'loading') {
      return <ThemedLoadingState message="Starting your experience..." />
    }

    // sessionState.status === 'ready'
    const { session } = sessionState
    const steps = experience?.published?.steps ?? []

    // Handle empty experience (no steps configured)
    if (steps.length === 0) {
      return (
        <ThemedErrorState
          title="Experience Not Ready"
          message="This experience doesn't have any steps yet. Please go back and try a different one."
          actionLabel="Go Back"
          onAction={navigateToWelcome}
        />
      )
    }

    return (
      <ExperienceRuntime
        experienceId={experienceId}
        steps={steps}
        session={session}
        onComplete={() => void handleExperienceComplete()}
        onError={handleRuntimeError}
      >
        <GuestRuntimeContent />
      </ExperienceRuntime>
    )
  }

  // Render with persistent ThemedBackground
  // Background stays mounted across all state transitions
  return (
    <ThemeProvider theme={theme}>
      <div className="h-screen">
        <ThemedBackground
          className="h-full w-full"
          contentClassName="h-full w-full"
        >
          {renderContent()}
        </ThemedBackground>
      </div>
    </ThemeProvider>
  )
}

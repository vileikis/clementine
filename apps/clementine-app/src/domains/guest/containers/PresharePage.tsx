/**
 * PresharePage Container
 *
 * Preshare experience page that runs after the main experience.
 * Used for surveys, feedback collection, promotional content, etc.
 *
 * Responsibilities:
 * - Validate main session ID from URL param
 * - Validate preshare experience exists
 * - Initialize preshare session with mainSessionId
 * - Handle preshare completion (mark complete, navigate to share)
 * - Use history replacement on navigation to share
 *
 * User Story: US3 - Guest Completes Preshare After Main Experience
 */
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { useGuestContext } from '../contexts'
import {
  GuestRuntimeContent,
  ThemedErrorState,
  ThemedLoadingState,
} from '../components'
import { useMarkExperienceComplete } from '../hooks'
import { useInitSession } from '@/domains/session/shared'
import { ExperienceRuntime } from '@/domains/experience/runtime'
import { ThemeProvider, ThemedBackground } from '@/shared/theming'
import { DEFAULT_THEME } from '@/domains/event/theme/constants'

export interface PresharePageProps {
  /** Main session ID from URL query params (for linking) */
  mainSessionId: string
}

/**
 * Preshare page container
 *
 * This component:
 * 1. Gets preshare experience ID from publishedConfig
 * 2. Validates preshare experience exists
 * 3. Creates preshare session with mainSessionId via useInitSession
 * 4. Handles completion (mark complete, navigate to share with replace)
 *
 * Edge cases:
 * - Preshare misconfigured (no experience ID) → skip to share
 * - Preshare experience has zero steps → skip to share
 * - Preshare experience doesn't exist → skip to share with error log
 * - No valid main session ID → redirect to welcome
 *
 * @example
 * ```tsx
 * // In route file: src/app/join/$projectId/preshare.tsx
 * function JoinPresharePage() {
 *   const { projectId } = Route.useParams()
 *   const { session } = Route.useSearch()
 *   return <PresharePage projectId={projectId} mainSessionId={session} />
 * }
 * ```
 */
export function PresharePage({ mainSessionId }: PresharePageProps) {
  const navigate = useNavigate()
  const { project, event, guest, experiences, experiencesLoading } =
    useGuestContext()
  const markExperienceComplete = useMarkExperienceComplete()

  // Get preshare config from event
  const preshareConfig = event.publishedConfig?.experiences?.preshare
  const preshareExperienceId = preshareConfig?.experienceId

  // Find preshare experience from loaded experiences
  const preshareExperience = experiences.find(
    (exp) => exp.id === preshareExperienceId,
  )

  // Check for missing main session ID (direct URL access without valid session)
  const isMissingMainSession = !mainSessionId

  // Check for misconfiguration or missing experience
  const isMisconfigured =
    !preshareExperienceId ||
    (!experiencesLoading && !preshareExperience) ||
    (preshareExperience?.published?.steps?.length ?? 0) === 0

  // Redirect to welcome if missing main session
  useEffect(() => {
    if (isMissingMainSession) {
      console.warn(
        'Preshare accessed without valid main session. Redirecting to welcome.',
      )
      void navigate({
        to: '/join/$projectId',
        params: { projectId: project.id },
        replace: true,
      })
    }
  }, [isMissingMainSession, navigate, project.id])

  // Skip to share screen if misconfigured
  useEffect(() => {
    if (!isMissingMainSession && isMisconfigured && !experiencesLoading) {
      if (!preshareExperienceId) {
        console.warn('Preshare misconfigured: no experience ID')
      } else if (!preshareExperience) {
        console.error(
          `Preshare experience not found: ${preshareExperienceId}. Skipping preshare.`,
        )
      } else {
        console.warn('Preshare experience has zero steps. Skipping preshare.')
      }

      void navigate({
        to: '/join/$projectId/share',
        params: { projectId: project.id },
        search: { session: mainSessionId },
        replace: true,
      })
    }
  }, [
    isMissingMainSession,
    isMisconfigured,
    experiencesLoading,
    navigate,
    project.id,
    mainSessionId,
    preshareExperienceId,
    preshareExperience,
  ])

  // Only initialize session if preshare is valid
  // Note: mainSessionId is passed for linking (set on session creation)
  const sessionState = useInitSession({
    projectId: project.id,
    workspaceId: project.workspaceId,
    eventId: event.id,
    experienceId: preshareExperienceId ?? '',
    initialSessionId: undefined,
    enabled:
      !isMissingMainSession &&
      !!preshareExperienceId &&
      !!preshareExperience &&
      !experiencesLoading,
    // Note: mainSessionId linking happens in useCreateSession when we add the feature
    // For now, we'll update the session after creation
  })

  // Get theme from event config (with fallback to default)
  const theme = event.publishedConfig?.theme ?? DEFAULT_THEME

  // Handle error for runtime (logs but doesn't block)
  const handleRuntimeError = (error: Error) => {
    console.error('ExperienceRuntime error in preshare:', error)
  }

  // Helper to navigate back to welcome
  const navigateToWelcome = () =>
    navigate({
      to: '/join/$projectId',
      params: { projectId: project.id },
    })

  /**
   * Handle preshare completion
   * Called when guest finishes all preshare steps
   */
  const handlePreshareComplete = async () => {
    if (sessionState.status !== 'ready') return
    if (!preshareExperienceId) return

    // 1. Mark preshare experience as complete in guest record
    await markExperienceComplete.mutateAsync({
      projectId: project.id,
      guestId: guest.id,
      experienceId: preshareExperienceId,
    })

    // 2. Navigate to share screen with main session ID
    // Use replace to remove preshare from browser history
    void navigate({
      to: '/join/$projectId/share',
      params: { projectId: project.id },
      search: { session: mainSessionId },
      replace: true,
    })
  }

  // Determine content to render based on state
  const renderContent = () => {
    // If missing main session, we're redirecting (handled by useEffect above)
    if (isMissingMainSession) {
      return <ThemedLoadingState message="Redirecting..." />
    }

    // Show loading state while experiences are loading
    if (experiencesLoading) {
      return <ThemedLoadingState message="Loading..." />
    }

    // If misconfigured, we're redirecting (handled by useEffect above)
    if (isMisconfigured) {
      return <ThemedLoadingState message="Redirecting to results..." />
    }

    // Handle error state
    if (sessionState.status === 'error') {
      return (
        <ThemedErrorState
          title="Error"
          message="Failed to start preshare experience. Please go back and try again."
          actionLabel="Go Back"
          onAction={navigateToWelcome}
        />
      )
    }

    // Show loading state while session is initializing
    if (sessionState.status === 'loading') {
      return <ThemedLoadingState message="Almost there..." />
    }

    // sessionState.status === 'ready'
    const { session } = sessionState
    const steps = preshareExperience?.published?.steps ?? []

    // Handle empty experience (no steps configured) - edge case already handled
    // by isMisconfigured check, but keeping for safety
    if (steps.length === 0) {
      return (
        <ThemedErrorState
          title="Preshare Not Ready"
          message="This preshare experience doesn't have any steps. Skipping..."
          actionLabel="Go Back"
          onAction={navigateToWelcome}
        />
      )
    }

    return (
      <ExperienceRuntime
        experienceId={preshareExperienceId}
        steps={steps}
        session={session}
        onComplete={() => void handlePreshareComplete()}
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

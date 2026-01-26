/**
 * PregatePage Container
 *
 * Pregate experience page that runs before the main experience.
 * Used for consent forms, contact info collection, surveys, etc.
 *
 * Responsibilities:
 * - Validate pregate experience exists
 * - Initialize pregate session
 * - Handle pregate completion (mark complete, navigate to main)
 * - Use history replacement on navigation to main
 *
 * User Story: US2 - Guest Completes Pregate Before Main Experience
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

export interface PregatePageProps {
  /** Selected main experience ID (to navigate to after pregate) */
  selectedExperienceId: string
}

/**
 * Pregate page container
 *
 * This component:
 * 1. Gets pregate experience ID from publishedConfig
 * 2. Validates pregate experience exists
 * 3. Creates pregate session via useInitSession
 * 4. Handles completion (mark complete, navigate to main with replace)
 *
 * Edge cases:
 * - Pregate misconfigured (no experience ID) → skip to main
 * - Pregate experience has zero steps → skip to main
 * - Pregate experience doesn't exist → skip to main with error log
 *
 * @example
 * ```tsx
 * // In route file: src/app/join/$projectId/pregate.tsx
 * function JoinPregatePage() {
 *   const { projectId } = Route.useParams()
 *   const { experience } = Route.useSearch()
 *   return <PregatePage projectId={projectId} selectedExperienceId={experience} />
 * }
 * ```
 */
export function PregatePage({ selectedExperienceId }: PregatePageProps) {
  const navigate = useNavigate()
  const { project, event, guest, experiences, experiencesLoading } =
    useGuestContext()
  const markExperienceComplete = useMarkExperienceComplete()

  // Get pregate config from event
  const pregateConfig = event.publishedConfig?.experiences?.pregate
  const pregateExperienceId = pregateConfig?.experienceId

  // Find pregate experience from loaded experiences
  const pregateExperience = experiences.find(
    (exp) => exp.id === pregateExperienceId,
  )

  // Check for misconfiguration or missing experience
  const isMisconfigured =
    !pregateExperienceId ||
    (!experiencesLoading && !pregateExperience) ||
    (pregateExperience?.published?.steps?.length ?? 0) === 0

  // Skip to main experience if misconfigured
  useEffect(() => {
    if (isMisconfigured && !experiencesLoading) {
      if (!pregateExperienceId) {
        console.warn('Pregate misconfigured: no experience ID')
      } else if (!pregateExperience) {
        console.error(
          `Pregate experience not found: ${pregateExperienceId}. Skipping pregate.`,
        )
      } else {
        console.warn('Pregate experience has zero steps. Skipping pregate.')
      }

      void navigate({
        to: '/join/$projectId/experience/$experienceId',
        params: { projectId: project.id, experienceId: selectedExperienceId },
      })
    }
  }, [
    isMisconfigured,
    experiencesLoading,
    navigate,
    project.id,
    selectedExperienceId,
    pregateExperienceId,
    pregateExperience,
  ])

  // Only initialize session if pregate is valid
  const sessionState = useInitSession({
    projectId: project.id,
    workspaceId: project.workspaceId,
    eventId: event.id,
    experienceId: pregateExperienceId ?? '',
    initialSessionId: undefined,
    enabled:
      !!pregateExperienceId && !!pregateExperience && !experiencesLoading,
  })

  // Get theme from event config (with fallback to default)
  const theme = event.publishedConfig?.theme ?? DEFAULT_THEME

  // Handle error for runtime (logs but doesn't block)
  const handleRuntimeError = (error: Error) => {
    console.error('ExperienceRuntime error in pregate:', error)
  }

  // Helper to navigate back to welcome
  const navigateToWelcome = () =>
    navigate({
      to: '/join/$projectId',
      params: { projectId: project.id },
    })

  /**
   * Handle pregate completion
   * Called when guest finishes all pregate steps
   */
  const handlePregateComplete = async () => {
    if (sessionState.status !== 'ready') return
    if (!pregateExperienceId) return

    const { sessionId } = sessionState

    // 1. Mark pregate experience as complete in guest record (best effort - don't block navigation)
    try {
      await markExperienceComplete.mutateAsync({
        projectId: project.id,
        guestId: guest.id,
        experienceId: pregateExperienceId,
      })
    } catch (error) {
      console.error('Failed to mark pregate complete:', error)
      // Continue with navigation - guest shouldn't be stuck
    }

    // 2. Navigate to main experience with pregate session ID for linking
    // Use replace to remove pregate from browser history
    void navigate({
      to: '/join/$projectId/experience/$experienceId',
      params: { projectId: project.id, experienceId: selectedExperienceId },
      search: { pregate: sessionId },
      replace: true,
    })
  }

  // Determine content to render based on state
  const renderContent = () => {
    // Show loading state while experiences are loading
    if (experiencesLoading) {
      return <ThemedLoadingState message="Loading..." />
    }

    // If misconfigured, we're redirecting (handled by useEffect above)
    if (isMisconfigured) {
      return <ThemedLoadingState message="Redirecting..." />
    }

    // Handle error state
    if (sessionState.status === 'error') {
      return (
        <ThemedErrorState
          title="Error"
          message="Failed to start pregate experience. Please go back and try again."
          actionLabel="Go Back"
          onAction={navigateToWelcome}
        />
      )
    }

    // Show loading state while session is initializing
    if (sessionState.status === 'loading') {
      return <ThemedLoadingState message="Starting pregate..." />
    }

    // sessionState.status === 'ready'
    const { session } = sessionState
    const steps = pregateExperience?.published?.steps ?? []

    // Handle empty experience (no steps configured) - edge case already handled
    // by isMisconfigured check, but keeping for safety
    if (steps.length === 0) {
      return (
        <ThemedErrorState
          title="Pregate Not Ready"
          message="This pregate experience doesn't have any steps. Skipping..."
          actionLabel="Go Back"
          onAction={navigateToWelcome}
        />
      )
    }

    return (
      <ExperienceRuntime
        experienceId={pregateExperienceId}
        steps={steps}
        session={session}
        onComplete={() => void handlePregateComplete()}
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

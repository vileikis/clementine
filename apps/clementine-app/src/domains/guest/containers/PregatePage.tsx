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
import { useEffect, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { useGuestContext } from '../contexts'
import { ErrorPage } from '../components'
import { useMarkExperienceComplete } from '../hooks'
import { useInitSession } from '@/domains/session/shared'

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
  const urlUpdatedRef = useRef(false)
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

  // Update URL with session ID when created (for resumption support)
  useEffect(() => {
    if (sessionState.status === 'ready' && !urlUpdatedRef.current) {
      urlUpdatedRef.current = true
      // Note: We don't update URL for pregate since it's a transient step
      // If user refreshes, they'll restart pregate (acceptable for short surveys)
    }
  }, [sessionState.status])

  /**
   * Handle pregate completion
   * Called when guest finishes all pregate steps
   */
  const handlePregateComplete = async () => {
    if (sessionState.status !== 'ready') return
    if (!pregateExperienceId) return

    const { sessionId } = sessionState

    // 1. Mark pregate experience as complete in guest record
    await markExperienceComplete.mutateAsync({
      projectId: project.id,
      guestId: guest.id,
      experienceId: pregateExperienceId,
      sessionId,
    })

    // 2. Navigate to main experience with pregate session ID for linking
    // Use replace to remove pregate from browser history
    void navigate({
      to: '/join/$projectId/experience/$experienceId',
      params: { projectId: project.id, experienceId: selectedExperienceId },
      search: { pregate: sessionId },
      replace: true,
    })
  }

  // Show loading state while experiences are loading
  if (experiencesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If misconfigured, we're redirecting (handled by useEffect above)
  if (isMisconfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (sessionState.status === 'error') {
    return (
      <ErrorPage
        title="Error"
        message="Failed to start pregate experience. Please go back and try again."
      />
    )
  }

  // Show loading state while session is initializing
  if (sessionState.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Starting pregate...</p>
        </div>
      </div>
    )
  }

  // sessionState.status === 'ready'
  const { session, sessionId } = sessionState

  // Placeholder content (full runtime will use ExperienceRuntime)
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-foreground">
          Before We Begin...
        </h1>
        <p className="mt-4 text-muted-foreground">
          Please complete this quick questionnaire before starting your
          experience.
        </p>

        {/* Session info for debugging/verification */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-left text-sm">
          <p className="font-medium text-foreground">Pregate Session</p>
          <p className="mt-2 text-muted-foreground">
            <span className="font-mono text-xs break-all">{sessionId}</span>
          </p>
          <p className="mt-2 text-muted-foreground text-xs">
            Status: {session.status}
          </p>
          <p className="mt-2 text-muted-foreground text-xs">
            Experience: {pregateExperience?.name ?? 'Unknown'}
          </p>
          <p className="mt-2 text-muted-foreground text-xs">
            Next: {selectedExperienceId.slice(0, 8)}...
          </p>
        </div>

        {/* Temporary: Complete button for testing flow */}
        <button
          type="button"
          onClick={() => void handlePregateComplete()}
          disabled={markExperienceComplete.isPending}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {markExperienceComplete.isPending
            ? 'Completing...'
            : 'Complete Pregate (Test)'}
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

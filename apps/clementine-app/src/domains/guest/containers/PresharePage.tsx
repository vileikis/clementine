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
import { useEffect, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { useGuestContext } from '../contexts'
import { ErrorPage } from '../components'
import { useMarkExperienceComplete } from '../hooks'
import { useInitSession } from '@/domains/session/shared'

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
  const urlUpdatedRef = useRef(false)
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

  // Update URL with session ID when created (for resumption support)
  useEffect(() => {
    if (sessionState.status === 'ready' && !urlUpdatedRef.current) {
      urlUpdatedRef.current = true
      // Note: We don't update URL for preshare since it's a transient step
      // The mainSessionId in the URL is what matters for the share screen
    }
  }, [sessionState.status])

  /**
   * Handle preshare completion
   * Called when guest finishes all preshare steps
   */
  const handlePreshareComplete = async () => {
    if (sessionState.status !== 'ready') return
    if (!preshareExperienceId) return

    const { sessionId } = sessionState

    // 1. Mark preshare experience as complete in guest record
    await markExperienceComplete.mutateAsync({
      projectId: project.id,
      guestId: guest.id,
      experienceId: preshareExperienceId,
      sessionId,
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

  // If missing main session, we're redirecting (handled by useEffect above)
  if (isMissingMainSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
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
          <p className="text-muted-foreground">Redirecting to results...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (sessionState.status === 'error') {
    return (
      <ErrorPage
        title="Error"
        message="Failed to start preshare experience. Please go back and try again."
      />
    )
  }

  // Show loading state while session is initializing
  if (sessionState.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Almost there...</p>
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
          One More Thing...
        </h1>
        <p className="mt-4 text-muted-foreground">
          While your creation is being processed, please answer a few quick
          questions.
        </p>

        {/* Session info for debugging/verification */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-left text-sm">
          <p className="font-medium text-foreground">Preshare Session</p>
          <p className="mt-2 text-muted-foreground">
            <span className="font-mono text-xs break-all">{sessionId}</span>
          </p>
          <p className="mt-2 text-muted-foreground text-xs">
            Status: {session.status}
          </p>
          <p className="mt-2 text-muted-foreground text-xs">
            Experience: {preshareExperience?.name ?? 'Unknown'}
          </p>
          <p className="mt-2 text-muted-foreground text-xs">
            Main session: {mainSessionId.slice(0, 8)}...
          </p>
        </div>

        {/* Temporary: Complete button for testing flow */}
        <button
          type="button"
          onClick={() => void handlePreshareComplete()}
          disabled={markExperienceComplete.isPending}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {markExperienceComplete.isPending
            ? 'Completing...'
            : 'Complete Preshare (Test)'}
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

/**
 * WelcomeScreenPage Container
 *
 * Main entry point for guest access to events via shareable links.
 * Handles authentication, validation, and renders the welcome screen
 * with available experiences.
 *
 * User Stories Implemented:
 * - US1: Guest Accesses Event via Shareable Link
 * - US2: Guest Selects an Experience (experience selection handler)
 * - US3: Guest Encounters Invalid or Unavailable Event (error states)
 * - US4: Guest Views Event with No Available Experiences (empty state)
 */
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useGuestAccess } from '../hooks/useGuestAccess'
import { useInitGuest } from '../hooks/useInitGuest'
import { ComingSoonPage, ErrorPage } from '../components'
import { DEFAULT_WELCOME, WelcomeRenderer } from '@/domains/event/welcome'
import { ThemeProvider } from '@/shared/theming'
import { useCreateSession } from '@/domains/session/shared'
import { DEFAULT_THEME } from '@/domains/event/theme/constants'
import { useAnonymousSignIn, useAuth } from '@/domains/auth'

export interface WelcomeScreenPageProps {
  /** Project ID from URL params */
  projectId: string
}

/**
 * Guest welcome screen container
 *
 * Orchestrates:
 * 1. Guest access validation (project + event existence, publish status)
 * 2. Anonymous authentication and guest record creation
 * 3. Experience selection and session creation
 * 4. Navigation to experience runtime
 *
 * @example
 * ```tsx
 * // In route file
 * function JoinProjectPage() {
 *   const { projectId } = Route.useParams()
 *   return <WelcomeScreenPage projectId={projectId} />
 * }
 * ```
 */
export function WelcomeScreenPage({ projectId }: WelcomeScreenPageProps) {
  const navigate = useNavigate()

  // Authentication: Check if user is authenticated, sign in anonymously if not
  const { user, isLoading: authLoading } = useAuth()
  const { signIn: signInAnonymously, isSigningIn, error: signInError } = useAnonymousSignIn()

  // Auto-trigger anonymous sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user && !isSigningIn) {
      void signInAnonymously()
    }
  }, [authLoading, user, isSigningIn, signInAnonymously])

  // Guest access validation (project, event, experiences)
  const access = useGuestAccess(projectId)

  // Guest initialization (only runs once authenticated)
  const guestState = useInitGuest(projectId)

  const createSession = useCreateSession()

  // Track which experience is being selected for loading state
  const [selectingExperienceId, setSelectingExperienceId] = useState<
    string | null
  >(null)

  // Handle sign-in error
  if (signInError) {
    return (
      <ErrorPage
        title="Authentication Error"
        message="Failed to sign in. Please refresh the page."
      />
    )
  }

  // US3: Handle not-found state (project or event missing)
  if (access.status === 'not-found') {
    const message =
      access.reason === 'project'
        ? "This project doesn't exist"
        : "This event doesn't exist"
    return <ErrorPage message={message} />
  }

  // US3: Handle coming-soon state (no active event or not published)
  if (access.status === 'coming-soon') {
    const message =
      access.reason === 'no-active-event'
        ? "This experience isn't available yet. Check back soon!"
        : 'This experience is being prepared. Check back soon!'
    return <ComingSoonPage message={message} />
  }

  // Show loading state while authenticating, fetching data, or creating guest record
  if (authLoading || isSigningIn || access.status === 'loading' || guestState.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading your experience...</p>
        </div>
      </div>
    )
  }

  // Handle guest record error
  if (guestState.status === 'error') {
    return (
      <ErrorPage
        title="Error"
        message="Failed to initialize. Please refresh the page."
      />
    )
  }

  // At this point, access.status === 'ready'
  const { project, event, experiences } = access
  const publishedConfig = event.publishedConfig!
  const welcome = publishedConfig.welcome ?? DEFAULT_WELCOME
  const theme = publishedConfig.theme ?? DEFAULT_THEME
  const mainExperiences = publishedConfig.experiences?.main ?? []

  // US2: Handle experience selection
  const handleSelectExperience = async (experienceId: string) => {
    // Prevent duplicate selections
    if (selectingExperienceId || createSession.isPending) {
      return
    }

    setSelectingExperienceId(experienceId)

    try {
      const result = await createSession.mutateAsync({
        projectId: project.id,
        workspaceId: project.workspaceId,
        eventId: event.id,
        experienceId,
        mode: 'guest',
        configSource: 'published',
      })

      // Navigate to experience page with session ID
      void navigate({
        to: '/join/$projectId/experience/$experienceId',
        params: { projectId, experienceId },
        search: { session: result.sessionId },
      })
    } catch {
      toast.error('Failed to start experience. Please try again.')
      setSelectingExperienceId(null)
    }
  }

  // US4: Handle empty experiences state (handled within WelcomeRenderer)
  // WelcomeRenderer shows "Experiences will appear here" placeholder when empty

  return (
    <div className="h-screen">
      <ThemeProvider theme={theme}>
        <WelcomeRenderer
          welcome={welcome}
          mainExperiences={mainExperiences}
          experienceDetails={experiences}
          mode="run"
          onSelectExperience={handleSelectExperience}
        />
      </ThemeProvider>
    </div>
  )
}

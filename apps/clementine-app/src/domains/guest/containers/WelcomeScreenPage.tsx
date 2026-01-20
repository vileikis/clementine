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
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useGuestAccess } from '../hooks/useGuestAccess'
import { useGuestRecord } from '../hooks/useGuestRecord'
import { ComingSoonPage, ErrorPage } from '../components'
import type { Experience } from '@/domains/experience/shared'
import { DEFAULT_WELCOME, WelcomeRenderer } from '@/domains/event/welcome'
import { ThemeProvider } from '@/shared/theming'
import { useCreateSession } from '@/domains/session/shared'
import { DEFAULT_THEME } from '@/domains/event/theme/constants'

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
  const access = useGuestAccess(projectId)
  const guestRecord = useGuestRecord(projectId)
  const createSession = useCreateSession()

  // Track which experience is being selected for loading state
  const [selectingExperienceId, setSelectingExperienceId] = useState<
    string | null
  >(null)

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

  // Show loading state while fetching data or creating guest record
  if (access.status === 'loading' || guestRecord.isLoading) {
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
  if (guestRecord.error) {
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

  // Convert ExperienceCardData back to Experience format for WelcomeRenderer
  // Note: WelcomeRenderer expects full Experience objects, but we only have card data
  // We need to create minimal Experience objects that satisfy the interface
  const experienceDetails: Experience[] = experiences.map((exp) => ({
    id: exp.id,
    name: exp.name,
    status: 'active' as const,
    profile: 'freeform' as const,
    media: exp.thumbnailUrl
      ? { mediaAssetId: '', url: exp.thumbnailUrl }
      : null,
    draft: {
      steps: [],
    },
    published: null,
    draftVersion: 1,
    publishedVersion: null,
    deletedAt: null,
    publishedAt: null,
    publishedBy: null,
    createdAt: 0,
    updatedAt: 0,
  }))

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
    <ThemeProvider theme={theme}>
      <WelcomeRenderer
        welcome={welcome}
        mainExperiences={mainExperiences}
        experienceDetails={experienceDetails}
        mode="run"
        onSelectExperience={handleSelectExperience}
      />
    </ThemeProvider>
  )
}

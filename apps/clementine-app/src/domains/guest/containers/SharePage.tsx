/**
 * SharePage Container
 *
 * Displays AI generation progress and final results using ShareLoadingRenderer
 * and ShareReadyRenderer components. Subscribes to session for real-time job
 * status updates.
 *
 * User Stories: P1-P3 (Loading, Ready State, Interactive Buttons)
 */
import { useNavigate } from '@tanstack/react-router'
import { useGuestContext } from '../contexts'
import { useShareActions } from '../hooks'
import { ThemedErrorState } from '../components'
import type { ShareOptionsConfig } from '@clementine/shared'
import {
  ShareLoadingRenderer,
  ShareReadyRenderer,
} from '@/domains/project-config/share/components'
import { useSubscribeSession } from '@/domains/session/shared'
import {
  ThemeProvider,
  ThemedBackground,
  useBodyThemeSync,
} from '@/shared/theming'
import { DEFAULT_THEME } from '@/domains/project-config/theme/constants'
import {
  DEFAULT_SHARE_LOADING,
  DEFAULT_SHARE_READY,
} from '@/domains/project-config/share/constants'

export interface SharePageProps {
  /** Main session ID from URL query params */
  mainSessionId: string
}

// Default share options when none configured
const DEFAULT_SHARE_OPTIONS: ShareOptionsConfig = {
  download: true,
  copyLink: true,
  email: false,
  instagram: false,
  facebook: false,
  linkedin: false,
  twitter: false,
  tiktok: false,
  telegram: false,
}

/**
 * Share page with renderer integration
 *
 * Subscribes to session for real-time job status updates.
 * Shows loading when job is pending/running, ready when completed or null (no transform).
 *
 * @example
 * ```tsx
 * // In route file: src/app/join/$projectId/share.tsx
 * function JoinSharePage() {
 *   const { session } = Route.useSearch()
 *   return <SharePage mainSessionId={session} />
 * }
 * ```
 */
export function SharePage({ mainSessionId }: SharePageProps) {
  const { project } = useGuestContext()
  const navigate = useNavigate()

  // Subscribe to session for real-time jobStatus updates
  const { data: session, isLoading: isSessionLoading } = useSubscribeSession(
    project.id,
    mainSessionId,
  )

  // Derive UI state from job status
  // null = no transform configured, should show ready immediately
  const jobStatus = session?.jobStatus
  const resultMedia = session?.resultMedia ?? null
  const resultMediaUrl = resultMedia?.url ?? null
  const isSessionMissing = !isSessionLoading && !session
  const isJobInProgress = jobStatus === 'pending' || jobStatus === 'running'
  // Job is truly completed when we have the result media URL
  const isJobCompleted =
    (jobStatus === 'completed' && resultMediaUrl !== null) || jobStatus === null
  const isJobFailed =
    isSessionMissing || jobStatus === 'failed' || jobStatus === 'cancelled'

  // Get configurations from published config (guest sees published, not draft)
  const currentTheme = project.publishedConfig?.theme ?? DEFAULT_THEME

  // Sync body background for Safari mobile immersive experience
  useBodyThemeSync(currentTheme.background.color)
  const shareReady = project.publishedConfig?.shareReady ?? DEFAULT_SHARE_READY
  const shareLoading =
    project.publishedConfig?.shareLoading ?? DEFAULT_SHARE_LOADING
  const shareOptions =
    project.publishedConfig?.shareOptions ?? DEFAULT_SHARE_OPTIONS

  // Share actions hook - only active when we have result media
  const { handleShare } = useShareActions({ media: resultMedia })

  // Navigation handlers
  const handleStartOver = () => {
    navigate({ to: '/join/$projectId', params: { projectId: project.id } })
  }

  const handleCta = () => {
    if (shareReady.cta?.url) {
      window.open(shareReady.cta.url, '_blank', 'noopener,noreferrer')
    }
  }

  // Show loading while session is being fetched
  if (isSessionLoading) {
    return (
      <ThemeProvider theme={currentTheme}>
        <div className="h-screen">
          <ThemedBackground className="h-full w-full">
            <ShareLoadingRenderer shareLoading={shareLoading} mode="run" />
          </ThemedBackground>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <ThemedBackground className="h-dvh">
        {isJobInProgress && (
          <ShareLoadingRenderer shareLoading={shareLoading} mode="run" />
        )}
        {isJobCompleted && resultMediaUrl && (
          <ShareReadyRenderer
            share={shareReady}
            shareOptions={shareOptions}
            mode="run"
            mediaUrl={resultMediaUrl}
            onShare={handleShare}
            onCta={handleCta}
            onStartOver={handleStartOver}
          />
        )}
        {isSessionMissing && (
          <ThemedErrorState
            title="Session not found"
            message="We couldn't find your session. Please try again."
            actionLabel="Start Over"
            onAction={handleStartOver}
          />
        )}
        {!isSessionMissing && isJobFailed && (
          <ThemedErrorState
            title="Something went wrong"
            message="We couldn't process your image. Please try again."
            actionLabel="Start Over"
            onAction={handleStartOver}
          />
        )}
      </ThemedBackground>
    </ThemeProvider>
  )
}

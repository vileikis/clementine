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
import { ThemeProvider, ThemedBackground } from '@/shared/theming'
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

// Mock result images (temporary - will be fetched from session in future)
// Swap between these to test different aspect ratios:
const MOCK_RESULT_IMAGE =
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&h=900' // Square
// const MOCK_RESULT_IMAGE =
// 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=900' // Portrait

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
  const isJobInProgress = jobStatus === 'pending' || jobStatus === 'running'
  const isJobCompleted = jobStatus === 'completed' || jobStatus === null
  const isJobFailed = jobStatus === 'failed' || jobStatus === 'cancelled'

  // Get configurations from published config (guest sees published, not draft)
  const currentTheme = project.publishedConfig?.theme ?? DEFAULT_THEME
  const shareReady = project.publishedConfig?.shareReady ?? DEFAULT_SHARE_READY
  const shareLoading =
    project.publishedConfig?.shareLoading ?? DEFAULT_SHARE_LOADING
  const shareOptions =
    project.publishedConfig?.shareOptions ?? DEFAULT_SHARE_OPTIONS

  // Share actions hook
  const { handleShare } = useShareActions({ mediaUrl: MOCK_RESULT_IMAGE })

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
          <ThemedBackground
            className="h-full w-full"
            contentClassName="h-full w-full"
          >
            <ShareLoadingRenderer shareLoading={shareLoading} mode="run" />
          </ThemedBackground>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <div className="h-screen">
        <ThemedBackground
          className="h-full w-full"
          contentClassName="h-full w-full"
        >
          {isJobInProgress && (
            <ShareLoadingRenderer shareLoading={shareLoading} mode="run" />
          )}
          {isJobCompleted && (
            <ShareReadyRenderer
              share={shareReady}
              shareOptions={shareOptions}
              mode="run"
              mediaUrl={MOCK_RESULT_IMAGE}
              onShare={handleShare}
              onCta={handleCta}
              onStartOver={handleStartOver}
            />
          )}
          {isJobFailed && (
            <ThemedErrorState
              title="Something went wrong"
              message="We couldn't process your image. Please try again."
              actionLabel="Start Over"
              onAction={handleStartOver}
            />
          )}
        </ThemedBackground>
      </div>
    </ThemeProvider>
  )
}

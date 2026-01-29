/**
 * SharePage Container
 *
 * Displays AI generation progress and final results using ShareLoadingRenderer
 * and ShareReadyRenderer components. Uses mock data with simulated 3-second
 * loading transition.
 *
 * User Stories: P1-P3 (Loading, Ready State, Interactive Buttons)
 */
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useGuestContext } from '../contexts'
import type { ShareOptionsConfig } from '@clementine/shared'
import {
  ShareLoadingRenderer,
  ShareReadyRenderer,
} from '@/domains/project-config/share/components'
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
// const MOCK_RESULT_IMAGE = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800' // Square
const MOCK_RESULT_IMAGE =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=900' // Portrait

/**
 * Share page with renderer integration
 *
 * Displays loading state for 3 seconds, then transitions to ready state
 * with mock result image and share options.
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
export function SharePage({ mainSessionId: _mainSessionId }: SharePageProps) {
  const { project } = useGuestContext()
  const navigate = useNavigate()
  const [isReady, setIsReady] = useState(false)

  // 3-second transition timer
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  // Get configurations from published config (guest sees published, not draft)
  const currentTheme = project.publishedConfig?.theme ?? DEFAULT_THEME
  const shareReady = project.publishedConfig?.shareReady ?? DEFAULT_SHARE_READY
  const shareLoading =
    project.publishedConfig?.shareLoading ?? DEFAULT_SHARE_LOADING
  const shareOptions =
    project.publishedConfig?.shareOptions ?? DEFAULT_SHARE_OPTIONS

  // Navigation handlers
  const handleStartOver = () => {
    navigate({ to: '/join/$projectId', params: { projectId: project.id } })
  }

  const handleCta = () => {
    if (shareReady.cta?.url) {
      window.open(shareReady.cta.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleShare = (platform: keyof ShareOptionsConfig) => {
    // No-op - share functionality deferred (FR-008)
    console.log(`Share clicked: ${platform}`)
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <div className="h-screen">
        <ThemedBackground
          className="h-full w-full"
          contentClassName="h-full w-full"
        >
          {isReady ? (
            <ShareReadyRenderer
              share={shareReady}
              shareOptions={shareOptions}
              mode="run"
              mediaUrl={MOCK_RESULT_IMAGE}
              onShare={handleShare}
              onCta={handleCta}
              onStartOver={handleStartOver}
            />
          ) : (
            <ShareLoadingRenderer shareLoading={shareLoading} mode="run" />
          )}
        </ThemedBackground>
      </div>
    </ThemeProvider>
  )
}

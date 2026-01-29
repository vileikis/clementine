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
import type {
  ShareLoadingConfig,
  ShareOptionsConfig,
  ShareReadyConfig,
} from '@clementine/shared'
import {
  ShareLoadingRenderer,
  ShareReadyRenderer,
} from '@/domains/project-config/share/components'
import { ThemeProvider, ThemedBackground } from '@/shared/theming'
import { DEFAULT_THEME } from '@/domains/project-config/theme/constants'

export interface SharePageProps {
  /** Main session ID from URL query params */
  mainSessionId: string
}

// Mock data constants
const MOCK_LOADING_CONFIG: ShareLoadingConfig = {
  title: 'Creating your masterpiece...',
  description: 'Our AI is working its magic. This usually takes 30-60 seconds.',
}

const MOCK_READY_CONFIG: ShareReadyConfig = {
  title: 'Your AI Creation is Ready!',
  description: 'Share your unique creation with friends and family.',
  cta: {
    label: 'Visit Our Website',
    url: 'https://example.com',
  },
}

const MOCK_SHARE_OPTIONS: ShareOptionsConfig = {
  download: true,
  copyLink: true,
  email: false,
  instagram: true,
  facebook: true,
  linkedin: false,
  twitter: true,
  tiktok: false,
  telegram: false,
}

const MOCK_RESULT_IMAGE =
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800'

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

  // Get theme from project or use default
  const currentTheme = project.draftConfig?.theme ?? DEFAULT_THEME

  // Navigation handlers
  const handleStartOver = () => {
    navigate({ to: '/join/$projectId', params: { projectId: project.id } })
  }

  const handleCta = () => {
    if (MOCK_READY_CONFIG.cta?.url) {
      window.location.href = MOCK_READY_CONFIG.cta.url
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
              share={MOCK_READY_CONFIG}
              shareOptions={MOCK_SHARE_OPTIONS}
              mode="run"
              mediaUrl={MOCK_RESULT_IMAGE}
              onShare={handleShare}
              onCta={handleCta}
              onStartOver={handleStartOver}
            />
          ) : (
            <ShareLoadingRenderer
              shareLoading={MOCK_LOADING_CONFIG}
              mode="run"
            />
          )}
        </ThemedBackground>
      </div>
    </ThemeProvider>
  )
}

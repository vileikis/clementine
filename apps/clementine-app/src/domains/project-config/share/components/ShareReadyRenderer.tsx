/**
 * ShareReadyRenderer Component
 *
 * Renders the ready state shown to guests when their AI-generated result is available.
 * Uses ThemedText, ThemedBackground, ThemedButton, and ThemedIconButton primitives
 * from shared theming module.
 *
 * WYSIWYG Principle: What creators see in preview is exactly what guests see.
 *
 * Must be used within a ThemeProvider.
 */

import { Download, Link2, Mail, RotateCcw } from 'lucide-react'
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
} from 'react-icons/fa6'
import { FaTelegramPlane } from 'react-icons/fa'
import type { ShareOptionsConfig, ShareReadyConfig } from '@clementine/shared'
import type { LucideIcon } from 'lucide-react'
import type { IconType } from 'react-icons'
import { Skeleton } from '@/ui-kit/ui/skeleton'
import {
  ThemedBackground,
  ThemedButton,
  ThemedIconButton,
  ThemedText,
} from '@/shared/theming'

export interface ShareReadyRendererProps {
  /** Share ready config to render */
  share: ShareReadyConfig
  /** Share options (determines which icons appear) */
  shareOptions: ShareOptionsConfig
  /**
   * Display mode
   * - edit: Non-interactive WYSIWYG preview in designer
   * - run: Interactive guest experience with actual sharing actions
   */
  mode?: 'edit' | 'run'
  /** Media URL to display (when available in run mode) */
  mediaUrl?: string | null
  /** Callback when share platform is clicked (required in run mode, handles download too) */
  onShare?: (platform: keyof ShareOptionsConfig) => void
  /** Callback when CTA is clicked (required in run mode) */
  onCta?: () => void
  /** Callback when start over is clicked (required in run mode) */
  onStartOver?: () => void
}

// Platform to icon mapping
const PLATFORM_ICONS: Record<
  keyof ShareOptionsConfig,
  { icon: LucideIcon | IconType; label: string }
> = {
  download: { icon: Download, label: 'Download' },
  copyLink: { icon: Link2, label: 'Copy Link' },
  email: { icon: Mail, label: 'Email' },
  instagram: { icon: FaInstagram, label: 'Instagram' },
  facebook: { icon: FaFacebookF, label: 'Facebook' },
  linkedin: { icon: FaLinkedinIn, label: 'LinkedIn' },
  twitter: { icon: FaXTwitter, label: 'Twitter' },
  tiktok: { icon: FaTiktok, label: 'TikTok' },
  telegram: { icon: FaTelegramPlane, label: 'Telegram' },
}

// Order for displaying share icons
const SHARE_ICON_ORDER: (keyof ShareOptionsConfig)[] = [
  'download',
  'copyLink',
  'email',
  'instagram',
  'facebook',
  'twitter',
  'linkedin',
  'tiktok',
  'telegram',
]

export function ShareReadyRenderer({
  share,
  shareOptions,
  mode = 'edit',
  mediaUrl,
  onShare,
  onCta,
  onStartOver,
}: ShareReadyRendererProps) {
  // Get enabled icons in order
  const enabledIcons = SHARE_ICON_ORDER.filter(
    (platform) => shareOptions[platform],
  )

  const handleIconClick = (platform: keyof ShareOptionsConfig) => {
    if (mode === 'run' && onShare) {
      onShare(platform)
    }
  }

  const handleCtaClick = () => {
    if (mode === 'run' && onCta && share.cta?.url) {
      onCta()
    }
  }

  const handleStartOverClick = () => {
    if (mode === 'run' && onStartOver) {
      onStartOver()
    }
  }

  return (
    <ThemedBackground
      className="h-full w-full"
      contentClassName="flex flex-col h-full"
    >
      {/* Scrollable content zone */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center space-y-6">
        {/* Media - using same sizing as loading skeleton */}
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt="Generated result"
            className="w-full aspect-square max-w-md rounded-lg object-cover"
          />
        ) : (
          <Skeleton className="w-full aspect-square max-w-md rounded-lg" />
        )}

        {/* Title (hidden when null) */}
        {share.title && (
          <ThemedText variant="heading" className="text-center">
            {share.title}
          </ThemedText>
        )}

        {/* Description (hidden when null) */}
        {share.description && (
          <ThemedText
            variant="body"
            className="text-center opacity-90 max-w-md"
          >
            {share.description}
          </ThemedText>
        )}
      </div>

      {/* Fixed footer zone */}
      <div className="shrink-0 border-t border-current/10 p-4 space-y-3">
        {/* Share icons (displayed when enabled) */}
        {enabledIcons.length > 0 && (
          <div className="flex justify-center gap-3 flex-wrap">
            {enabledIcons.map((platform) => {
              const { icon: Icon, label } = PLATFORM_ICONS[platform]
              return (
                <ThemedIconButton
                  key={platform}
                  title={label}
                  aria-label={label}
                  onClick={() => handleIconClick(platform)}
                  disabled={mode === 'edit'}
                >
                  <Icon className="h-5 w-5" />
                </ThemedIconButton>
              )
            })}
          </div>
        )}

        {/* CTA button (primary style, hidden when label is null/empty) */}
        {share.cta?.label && (
          <ThemedButton
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleCtaClick}
            disabled={mode === 'edit'}
          >
            {share.cta.label}
          </ThemedButton>
        )}

        {/* Start over button (secondary/outline style) */}
        <ThemedButton
          variant="outline"
          size="md"
          className="w-full"
          onClick={handleStartOverClick}
          disabled={mode === 'edit'}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Start over
        </ThemedButton>
      </div>
    </ThemedBackground>
  )
}

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

import {
  Download,
  Image as ImageIcon,
  Link2,
  Mail,
  RotateCcw,
} from 'lucide-react'
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
} from 'react-icons/fa6'
import { FaTelegramPlane } from 'react-icons/fa'
import { ShareVideoPlayer } from './ShareVideoPlayer'
import type { ShareOptionsConfig, ShareReadyConfig } from '@clementine/shared'
import type { LucideIcon } from 'lucide-react'
import type { IconType } from 'react-icons'
import { Skeleton } from '@/ui-kit/ui/skeleton'
import {
  ScrollableView,
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
  /** Format of the result media */
  mediaFormat?: 'image' | 'gif' | 'video' | null
  /** Thumbnail URL for video poster image */
  mediaThumbnailUrl?: string | null
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
  mediaFormat,
  mediaThumbnailUrl,
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
    <ScrollableView className="items-center max-w-2xl">
      {mediaUrl ? (
        <div className="h-[50vh] w-full overflow-hidden rounded-lg flex items-center justify-center">
          {mediaFormat === 'video' ? (
            <ShareVideoPlayer
              src={mediaUrl}
              posterUrl={mediaThumbnailUrl}
              className="h-full w-full"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Generated result"
              className="h-full object-contain rounded-lg overflow-hidden"
            />
          )}
        </div>
      ) : mode === 'edit' ? (
        <div className="flex h-[50vh] w-full items-center justify-center rounded-lg bg-muted">
          <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
        </div>
      ) : (
        <Skeleton className="h-[50vh] w-full rounded-lg" />
      )}

      <div className="flex flex-col space-y-6 p-6 pb-12 items-center justify-center">
        {/* Share icons (displayed when enabled) */}
        <div>
          {enabledIcons.length > 0 && (
            <div className="flex justify-center gap-3 flex-wrap">
              {enabledIcons.map((platform) => {
                const { icon: Icon, label } = PLATFORM_ICONS[platform]
                return (
                  <ThemedIconButton
                    key={platform}
                    title={label}
                    size="lg"
                    aria-label={label}
                    onClick={() => handleIconClick(platform)}
                  >
                    <Icon className="h-5 w-5" />
                  </ThemedIconButton>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {/* Title (hidden when null) */}
          {share.title && (
            <ThemedText variant="heading" className="text-center">
              {share.title}
            </ThemedText>
          )}

          {/* Description (hidden when null) */}
          {share.description && (
            <ThemedText variant="body" className="text-center opacity-90">
              {share.description}
            </ThemedText>
          )}
        </div>

        {/* CTA button (primary style, hidden when label is null/empty) */}
        <div className="w-full max-w-[450px] space-y-3 pt-4">
          {share.cta?.label && (
            <ThemedButton
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleCtaClick}
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
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Start over
          </ThemedButton>
        </div>
      </div>
    </ScrollableView>
  )
}

/**
 * SharePreview Component
 *
 * Display-only preview component showing how the share screen will appear
 * in the guest-facing experience. Supports both ready and loading states.
 *
 * Uses ThemedText, ThemedBackground, ThemedButton, and ThemedIconButton primitives
 * from shared theming module.
 *
 * Two states:
 * 1. Loading: Skeleton placeholder + loading text (during AI generation)
 * 2. Ready: Full share screen with media, title, description, CTA, share icons
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
import type {
  ShareLoadingConfig,
  ShareOptionsConfig,
  ShareReadyConfig,
} from '@clementine/shared'
import type { LucideIcon } from 'lucide-react'
import type { IconType } from 'react-icons'
import { Skeleton } from '@/ui-kit/ui/skeleton'
import {
  ThemedBackground,
  ThemedButton,
  ThemedIconButton,
  ThemedText,
} from '@/shared/theming'

export interface SharePreviewProps {
  /** Preview state: ready (result available) or loading (AI generating) */
  previewState: 'ready' | 'loading'
  /** Share ready state config to preview */
  share: ShareReadyConfig
  /** Share loading state config to preview */
  shareLoading: ShareLoadingConfig
  /** Share options (determines which icons appear) */
  shareOptions: ShareOptionsConfig
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

export function SharePreview({
  previewState,
  share,
  shareLoading,
  shareOptions,
}: SharePreviewProps) {
  // Get enabled icons in order
  const enabledIcons = SHARE_ICON_ORDER.filter(
    (platform) => shareOptions[platform],
  )

  // Loading state preview
  if (previewState === 'loading') {
    return (
      <ThemedBackground
        className="h-full w-full"
        contentClassName="flex flex-col items-center justify-center p-8 space-y-6"
      >
        {/* Image skeleton */}
        <Skeleton className="w-full aspect-square max-w-md rounded-lg" />

        {/* Loading title */}
        <ThemedText variant="heading" className="text-center">
          {shareLoading.title || 'Creating your experience...'}
        </ThemedText>

        {/* Loading description */}
        <ThemedText variant="body" className="text-center opacity-90 max-w-md">
          {shareLoading.description ||
            'This usually takes 30-60 seconds. Please wait while we generate your personalized result.'}
        </ThemedText>
      </ThemedBackground>
    )
  }

  // Ready state preview (existing implementation)
  return (
    <ThemedBackground
      className="h-full w-full"
      contentClassName="flex flex-col h-full"
    >
      {/* Scrollable content zone */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Media placeholder */}
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
        </div>

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
                >
                  <Icon className="h-5 w-5" />
                </ThemedIconButton>
              )
            })}
          </div>
        )}

        {/* CTA button (primary style, hidden when label is null/empty) */}
        {share.cta?.label && (
          <ThemedButton variant="primary" size="md" className="w-full">
            {share.cta.label}
          </ThemedButton>
        )}

        {/* Start over button (secondary/outline style) */}
        <ThemedButton variant="outline" size="md" className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" />
          Start over
        </ThemedButton>
      </div>
    </ThemedBackground>
  )
}

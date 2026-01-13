/**
 * Share Preview Component Contract
 *
 * Defines the interface for the share screen preview component.
 * The preview displays a mock share screen with configurable content.
 *
 * Feature: 024-share-editor
 * Date: 2026-01-13
 */

// ============================================================================
// Types
// ============================================================================

/**
 * CTA configuration for preview display
 */
export interface CtaPreviewConfig {
  /** Button text label */
  label: string | null
  /** Destination URL (not used in preview, but shown for validation state) */
  url: string | null
}

/**
 * Share configuration for preview display
 */
export interface SharePreviewConfig {
  /** Title text displayed at top of share screen */
  title: string | null
  /** Description text displayed below title */
  description: string | null
  /** CTA button configuration */
  cta: CtaPreviewConfig | null
}

/**
 * Share options that affect which icons appear in footer
 * Renamed from SharingConfig to ShareOptionsConfig (FR-017)
 */
export interface ShareOptionsConfig {
  download: boolean
  copyLink: boolean
  email: boolean
  instagram: boolean
  facebook: boolean
  linkedin: boolean
  twitter: boolean
  tiktok: boolean
  telegram: boolean
}

// ============================================================================
// Component Props Contract
// ============================================================================

/**
 * SharePreview Component Props
 *
 * @example
 * ```tsx
 * <SharePreview
 *   share={{
 *     title: 'Your photo is ready!',
 *     description: 'Download or share your creation',
 *     cta: { label: 'Visit Website', url: 'https://example.com' }
 *   }}
 *   shareOptions={{
 *     download: true,
 *     copyLink: true,
 *     email: false,
 *     instagram: true,
 *     // ... other platforms
 *   }}
 * />
 * ```
 */
export interface SharePreviewProps {
  /** Share screen content configuration */
  share: SharePreviewConfig
  /** Share options (determines which icons appear) */
  shareOptions: ShareOptionsConfig
}

// ============================================================================
// Layout Contract
// ============================================================================

/**
 * Share screen layout zones
 *
 * The preview has two distinct zones:
 * 1. Scrollable content zone (top): Title, description, media placeholder
 * 2. Fixed footer zone (bottom): Share icons, Start over, CTA button
 *
 * ```
 * ┌─────────────────────────┐
 * │                         │
 * │   [Media Placeholder]   │  ← Scrollable
 * │                         │     Zone
 * │   Title                 │
 * │   Description           │
 * │                         │
 * ├─────────────────────────┤
 * │ [icons] [Start] [CTA]   │  ← Fixed Footer
 * └─────────────────────────┘
 * ```
 */
export const SHARE_PREVIEW_LAYOUT = {
  /** Scrollable content zone contains media, title, description */
  CONTENT_ZONE: ['media', 'title', 'description'] as const,
  /** Fixed footer zone contains share icons, buttons */
  FOOTER_ZONE: ['shareIcons', 'startOverButton', 'ctaButton'] as const,
} as const

// ============================================================================
// Visual Constants
// ============================================================================

/**
 * Share icon display order
 * Icons appear in footer in this order (when enabled)
 */
export const SHARE_ICON_ORDER = [
  'download',
  'copyLink',
  'email',
  'instagram',
  'facebook',
  'twitter',
  'linkedin',
  'tiktok',
  'telegram',
] as const

/**
 * Media placeholder configuration
 */
export const MEDIA_PLACEHOLDER = {
  /** Aspect ratio for placeholder image */
  ASPECT_RATIO: '1:1',
  /** Background color for placeholder */
  BACKGROUND: 'bg-muted',
  /** Icon to display in placeholder */
  ICON: 'Image',
} as const

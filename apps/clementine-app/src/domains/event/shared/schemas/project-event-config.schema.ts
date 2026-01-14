/**
 * Project Event Configuration Schema
 *
 * Guest-facing configuration for event experiences (theme, overlays, sharing).
 * This schema is embedded within ProjectEvent as `draftConfig` or `publishedConfig`.
 *
 * Cross-reference: See project-event-full.schema.ts for complete ProjectEvent schema
 */
import { z } from 'zod'
import { themeSchema } from '@/shared/theming/schemas/theme.schemas'
import { mediaReferenceSchema } from '@/shared/theming'
import { experiencesConfigSchema } from '@/domains/event/experiences/schemas/event-experiences.schema'

/**
 * Current schema version for event configuration
 */
export const CURRENT_CONFIG_VERSION = 1

/**
 * Overlay Reference Schema
 *
 * References a MediaAsset document for use as an overlay
 * Stores both ID (tracking) and URL (fast rendering)
 */
export const overlayReferenceSchema = z
  .object({
    /**
     * MediaAsset document ID
     * Reference: workspaces/{workspaceId}/mediaAssets/{mediaAssetId}
     */
    mediaAssetId: z.string(),

    /**
     * Firebase Storage download URL
     * Fast rendering without extra Firestore query or getDownloadURL call
     */
    url: z.string().url(),
  })
  .nullable()

/**
 * Overlay images for different aspect ratios
 * Applied to guest photos based on their orientation
 */
export const overlaysConfigSchema = z
  .object({
    '1:1': overlayReferenceSchema.default(null),
    '9:16': overlayReferenceSchema.default(null),
  })
  .nullable()
  .default(null)

/**
 * Experience Picker Layout
 *
 * Layout options for displaying experience cards on the welcome screen.
 * - list: Vertical stack of experience cards
 * - grid: Grid layout of experience cards
 */
export const experiencePickerLayoutSchema = z.enum(['list', 'grid'])

export type ExperiencePickerLayout = z.infer<
  typeof experiencePickerLayoutSchema
>

/**
 * Guest sharing preferences and options (platform toggles)
 * Renamed from sharingConfigSchema to shareOptionsConfigSchema (FR-017)
 * Flattened structure for simpler updates using Firestore dot notation
 */
export const shareOptionsConfigSchema = z.object({
  download: z.boolean().default(true),
  copyLink: z.boolean().default(true),
  email: z.boolean().default(false),
  instagram: z.boolean().default(false),
  facebook: z.boolean().default(false),
  linkedin: z.boolean().default(false),
  twitter: z.boolean().default(false),
  tiktok: z.boolean().default(false),
  telegram: z.boolean().default(false),
})

/**
 * @deprecated Use shareOptionsConfigSchema instead
 * Alias for backward compatibility
 */
export const sharingConfigSchema = shareOptionsConfigSchema

/**
 * CTA (Call-to-Action) Configuration
 *
 * Configuration for the call-to-action button on the share screen.
 * When label is null, CTA button is hidden.
 *
 * Note: This read schema is permissive to handle existing data.
 * Write validation is enforced by ctaWriteSchema.
 */
export const ctaConfigSchema = z.object({
  /** Button text label. When null, CTA button is hidden. */
  label: z.string().nullable().default(null),
  /** Destination URL. Required when label is provided. */
  url: z.string().nullable().default(null),
})

/**
 * CTA Write Schema
 *
 * Stricter validation for writing CTA config.
 * Enforces: if label is provided, url must also be provided.
 */
export const ctaWriteSchema = ctaConfigSchema.refine(
  (data) => {
    // If label is provided, url must also be provided
    if (data.label !== null && data.url === null) {
      return false
    }
    return true
  },
  {
    message: 'CTA url is required when label is provided',
    path: ['url'],
  },
)

/**
 * Share Screen Configuration
 *
 * Customizable share screen content for guest-facing experience.
 * Title, description, and CTA button configuration.
 *
 * Note: This read schema is permissive (no max limits) to handle existing data.
 * Write validation with limits is enforced by updateShareSchema.
 */
export const shareConfigSchema = z.object({
  /** Share screen title text. When null, title area is hidden. */
  title: z.string().nullable().default(null),
  /** Share screen description text. When null, description area is hidden. */
  description: z.string().nullable().default(null),
  /** CTA button configuration. When null or label is null, button is hidden. */
  cta: ctaConfigSchema.nullable().default(null),
})

/**
 * Share Write Schema
 *
 * Stricter validation for writing share config.
 * Uses ctaWriteSchema to enforce CTA cross-field validation.
 */
export const shareWriteSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  cta: ctaWriteSchema.nullable().default(null),
})

/**
 * Welcome Screen Configuration
 *
 * Customizable welcome screen content for guest-facing experience.
 * Hero media, title, description, and experience card layout.
 *
 * Note: This read schema is permissive (no max limits) to handle existing data.
 * Write validation with limits is enforced by updateWelcomeSchema.
 */
export const welcomeConfigSchema = z.object({
  /** Welcome screen title */
  title: z.string().default('Choose your experience'),
  /** Welcome screen description */
  description: z.string().nullable().default(null),
  /** Hero media (image) - uses shared MediaReference type */
  media: mediaReferenceSchema.nullable().default(null),
  /** Experience cards layout */
  layout: experiencePickerLayoutSchema.default('list'),
})

/**
 * Complete guest-facing event configuration
 *
 * Contains all settings that affect the guest experience:
 * - Visual theme (colors, fonts, backgrounds)
 * - Overlay images for photo composition
 * - Sharing options and social media integrations
 * - Share screen content configuration
 *
 * This schema uses Firestore-safe patterns:
 * - Optional fields use `.nullable().default(null)` (Firestore doesn't support undefined)
 * - Uses `z.looseObject()` for forward compatibility with future fields
 */
export const projectEventConfigSchema = z.looseObject({
  /**
   * Schema version for migration tracking
   */
  schemaVersion: z.number().default(CURRENT_CONFIG_VERSION),

  /**
   * Visual theme configuration
   * Full embedded theme object (not a reference)
   */
  theme: themeSchema.nullable().default(null),

  /**
   * Overlay images by aspect ratio
   */
  overlays: overlaysConfigSchema,

  /**
   * Share options (platform toggles)
   * Renamed from 'sharing' to 'shareOptions' (FR-017)
   */
  shareOptions: shareOptionsConfigSchema.nullable().default(null),

  /**
   * @deprecated Use shareOptions instead
   * Alias for backward compatibility - reads from old field name
   */
  sharing: sharingConfigSchema.nullable().default(null),

  /**
   * Share screen content configuration
   * Title, description, and CTA button
   */
  share: shareConfigSchema.nullable().default(null),

  /**
   * Welcome screen configuration
   */
  welcome: welcomeConfigSchema.nullable().default(null),

  /**
   * Experience slot assignments
   * Defines which experiences are connected to this event
   */
  experiences: experiencesConfigSchema.nullable().default(null),
}) // Allow unknown fields for future evolution

/**
 * TypeScript types exported from schemas
 */
export type ProjectEventConfig = z.infer<typeof projectEventConfigSchema>
export type OverlayReference = z.infer<typeof overlayReferenceSchema>
export type OverlaysConfig = z.infer<typeof overlaysConfigSchema>
export type ShareOptionsConfig = z.infer<typeof shareOptionsConfigSchema>
/** @deprecated Use ShareOptionsConfig instead */
export type SharingConfig = z.infer<typeof sharingConfigSchema>
export type WelcomeConfig = z.infer<typeof welcomeConfigSchema>
export type CtaConfig = z.infer<typeof ctaConfigSchema>
export type ShareConfig = z.infer<typeof shareConfigSchema>

// Re-export experiences types for convenience
export type { ExperiencesConfig } from '@/domains/event/experiences/schemas/event-experiences.schema'

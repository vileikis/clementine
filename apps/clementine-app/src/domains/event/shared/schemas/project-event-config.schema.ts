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
 * Guest sharing preferences and options
 * Flattened structure for simpler updates using Firestore dot notation
 */
export const sharingConfigSchema = z.object({
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
   * Sharing configuration
   */
  sharing: sharingConfigSchema.nullable().default(null),

  /**
   * Welcome screen configuration
   */
  welcome: welcomeConfigSchema.nullable().default(null),
}) // Allow unknown fields for future evolution

/**
 * TypeScript types exported from schemas
 */
export type ProjectEventConfig = z.infer<typeof projectEventConfigSchema>
export type OverlayReference = z.infer<typeof overlayReferenceSchema>
export type OverlaysConfig = z.infer<typeof overlaysConfigSchema>
export type SharingConfig = z.infer<typeof sharingConfigSchema>
export type WelcomeConfig = z.infer<typeof welcomeConfigSchema>

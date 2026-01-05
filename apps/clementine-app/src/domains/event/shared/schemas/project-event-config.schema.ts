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

/**
 * Current schema version for event configuration
 */
export const CURRENT_CONFIG_VERSION = 1

/**
 * Overlay images for different aspect ratios
 * Applied to guest photos based on their orientation
 */
export const overlaysConfigSchema = z
  .object({
    '1:1': z.string().url().nullable().default(null),
    '9:16': z.string().url().nullable().default(null),
  })
  .nullable()
  .default(null)

/**
 * Social media platform enable/disable flags
 */
export const socialSharingConfigSchema = z.object({
  email: z.boolean().default(false),
  instagram: z.boolean().default(false),
  facebook: z.boolean().default(false),
  linkedin: z.boolean().default(false),
  twitter: z.boolean().default(false),
  tiktok: z.boolean().default(false),
  telegram: z.boolean().default(false),
})

/**
 * Guest sharing preferences and options
 */
export const sharingConfigSchema = z.object({
  downloadEnabled: z.boolean().default(true),
  copyLinkEnabled: z.boolean().default(true),
  socials: socialSharingConfigSchema.nullable().default(null),
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
}) // Allow unknown fields for future evolution

/**
 * TypeScript types exported from schemas
 */
export type ProjectEventConfig = z.infer<typeof projectEventConfigSchema>
export type OverlaysConfig = z.infer<typeof overlaysConfigSchema>
export type SharingConfig = z.infer<typeof sharingConfigSchema>
export type SocialSharingConfig = z.infer<typeof socialSharingConfigSchema>

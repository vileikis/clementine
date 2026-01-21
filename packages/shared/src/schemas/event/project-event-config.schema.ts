/**
 * Project Event Configuration Schema (Shared)
 *
 * Simplified event configuration schema for shared kernel.
 * Contains core fields needed by both app and functions.
 *
 * Note: Full theming and experiences configuration is handled by app-specific schemas
 * that extend or re-export from this base. This schema focuses on the minimal
 * structure needed for cross-package usage.
 */
import { z } from 'zod'

/**
 * Current schema version for event configuration
 */
export const CURRENT_CONFIG_VERSION = 1

/**
 * Overlay Reference Schema
 *
 * References a MediaAsset document for use as an overlay.
 * Stores both ID (tracking) and URL (fast rendering)
 */
export const overlayReferenceSchema = z
  .object({
    /** MediaAsset document ID */
    mediaAssetId: z.string(),
    /** Firebase Storage download URL */
    url: z.string().url(),
  })
  .nullable()

/**
 * Overlay images for different aspect ratios
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
 */
export const experiencePickerLayoutSchema = z.enum(['list', 'grid'])

/**
 * Guest sharing preferences and options
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
 * CTA Configuration
 */
export const ctaConfigSchema = z.object({
  label: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
})

/**
 * Share Screen Configuration
 */
export const shareConfigSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  cta: ctaConfigSchema.nullable().default(null),
})

/**
 * Media Reference Schema (simplified)
 */
export const mediaReferenceSchema = z
  .object({
    mediaAssetId: z.string(),
    url: z.string().url(),
  })
  .nullable()

/**
 * Welcome Screen Configuration
 */
export const welcomeConfigSchema = z.object({
  title: z.string().default('Choose your experience'),
  description: z.string().nullable().default(null),
  media: mediaReferenceSchema.default(null),
  layout: experiencePickerLayoutSchema.default('list'),
})

/**
 * Base Event Configuration Schema
 *
 * This is a loose object to allow app-specific extensions (theme, experiences)
 * without breaking the shared schema.
 */
export const projectEventConfigSchema = z.looseObject({
  schemaVersion: z.number().default(CURRENT_CONFIG_VERSION),
  overlays: overlaysConfigSchema,
  shareOptions: shareOptionsConfigSchema.nullable().default(null),
  share: shareConfigSchema.nullable().default(null),
  welcome: welcomeConfigSchema.nullable().default(null),
  // Note: theme and experiences are handled by app-specific schemas
  // since they have complex app-specific dependencies
})

/**
 * TypeScript types exported from schemas
 */
export type ProjectEventConfig = z.infer<typeof projectEventConfigSchema>
export type OverlayReference = z.infer<typeof overlayReferenceSchema>
export type OverlaysConfig = z.infer<typeof overlaysConfigSchema>
export type ShareOptionsConfig = z.infer<typeof shareOptionsConfigSchema>
export type WelcomeConfig = z.infer<typeof welcomeConfigSchema>
export type CtaConfig = z.infer<typeof ctaConfigSchema>
export type ShareConfig = z.infer<typeof shareConfigSchema>
export type ExperiencePickerLayout = z.infer<typeof experiencePickerLayoutSchema>
export type MediaReference = z.infer<typeof mediaReferenceSchema>

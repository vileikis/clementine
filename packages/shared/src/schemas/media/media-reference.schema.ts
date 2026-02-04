/**
 * Media Reference Schema
 *
 * Lightweight reference to a MediaAsset used in other documents.
 * Used for theme backgrounds, event overlays, experience media, etc.
 *
 * filePath is nullable for backward compatibility with existing documents
 * that don't have this field. New uploads will populate filePath.
 */
import { z } from 'zod'

/**
 * Media display name validation schema.
 *
 * Validates display names for mention-safe usage in @{ref:displayName} syntax.
 * Allowed characters: letters, numbers, spaces, hyphens, underscores, and periods.
 * Forbidden characters: } : { (break mention parsing)
 *
 * Uses .catch('Untitled') for backward compatibility with existing documents.
 */
export const mediaDisplayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required')
  .max(100, 'Display name must be 100 characters or less')
  .regex(
    /^[a-zA-Z0-9 \-_.]+$/,
    'Display name can only contain letters, numbers, spaces, hyphens, underscores, and periods'
  )
  .catch('Untitled')

/** Validated display name for media references */
export type MediaDisplayName = z.infer<typeof mediaDisplayNameSchema>

export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.url(),
  filePath: z.string().nullable().default(null),
  displayName: mediaDisplayNameSchema,
})

export type MediaReference = z.infer<typeof mediaReferenceSchema>

// Type aliases for backward compatibility with existing code
export type OverlayReference = MediaReference | null
export type ExperienceMedia = MediaReference | null
export type ExperienceMediaAsset = MediaReference | null

// Schema aliases for nullable variants
export const overlayReferenceSchema = mediaReferenceSchema.nullable()
export const experienceMediaSchema = mediaReferenceSchema.nullable()
export const experienceMediaAssetSchema = mediaReferenceSchema.nullable()

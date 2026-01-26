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

export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.string().url(),
  filePath: z.string().nullable().default(null),
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

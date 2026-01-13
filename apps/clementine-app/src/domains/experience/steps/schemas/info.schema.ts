/**
 * Info Step Config Schema
 *
 * Configuration for information/display steps.
 * Used for welcome screens, instructions, or informational content.
 */
import { z } from 'zod'

/**
 * Media asset reference schema
 * Points to an asset in the media library
 */
export const mediaAssetSchema = z
  .object({
    /** Reference to media asset in media library */
    mediaAssetId: z.string().min(1),
    /** Full public URL for immediate rendering */
    url: z.string().url(),
  })
  .nullable()

/**
 * Info step configuration schema
 */
export const infoStepConfigSchema = z.object({
  /** Optional title text (max 200 chars) */
  title: z.string().max(200).default(''),
  /** Optional description text (max 1000 chars) */
  description: z.string().max(1000).default(''),
  /** Optional media asset (image/video) */
  media: mediaAssetSchema.default(null),
})

export type InfoStepConfig = z.infer<typeof infoStepConfigSchema>
export type MediaAsset = z.infer<typeof mediaAssetSchema>

/**
 * Default config factory for info steps
 */
export function createDefaultInfoConfig(): InfoStepConfig {
  return {
    title: '',
    description: '',
    media: null,
  }
}

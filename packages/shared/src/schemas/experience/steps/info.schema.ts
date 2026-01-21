/**
 * Experience Info Step Config Schema
 *
 * Configuration for information/display steps.
 * Used for welcome screens, instructions, or informational content.
 */
import { z } from 'zod'

/**
 * Media asset reference schema
 * Points to an asset in the media library
 */
export const experienceMediaAssetSchema = z
  .object({
    /** Reference to media asset in media library */
    mediaAssetId: z.string().min(1),
    /** Full public URL for immediate rendering */
    url: z.url(),
  })
  .nullable()

/**
 * Experience info step configuration schema
 */
export const experienceInfoStepConfigSchema = z.object({
  /** Optional title text (max 200 chars) */
  title: z.string().max(200).default(''),
  /** Optional description text (max 1000 chars) */
  description: z.string().max(1000).default(''),
  /** Optional media asset (image/video) */
  media: experienceMediaAssetSchema.default(null),
})

export type ExperienceInfoStepConfig = z.infer<
  typeof experienceInfoStepConfigSchema
>
export type ExperienceMediaAsset = z.infer<typeof experienceMediaAssetSchema>

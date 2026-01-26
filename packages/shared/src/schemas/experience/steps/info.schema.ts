/**
 * Experience Info Step Config Schema
 *
 * Configuration for information/display steps.
 * Used for welcome screens, instructions, or informational content.
 */
import { z } from 'zod'

import { experienceMediaAssetSchema } from '../../media/media-reference.schema'

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

// Re-export for backward compatibility
export {
  experienceMediaAssetSchema,
  type ExperienceMediaAsset,
} from '../../media/media-reference.schema'

/**
 * Experience Capture Photo Step Config Schema
 *
 * Configuration for photo capture steps.
 */
import { z } from 'zod'

/**
 * Aspect ratio options for photo capture
 */
export const experienceAspectRatioSchema = z.enum(['1:1', '9:16', '3:2', '2:3'])

/**
 * Experience capture photo step configuration schema
 */
export const experienceCapturePhotoStepConfigSchema = z.object({
  /** Aspect ratio for the captured photo */
  aspectRatio: experienceAspectRatioSchema.default('1:1'),
})

export type ExperienceAspectRatio = z.infer<typeof experienceAspectRatioSchema>
export type ExperienceCapturePhotoStepConfig = z.infer<
  typeof experienceCapturePhotoStepConfigSchema
>

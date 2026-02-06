/**
 * Experience Capture Photo Step Config Schema
 *
 * Configuration for photo capture steps.
 * Uses canonical aspect ratio schema for consistency across the platform.
 */
import { z } from 'zod'
import { aspectRatioSchema, type AspectRatio } from '../../media/aspect-ratio.schema'

/**
 * Aspect ratio options for photo capture.
 * Uses canonical aspect ratio schema.
 */
export const experienceAspectRatioSchema = aspectRatioSchema

/**
 * Experience capture photo step configuration schema
 */
export const experienceCapturePhotoStepConfigSchema = z.object({
  /** Aspect ratio for the captured photo */
  aspectRatio: experienceAspectRatioSchema.default('1:1'),
})

/** @deprecated Use AspectRatio from media/aspect-ratio.schema instead */
export type ExperienceAspectRatio = AspectRatio
export type ExperienceCapturePhotoStepConfig = z.infer<
  typeof experienceCapturePhotoStepConfigSchema
>

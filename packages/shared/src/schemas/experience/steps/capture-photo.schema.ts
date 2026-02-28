/**
 * Experience Capture Photo Step Config Schema
 *
 * Configuration for photo capture steps.
 * Uses canonical aspect ratio schema for consistency across the platform.
 */
import { z } from 'zod'
import { imageAspectRatioSchema, type ImageAspectRatio } from '../../media/aspect-ratio.schema'

/**
 * Aspect ratio options for photo capture (image ratios only, excludes 16:9).
 */
export const experienceAspectRatioSchema = imageAspectRatioSchema

/**
 * Experience capture photo step configuration schema
 */
export const experienceCapturePhotoStepConfigSchema = z.object({
  /** Aspect ratio for the captured photo */
  aspectRatio: experienceAspectRatioSchema.default('1:1'),
})

/** @deprecated Use ImageAspectRatio from media/aspect-ratio.schema instead */
export type ExperienceAspectRatio = ImageAspectRatio
export type ExperienceCapturePhotoStepConfig = z.infer<
  typeof experienceCapturePhotoStepConfigSchema
>

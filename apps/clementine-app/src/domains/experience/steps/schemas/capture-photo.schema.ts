/**
 * Capture Photo Step Config Schema
 *
 * Configuration for photo capture steps.
 */
import { z } from 'zod'

/**
 * Aspect ratio options for photo capture
 */
export const aspectRatioSchema = z.enum(['1:1', '9:16'])

/**
 * Capture photo step configuration schema
 */
export const capturePhotoStepConfigSchema = z.object({
  /** Aspect ratio for the captured photo */
  aspectRatio: aspectRatioSchema.default('1:1'),
})

export type AspectRatio = z.infer<typeof aspectRatioSchema>
export type CapturePhotoStepConfig = z.infer<
  typeof capturePhotoStepConfigSchema
>

/**
 * Default config factory for capture photo steps
 */
export function createDefaultCapturePhotoConfig(): CapturePhotoStepConfig {
  return {
    aspectRatio: '1:1',
  }
}

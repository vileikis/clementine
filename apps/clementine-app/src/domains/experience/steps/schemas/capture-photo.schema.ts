/**
 * Capture Photo Step Config Schema
 *
 * Configuration for photo capture steps.
 */
import { z } from 'zod'
import { mediaAssetSchema } from './info.schema'

/**
 * Capture photo step configuration schema
 */
export const capturePhotoStepConfigSchema = z.object({
  /** Instructions for the user (max 200 chars) */
  instructions: z.string().max(200).default(''),
  /** Countdown before capture in seconds (0 = disabled, max 10) */
  countdown: z.number().int().min(0).max(10).default(0),
  /** Optional overlay image (future feature) */
  overlay: mediaAssetSchema.default(null),
})

export type CapturePhotoStepConfig = z.infer<
  typeof capturePhotoStepConfigSchema
>

/**
 * Default config factory for capture photo steps
 */
export function createDefaultCapturePhotoConfig(): CapturePhotoStepConfig {
  return {
    instructions: '',
    countdown: 0,
    overlay: null,
  }
}

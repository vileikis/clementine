/**
 * Outcome Schema
 *
 * Configuration schema for outcome-based generation (image/gif/video).
 * Part of Transform v3 - replaces node-based pipeline with outcome-focused config.
 *
 * Aspect ratio is now a top-level outcome setting (not AI-specific) because it affects:
 * - Camera capture constraints
 * - Overlay resolution
 * - AI generation dimensions
 *
 * @see PRD 1A - Schema Foundations
 * @see Feature 065 - Experience-Level Aspect Ratio & Overlay System
 */
import { z } from 'zod'
import { aspectRatioSchema, imageAspectRatioSchema } from '../media/aspect-ratio.schema'
import { mediaReferenceSchema } from '../media/media-reference.schema'

/**
 * Outcome type for configuration.
 * Determines the final output format.
 */
export const outcomeTypeSchema = z.enum(['image', 'gif', 'video'])

/** Type of outcome: image, gif, or video */
export type OutcomeType = z.infer<typeof outcomeTypeSchema>

/**
 * AI image generation model selection.
 * Defined locally to avoid coupling to deprecated nodes/ system.
 */
export const aiImageModelSchema = z.enum([
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
])

/** AI model for image generation */
export type AIImageModel = z.infer<typeof aiImageModelSchema>

/**
 * AI image aspect ratio options.
 * Uses canonical aspect ratio schema. 16:9 removed per PRD spec.
 */
export const aiImageAspectRatioSchema = imageAspectRatioSchema

/** Aspect ratio for generated images */
export type AIImageAspectRatio = z.infer<typeof aiImageAspectRatioSchema>

/**
 * Image generation configuration.
 * Contains prompt template, reference media, model, and aspect ratio.
 */
export const imageGenerationConfigSchema = z.object({
  /** Prompt template with @{step:...} and @{ref:...} placeholders */
  prompt: z.string().default(''),
  /** Reference images for style guidance */
  refMedia: z.array(mediaReferenceSchema).default([]),
  /** AI model selection */
  model: aiImageModelSchema.default('gemini-2.5-flash-image'),
  /** Output aspect ratio */
  aspectRatio: aiImageAspectRatioSchema.default('1:1'),
})

/** Configuration for AI image generation */
export type ImageGenerationConfig = z.infer<typeof imageGenerationConfigSchema>

/**
 * Options for static image output.
 */
export const imageOptionsSchema = z.object({
  /** Discriminator for image options */
  kind: z.literal('image'),
})

/** Options specific to image output */
export type ImageOptions = z.infer<typeof imageOptionsSchema>

/**
 * Options for animated GIF output.
 */
export const gifOptionsSchema = z.object({
  /** Discriminator for GIF options */
  kind: z.literal('gif'),
  /** Frames per second (1-60) */
  fps: z.number().int().min(1).max(60).default(24),
  /** Duration in seconds (0.5-30) */
  duration: z.number().min(0.5).max(30).default(3),
})

/** Options specific to GIF output */
export type GifOptions = z.infer<typeof gifOptionsSchema>

/**
 * Options for video output.
 */
export const videoOptionsSchema = z.object({
  /** Discriminator for video options */
  kind: z.literal('video'),
  /** Prompt for video generation/animation */
  videoPrompt: z.string().default(''),
  /** Duration in seconds (1-60) */
  duration: z.number().min(1).max(60).default(5),
})

/** Options specific to video output */
export type VideoOptions = z.infer<typeof videoOptionsSchema>

/**
 * Discriminated union of outcome options by 'kind' field.
 * Enables type-safe narrowing based on output type.
 */
export const outcomeOptionsSchema = z.discriminatedUnion('kind', [
  imageOptionsSchema,
  gifOptionsSchema,
  videoOptionsSchema,
])

/** Union of all outcome-specific options */
export type OutcomeOptions = z.infer<typeof outcomeOptionsSchema>

/**
 * Complete Outcome configuration.
 * Defines how a session generates its final output.
 *
 * The top-level `aspectRatio` is the canonical output dimension setting that affects:
 * - Camera capture constraints
 * - Overlay resolution (at job creation)
 * - AI generation dimensions
 *
 * Note: `imageGeneration.aspectRatio` is kept for backward compatibility but
 * new code should use the top-level `aspectRatio` field.
 */
export const outcomeSchema = z.object({
  /** Output type (null = not configured) */
  type: outcomeTypeSchema.nullable().default(null),
  /**
   * Output aspect ratio - single source of truth for all downstream systems.
   * Affects camera capture, overlay resolution, and AI generation.
   */
  aspectRatio: aspectRatioSchema.default('1:1'),
  /** Source capture step ID for image-to-image (null = no source) */
  captureStepId: z.string().nullable().default(null),
  /** Global AI toggle (false = passthrough mode) */
  aiEnabled: z.boolean().default(true),
  /** AI image generation settings */
  imageGeneration: imageGenerationConfigSchema.default({
    prompt: '',
    refMedia: [],
    model: 'gemini-2.5-flash-image',
    aspectRatio: '1:1',
  }),
  /** Type-specific output options (null = not configured) */
  options: outcomeOptionsSchema.nullable().default(null),
})

/** Complete outcome configuration for experiences */
export type Outcome = z.infer<typeof outcomeSchema>

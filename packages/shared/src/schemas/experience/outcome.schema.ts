/**
 * Outcome Schema
 *
 * Per-type config architecture for outcome-based generation.
 * Each outcome type (photo, gif, video, ai.image, ai.video) has its own
 * nullable config object. Only the active type's config is populated.
 *
 * Uses z.looseObject() at the top level for backward compatibility —
 * old fields (aiEnabled, imageGeneration, etc.) are silently ignored during parsing.
 *
 * @see specs/072-outcome-schema-redesign
 */
import { z } from 'zod'
import {
  imageAspectRatioSchema,
  videoAspectRatioSchema,
} from '../media/aspect-ratio.schema'
import { mediaReferenceSchema } from '../media/media-reference.schema'

// ── OutcomeType ──────────────────────────────────────────────

/** Outcome type enum — determines the final output format. */
export const outcomeTypeSchema = z.enum([
  'photo',
  'gif',
  'video',
  'ai.image',
  'ai.video',
])

// ── AI Image Model ───────────────────────────────────────────

export const aiImageModelSchema = z.enum([
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
])

// ── AI Image Aspect Ratio (alias) ───────────────────────────

export const aiImageAspectRatioSchema = imageAspectRatioSchema

// ── Per-Type Config Schemas ──────────────────────────────────

/** Photo outcome config — passthrough capture with optional overlay. */
export const photoOutcomeConfigSchema = z.object({
  captureStepId: z.string(),
  aspectRatio: imageAspectRatioSchema.default('1:1'),
})

/** AI image task type — text-to-image or image-to-image. */
export const aiImageTaskSchema = z.enum(['text-to-image', 'image-to-image'])

/** AI image outcome config — AI-generated image from prompt and/or source. */
export const aiImageOutcomeConfigSchema = z.object({
  task: aiImageTaskSchema.default('text-to-image'),
  captureStepId: z.string().nullable().default(null),
  aspectRatio: imageAspectRatioSchema.default('1:1'),
  prompt: z.string().default(''),
  model: aiImageModelSchema.default('gemini-2.5-flash-image'),
  refMedia: z.array(mediaReferenceSchema).default([]),
})

/** GIF outcome config — placeholder for future implementation. */
export const gifOutcomeConfigSchema = z.object({
  captureStepId: z.string(),
  aspectRatio: imageAspectRatioSchema.default('1:1'),
})

/** Video outcome config — placeholder for future implementation. */
export const videoOutcomeConfigSchema = z.object({
  captureStepId: z.string(),
  aspectRatio: imageAspectRatioSchema.default('1:1'),
})

// ── AI Video (internal helpers) ──────────────────────────────

/** AI video task type. */
const aiVideoTaskSchema = z.enum(['animate', 'transform', 'reimagine'])

/**
 * Image generation config — used internally by AI video for
 * start/end frame generation. Not exported as a top-level concept.
 */
const imageGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  refMedia: z.array(mediaReferenceSchema).default([]),
  model: aiImageModelSchema.default('gemini-2.5-flash-image'),
  aspectRatio: aiImageAspectRatioSchema.default('1:1'),
})

/** AI video outcome config — placeholder for future implementation. */
export const aiVideoOutcomeConfigSchema = z.object({
  task: aiVideoTaskSchema.default('animate'),
  captureStepId: z.string(),
  aspectRatio: videoAspectRatioSchema.default('9:16'),
  startFrameImageGen: imageGenerationConfigSchema.nullable().default(null),
  endFrameImageGen: imageGenerationConfigSchema.nullable().default(null),
  videoGeneration: z.object({
    prompt: z.string().default(''),
    model: z.string().default(''),
    duration: z.number().min(1).max(60).default(5),
  }),
})

// ── Outcome (top-level) ──────────────────────────────────────

/**
 * Complete Outcome configuration.
 *
 * Uses z.looseObject() for backward compatibility — old fields
 * (aiEnabled, imageGeneration, captureStepId, options, etc.)
 * are silently ignored during parsing.
 *
 * Per-type configs persist independently — switching types does NOT
 * clear other configs. Setting type to null preserves all configs.
 */
export const outcomeSchema = z.looseObject({
  type: outcomeTypeSchema.nullable().default(null),
  photo: photoOutcomeConfigSchema.nullable().default(null),
  gif: gifOutcomeConfigSchema.nullable().default(null),
  video: videoOutcomeConfigSchema.nullable().default(null),
  aiImage: aiImageOutcomeConfigSchema.nullable().default(null),
  aiVideo: aiVideoOutcomeConfigSchema.nullable().default(null),
})

// ── Type Exports ─────────────────────────────────────────────

export type OutcomeType = z.infer<typeof outcomeTypeSchema>
export type AIImageModel = z.infer<typeof aiImageModelSchema>
export type AIImageAspectRatio = z.infer<typeof aiImageAspectRatioSchema>
export type PhotoOutcomeConfig = z.infer<typeof photoOutcomeConfigSchema>
export type AIImageTask = z.infer<typeof aiImageTaskSchema>
export type AIImageOutcomeConfig = z.infer<typeof aiImageOutcomeConfigSchema>
export type GifOutcomeConfig = z.infer<typeof gifOutcomeConfigSchema>
export type VideoOutcomeConfig = z.infer<typeof videoOutcomeConfigSchema>
export type AIVideoOutcomeConfig = z.infer<typeof aiVideoOutcomeConfigSchema>
export type Outcome = z.infer<typeof outcomeSchema>

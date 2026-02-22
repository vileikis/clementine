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

// ── AI Video Model ──────────────────────────────────────────

export const aiVideoModelSchema = z.enum([
  'veo-3.1-generate-001',
  'veo-3.1-fast-generate-001',
])

// ── Generation Config Schemas ────────────────────────────────

/**
 * Image generation config — shared by ai.image and ai.video outcomes.
 *
 * Contains the parameters passed to aiGenerateImage().
 * aspectRatio is nullable: null = inherit from parent outcome config.
 */
export const imageGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  model: aiImageModelSchema.default('gemini-2.5-flash-image'),
  refMedia: z.array(mediaReferenceSchema).default([]),
  aspectRatio: imageAspectRatioSchema.nullable().default(null),
})

/** Video duration — coerces any number to nearest valid value (4, 6, 8). */
const VALID_DURATIONS = [4, 6, 8] as const
export type VideoDuration = (typeof VALID_DURATIONS)[number]

export const videoDurationSchema = z
  .number()
  .transform((n): VideoDuration => {
    const clamped = Math.max(4, Math.min(8, n))
    return VALID_DURATIONS.reduce((prev, curr) =>
      Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev,
    ) as VideoDuration
  })
  .pipe(z.literal(4).or(z.literal(6)).or(z.literal(8)))

/**
 * Video generation config — used by ai.video outcome.
 *
 * Contains the parameters passed to the video generation service.
 * aspectRatio is nullable: null = inherit from parent outcome config.
 */
export const videoGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  model: aiVideoModelSchema.default('veo-3.1-fast-generate-001'),
  duration: videoDurationSchema.default(6),
  aspectRatio: videoAspectRatioSchema.nullable().default(null),
  refMedia: z.array(mediaReferenceSchema).default([]),
})

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
  imageGeneration: imageGenerationConfigSchema,
})

/** GIF outcome config — placeholder for future implementation. */
export const gifOutcomeConfigSchema = z.object({
  captureStepId: z.string(),
  aspectRatio: imageAspectRatioSchema.default('1:1'),
})

/** Video outcome config — placeholder for future implementation. */
export const videoOutcomeConfigSchema = z.object({
  captureStepId: z.string(),
  aspectRatio: videoAspectRatioSchema.default('9:16'),
})

// ── AI Video ─────────────────────────────────────────────────

/** Raw AI video task enum — accepts legacy 'animate' value for backward compatibility. */
const rawAiVideoTaskSchema = z.enum([
  'animate',
  'image-to-video',
  'ref-images-to-video',
  'transform',
  'reimagine',
])

/** AI video task type with lazy migration transform (animate → image-to-video). */
export const aiVideoTaskSchema = rawAiVideoTaskSchema.transform((v) =>
  v === 'animate' ? ('image-to-video' as const) : v,
)

/** AI video outcome config. */
export const aiVideoOutcomeConfigSchema = z.object({
  task: aiVideoTaskSchema.default('image-to-video'),
  captureStepId: z.string(),
  aspectRatio: videoAspectRatioSchema.default('9:16'),
  startFrameImageGen: imageGenerationConfigSchema.nullable().default(null),
  endFrameImageGen: imageGenerationConfigSchema.nullable().default(null),
  videoGeneration: videoGenerationConfigSchema,
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
export type ImageGenerationConfig = z.infer<typeof imageGenerationConfigSchema>
export type VideoGenerationConfig = z.infer<typeof videoGenerationConfigSchema>
export type PhotoOutcomeConfig = z.infer<typeof photoOutcomeConfigSchema>
export type AIImageTask = z.infer<typeof aiImageTaskSchema>
export type AIImageOutcomeConfig = z.infer<typeof aiImageOutcomeConfigSchema>
export type GifOutcomeConfig = z.infer<typeof gifOutcomeConfigSchema>
export type VideoOutcomeConfig = z.infer<typeof videoOutcomeConfigSchema>
export type AIVideoTask = z.infer<typeof aiVideoTaskSchema>
export type AIVideoModel = z.infer<typeof aiVideoModelSchema>
export type AIVideoOutcomeConfig = z.infer<typeof aiVideoOutcomeConfigSchema>
export type Outcome = z.infer<typeof outcomeSchema>

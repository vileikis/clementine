/**
 * AI Image Node Schema
 *
 * Configuration for AI image generation transform nodes.
 * Supports inline prompts with step and reference media placeholders.
 */
import { z } from 'zod'
import { mediaReferenceSchema } from '../../media/media-reference.schema'

/**
 * Node type constant for AI image generation
 */
export const AI_IMAGE_NODE_TYPE = 'ai.imageGeneration' as const

export const aiImageModelSchema = z.enum([
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
])

export const aiImageAspectRatioSchema = z.enum([
  '1:1',
  '3:2',
  '2:3',
  '9:16',
  '16:9',
])

/**
 * AI image node configuration schema
 */
export const aiImageNodeConfigSchema = z.object({
  /** AI model identifier */
  model: aiImageModelSchema,
  /** Output aspect ratio */
  aspectRatio: aiImageAspectRatioSchema,
  /** Prompt template with @{step:name} and @{ref:mediaAssetId} placeholders */
  prompt: z.string(), // Validation (min length) happens at publish time
  /** Reference media for prompt with display names (may be empty array) */
  refMedia: z.array(mediaReferenceSchema),
})

/**
 * Complete AI image node schema (id + type + config)
 */
export const aiImageNodeSchema = z.object({
  /** Unique node identifier */
  id: z.string(),
  /** Node type discriminator */
  type: z.literal(AI_IMAGE_NODE_TYPE),
  /** Node-specific configuration */
  config: aiImageNodeConfigSchema,
})

export type AIImageNodeConfig = z.infer<typeof aiImageNodeConfigSchema>
export type AIImageNode = z.infer<typeof aiImageNodeSchema>
export type AIImageModel = z.infer<typeof aiImageModelSchema>
export type AIImageAspectRatio = z.infer<typeof aiImageAspectRatioSchema>

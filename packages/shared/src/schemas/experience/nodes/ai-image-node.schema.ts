/**
 * AI Image Node Schema
 *
 * Configuration for AI image generation transform nodes.
 * Supports inline prompts with step and reference media placeholders.
 */
import { z } from 'zod'
import { mediaReferenceSchema } from '../../media/media-reference.schema'

export const aiImageModelSchema = z.enum([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3.0',
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
  prompt: z.string().min(1, 'Prompt is required'),
  /** Reference media for prompt with display names (may be empty array) */
  refMedia: z.array(mediaReferenceSchema),
})

export type AIImageNodeConfig = z.infer<typeof aiImageNodeConfigSchema>
export type AIImageModel = z.infer<typeof aiImageModelSchema>
export type AIImageAspectRatio = z.infer<typeof aiImageAspectRatioSchema>

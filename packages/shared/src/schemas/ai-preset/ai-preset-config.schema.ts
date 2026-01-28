/**
 * AI Preset Config Schema
 *
 * Nested configuration object containing all editable preset fields.
 * Used for both published (`published`) and draft (`draft`) states.
 *
 * This follows the same pattern as Experience entity with draft/published workflow.
 */
import { z } from 'zod'

import { presetMediaEntrySchema } from './preset-media.schema'
import { presetVariableSchema } from './preset-variable.schema'

/**
 * Supported AI models for image generation
 */
export const aiModelSchema = z.enum([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3.0',
])

/**
 * Supported aspect ratios for generated images
 */
export const aspectRatioSchema = z.enum([
  '1:1',
  '3:2',
  '2:3',
  '9:16',
  '16:9',
])

/**
 * AI Preset configuration schema
 *
 * Contains all editable fields that are part of the draft/publish workflow:
 * - model: AI model selection
 * - aspectRatio: Output image aspect ratio
 * - mediaRegistry: Registered media for @mentions
 * - variables: Variable definitions
 * - promptTemplate: Prompt with @references
 */
export const aiPresetConfigSchema = z.object({
  /** AI model for generation */
  model: aiModelSchema.default('gemini-2.5-flash'),

  /** Output aspect ratio */
  aspectRatio: aspectRatioSchema.default('1:1'),

  /** Media registry - images available for prompt references */
  mediaRegistry: z.array(presetMediaEntrySchema).default([]),

  /** Variable definitions */
  variables: z.array(presetVariableSchema).default([]),

  /** Prompt template with @variable and @media references */
  promptTemplate: z.string().default(''),
})

export type AIPresetConfig = z.infer<typeof aiPresetConfigSchema>
export type AIModel = z.infer<typeof aiModelSchema>
export type AspectRatio = z.infer<typeof aspectRatioSchema>

/**
 * AI Preset Editor Input Schemas
 *
 * Editor-specific validation schemas for mutations.
 *
 * Note: Most section-specific schemas are defined locally in their hooks:
 * - useUpdateModelSettings has updateModelSettingsSchema
 * - useUpdateMediaRegistry has updateMediaRegistrySchema
 * - useUpdateAIPreset has updateAIPresetSchema (name, description)
 *
 * This file contains shared schemas that may be used across multiple hooks.
 */
import { z } from 'zod'
import {
  aiModelSchema,
  aspectRatioSchema,
  presetMediaEntrySchema,
  presetVariableSchema,
} from '@clementine/shared'

/**
 * Update AI Preset Draft Input Schema
 *
 * Generic schema for updating any draft configuration field.
 * Used by useUpdateAIPresetDraft hook.
 */
export const updateAIPresetDraftInputSchema = z.object({
  /** AI model for generation */
  model: aiModelSchema.optional(),

  /** Output aspect ratio */
  aspectRatio: aspectRatioSchema.optional(),

  /** Media registry - images for @mentions */
  mediaRegistry: z.array(presetMediaEntrySchema).optional(),

  /** Variable definitions */
  variables: z.array(presetVariableSchema).optional(),

  /** Prompt template with @references */
  promptTemplate: z.string().optional(),
})

export type UpdateAIPresetDraftInput = z.infer<
  typeof updateAIPresetDraftInputSchema
>

/**
 * Publish AI Preset Input Schema
 *
 * For publishing draft changes to the live configuration.
 */
export const publishAIPresetInputSchema = z.object({
  /** Preset ID to publish */
  presetId: z.string().min(1),
})

export type PublishAIPresetInput = z.infer<typeof publishAIPresetInputSchema>

/**
 * Create Variable Input Schema
 *
 * For creating a new variable (text or image type).
 * Variable name must be unique within the preset.
 */
export const createVariableInputSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    name: z
      .string()
      .min(1, 'Name is required')
      .regex(
        /^[a-zA-Z_][a-zA-Z0-9_]*$/,
        'Name must start with a letter or underscore and contain only alphanumeric characters and underscores',
      ),
    defaultValue: z.string().nullable().default(null),
    valueMap: z
      .array(
        z.object({
          value: z.string().min(1, 'Value is required'),
          text: z.string(),
        }),
      )
      .nullable()
      .default(null),
  }),
  z.object({
    type: z.literal('image'),
    name: z
      .string()
      .min(1, 'Name is required')
      .regex(
        /^[a-zA-Z_][a-zA-Z0-9_]*$/,
        'Name must start with a letter or underscore and contain only alphanumeric characters and underscores',
      ),
  }),
])

export type CreateVariableInput = z.infer<typeof createVariableInputSchema>

/**
 * Update Variable Input Schema
 *
 * For updating an existing variable.
 * Requires the original name to identify the variable to update.
 */
export const updateVariableInputSchema = z.object({
  /** Original name to identify the variable */
  originalName: z.string(),
  /** Updated variable data */
  variable: createVariableInputSchema,
})

export type UpdateVariableInput = z.infer<typeof updateVariableInputSchema>

/**
 * Add Value Mapping Input Schema
 *
 * For adding a new value mapping entry to a text variable.
 * Maps an input value to prompt text (can include @media references).
 */
export const addValueMappingInputSchema = z.object({
  /** The input value to match */
  value: z.string().min(1, 'Value is required'),
  /** Text to substitute in prompt (can include @media references) */
  text: z.string(),
})

export type AddValueMappingInput = z.infer<typeof addValueMappingInputSchema>

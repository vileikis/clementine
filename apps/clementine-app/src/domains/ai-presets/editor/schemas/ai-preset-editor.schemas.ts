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

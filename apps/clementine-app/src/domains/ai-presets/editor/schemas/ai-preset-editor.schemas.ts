/**
 * AI Preset Editor Input Schemas
 *
 * Editor-specific validation schemas for partial updates and mutations.
 * These extend the shared schemas with editor-specific requirements.
 *
 * Draft/Published Model (Phase 5.5):
 * - Draft config fields (model, aspectRatio, etc.) are written to preset.draft
 * - Top-level fields (name, description) remain at preset root
 * - draftVersion is incremented on each save
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
 * For updating draft configuration fields.
 * These fields are written to preset.draft.* and increment draftVersion.
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
 * Update AI Preset Input Schema
 *
 * For partial updates via the editor - all fields optional.
 * At least one field must be provided for a valid update.
 *
 * - Top-level fields (name, description) are written directly to preset
 * - Draft config fields are written to preset.draft.* and increment draftVersion
 */
export const updateAIPresetInputSchema = z
  .object({
    /** Preset display name (1-100 chars) - written to preset.name */
    name: z.string().min(1).max(100).optional(),

    /** Optional description (max 500 chars) - written to preset.description */
    description: z.string().max(500).nullable().optional(),

    /** Draft configuration updates - written to preset.draft.* */
    draft: updateAIPresetDraftInputSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export type UpdateAIPresetInput = z.infer<typeof updateAIPresetInputSchema>

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

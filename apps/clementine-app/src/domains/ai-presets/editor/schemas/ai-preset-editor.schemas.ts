/**
 * AI Preset Editor Input Schemas
 *
 * Editor-specific validation schemas for partial updates and mutations.
 * These extend the shared schemas with editor-specific requirements.
 */
import { z } from 'zod'
import {
  aiModelSchema,
  aspectRatioSchema,
  presetMediaEntrySchema,
  presetVariableSchema,
} from '@clementine/shared'

/**
 * Update AI Preset Input Schema
 *
 * For partial updates via the editor - all fields optional.
 * At least one field must be provided for a valid update.
 */
export const updateAIPresetInputSchema = z
  .object({
    /** Preset display name (1-100 chars) */
    name: z.string().min(1).max(100).optional(),

    /** Optional description (max 500 chars) */
    description: z.string().max(500).nullable().optional(),

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
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export type UpdateAIPresetInput = z.infer<typeof updateAIPresetInputSchema>

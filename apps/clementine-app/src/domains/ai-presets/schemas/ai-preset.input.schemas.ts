/**
 * AI Preset Input Schemas
 *
 * Zod schemas for mutation inputs (create, rename, delete, duplicate).
 * These are app-specific schemas, not shared with backend.
 */
import { z } from 'zod'

/**
 * Create AI Preset input schema
 * Most fields optional - uses defaults
 */
export const createAIPresetInputSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
  })
  .default({ name: 'Untitled preset' })

/**
 * Rename AI Preset input schema
 */
export const renameAIPresetInputSchema = z.object({
  presetId: z.string().min(1, 'Preset ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
})

/**
 * Delete AI Preset input schema
 */
export const deleteAIPresetInputSchema = z.object({
  presetId: z.string().min(1, 'Preset ID is required'),
})

/**
 * Duplicate AI Preset input schema
 */
export const duplicateAIPresetInputSchema = z.object({
  presetId: z.string().min(1, 'Preset ID is required'),
  /** If not provided, uses "Copy of {original}" */
  newName: z.string().min(1).max(100).optional(),
})

/**
 * Type exports
 */
export type CreateAIPresetInput = z.infer<typeof createAIPresetInputSchema>
export type RenameAIPresetInput = z.infer<typeof renameAIPresetInputSchema>
export type DeleteAIPresetInput = z.infer<typeof deleteAIPresetInputSchema>
export type DuplicateAIPresetInput = z.infer<
  typeof duplicateAIPresetInputSchema
>

/**
 * Preset Media Entry Schema
 *
 * Media registry entry - extends shared MediaReference with a reference name.
 * Used for images that can be included in prompts via @name syntax.
 */
import { z } from 'zod'

import { mediaReferenceSchema } from '../media'

/**
 * Preset media entry schema
 *
 * Extends mediaReferenceSchema (mediaAssetId, url, filePath) with:
 * - name: Reference name used in prompt templates (e.g., @cat, @hobbiton)
 *
 * @example
 * ```typescript
 * const mediaEntry: PresetMediaEntry = {
 *   mediaAssetId: 'asset_123',
 *   url: 'https://storage.example.com/image.png',
 *   filePath: 'workspaces/ws_123/media/style-ref.png',
 *   name: 'style_ref',
 * }
 * ```
 */
export const presetMediaEntrySchema = mediaReferenceSchema.extend({
  /** Reference name used in prompt (e.g., "cat", "hobbiton") - alphanumeric + underscore, must start with letter or underscore */
  name: z
    .string()
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Reference name must start with a letter or underscore and contain only alphanumeric characters and underscores',
    ),
})

export type PresetMediaEntry = z.infer<typeof presetMediaEntrySchema>

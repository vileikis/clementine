/**
 * Reference Media Entry Schema
 *
 * Extends MediaReference with displayName for AI node reference media.
 * Used in AI image generation nodes for prompt editor autocomplete.
 */
import { z } from 'zod'
import { mediaReferenceSchema } from '../../media/media-reference.schema'

/**
 * Reference media entry schema
 * Extends MediaReference with human-readable display name
 */
export const refMediaEntrySchema = mediaReferenceSchema.extend({
  /** Human-readable name for prompt editor autocomplete */
  displayName: z.string().min(1, 'Display name is required').max(50),
})

export type RefMediaEntry = z.infer<typeof refMediaEntrySchema>

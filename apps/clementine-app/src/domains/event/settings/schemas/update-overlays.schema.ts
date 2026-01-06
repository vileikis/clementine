/**
 * Update Overlays Schema
 *
 * Schema for partial overlay updates in the settings domain.
 * Supports updating individual aspect ratios without affecting others.
 */
import { z } from 'zod'
import { overlayReferenceSchema } from '@/domains/event/shared'

/**
 * Update Overlays Config Schema
 *
 * For partial overlay updates (used in mutations).
 * Unlike overlaysConfigSchema, this doesn't set defaults for missing fields,
 * allowing partial updates without overwriting existing overlays.
 *
 * @example
 * ```typescript
 * // Update only 1:1 overlay (doesn't affect 9:16)
 * { '1:1': { mediaAssetId: 'abc', url: 'https://...' } }
 *
 * // Update only 9:16 overlay (doesn't affect 1:1)
 * { '9:16': { mediaAssetId: 'xyz', url: 'https://...' } }
 *
 * // Remove an overlay
 * { '1:1': null }
 * ```
 */
export const updateOverlaysConfigSchema = z.looseObject({
  '1:1': overlayReferenceSchema.optional(),
  '9:16': overlayReferenceSchema.optional(),
})

/**
 * TypeScript type for overlay updates
 */
export type UpdateOverlaysConfig = z.infer<typeof updateOverlaysConfigSchema>

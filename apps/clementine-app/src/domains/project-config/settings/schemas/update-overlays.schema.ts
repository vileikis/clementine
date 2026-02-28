/**
 * Update Overlays Schema
 *
 * Schema for partial overlay updates in the settings domain.
 * Supports updating individual aspect ratios without affecting others.
 */
import { z } from 'zod'
import { overlayReferenceSchema } from '@/domains/project-config/shared'

/**
 * Update Overlays Config Schema
 *
 * For partial overlay updates (used in mutations).
 * Unlike overlaysConfigSchema, this doesn't set defaults for missing fields,
 * allowing partial updates without overwriting existing overlays.
 *
 * Supports all 6 overlay keys:
 * - 1:1     - Square
 * - 3:2     - Landscape
 * - 2:3     - Portrait
 * - 9:16    - Vertical/stories
 * - 16:9    - Landscape video
 * - default - Fallback overlay when no exact match exists
 *
 * @example
 * ```typescript
 * // Update only 1:1 overlay (doesn't affect others)
 * { '1:1': { mediaAssetId: 'abc', url: 'https://...' } }
 *
 * // Update default overlay
 * { 'default': { mediaAssetId: 'xyz', url: 'https://...' } }
 *
 * // Remove an overlay
 * { '1:1': null }
 * ```
 */
export const updateOverlaysConfigSchema = z.looseObject({
  '1:1': overlayReferenceSchema.optional(),
  '3:2': overlayReferenceSchema.optional(),
  '2:3': overlayReferenceSchema.optional(),
  '9:16': overlayReferenceSchema.optional(),
  '16:9': overlayReferenceSchema.optional(),
  default: overlayReferenceSchema.optional(),
})

/**
 * TypeScript type for overlay updates
 */
export type UpdateOverlaysConfig = z.infer<typeof updateOverlaysConfigSchema>

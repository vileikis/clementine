/**
 * Update Sharing Schema
 *
 * Schema for partial sharing config updates in the settings domain.
 * Supports updating individual sharing options without affecting others.
 */
import { z } from 'zod'

/**
 * Update Sharing Config Schema
 *
 * For partial sharing updates (used in mutations).
 * Allows updating individual sharing options without providing all fields.
 *
 * @example
 * ```typescript
 * // Update only download option
 * { download: false }
 *
 * // Update multiple options atomically
 * { instagram: true, facebook: true, download: false }
 * ```
 */
export const updateSharingConfigSchema = z.looseObject({
  download: z.boolean().optional(),
  copyLink: z.boolean().optional(),
  email: z.boolean().optional(),
  instagram: z.boolean().optional(),
  facebook: z.boolean().optional(),
  linkedin: z.boolean().optional(),
  twitter: z.boolean().optional(),
  tiktok: z.boolean().optional(),
  telegram: z.boolean().optional(),
})

/**
 * TypeScript type for sharing updates
 */
export type UpdateSharingConfig = z.infer<typeof updateSharingConfigSchema>

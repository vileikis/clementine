/**
 * Media Asset Type Schema
 *
 * Asset categorization for media library organization.
 */
import { z } from 'zod'

export const mediaAssetTypeSchema = z.enum(['overlay', 'logo', 'other'])

export type MediaAssetType = z.infer<typeof mediaAssetTypeSchema>

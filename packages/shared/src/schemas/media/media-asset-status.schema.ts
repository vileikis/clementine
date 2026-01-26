/**
 * Media Asset Status Schema
 *
 * Lifecycle status for soft delete support.
 */
import { z } from 'zod'

export const mediaAssetStatusSchema = z.enum(['active', 'deleted'])

export type MediaAssetStatus = z.infer<typeof mediaAssetStatusSchema>

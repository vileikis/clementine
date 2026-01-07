/**
 * MediaReference Schema
 *
 * Reusable schema for referencing MediaAsset documents.
 * Stores both the document ID (for tracking/management) and the URL (for fast rendering).
 *
 * @usage
 * - theme.background.image
 * - overlaysConfig['1:1'] and overlaysConfig['9:16']
 * - welcomeConfig.media (future)
 */
import { z } from 'zod'

/**
 * MediaReference schema for media asset references.
 *
 * @field mediaAssetId - MediaAsset document ID from workspaces/{workspaceId}/mediaAssets/{id}
 *                       Empty string indicates legacy data migrated from URL-only format.
 * @field url - Firebase Storage download URL for fast rendering
 */
export const mediaReferenceSchema = z.object({
  mediaAssetId: z.string(),
  url: z.string().url(),
})

export type MediaReference = z.infer<typeof mediaReferenceSchema>

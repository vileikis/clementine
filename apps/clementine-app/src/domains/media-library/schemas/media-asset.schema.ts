import { z } from 'zod'

/**
 * Media Asset Schema
 *
 * Stored in: workspaces/{workspaceId}/mediaAssets/{assetId}
 * Storage path: workspaces/{workspaceId}/media/{fileName}
 *
 * Reusable across all workspace features (events, projects, etc.)
 */
export const mediaAssetSchema = z.object({
  /**
   * Document ID (Firestore auto-generated)
   */
  id: z.string(),

  /**
   * Generated unique file name
   * Format: overlay-{nanoid()}.{ext}
   * Example: overlay-V1StGXR8_Z5jdHi6B-myT.png
   */
  fileName: z.string(),

  /**
   * Full Storage path
   * Format: workspaces/{workspaceId}/media/{fileName}
   * Example: workspaces/ws-abc123/media/overlay-xyz789.png
   */
  filePath: z.string(),

  /**
   * Firebase Storage download URL
   * Full public URL for direct image rendering
   * Example: https://firebasestorage.googleapis.com/v0/b/.../overlay-abc123.png?token=...
   */
  url: z.string().url(),

  /**
   * File size in bytes
   * Max: 5MB (5,242,880 bytes)
   */
  fileSize: z.number().int().positive(),

  /**
   * MIME type
   * Allowed: image/png, image/jpeg, image/jpg, image/webp
   */
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']),

  /**
   * Image width in pixels
   * Extracted client-side before upload
   */
  width: z.number().int().positive(),

  /**
   * Image height in pixels
   * Extracted client-side before upload
   */
  height: z.number().int().positive(),

  /**
   * Upload timestamp (milliseconds since epoch)
   * Example: Date.now()
   */
  uploadedAt: z.number().int().positive(),

  /**
   * User ID who uploaded the asset
   * Reference: users/{userId}
   */
  uploadedBy: z.string(),

  /**
   * Asset type for categorization
   * - overlay: Overlay image for events
   * - logo: Workspace or event logo
   * - other: Miscellaneous media
   */
  type: z.enum(['overlay', 'logo', 'other']),

  /**
   * Soft delete status
   * - active: Asset is available
   * - deleted: Asset is soft-deleted (future cleanup job will remove)
   */
  status: z.enum(['active', 'deleted']).default('active'),
})

export type MediaAsset = z.infer<typeof mediaAssetSchema>

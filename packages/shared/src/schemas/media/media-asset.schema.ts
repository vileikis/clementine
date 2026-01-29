/**
 * Media Asset Schema
 *
 * Complete media file document stored in Firestore.
 * Firestore Path: workspaces/{workspaceId}/mediaAssets/{id}
 * Storage Path: workspaces/{workspaceId}/media/{fileName}
 */
import { z } from 'zod'

import { imageMimeTypeSchema } from './image-mime-type.schema'
import { mediaAssetStatusSchema } from './media-asset-status.schema'
import { mediaAssetTypeSchema } from './media-asset-type.schema'

export const mediaAssetSchema = z.looseObject({
  id: z.string(),
  fileName: z.string(),
  displayName: z.string().default('Untitled'),
  filePath: z.string(),
  url: z.url(),
  fileSize: z.number().int().positive(),
  mimeType: imageMimeTypeSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  uploadedAt: z.number().int().positive(),
  uploadedBy: z.string(),
  type: mediaAssetTypeSchema,
  status: mediaAssetStatusSchema.default('active'),
})

export type MediaAsset = z.infer<typeof mediaAssetSchema>

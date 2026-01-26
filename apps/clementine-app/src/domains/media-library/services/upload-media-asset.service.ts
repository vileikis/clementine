/**
 * Upload Media Asset Service
 *
 * Pure function for uploading media assets to Firebase Storage.
 * Can be called directly without React/Query context.
 *
 * The service:
 * 1. Validates the file
 * 2. Extracts image dimensions
 * 3. Uploads to Firebase Storage
 * 4. Creates a MediaAsset document in Firestore
 * 5. Returns the asset ID, URL, and filePath
 */
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'

import {
  generateFileName,
  getImageDimensions,
  validateFile,
} from '../utils/upload.utils'
import type {
  ImageMimeType,
  MediaAsset,
  MediaAssetType,
} from '@clementine/shared'

import { firestore, storage } from '@/integrations/firebase/client'

/**
 * Parameters for uploading a media asset
 */
export interface UploadMediaAssetParams {
  /** File to upload */
  file: File
  /** Asset type for categorization */
  type: MediaAssetType
  /** Workspace ID for storage path */
  workspaceId: string
  /** User ID for upload attribution */
  userId: string
  /** Optional progress callback (0-100) */
  onProgress?: (progress: number) => void
}

/**
 * Result of uploading a media asset
 */
export interface UploadMediaAssetResult {
  /** Media asset document ID */
  mediaAssetId: string
  /** Firebase Storage download URL */
  url: string
  /** Storage path for server-side access */
  filePath: string
}

/**
 * Upload a media asset to Firebase Storage
 *
 * This is a pure function that can be used directly without React context.
 * For use in React components, prefer the useUploadMediaAsset hook.
 *
 * @param params - Upload parameters
 * @returns Upload result with asset ID, URL, and filePath
 * @throws Error if file validation fails or upload fails
 *
 * @example
 * ```typescript
 * const result = await uploadMediaAsset({
 *   file: selectedFile,
 *   type: 'overlay',
 *   workspaceId: 'ws-123',
 *   userId: 'user-456',
 *   onProgress: (progress) => console.log(`${progress}%`),
 * })
 *
 * console.log(result.filePath) // 'workspaces/ws-123/media/overlay-xyz.png'
 * ```
 */
export async function uploadMediaAsset({
  file,
  type,
  workspaceId,
  userId,
  onProgress,
}: UploadMediaAssetParams): Promise<UploadMediaAssetResult> {
  // 1. Validate file
  validateFile(file)

  // 2. Extract image dimensions
  const { width, height } = await getImageDimensions(file)

  // 3. Generate unique file name and storage path
  const fileName = generateFileName(file)
  const filePath = `workspaces/${workspaceId}/media/${fileName}`

  // 4. Upload to Firebase Storage with progress tracking
  const storageRef = ref(storage, filePath)
  const uploadTask = uploadBytesResumable(storageRef, file)

  // Wait for upload to complete with progress tracking
  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Progress callback
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(progress)
      },
      (error) => {
        // Error callback
        reject(error)
      },
      () => {
        // Complete callback
        resolve()
      },
    )
  })

  // 5. Get download URL
  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

  // 6. Create Firestore document
  const mediaAssetsRef = collection(
    firestore,
    `workspaces/${workspaceId}/mediaAssets`,
  )

  const docRef = await addDoc(mediaAssetsRef, {
    fileName,
    filePath,
    url: downloadURL,
    fileSize: file.size,
    mimeType: file.type as ImageMimeType,
    width,
    height,
    uploadedAt: serverTimestamp(),
    uploadedBy: userId,
    type,
    status: 'active',
  } satisfies Omit<MediaAsset, 'id'>)

  // 7. Return media asset ID, URL, and filePath
  return {
    mediaAssetId: docRef.id,
    url: downloadURL,
    filePath,
  }
}

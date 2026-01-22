import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addDoc, collection } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import {
  generateFileName,
  getImageDimensions,
  validateFile,
} from '../utils/upload.utils'
import type { MediaAsset } from '../schemas/media-asset.schema'
import { firestore, storage } from '@/integrations/firebase/client'

// Upload media asset parameters
interface UploadMediaAssetParams {
  file: File
  type: 'overlay' | 'logo' | 'other'
  workspaceId: string
  userId: string
  onProgress?: (progress: number) => void
}

// Upload media asset return type
interface UploadMediaAssetResult {
  mediaAssetId: string
  url: string
}

// Upload media asset mutation function
async function uploadMediaAsset({
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

  // 3. Generate unique file name
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
    mimeType: file.type as
      | 'image/png'
      | 'image/jpeg'
      | 'image/jpg'
      | 'image/webp',
    width,
    height,
    uploadedAt: Date.now(),
    uploadedBy: userId,
    type,
    status: 'active',
  } satisfies Omit<MediaAsset, 'id'>)

  // 7. Return media asset ID and URL
  return {
    mediaAssetId: docRef.id,
    url: downloadURL,
  }
}

// Hook: Upload media asset
// Accepts undefined params - mutation will throw if called without valid IDs
export function useUploadMediaAsset(
  workspaceId: string | undefined,
  userId: string | undefined,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      file: File
      type: 'overlay' | 'logo' | 'other'
      onProgress?: (progress: number) => void
    }) => {
      // Guard against missing params
      if (!workspaceId || !userId) {
        throw new Error('Cannot upload media: missing workspaceId or userId')
      }

      return uploadMediaAsset({
        ...params,
        workspaceId,
        userId,
      })
    },
    onSuccess: () => {
      // Invalidate queries to trigger re-fetch
      // Safe to use ! here - mutationFn throws if workspaceId is undefined
      queryClient.invalidateQueries({
        queryKey: ['mediaAssets', workspaceId!],
      })
    },
  })
}

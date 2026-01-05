import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addDoc, collection } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { nanoid } from 'nanoid'
import type { MediaAsset } from '../schemas/media-asset.schema'
import { firestore, storage } from '@/integrations/firebase/client'

// File validation constants
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// Helper: Validate file type and size
function validateFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only PNG, JPG, and WebP images are supported')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File must be under 5MB')
  }
}

// Helper: Extract image dimensions
async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

// Helper: Generate unique file name
function generateFileName(originalFile: File): string {
  const ext = originalFile.name.split('.').pop() || 'png'
  return `overlay-${nanoid()}.${ext}`
}

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
export function useUploadMediaAsset(workspaceId: string, userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      file: File
      type: 'overlay' | 'logo' | 'other'
      onProgress?: (progress: number) => void
    }) =>
      uploadMediaAsset({
        ...params,
        workspaceId,
        userId,
      }),
    onSuccess: () => {
      // Invalidate queries to trigger re-fetch
      queryClient.invalidateQueries({
        queryKey: ['mediaAssets', workspaceId],
      })
    },
  })
}

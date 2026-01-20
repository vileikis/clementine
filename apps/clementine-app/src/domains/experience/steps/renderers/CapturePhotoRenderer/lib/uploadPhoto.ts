/**
 * Upload Photo Utility
 *
 * Handles uploading captured photos to Firebase Storage.
 */

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { nanoid } from 'nanoid'
import type { CapturedPhoto } from '@/shared/camera'
import { storage } from '@/integrations/firebase/client'

interface UploadPhotoParams {
  photo: CapturedPhoto
  projectId: string
  sessionId: string
  stepId: string
}

interface UploadPhotoResult {
  assetId: string
  url: string
}

/**
 * Upload captured photo to Firebase Storage
 */
export async function uploadPhoto({
  photo,
  projectId,
  sessionId,
  stepId,
}: UploadPhotoParams): Promise<UploadPhotoResult> {
  const assetId = nanoid()
  const path = `projects/${projectId}/sessions/${sessionId}/inputs/${assetId}.jpg`

  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, photo.file, {
    contentType: 'image/jpeg',
    customMetadata: {
      stepId,
      sessionId,
      captureMethod: photo.method,
      capturedAt: new Date().toISOString(),
    },
  })

  const url = await getDownloadURL(storageRef)
  return { assetId, url }
}

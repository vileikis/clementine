/**
 * useUploadExperienceCover Hook
 *
 * Uploads experience cover images to Firebase Storage.
 * Returns upload function, loading state, and progress.
 *
 * Note: This only uploads to Storage for preview purposes.
 * The actual experience.media update happens when the dialog's Save button is clicked.
 */
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useUploadMediaAsset } from '@/domains/media-library'

interface UploadResult {
  mediaAssetId: string
  url: string
}

export function useUploadExperienceCover(
  workspaceId: string | undefined,
  userId: string | undefined,
) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | undefined>()

  const uploadAsset = useUploadMediaAsset(workspaceId, userId)

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      if (!workspaceId || !userId) {
        toast.error('Cannot upload: missing context')
        return null
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        const result = await uploadAsset.mutateAsync({
          file,
          type: 'other',
          onProgress: setUploadProgress,
        })

        return { mediaAssetId: result.mediaAssetId, url: result.url }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Upload failed')
        return null
      } finally {
        setIsUploading(false)
        setUploadProgress(undefined)
      }
    },
    [workspaceId, userId, uploadAsset.mutateAsync],
  )

  return {
    upload,
    isUploading,
    uploadProgress,
  }
}

/**
 * useUploadPromptMedia Hook
 *
 * Uploads prompt media images to Firebase Storage.
 * Adapts useUploadExperienceCover pattern for prompt media.
 * Returns upload function, loading state, and progress.
 */
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { MediaReference } from '@clementine/shared'

import { useUploadMediaAsset } from '@/domains/media-library'

export function useUploadPromptMedia(
  workspaceId: string | undefined,
  userId: string | undefined,
) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | undefined>()

  const uploadAsset = useUploadMediaAsset(workspaceId, userId)

  const upload = useCallback(
    async (file: File): Promise<MediaReference | null> => {
      if (!workspaceId || !userId) {
        toast.error('Cannot upload: missing context')
        return null
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        return await uploadAsset.mutateAsync({
          file,
          type: 'other', // Prompt media stored as 'other' type
          onProgress: setUploadProgress,
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Upload failed')
        return null
      } finally {
        setIsUploading(false)
        setUploadProgress(undefined)
      }
    },
    [workspaceId, userId, uploadAsset],
  )

  return {
    upload,
    isUploading,
    uploadProgress,
  }
}

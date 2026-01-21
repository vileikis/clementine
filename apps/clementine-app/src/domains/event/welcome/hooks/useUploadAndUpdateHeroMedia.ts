/**
 * Hook: useUploadAndUpdateHeroMedia
 *
 * Uploads a hero media image to Storage and returns the URL.
 * The caller is responsible for updating form state and triggering save.
 *
 * @param workspaceId - Workspace ID for media storage
 * @param userId - User ID for upload attribution
 * @returns TanStack Query mutation for upload operation
 *
 * @example
 * ```tsx
 * const uploadHeroMedia = useUploadAndUpdateHeroMedia(workspaceId, userId)
 *
 * const { mediaAssetId, url } = await uploadHeroMedia.mutateAsync({
 *   file,
 *   onProgress: (progress) => console.log(`${progress}%`)
 * })
 *
 * // Caller updates form state
 * form.setValue('media', { mediaAssetId, url })
 * triggerSave()
 * ```
 */
import { useMutation } from '@tanstack/react-query'
import { useTrackedMutation } from '@/domains/event/designer'
import { useUploadMediaAsset } from '@/domains/media-library'

interface UploadHeroMediaParams {
  /** File to upload */
  file: File
  /** Optional progress callback (0-100) */
  onProgress?: (progress: number) => void
}

interface UploadHeroMediaResult {
  /** Media asset ID */
  mediaAssetId: string
  /** Media asset URL */
  url: string
}

/**
 * Upload hero media image to Storage.
 *
 * Returns the URL for the caller to update form state.
 * Auto-save handles persisting the welcome update to Firestore.
 *
 * Accepts undefined params - mutation will throw if called without valid IDs
 */
export function useUploadAndUpdateHeroMedia(
  workspaceId: string | undefined,
  userId: string | undefined,
) {
  const uploadAsset = useUploadMediaAsset(workspaceId, userId)

  const mutation = useMutation<
    UploadHeroMediaResult,
    Error,
    UploadHeroMediaParams
  >({
    mutationFn: async ({ file, onProgress }) => {
      // Guard against missing params
      if (!workspaceId || !userId) {
        throw new Error(
          'Cannot upload hero media: missing workspaceId or userId',
        )
      }
      // Upload to Storage + create MediaAsset document
      const { mediaAssetId, url } = await uploadAsset.mutateAsync({
        file,
        type: 'other', // Use 'other' for hero images
        onProgress,
      })

      return { mediaAssetId, url }
    },
  })

  // Wrap with tracking for save indicator
  return useTrackedMutation(mutation)
}

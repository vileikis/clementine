/**
 * Hook: useUploadAndUpdateBackground
 *
 * Uploads a background image to Storage and returns the URL.
 * The caller is responsible for updating form state and triggering save.
 *
 * @param workspaceId - Workspace ID for media storage
 * @param userId - User ID for upload attribution
 * @returns TanStack Query mutation for upload operation
 *
 * @example
 * ```tsx
 * const uploadBackground = useUploadAndUpdateBackground(workspaceId, userId)
 *
 * const { url } = await uploadBackground.mutateAsync({
 *   file,
 *   onProgress: (progress) => console.log(`${progress}%`)
 * })
 *
 * // Caller updates form state
 * form.setValue('background.image', url)
 * triggerSave()
 * ```
 */
import { useMutation } from '@tanstack/react-query'
import { useTrackedMutation } from '@/domains/event/designer'
import { useUploadMediaAsset } from '@/domains/media-library'

interface UploadBackgroundParams {
  /** File to upload */
  file: File
  /** Optional progress callback (0-100) */
  onProgress?: (progress: number) => void
}

interface UploadBackgroundResult {
  /** Media asset ID */
  mediaAssetId: string
  /** Media asset URL */
  url: string
  /** Storage path for server-side access */
  filePath: string
}

/**
 * Upload background image to Storage.
 *
 * Returns the URL for the caller to update form state.
 * Auto-save handles persisting the theme update to Firestore.
 */
export function useUploadAndUpdateBackground(
  workspaceId: string,
  userId: string,
) {
  const uploadAsset = useUploadMediaAsset(workspaceId, userId)

  const mutation = useMutation<
    UploadBackgroundResult,
    Error,
    UploadBackgroundParams
  >({
    mutationFn: async ({ file, onProgress }) => {
      // Upload to Storage + create MediaAsset document
      const { mediaAssetId, url, filePath } = await uploadAsset.mutateAsync({
        file,
        type: 'other', // Use 'other' for background images
        onProgress,
      })

      return { mediaAssetId, url, filePath }
    },
  })

  // Wrap with tracking for save indicator
  return useTrackedMutation(mutation)
}

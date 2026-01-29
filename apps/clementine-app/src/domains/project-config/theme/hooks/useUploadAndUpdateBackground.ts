/**
 * Hook: useUploadAndUpdateBackground
 *
 * Uploads a background image to Storage and returns a MediaReference.
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
 * const mediaRef = await uploadBackground.mutateAsync({
 *   file,
 *   onProgress: (progress) => console.log(`${progress}%`)
 * })
 *
 * // Caller updates form state with MediaReference
 * form.setValue('background.image', mediaRef)
 * triggerSave()
 * ```
 */
import { useMutation } from '@tanstack/react-query'
import type { MediaReference } from '@clementine/shared'
import { useTrackedMutation } from '@/domains/project-config/designer'
import { useUploadMediaAsset } from '@/domains/media-library'

interface UploadBackgroundParams {
  /** File to upload */
  file: File
  /** Optional progress callback (0-100) */
  onProgress?: (progress: number) => void
}

/**
 * Upload background image to Storage.
 *
 * Returns a MediaReference for the caller to update form state.
 * Auto-save handles persisting the theme update to Firestore.
 */
export function useUploadAndUpdateBackground(
  workspaceId: string,
  userId: string,
) {
  const uploadAsset = useUploadMediaAsset(workspaceId, userId)

  const mutation = useMutation<MediaReference, Error, UploadBackgroundParams>({
    mutationFn: async ({ file, onProgress }) => {
      // Upload to Storage + create MediaAsset document
      return await uploadAsset.mutateAsync({
        file,
        type: 'other', // Use 'other' for background images
        onProgress,
      })
    },
  })

  // Wrap with tracking for save indicator
  return useTrackedMutation(mutation)
}

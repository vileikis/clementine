/**
 * Hook: useUploadAndUpdateHeroMedia
 *
 * Uploads a hero media image to Storage and returns a MediaReference.
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
 * const mediaRef = await uploadHeroMedia.mutateAsync({
 *   file,
 *   onProgress: (progress) => console.log(`${progress}%`)
 * })
 *
 * // Caller updates form state with MediaReference
 * form.setValue('media', mediaRef)
 * triggerSave()
 * ```
 */
import { useMutation } from '@tanstack/react-query'
import type { MediaReference } from '@clementine/shared'
import { useTrackedMutation } from '@/domains/project-config/designer'
import { useUploadMediaAsset } from '@/domains/media-library'

interface UploadHeroMediaParams {
  /** File to upload */
  file: File
  /** Optional progress callback (0-100) */
  onProgress?: (progress: number) => void
}

/**
 * Upload hero media image to Storage.
 *
 * Returns a MediaReference for the caller to update form state.
 * Auto-save handles persisting the welcome update to Firestore.
 *
 * Accepts undefined params - mutation will throw if called without valid IDs
 */
export function useUploadAndUpdateHeroMedia(
  workspaceId: string | undefined,
  userId: string | undefined,
) {
  const uploadAsset = useUploadMediaAsset(workspaceId, userId)

  const mutation = useMutation<MediaReference, Error, UploadHeroMediaParams>({
    mutationFn: async ({ file, onProgress }) => {
      // Guard against missing params
      if (!workspaceId || !userId) {
        throw new Error(
          'Cannot upload hero media: missing workspaceId or userId',
        )
      }
      // Upload to Storage + create MediaAsset document
      return await uploadAsset.mutateAsync({
        file,
        type: 'other', // Use 'other' for hero images
        onProgress,
      })
    },
  })

  // Wrap with tracking for save indicator
  return useTrackedMutation(mutation)
}

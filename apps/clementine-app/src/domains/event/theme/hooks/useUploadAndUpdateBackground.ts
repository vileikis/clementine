/**
 * Composition Hook: useUploadAndUpdateBackground
 *
 * Combines two operations into a single tracked mutation:
 * 1. Upload background image to Storage (via useUploadMediaAsset)
 * 2. Update event theme config (via useUpdateTheme)
 *
 * This ensures the save indicator tracks the ENTIRE operation
 * (upload + config update) instead of just the config update.
 *
 * @param projectId - Project ID
 * @param eventId - Event ID
 * @param workspaceId - Workspace ID for media storage
 * @param userId - User ID for upload attribution
 * @returns TanStack Query mutation for upload + update operation
 *
 * @example
 * ```tsx
 * const uploadAndUpdate = useUploadAndUpdateBackground(
 *   projectId,
 *   eventId,
 *   workspaceId,
 *   userId
 * )
 *
 * // Upload and update in one operation
 * await uploadAndUpdate.mutateAsync({
 *   file,
 *   onProgress: (progress) => console.log(`${progress}%`)
 * })
 * ```
 */
import { useMutation } from '@tanstack/react-query'
import { useUpdateTheme } from './useUpdateTheme'
import { useTrackedMutation } from '@/domains/event/designer'
import { useUploadMediaAsset } from '@/domains/media-library'

interface UploadAndUpdateBackgroundParams {
  /** File to upload */
  file: File
  /** Optional progress callback (0-100) */
  onProgress?: (progress: number) => void
}

interface UploadAndUpdateBackgroundResult {
  /** Media asset ID */
  mediaAssetId: string
  /** Media asset URL */
  url: string
}

/**
 * Composition hook: Upload background image + update theme config
 *
 * Combines upload and config update into a single mutation that is
 * tracked by the event designer save indicator. This ensures users
 * see a single save operation for the entire flow.
 *
 * Architecture:
 * - Uses useUploadMediaAsset (domain-agnostic, no event coupling)
 * - Uses useUpdateTheme (event-specific config update)
 * - Wrapped with useTrackedMutation (designer save tracking)
 */
export function useUploadAndUpdateBackground(
  projectId: string,
  eventId: string,
  workspaceId: string,
  userId: string,
) {
  const uploadAsset = useUploadMediaAsset(workspaceId, userId)
  const updateTheme = useUpdateTheme(projectId, eventId)

  const mutation = useMutation<
    UploadAndUpdateBackgroundResult,
    Error,
    UploadAndUpdateBackgroundParams
  >({
    mutationFn: async ({ file, onProgress }) => {
      // Step 1: Upload to Storage + create MediaAsset document
      const { mediaAssetId, url } = await uploadAsset.mutateAsync({
        file,
        type: 'other', // Use 'other' for background images
        onProgress,
      })

      // Step 2: Update theme config with new background reference
      await updateTheme.mutateAsync({
        background: { image: url },
      })

      return { mediaAssetId, url }
    },
  })

  // Wrap with tracking - single save indicator for both operations
  // This ensures pendingSaves counter tracks upload + update as one unit
  return useTrackedMutation(mutation)
}

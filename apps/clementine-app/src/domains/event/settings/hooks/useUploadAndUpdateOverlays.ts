/**
 * Composition Hook: useUploadAndUpdateOverlays
 *
 * Combines two operations into a single tracked mutation:
 * 1. Upload overlay file to Storage (via useUploadMediaAsset)
 * 2. Update event overlays config (via useUpdateOverlays)
 *
 * This ensures the save indicator tracks the ENTIRE operation
 * (upload + config update) instead of just the config update.
 *
 * Pattern: This composition pattern should be used for all
 * upload + config update scenarios (backgrounds, logos, etc.)
 *
 * @param projectId - Project ID
 * @param eventId - Event ID
 * @param workspaceId - Workspace ID for media storage
 * @param userId - User ID for upload attribution
 * @returns TanStack Query mutation for upload + update operation
 *
 * @example
 * ```tsx
 * const uploadAndUpdate = useUploadAndUpdateOverlays(
 *   projectId,
 *   eventId,
 *   workspaceId,
 *   userId
 * )
 *
 * // Upload and update in one operation
 * await uploadAndUpdate.mutateAsync({
 *   file,
 *   aspectRatio: '1:1',
 *   onProgress: (progress) => console.log(`${progress}%`)
 * })
 * ```
 */
import { useMutation } from '@tanstack/react-query'
import { useUpdateOverlays } from './useUpdateOverlays'
import { useTrackedMutation } from '@/domains/event/designer'
import { useUploadMediaAsset } from '@/domains/media-library'

type AspectRatio = '1:1' | '9:16'

interface UploadAndUpdateOverlaysParams {
  /** File to upload */
  file: File
  /** Aspect ratio for the overlay */
  aspectRatio: AspectRatio
  /** Optional progress callback (0-100) */
  onProgress?: (progress: number) => void
}

interface UploadAndUpdateOverlaysResult {
  /** Media asset ID */
  mediaAssetId: string
  /** Media asset URL */
  url: string
}

/**
 * Composition hook: Upload overlay asset + update event config
 *
 * Combines upload and config update into a single mutation that is
 * tracked by the event designer save indicator. This ensures users
 * see a single save operation for the entire flow.
 *
 * Architecture:
 * - Uses useUploadMediaAsset (domain-agnostic, no event coupling)
 * - Uses useUpdateOverlays (event-specific config update)
 * - Wrapped with useTrackedMutation (designer save tracking)
 *
 * This keeps clean separation of concerns while providing accurate
 * save progress feedback to users.
 */
export function useUploadAndUpdateOverlays(
  projectId: string,
  eventId: string,
  workspaceId: string,
  userId: string,
) {
  const uploadAsset = useUploadMediaAsset(workspaceId, userId)
  const updateOverlays = useUpdateOverlays(projectId, eventId)

  const mutation = useMutation<
    UploadAndUpdateOverlaysResult,
    Error,
    UploadAndUpdateOverlaysParams
  >({
    mutationFn: async ({ file, aspectRatio, onProgress }) => {
      // Step 1: Upload to Storage + create MediaAsset document
      const { mediaAssetId, url } = await uploadAsset.mutateAsync({
        file,
        type: 'overlay',
        onProgress,
      })

      // Step 2: Update event config with new overlay reference
      await updateOverlays.mutateAsync({
        [aspectRatio]: { mediaAssetId, url },
      })

      return { mediaAssetId, url }
    },
  })

  // Wrap with tracking - single save indicator for both operations
  // This ensures pendingSaves counter tracks upload + update as one unit
  return useTrackedMutation(mutation)
}

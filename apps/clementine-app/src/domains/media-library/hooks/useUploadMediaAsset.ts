/**
 * useUploadMediaAsset Hook
 *
 * React hook for uploading media assets using TanStack Query mutation.
 * Wraps the uploadMediaAsset service with React state management.
 *
 * For non-React contexts, use the uploadMediaAsset service directly.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { uploadMediaAsset } from '../services/upload-media-asset.service'
import type { MediaAssetType } from '@clementine/shared'

// Hook: Upload media asset
// Accepts undefined params - mutation will throw if called without valid IDs
export function useUploadMediaAsset(
  workspaceId: string | undefined,
  userId: string | undefined,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      file: File
      type: MediaAssetType
      onProgress?: (progress: number) => void
    }) => {
      // Guard against missing params
      if (!workspaceId || !userId) {
        throw new Error('Cannot upload media: missing workspaceId or userId')
      }

      return uploadMediaAsset({
        ...params,
        workspaceId,
        userId,
      })
    },
    onSuccess: () => {
      // Invalidate queries to trigger re-fetch
      // Safe to use ! here - mutationFn throws if workspaceId is undefined
      queryClient.invalidateQueries({
        queryKey: ['mediaAssets', workspaceId!],
      })
    },
  })
}

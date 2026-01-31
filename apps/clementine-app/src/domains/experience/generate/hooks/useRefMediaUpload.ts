/**
 * useRefMediaUpload Hook
 *
 * Handles uploading reference media files for AI Image nodes.
 * Manages upload progress state and updates transform nodes after each upload.
 * Uses a ref to always read the latest nodes to prevent stale closures.
 */
import { useCallback, useRef, useState } from 'react'
import { nanoid } from 'nanoid'

import {
  MAX_REF_MEDIA_COUNT,
  addNodeRefMedia,
} from '../lib/transform-operations'
import type { TransformNode } from '@clementine/shared'
import { useUploadMediaAsset } from '@/domains/media-library'

export interface UploadingFile {
  /** Temporary ID for tracking */
  tempId: string
  /** File being uploaded */
  file: File
  /** Upload progress (0-100) */
  progress: number
}

export interface UseRefMediaUploadParams {
  /** Workspace ID for uploads */
  workspaceId: string
  /** User ID for uploads */
  userId: string | undefined
  /** Node ID to add refs to */
  nodeId: string
  /** Current transform nodes (may be stale during batch uploads) */
  transformNodes: TransformNode[]
  /** Current ref media count for limit checking */
  currentRefMediaCount: number
  /** Callback to update transform nodes */
  onUpdate: (nodes: TransformNode[]) => void
}

export interface UseRefMediaUploadResult {
  /** Files currently being uploaded */
  uploadingFiles: UploadingFile[]
  /** Whether any upload is in progress */
  isUploading: boolean
  /** Upload multiple files */
  uploadFiles: (files: File[]) => Promise<void>
  /** Check if more files can be added */
  canAddMore: boolean
  /** Number of slots available */
  availableSlots: number
}

/**
 * Hook for uploading reference media to AI Image nodes
 */
export function useRefMediaUpload({
  workspaceId,
  userId,
  nodeId,
  transformNodes,
  currentRefMediaCount,
  onUpdate,
}: UseRefMediaUploadParams): UseRefMediaUploadResult {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  // Keep a ref to the latest transform nodes to avoid stale closures in uploadFiles
  const nodesRef = useRef(transformNodes)
  nodesRef.current = transformNodes

  const uploadAsset = useUploadMediaAsset(workspaceId, userId)

  const availableSlots = MAX_REF_MEDIA_COUNT - currentRefMediaCount
  const canAddMore = availableSlots > 0

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!userId || availableSlots <= 0) return

      // Limit files to available slots
      const filesToUpload = files.slice(0, availableSlots)

      // Add files to uploading state with temp IDs
      const uploadingEntries: UploadingFile[] = filesToUpload.map((file) => ({
        tempId: nanoid(),
        file,
        progress: 0,
      }))
      setUploadingFiles((prev) => [...prev, ...uploadingEntries])

      // Upload files sequentially to show progress per file
      for (const entry of uploadingEntries) {
        try {
          const mediaRef = await uploadAsset.mutateAsync({
            file: entry.file,
            type: 'other',
            onProgress: (progress) => {
              setUploadingFiles((prev) =>
                prev.map((item) =>
                  item.tempId === entry.tempId ? { ...item, progress } : item,
                ),
              )
            },
          })

          // Remove from uploading state
          setUploadingFiles((prev) =>
            prev.filter((item) => item.tempId !== entry.tempId),
          )

          // Always read the latest nodes from ref to avoid stale closure
          const latestNodes = nodesRef.current
          const newNodes = addNodeRefMedia(latestNodes, nodeId, [mediaRef])
          onUpdate(newNodes)
        } catch {
          // Remove failed upload from uploading state
          setUploadingFiles((prev) =>
            prev.filter((item) => item.tempId !== entry.tempId),
          )
        }
      }
    },
    [availableSlots, nodeId, onUpdate, uploadAsset, userId],
  )

  return {
    uploadingFiles,
    isUploading: uploadingFiles.length > 0,
    uploadFiles,
    canAddMore,
    availableSlots,
  }
}

/**
 * useRefMediaUpload Hook
 *
 * Handles uploading reference media files for outcome configuration.
 * Manages upload progress state and provides uploaded media references.
 * Uses a ref to always read the latest outcome to prevent stale closures.
 */
import { useCallback, useRef, useState } from 'react'
import { nanoid } from 'nanoid'

import { MAX_REF_MEDIA_COUNT } from '../lib/model-options'
import type { Outcome, MediaReference } from '@clementine/shared'
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
  /** Current outcome configuration (may be stale during batch uploads) */
  outcome: Outcome | null
  /** Callback when a media reference is uploaded */
  onMediaUploaded: (mediaRef: MediaReference) => void
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
 * Hook for uploading reference media for outcome configuration
 */
export function useRefMediaUpload({
  workspaceId,
  userId,
  outcome,
  onMediaUploaded,
}: UseRefMediaUploadParams): UseRefMediaUploadResult {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  // Keep a ref to the latest outcome to avoid stale closures in uploadFiles
  const outcomeRef = useRef(outcome)
  outcomeRef.current = outcome

  const uploadAsset = useUploadMediaAsset(workspaceId, userId)

  const currentRefMediaCount = outcome?.imageGeneration.refMedia.length ?? 0
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

          // Notify parent of uploaded media
          onMediaUploaded(mediaRef)
        } catch {
          // Remove failed upload from uploading state
          setUploadingFiles((prev) =>
            prev.filter((item) => item.tempId !== entry.tempId),
          )
        }
      }
    },
    [availableSlots, onMediaUploaded, uploadAsset, userId],
  )

  return {
    uploadingFiles,
    isUploading: uploadingFiles.length > 0,
    uploadFiles,
    canAddMore,
    availableSlots,
  }
}

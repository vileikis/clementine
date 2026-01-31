/**
 * PromptComposer Component
 *
 * Unified bordered container for AI Image node configuration.
 * Contains prompt input, model/aspect ratio selectors, and reference media.
 * Supports file upload via button and drag-and-drop.
 */
import { useCallback, useEffect, useState } from 'react'
import { nanoid } from 'nanoid'

import {
  MAX_REF_MEDIA_COUNT,
  addNodeRefMedia,
  removeNodeRefMedia,
  updateNodePrompt,
} from '../../lib/transform-operations'
import { ControlRow } from './ControlRow'
import { PromptInput } from './PromptInput'
import { ReferenceMediaStrip } from './ReferenceMediaStrip'
import type { UploadingFile } from './ReferenceMediaStrip'
import type { AIImageNode, TransformConfig } from '@clementine/shared'
import { useAuth } from '@/domains/auth'
import { useUploadMediaAsset } from '@/domains/media-library'
import { cn } from '@/shared/utils'
import { useDebounce } from '@/shared/utils/useDebounce'

export interface PromptComposerProps {
  /** AI Image node being edited */
  node: AIImageNode
  /** Current transform configuration */
  transform: TransformConfig
  /** Workspace ID for media uploads */
  workspaceId: string
  /** Callback to update transform configuration */
  onUpdate: (transform: TransformConfig) => void
  /** Whether the composer is disabled */
  disabled?: boolean
}

/** Debounce delay for prompt changes (ms) */
const PROMPT_DEBOUNCE_DELAY = 2000

/**
 * PromptComposer - Main container for AI Image node settings
 */
export function PromptComposer({
  node,
  transform,
  workspaceId,
  onUpdate,
  disabled,
}: PromptComposerProps) {
  const { config } = node
  const { user } = useAuth()

  // Local state for prompt to enable debouncing
  const [localPrompt, setLocalPrompt] = useState(config.prompt)

  // Uploading files state for progress tracking
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  // Drag-over state for drop zone highlight
  const [isDragOver, setIsDragOver] = useState(false)

  // Upload hook
  const uploadAsset = useUploadMediaAsset(workspaceId, user?.uid)

  // Debounce the local prompt value
  const debouncedPrompt = useDebounce(localPrompt, PROMPT_DEBOUNCE_DELAY)

  // Update transform when debounced prompt changes
  useEffect(() => {
    // Only update if the debounced value differs from the config
    if (debouncedPrompt !== config.prompt) {
      const newTransform = updateNodePrompt(transform, node.id, debouncedPrompt)
      onUpdate(newTransform)
    }
  }, [debouncedPrompt])

  // Sync local prompt with config when it changes externally
  useEffect(() => {
    if (config.prompt !== localPrompt) {
      setLocalPrompt(config.prompt)
    }
  }, [config.prompt])

  // Handle file upload (used by both AddMediaButton and drag-drop)
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (!user?.uid) return

      // Check how many more can be added
      const currentCount = config.refMedia.length
      const availableSlots = MAX_REF_MEDIA_COUNT - currentCount
      if (availableSlots <= 0) return

      // Limit files to available slots
      const filesToUpload = files.slice(0, availableSlots)

      // Add files to uploading state
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

          // Add to transform config
          const newTransform = addNodeRefMedia(transform, node.id, [mediaRef])
          onUpdate(newTransform)
        } catch {
          // Remove failed upload from uploading state
          setUploadingFiles((prev) =>
            prev.filter((item) => item.tempId !== entry.tempId),
          )
        }
      }
    },
    [
      config.refMedia.length,
      node.id,
      onUpdate,
      transform,
      uploadAsset,
      user?.uid,
    ],
  )

  // Handle remove reference media
  const handleRemoveRefMedia = useCallback(
    (mediaAssetId: string) => {
      const newTransform = removeNodeRefMedia(transform, node.id, mediaAssetId)
      onUpdate(newTransform)
    },
    [node.id, onUpdate, transform],
  )

  // Drag-and-drop handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Only highlight if we can accept more files
      if (!disabled && config.refMedia.length < MAX_REF_MEDIA_COUNT) {
        setIsDragOver(true)
      }
    },
    [disabled, config.refMedia.length],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      // Check if we can accept more files
      if (disabled || config.refMedia.length >= MAX_REF_MEDIA_COUNT) {
        return
      }

      // Get dropped files and filter to images only
      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/'),
      )

      if (droppedFiles.length > 0) {
        handleFilesSelected(droppedFiles)
      }
    },
    [disabled, config.refMedia.length, handleFilesSelected],
  )

  // Check if add button should be disabled
  const isAddDisabled =
    disabled || config.refMedia.length >= MAX_REF_MEDIA_COUNT

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border transition-colors',
        isDragOver && 'border-primary bg-primary/5',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Reference Media Strip (only shown when items exist) */}
      <ReferenceMediaStrip
        media={config.refMedia}
        uploadingFiles={uploadingFiles}
        onRemove={handleRemoveRefMedia}
        disabled={disabled}
      />

      {/* Prompt Input */}
      <PromptInput
        value={localPrompt}
        onChange={setLocalPrompt}
        disabled={disabled}
      />

      {/* Control Row */}
      <ControlRow
        node={node}
        transform={transform}
        onUpdate={onUpdate}
        onFilesSelected={handleFilesSelected}
        isAddDisabled={isAddDisabled}
        disabled={disabled}
      />
    </div>
  )
}

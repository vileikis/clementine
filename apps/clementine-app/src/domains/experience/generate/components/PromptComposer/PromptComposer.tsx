/**
 * PromptComposer Component
 *
 * Unified bordered container for AI Image node configuration.
 * Contains prompt input, model/aspect ratio selectors, and reference media.
 * Supports file upload via button and drag-and-drop.
 * Supports @mention for steps and media references.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useRefMediaUpload } from '../../hooks'
import {
  removeNodeRefMedia,
  updateNodePrompt,
} from '../../lib/transform-operations'
import { ControlRow } from './ControlRow'
import { LexicalPromptInput } from './LexicalPromptInput'
import { ReferenceMediaStrip } from './ReferenceMediaStrip'
import type {
  AIImageNode,
  ExperienceStep,
  TransformNode,
} from '@clementine/shared'
import type { MediaOption, StepOption } from '../../lexical/utils/types'
import { useAuth } from '@/domains/auth'
import { cn } from '@/shared/utils'
import { useDebounce } from '@/shared/utils/useDebounce'

/**
 * Convert ExperienceStep to StepOption for mention autocomplete
 */
function toStepOption(step: ExperienceStep): StepOption {
  return {
    id: step.id,
    name: step.name,
    type: step.type,
  }
}

/**
 * Convert refMedia to MediaOption for mention autocomplete
 */
function toMediaOption(media: { mediaAssetId: string; displayName: string }): MediaOption {
  return {
    id: media.mediaAssetId,
    name: media.displayName,
  }
}

export interface PromptComposerProps {
  /** AI Image node being edited */
  node: AIImageNode
  /** Current transform nodes array */
  transformNodes: TransformNode[]
  /** Experience steps for @mention (info steps should be excluded by caller) */
  steps: ExperienceStep[]
  /** Workspace ID for media uploads */
  workspaceId: string
  /** Callback to update transform nodes */
  onUpdate: (nodes: TransformNode[]) => void
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
  transformNodes,
  steps,
  workspaceId,
  onUpdate,
  disabled,
}: PromptComposerProps) {
  const { config } = node
  const { user } = useAuth()

  // Local state for prompt to enable debouncing
  const [localPrompt, setLocalPrompt] = useState(config.prompt)

  // Convert steps to StepOption format (exclude info steps)
  const stepOptions = useMemo(
    () => steps.filter((s) => s.type !== 'info').map(toStepOption),
    [steps],
  )

  // Convert refMedia to MediaOption format
  const mediaOptions = useMemo(
    () => config.refMedia.map(toMediaOption),
    [config.refMedia],
  )

  // Drag-over state for drop zone highlight
  const [isDragOver, setIsDragOver] = useState(false)

  // Reference media upload hook
  const { uploadingFiles, uploadFiles, canAddMore, isUploading } =
    useRefMediaUpload({
      workspaceId,
      userId: user?.uid,
      nodeId: node.id,
      transformNodes,
      currentRefMediaCount: config.refMedia.length,
      onUpdate,
    })

  // Debounce the local prompt value
  const debouncedPrompt = useDebounce(localPrompt, PROMPT_DEBOUNCE_DELAY)

  // Update transform nodes when debounced prompt changes
  useEffect(() => {
    // Only update if the debounced value differs from the config
    if (debouncedPrompt !== config.prompt) {
      const newNodes = updateNodePrompt(
        transformNodes,
        node.id,
        debouncedPrompt,
      )
      onUpdate(newNodes)
    }
  }, [debouncedPrompt])

  // Sync local prompt with config when it changes externally
  useEffect(() => {
    if (config.prompt !== localPrompt) {
      setLocalPrompt(config.prompt)
    }
  }, [config.prompt])

  // Handle file selection (from button or drop)
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      uploadFiles(files)
    },
    [uploadFiles],
  )

  // Handle remove reference media
  const handleRemoveRefMedia = useCallback(
    (mediaAssetId: string) => {
      const newNodes = removeNodeRefMedia(transformNodes, node.id, mediaAssetId)
      onUpdate(newNodes)
    },
    [node.id, onUpdate, transformNodes],
  )

  // Drag-and-drop handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Only highlight if we can accept more files and not currently uploading
      if (!disabled && canAddMore && !isUploading) {
        setIsDragOver(true)
      }
    },
    [disabled, canAddMore, isUploading],
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

      // Check if we can accept more files and not currently uploading
      if (disabled || !canAddMore || isUploading) {
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
    [disabled, canAddMore, isUploading, handleFilesSelected],
  )

  // Check if add button should be disabled (also prevent concurrent batches)
  const isAddDisabled = disabled || !canAddMore || isUploading

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

      {/* Prompt Input with @mention support */}
      <LexicalPromptInput
        value={localPrompt}
        onChange={setLocalPrompt}
        steps={stepOptions}
        media={mediaOptions}
        disabled={disabled}
      />

      {/* Control Row */}
      <ControlRow
        node={node}
        transformNodes={transformNodes}
        onUpdate={onUpdate}
        onFilesSelected={handleFilesSelected}
        isAddDisabled={isAddDisabled}
        disabled={disabled}
      />
    </div>
  )
}

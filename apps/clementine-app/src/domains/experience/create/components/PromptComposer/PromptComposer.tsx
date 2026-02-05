/**
 * PromptComposer Component
 *
 * Unified bordered container for AI generation configuration.
 * Contains prompt input, model/aspect ratio selectors, and reference media.
 * Supports file upload via button and drag-and-drop.
 * Supports @mention for steps and media references.
 *
 * Uses composition pattern - accepts all values and callbacks via props
 * to work with any data source (outcome config, node config, etc.)
 */
import { useCallback, useMemo, useState } from 'react'

import { AI_IMAGE_MODELS, ASPECT_RATIOS } from '../../lib/model-options'
import { ControlRow } from './ControlRow'
import { LexicalPromptInput } from './LexicalPromptInput'
import { ReferenceMediaStrip } from './ReferenceMediaStrip'
import type { ExperienceStep, MediaReference } from '@clementine/shared'
import type { MediaOption, StepOption } from '../../lexical/utils/types'
import type { UploadingFile } from '../../hooks/useRefMediaUpload'
import { cn } from '@/shared/utils'

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
 * Convert MediaReference to MediaOption for mention autocomplete
 */
function toMediaOption(media: MediaReference): MediaOption {
  return {
    id: media.mediaAssetId,
    name: media.displayName,
  }
}

export interface PromptComposerProps {
  /** Current prompt value */
  prompt: string
  /** Callback when prompt changes (local state for debouncing) */
  onPromptChange: (prompt: string) => void
  /** Current model value */
  model: string
  /** Callback when model changes */
  onModelChange: (model: string) => void
  /** Current aspect ratio value */
  aspectRatio: string
  /** Callback when aspect ratio changes */
  onAspectRatioChange: (aspectRatio: string) => void
  /** Reference media array */
  refMedia: MediaReference[]
  /** Callback to remove reference media */
  onRefMediaRemove: (mediaAssetId: string) => void
  /** Files currently being uploaded */
  uploadingFiles: UploadingFile[]
  /** Callback when files are selected for upload */
  onFilesSelected: (files: File[]) => void
  /** Whether more files can be added */
  canAddMore: boolean
  /** Whether upload is in progress */
  isUploading: boolean
  /** Experience steps for @mention (info steps should be excluded by caller) */
  steps: ExperienceStep[]
  /** Whether the composer is disabled */
  disabled?: boolean
}

/**
 * PromptComposer - Main container for AI generation configuration
 */
export function PromptComposer({
  prompt,
  onPromptChange,
  model,
  onModelChange,
  aspectRatio,
  onAspectRatioChange,
  refMedia,
  onRefMediaRemove,
  uploadingFiles,
  onFilesSelected,
  canAddMore,
  isUploading,
  steps,
  disabled,
}: PromptComposerProps) {
  // Convert steps to StepOption format (exclude info steps)
  const stepOptions = useMemo(
    () => steps.filter((s) => s.type !== 'info').map(toStepOption),
    [steps],
  )

  // Convert refMedia to MediaOption format
  const mediaOptions = useMemo(() => refMedia.map(toMediaOption), [refMedia])

  // Drag-over state for drop zone highlight
  const [isDragOver, setIsDragOver] = useState(false)

  // Check if add button should be disabled
  const isAddDisabled = disabled || !canAddMore || isUploading

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
        onFilesSelected(droppedFiles)
      }
    },
    [disabled, canAddMore, isUploading, onFilesSelected],
  )

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border transition-colors',
        isDragOver && 'border-primary bg-primary/5',
        disabled && 'pointer-events-none opacity-50',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Reference Media Strip (only shown when items exist) */}
      <ReferenceMediaStrip
        media={refMedia}
        uploadingFiles={uploadingFiles}
        onRemove={onRefMediaRemove}
        disabled={disabled}
      />

      {/* Prompt Input with @mention support */}
      <LexicalPromptInput
        value={prompt}
        onChange={onPromptChange}
        steps={stepOptions}
        media={mediaOptions}
        disabled={disabled}
      />

      {/* Control Row */}
      <ControlRow
        model={model}
        onModelChange={onModelChange}
        modelOptions={AI_IMAGE_MODELS}
        aspectRatio={aspectRatio}
        onAspectRatioChange={onAspectRatioChange}
        aspectRatioOptions={ASPECT_RATIOS}
        onFilesSelected={onFilesSelected}
        isAddDisabled={isAddDisabled}
        disabled={disabled}
      />
    </div>
  )
}

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
import type { SelectOption } from './ControlRow'
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
  /** Available model options (defaults to AI_IMAGE_MODELS) */
  modelOptions?: readonly SelectOption[]
  /** Current aspect ratio value */
  aspectRatio: string
  /** Callback when aspect ratio changes */
  onAspectRatioChange: (aspectRatio: string) => void
  /**
   * Whether to hide the aspect ratio selector.
   * When true, aspect ratio is controlled at a higher level (e.g., outcome.aspectRatio).
   * @default true - Aspect ratio is now a top-level outcome setting (Feature 065)
   */
  hideAspectRatio?: boolean
  /** Current duration value */
  duration?: string
  /** Callback when duration changes */
  onDurationChange?: (duration: string) => void
  /** Available duration options — when provided, duration picker is rendered */
  durationOptions?: readonly SelectOption[]
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
  /** Whether to hide reference media strip and add button */
  hideRefMedia?: boolean
  /** Experience steps for @mention (info steps should be excluded by caller) */
  steps: ExperienceStep[]
  /** Whether the composer is disabled */
  disabled?: boolean
  /** Validation error message for prompt */
  error?: string
}

/**
 * PromptComposer - Main container for AI generation configuration
 */
export function PromptComposer({
  prompt,
  onPromptChange,
  model,
  onModelChange,
  modelOptions = AI_IMAGE_MODELS,
  aspectRatio,
  onAspectRatioChange,
  hideAspectRatio = true,
  duration,
  onDurationChange,
  durationOptions,
  refMedia,
  onRefMediaRemove,
  uploadingFiles,
  onFilesSelected,
  canAddMore,
  isUploading,
  hideRefMedia = false,
  steps,
  disabled,
  error,
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
  const isAddDisabled = disabled || !canAddMore || isUploading || hideRefMedia

  // Drag-and-drop handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Only highlight if we can accept more files and not currently uploading
      if (!disabled && canAddMore && !isUploading && !hideRefMedia) {
        setIsDragOver(true)
      }
    },
    [disabled, canAddMore, isUploading, hideRefMedia],
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
      if (disabled || !canAddMore || isUploading || hideRefMedia) {
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
    [disabled, canAddMore, isUploading, hideRefMedia, onFilesSelected],
  )

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-lg border transition-colors',
          isDragOver && 'border-primary bg-primary/5',
          error && 'border-destructive',
          disabled && 'pointer-events-none opacity-50',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Reference Media Strip (hidden when hideRefMedia is true) */}
        {!hideRefMedia && (
          <ReferenceMediaStrip
            media={refMedia}
            uploadingFiles={uploadingFiles}
            onRemove={onRefMediaRemove}
            disabled={disabled}
          />
        )}

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
          modelOptions={modelOptions}
          aspectRatio={aspectRatio}
          onAspectRatioChange={onAspectRatioChange}
          aspectRatioOptions={ASPECT_RATIOS}
          hideAspectRatio={hideAspectRatio}
          duration={duration}
          onDurationChange={onDurationChange}
          durationOptions={durationOptions}
          onFilesSelected={onFilesSelected}
          isAddDisabled={hideRefMedia ? true : isAddDisabled}
          disabled={disabled}
        />
      </div>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * PromptComposer Component
 *
 * Unified bordered container for AI generation configuration.
 * Contains prompt input, model/aspect ratio selectors, and reference media.
 * Supports file upload via button and drag-and-drop.
 * Supports @mention for steps and media references.
 *
 * Accepts a ModalityDefinition to auto-render the correct controls.
 * Child components read from PromptComposerContext instead of props.
 *
 * @see specs/001-prompt-composer-refactor
 */
import { useCallback, useMemo, useState } from 'react'

import { ControlRow } from './ControlRow'
import { LexicalPromptInput } from './LexicalPromptInput'
import {
  
  
  PromptComposerProvider
  
} from './PromptComposerContext'
import { ReferenceMediaStrip } from './ReferenceMediaStrip'
import type {ModalityControlValues, PromptComposerContextValue, RefMediaState} from './PromptComposerContext';
import type { ExperienceStep, MediaReference } from '@clementine/shared'
import type { MediaOption, StepOption } from '../../lexical/utils/types'
import type { ModalityDefinition } from '../../lib/modality-definitions'
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
  /** Modality configuration — declares supported features and limits */
  modality: ModalityDefinition
  /** Current prompt value */
  prompt: string
  /** Callback when prompt changes */
  onPromptChange: (prompt: string) => void
  /** Current model value */
  model: string
  /** Callback when model changes */
  onModelChange: (model: string) => void
  /** Modality-specific control values (aspect ratio, duration) */
  controls?: ModalityControlValues
  /** Reference media state (items, upload callbacks, status) */
  refMedia?: RefMediaState
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
  modality,
  prompt,
  onPromptChange,
  model,
  onModelChange,
  controls,
  refMedia,
  steps,
  disabled = false,
  error,
}: PromptComposerProps) {
  // Convert steps to StepOption format (exclude info steps)
  const stepOptions = useMemo(
    () => steps.filter((s) => s.type !== 'info').map(toStepOption),
    [steps],
  )

  // Convert refMedia to MediaOption format
  const mediaOptions = useMemo(
    () => (refMedia?.items ?? []).map(toMediaOption),
    [refMedia?.items],
  )

  // Build context value for child components
  const contextValue = useMemo<PromptComposerContextValue>(
    () => ({
      modality,
      prompt,
      onPromptChange,
      model,
      onModelChange,
      controls,
      refMedia,
      steps,
      disabled,
      error,
    }),
    [
      modality,
      prompt,
      onPromptChange,
      model,
      onModelChange,
      controls,
      refMedia,
      steps,
      disabled,
      error,
    ],
  )

  // Whether reference media is supported and provided
  const showRefMedia = modality.supports.referenceMedia && !!refMedia

  // Drag-over state for drop zone highlight
  const [isDragOver, setIsDragOver] = useState(false)

  // Drag-and-drop handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (
        !disabled &&
        showRefMedia &&
        refMedia?.canAddMore &&
        !refMedia?.isUploading
      ) {
        setIsDragOver(true)
      }
    },
    [disabled, showRefMedia, refMedia?.canAddMore, refMedia?.isUploading],
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

      if (
        disabled ||
        !showRefMedia ||
        !refMedia?.canAddMore ||
        refMedia?.isUploading
      ) {
        return
      }

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/'),
      )

      if (droppedFiles.length > 0) {
        refMedia.onFilesSelected(droppedFiles)
      }
    },
    [disabled, showRefMedia, refMedia],
  )

  return (
    <PromptComposerProvider value={contextValue}>
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
          {/* Reference Media Strip */}
          {showRefMedia && <ReferenceMediaStrip />}

          {/* Prompt Input with @mention support */}
          <LexicalPromptInput
            value={prompt}
            onChange={onPromptChange}
            steps={stepOptions}
            media={mediaOptions}
            disabled={disabled}
          />

          {/* Control Row */}
          <ControlRow />
        </div>
        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
      </div>
    </PromptComposerProvider>
  )
}

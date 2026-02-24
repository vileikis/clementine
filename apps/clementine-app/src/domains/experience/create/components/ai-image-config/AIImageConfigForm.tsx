/**
 * AIImageConfigForm Component
 *
 * Self-contained configuration form for AI Image outcome type.
 * Owns all AI-image-specific handlers, ref media uploads, and rendering.
 * Communicates back to parent via a single `onConfigChange` callback.
 *
 * @see specs/072-outcome-schema-redesign — US2/US3
 */
import { useCallback } from 'react'

import { getFieldError } from '../../hooks/useExperienceConfigValidation'
import { useRefMediaUpload } from '../../hooks/useRefMediaUpload'
import { sanitizeDisplayName } from '../../lib/experience-config-operations'
import { SourceImageSelector } from '../shared-controls/SourceImageSelector'
import { AspectRatioSelector } from '../shared-controls/AspectRatioSelector'
import { IMAGE_MODALITY, PromptComposer } from '../PromptComposer'
import { TaskSelector } from './TaskSelector'
import type { FieldValidationError } from '../../hooks/useExperienceConfigValidation'
import type {
  AIImageConfig,
  AIImageModel,
  AIImageTask,
  AspectRatio,
  ExperienceStep,
  MediaReference,
} from '@clementine/shared'

export interface AIImageConfigFormProps {
  /** AI Image configuration */
  config: AIImageConfig
  /** Callback when any config field changes (parent handles form.setValue + save) */
  onConfigChange: (updates: Partial<AIImageConfig>) => void
  /** Experience steps */
  steps: ExperienceStep[]
  /** Validation errors */
  errors: FieldValidationError[]
  /** Workspace ID for media uploads */
  workspaceId: string
  /** User ID for media uploads */
  userId: string | undefined
}

/**
 * AIImageConfigForm - Task, source, aspect ratio, and prompt for AI Image output
 */
export function AIImageConfigForm({
  config,
  onConfigChange,
  steps,
  errors,
  workspaceId,
  userId,
}: AIImageConfigFormProps) {
  const { imageGeneration } = config

  // ── imageGeneration field helpers ─────────────────────────

  const updateImageGeneration = useCallback(
    (genUpdates: Partial<AIImageConfig['imageGeneration']>) => {
      onConfigChange({
        imageGeneration: { ...imageGeneration, ...genUpdates },
      })
    },
    [imageGeneration, onConfigChange],
  )

  // ── Handlers ──────────────────────────────────────────────

  const handlePromptChange = useCallback(
    (prompt: string) => updateImageGeneration({ prompt }),
    [updateImageGeneration],
  )

  const handleModelChange = useCallback(
    (model: string) => updateImageGeneration({ model: model as AIImageModel }),
    [updateImageGeneration],
  )

  const handleGenAspectRatioChange = useCallback(
    (aspectRatio: string) =>
      updateImageGeneration({ aspectRatio: aspectRatio as AspectRatio }),
    [updateImageGeneration],
  )

  const handleRemoveRefMedia = useCallback(
    (mediaAssetId: string) =>
      updateImageGeneration({
        refMedia: imageGeneration.refMedia.filter(
          (m) => m.mediaAssetId !== mediaAssetId,
        ),
      }),
    [imageGeneration.refMedia, updateImageGeneration],
  )

  const handleMediaUploaded = useCallback(
    (mediaRef: MediaReference) => {
      updateImageGeneration({
        refMedia: [
          ...imageGeneration.refMedia,
          {
            ...mediaRef,
            displayName: sanitizeDisplayName(mediaRef.displayName),
          },
        ],
      })
    },
    [imageGeneration.refMedia, updateImageGeneration],
  )

  const handleTaskChange = useCallback(
    (task: AIImageTask) => {
      if (task === 'text-to-image') {
        onConfigChange({ task, captureStepId: null })
      } else {
        onConfigChange({ task })
      }
    },
    [onConfigChange],
  )

  // ── Ref media upload hook ─────────────────────────────────

  const { uploadingFiles, uploadFiles, canAddMore, isUploading } =
    useRefMediaUpload({
      workspaceId,
      userId,
      currentRefMedia: config.imageGeneration.refMedia,
      onMediaUploaded: handleMediaUploaded,
    })

  // ── Render ────────────────────────────────────────────────

  // Filter steps for @mention (exclude info steps)
  const mentionableSteps = steps.filter((s) => s.type !== 'info')

  return (
    <div className="space-y-6">
      {/* Task selector */}
      <TaskSelector task={config.task} onTaskChange={handleTaskChange} />

      {/* Source image + aspect ratio */}
      {config.task === 'image-to-image' ? (
        <div className="grid grid-cols-2 gap-4">
          <SourceImageSelector
            value={config.captureStepId}
            onChange={(captureStepId) => onConfigChange({ captureStepId })}
            steps={steps}
            error={getFieldError(errors, 'aiImage.captureStepId')}
          />
          <AspectRatioSelector
            value={config.aspectRatio}
            onChange={(aspectRatio) =>
              onConfigChange({ aspectRatio: aspectRatio })
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div /> {/* Empty slot */}
          <AspectRatioSelector
            value={config.aspectRatio}
            onChange={(aspectRatio) =>
              onConfigChange({ aspectRatio: aspectRatio })
            }
          />
        </div>
      )}

      {/* PromptComposer */}
      <PromptComposer
        modality={IMAGE_MODALITY}
        prompt={imageGeneration.prompt}
        onPromptChange={handlePromptChange}
        model={imageGeneration.model}
        onModelChange={handleModelChange}
        controls={{
          aspectRatio: imageGeneration.aspectRatio ?? config.aspectRatio,
          onAspectRatioChange: handleGenAspectRatioChange,
        }}
        refMedia={{
          items: imageGeneration.refMedia,
          onRemove: handleRemoveRefMedia,
          uploadingFiles,
          onFilesSelected: uploadFiles,
          canAddMore,
          isUploading,
        }}
        steps={mentionableSteps}
        error={getFieldError(errors, 'aiImage.imageGeneration.prompt')}
      />
    </div>
  )
}

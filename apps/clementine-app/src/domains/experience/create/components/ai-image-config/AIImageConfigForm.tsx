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
import { SubjectMediaSection } from '../shared-controls/SubjectMediaSection'
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
  /** Callback when a capture step's aspect ratio is changed inline */
  onCaptureAspectRatioChange?: (
    stepId: string,
    aspectRatio: AspectRatio,
  ) => void
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
  onCaptureAspectRatioChange,
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

      {/* Subject Media section (visible for image-to-image only) */}
      {config.task === 'image-to-image' && (
        <SubjectMediaSection
          captureStepId={config.captureStepId}
          steps={steps}
          onCaptureStepChange={(captureStepId) =>
            onConfigChange({ captureStepId })
          }
          onCaptureAspectRatioChange={onCaptureAspectRatioChange}
          error={getFieldError(errors, 'aiImage.captureStepId')}
        />
      )}

      {/* Output section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Output</h3>
        <AspectRatioSelector
          value={config.aspectRatio}
          onChange={(aspectRatio) =>
            onConfigChange({ aspectRatio: aspectRatio })
          }
        />
        <PromptComposer
          modality={IMAGE_MODALITY}
          prompt={imageGeneration.prompt}
          onPromptChange={handlePromptChange}
          model={imageGeneration.model}
          onModelChange={handleModelChange}
          controls={{}}
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
    </div>
  )
}

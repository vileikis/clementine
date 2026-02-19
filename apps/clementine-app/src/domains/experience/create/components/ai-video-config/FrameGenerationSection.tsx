/**
 * FrameGenerationSection Component
 *
 * Reusable section for start/end frame image generation configuration.
 * Wraps PromptComposer with a section header and label.
 * Used for both startFrameImageGen and endFrameImageGen in AI Video config.
 *
 * @see specs/073-ai-video-editor — US3/US4
 */
import { useCallback } from 'react'

import { sanitizeDisplayName } from '../../lib/outcome-operations'
import { getFieldError } from '../../hooks/useOutcomeValidation'
import { useRefMediaUpload } from '../../hooks/useRefMediaUpload'
import { PromptComposer } from '../PromptComposer/PromptComposer'
import type { FieldValidationError } from '../../hooks/useOutcomeValidation'
import type {
  AIImageModel,
  ExperienceStep,
  ImageGenerationConfig,
  MediaReference,
} from '@clementine/shared'

export interface FrameGenerationSectionProps {
  /** Section label (e.g., "Start Frame Image Generation" or "End Frame Image Generation") */
  label: string
  /** Frame generation config */
  config: ImageGenerationConfig
  /** Callback when any field changes */
  onConfigChange: (updates: Partial<ImageGenerationConfig>) => void
  /** Experience steps for @mention */
  steps: ExperienceStep[]
  /** Validation errors */
  errors: FieldValidationError[]
  /** Error field prefix for validation lookup (e.g., 'aiVideo.startFrameImageGen') */
  errorFieldPrefix: string
  /** Workspace ID for media uploads */
  workspaceId: string
  /** User ID for media uploads */
  userId: string | undefined
}

/**
 * FrameGenerationSection - Image generation config for a single frame (start or end)
 */
export function FrameGenerationSection({
  label,
  config,
  onConfigChange,
  steps,
  errors,
  errorFieldPrefix,
  workspaceId,
  userId,
}: FrameGenerationSectionProps) {
  // ── Handlers ──────────────────────────────────────────────

  const handlePromptChange = useCallback(
    (prompt: string) => onConfigChange({ prompt }),
    [onConfigChange],
  )

  const handleModelChange = useCallback(
    (model: string) => onConfigChange({ model: model as AIImageModel }),
    [onConfigChange],
  )

  const handleAspectRatioChange = useCallback(
    (aspectRatio: string) =>
      onConfigChange({
        aspectRatio: aspectRatio as ImageGenerationConfig['aspectRatio'],
      }),
    [onConfigChange],
  )

  const handleRemoveRefMedia = useCallback(
    (mediaAssetId: string) =>
      onConfigChange({
        refMedia: config.refMedia.filter(
          (m) => m.mediaAssetId !== mediaAssetId,
        ),
      }),
    [config.refMedia, onConfigChange],
  )

  const handleMediaUploaded = useCallback(
    (mediaRef: MediaReference) => {
      onConfigChange({
        refMedia: [
          ...config.refMedia,
          {
            ...mediaRef,
            displayName: sanitizeDisplayName(mediaRef.displayName),
          },
        ],
      })
    },
    [config.refMedia, onConfigChange],
  )

  // ── Ref media upload hook ─────────────────────────────────

  const { uploadingFiles, uploadFiles, canAddMore, isUploading } =
    useRefMediaUpload({
      workspaceId,
      userId,
      currentRefMedia: config.refMedia,
      onMediaUploaded: handleMediaUploaded,
    })

  // ── Render ────────────────────────────────────────────────

  // Filter steps for @mention (exclude info steps)
  const mentionableSteps = steps.filter((s) => s.type !== 'info')

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{label}</h4>
      <PromptComposer
        prompt={config.prompt}
        onPromptChange={handlePromptChange}
        model={config.model}
        onModelChange={handleModelChange}
        aspectRatio={config.aspectRatio ?? ''}
        onAspectRatioChange={handleAspectRatioChange}
        hideAspectRatio={true}
        refMedia={config.refMedia}
        onRefMediaRemove={handleRemoveRefMedia}
        uploadingFiles={uploadingFiles}
        onFilesSelected={uploadFiles}
        canAddMore={canAddMore}
        isUploading={isUploading}
        steps={mentionableSteps}
        disabled={false}
        error={getFieldError(errors, `${errorFieldPrefix}.prompt`)}
      />
    </div>
  )
}

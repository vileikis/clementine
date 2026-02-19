/**
 * AIVideoConfigForm Component
 *
 * Self-contained configuration form for AI Video outcome type.
 * Owns all AI-video-specific handlers and rendering.
 * Communicates back to parent via a single `onConfigChange` callback.
 *
 * @see specs/073-ai-video-editor — US1/US2
 */
import { useCallback } from 'react'

import { VIDEO_ASPECT_RATIOS } from '@clementine/shared'
import { getFieldError } from '../../hooks/useOutcomeValidation'
import { SourceImageSelector } from '../shared-controls/SourceImageSelector'
import { AspectRatioSelector } from '../shared-controls/AspectRatioSelector'
import { AIVideoTaskSelector } from './AIVideoTaskSelector'
import { FrameGenerationSection } from './FrameGenerationSection'
import { VideoGenerationSection } from './VideoGenerationSection'
import type { FieldValidationError } from '../../hooks/useOutcomeValidation'
import type {
  AIVideoOutcomeConfig,
  AIVideoTask,
  ExperienceStep,
  ImageGenerationConfig,
  VideoGenerationConfig,
} from '@clementine/shared'

const VIDEO_ASPECT_RATIO_OPTIONS = VIDEO_ASPECT_RATIOS.map((value) => ({
  value,
  label: value,
}))

const DEFAULT_IMAGE_GEN_CONFIG: ImageGenerationConfig = {
  prompt: '',
  model: 'gemini-2.5-flash-image',
  refMedia: [],
  aspectRatio: null,
}

export interface AIVideoConfigFormProps {
  /** AI Video outcome configuration */
  config: AIVideoOutcomeConfig
  /** Callback when any config field changes (parent handles form.setValue + save) */
  onConfigChange: (updates: Partial<AIVideoOutcomeConfig>) => void
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
 * AIVideoConfigForm - Task, source, aspect ratio, and video gen config for AI Video output
 */
export function AIVideoConfigForm({
  config,
  onConfigChange,
  steps,
  errors,
  workspaceId,
  userId,
}: AIVideoConfigFormProps) {
  const { videoGeneration } = config

  // ── videoGeneration field helpers ─────────────────────────

  const updateVideoGeneration = useCallback(
    (genUpdates: Partial<VideoGenerationConfig>) => {
      onConfigChange({
        videoGeneration: { ...videoGeneration, ...genUpdates },
      })
    },
    [videoGeneration, onConfigChange],
  )

  // ── startFrameImageGen field helpers ───────────────────────

  const updateStartFrameImageGen = useCallback(
    (genUpdates: Partial<ImageGenerationConfig>) => {
      const current = config.startFrameImageGen ?? DEFAULT_IMAGE_GEN_CONFIG
      onConfigChange({
        startFrameImageGen: { ...current, ...genUpdates },
      })
    },
    [config.startFrameImageGen, onConfigChange],
  )

  // ── endFrameImageGen field helpers ────────────────────────

  const updateEndFrameImageGen = useCallback(
    (genUpdates: Partial<ImageGenerationConfig>) => {
      const current = config.endFrameImageGen ?? DEFAULT_IMAGE_GEN_CONFIG
      onConfigChange({
        endFrameImageGen: { ...current, ...genUpdates },
      })
    },
    [config.endFrameImageGen, onConfigChange],
  )

  // ── Handlers ──────────────────────────────────────────────

  const handleTaskChange = useCallback(
    (task: AIVideoTask) => {
      const updates: Partial<AIVideoOutcomeConfig> = { task }

      // Initialize frame gen configs with defaults when null and new task requires them.
      // Never clear existing configs — preserves data when hiding sections.
      if (
        (task === 'transform' || task === 'reimagine') &&
        !config.endFrameImageGen
      ) {
        updates.endFrameImageGen = { ...DEFAULT_IMAGE_GEN_CONFIG }
      }
      if (task === 'reimagine' && !config.startFrameImageGen) {
        updates.startFrameImageGen = { ...DEFAULT_IMAGE_GEN_CONFIG }
      }

      onConfigChange(updates)
    },
    [config.endFrameImageGen, config.startFrameImageGen, onConfigChange],
  )

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Task selector */}
      <AIVideoTaskSelector task={config.task} onTaskChange={handleTaskChange} />

      {/* Source image + aspect ratio */}
      <div className="grid grid-cols-2 gap-4">
        <SourceImageSelector
          value={config.captureStepId}
          onChange={(captureStepId) =>
            onConfigChange({ captureStepId: captureStepId ?? '' })
          }
          steps={steps}
          error={getFieldError(errors, 'aiVideo.captureStepId')}
        />
        <AspectRatioSelector
          value={config.aspectRatio}
          onChange={(aspectRatio) =>
            onConfigChange({ aspectRatio: aspectRatio })
          }
          options={VIDEO_ASPECT_RATIO_OPTIONS}
        />
      </div>

      {/* Video generation section */}
      <VideoGenerationSection
        config={videoGeneration}
        onConfigChange={updateVideoGeneration}
      />

      {/* Start frame image generation (reimagine only) */}
      {config.task === 'reimagine' && config.startFrameImageGen && (
        <FrameGenerationSection
          label="Start Frame Image Generation"
          config={config.startFrameImageGen}
          onConfigChange={updateStartFrameImageGen}
          steps={steps}
          errors={errors}
          errorFieldPrefix="aiVideo.startFrameImageGen"
          workspaceId={workspaceId}
          userId={userId}
        />
      )}

      {/* End frame image generation (transform + reimagine) */}
      {(config.task === 'transform' || config.task === 'reimagine') &&
        config.endFrameImageGen && (
          <FrameGenerationSection
            label="End Frame Image Generation"
            config={config.endFrameImageGen}
            onConfigChange={updateEndFrameImageGen}
            steps={steps}
            errors={errors}
            errorFieldPrefix="aiVideo.endFrameImageGen"
            workspaceId={workspaceId}
            userId={userId}
          />
        )}
    </div>
  )
}

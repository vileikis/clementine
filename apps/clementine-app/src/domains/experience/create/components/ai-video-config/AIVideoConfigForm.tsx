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
import { VideoGenerationSection } from './VideoGenerationSection'
import type { FieldValidationError } from '../../hooks/useOutcomeValidation'
import type {
  AIVideoOutcomeConfig,
  AIVideoTask,
  ExperienceStep,
  VideoAspectRatio,
  VideoGenerationConfig,
} from '@clementine/shared'

const VIDEO_ASPECT_RATIO_OPTIONS = VIDEO_ASPECT_RATIOS.map((value) => ({
  value,
  label: value,
}))

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

  // ── Handlers ──────────────────────────────────────────────

  const handleTaskChange = useCallback(
    (task: AIVideoTask) => {
      onConfigChange({ task })
    },
    [onConfigChange],
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
            onConfigChange({ aspectRatio: aspectRatio as VideoAspectRatio })
          }
          options={VIDEO_ASPECT_RATIO_OPTIONS}
        />
      </div>

      {/* Video generation section */}
      <VideoGenerationSection
        config={videoGeneration}
        onConfigChange={updateVideoGeneration}
      />
    </div>
  )
}

/**
 * AIVideoConfigForm Component
 *
 * Self-contained configuration form for AI Video outcome type.
 * Owns all AI-video-specific handlers and rendering.
 * Communicates back to parent via a single `onConfigChange` callback.
 *
 * Uses PromptComposer for prompt input, model selection, duration, and @mentions.
 *
 * @see specs/075-ai-video-editor-v2 — US1/US2
 */
import { useCallback, useMemo, useRef } from 'react'

import { VIDEO_ASPECT_RATIOS } from '@clementine/shared'
import { getFieldError } from '../../hooks/useExperienceConfigValidation'
import { MAX_VIDEO_REF_MEDIA_COUNT } from '../../lib/model-options'
import { useRefMediaUpload } from '../../hooks/useRefMediaUpload'
import { SubjectMediaSection } from '../shared-controls/SubjectMediaSection'
import { AspectRatioSelector } from '../shared-controls/AspectRatioSelector'
import { PromptComposer, VIDEO_MODALITY } from '../PromptComposer'
import { AIVideoTaskSelector } from './AIVideoTaskSelector'
import { FrameGenerationSection } from './FrameGenerationSection'
import type { FieldValidationError } from '../../hooks/useExperienceConfigValidation'
import type {
  AIVideoConfig,
  AIVideoModel,
  AIVideoTask,
  AspectRatio,
  ExperienceStep,
  ImageGenerationConfig,
  MediaReference,
  VideoGenerationConfig,
} from '@clementine/shared'

const VIDEO_ASPECT_RATIO_OPTIONS = VIDEO_ASPECT_RATIOS.map((value) => ({
  value,
  label: value,
}))

/** Remix task only supports 8s duration (Veo API constraint) */
const REMIX_DURATION_OPTIONS = [{ value: '8', label: '8s' }] as const

const DEFAULT_IMAGE_GEN_CONFIG: ImageGenerationConfig = {
  prompt: '',
  model: 'gemini-2.5-flash-image',
  refMedia: [],
  aspectRatio: null,
}

export interface AIVideoConfigFormProps {
  /** AI Video outcome configuration */
  config: AIVideoConfig
  /** Callback when any config field changes (parent handles form.setValue + save) */
  onConfigChange: (updates: Partial<AIVideoConfig>) => void
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
 * AIVideoConfigForm - Task, source, aspect ratio, and video gen config for AI Video output
 */
export function AIVideoConfigForm({
  config,
  onConfigChange,
  steps,
  errors,
  workspaceId,
  userId,
  onCaptureAspectRatioChange,
}: AIVideoConfigFormProps) {
  const { videoGeneration } = config

  // Keep a stable ref to the latest videoGeneration to avoid stale closures
  // when multiple ref-media files are uploaded in a single batch.
  const videoGenerationRef = useRef(videoGeneration)
  videoGenerationRef.current = videoGeneration

  // ── videoGeneration field helpers ─────────────────────────

  const updateVideoGeneration = useCallback(
    (genUpdates: Partial<VideoGenerationConfig>) => {
      onConfigChange({
        videoGeneration: { ...videoGeneration, ...genUpdates },
      })
    },
    [videoGeneration, onConfigChange],
  )

  // ── Reference media upload for Remix task ──────────────────

  const handleRefMediaUploaded = useCallback(
    (mediaRef: MediaReference) => {
      const currentGen = videoGenerationRef.current
      onConfigChange({
        videoGeneration: {
          ...currentGen,
          refMedia: [...currentGen.refMedia, mediaRef],
        },
      })
    },
    [onConfigChange],
  )

  const { uploadingFiles, isUploading, uploadFiles, canAddMore } =
    useRefMediaUpload({
      workspaceId,
      userId,
      currentRefMedia: videoGeneration.refMedia,
      onMediaUploaded: handleRefMediaUploaded,
      maxCount: MAX_VIDEO_REF_MEDIA_COUNT,
    })

  const handleRemoveRefMedia = useCallback(
    (mediaAssetId: string) => {
      onConfigChange({
        videoGeneration: {
          ...videoGeneration,
          refMedia: videoGeneration.refMedia.filter(
            (m) => m.mediaAssetId !== mediaAssetId,
          ),
        },
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
      const updates: Partial<AIVideoConfig> = { task }

      // ref-images-to-video only supports 8s duration (Veo API constraint).
      // Reset duration when switching to this task so UI matches backend behavior.
      if (task === 'ref-images-to-video') {
        updates.videoGeneration = {
          ...videoGeneration,
          duration: 8,
        }
      }

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
    [
      videoGeneration,
      config.endFrameImageGen,
      config.startFrameImageGen,
      onConfigChange,
    ],
  )

  // ── Task-specific modality variants ────────────────────────

  const taskModality = useMemo(() => {
    if (config.task === 'image-to-video') {
      return {
        ...VIDEO_MODALITY,
        supports: { ...VIDEO_MODALITY.supports, referenceMedia: false },
      }
    }
    if (config.task === 'ref-images-to-video') {
      return {
        ...VIDEO_MODALITY,
        durationOptions: REMIX_DURATION_OPTIONS,
      }
    }
    return VIDEO_MODALITY
  }, [config.task])

  // ── Render ────────────────────────────────────────────────

  // Filter steps for @mention (exclude info steps)
  const mentionableSteps = steps.filter((s) => s.type !== 'info')

  return (
    <div className="space-y-6">
      {/* Task selector */}
      <AIVideoTaskSelector task={config.task} onTaskChange={handleTaskChange} />

      {/* Subject Media section */}
      <SubjectMediaSection
        captureStepId={config.captureStepId}
        steps={steps}
        onCaptureStepChange={(captureStepId) =>
          onConfigChange({ captureStepId: captureStepId ?? '' })
        }
        onCaptureAspectRatioChange={onCaptureAspectRatioChange}
        error={getFieldError(errors, 'aiVideo.captureStepId')}
      />

      {/* Output section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Output</h3>
        <AspectRatioSelector
          value={config.aspectRatio}
          onChange={(aspectRatio) =>
            onConfigChange({ aspectRatio: aspectRatio })
          }
          options={VIDEO_ASPECT_RATIO_OPTIONS}
        />
        {(config.task === 'image-to-video' ||
          config.task === 'ref-images-to-video') && (
          <PromptComposer
            modality={taskModality}
            prompt={videoGeneration.prompt}
            onPromptChange={(prompt) => updateVideoGeneration({ prompt })}
            model={videoGeneration.model}
            onModelChange={(model) =>
              updateVideoGeneration({ model: model as AIVideoModel })
            }
            controls={{
              duration: String(videoGeneration.duration ?? 6),
              onDurationChange: (d) => {
                const n = Number(d)
                if (n === 4 || n === 6 || n === 8) {
                  updateVideoGeneration({ duration: n })
                }
              },
            }}
            refMedia={
              config.task === 'ref-images-to-video'
                ? {
                    items: videoGeneration.refMedia,
                    onRemove: handleRemoveRefMedia,
                    uploadingFiles,
                    onFilesSelected: uploadFiles,
                    canAddMore,
                    isUploading,
                  }
                : undefined
            }
            steps={mentionableSteps}
            error={getFieldError(errors, 'aiVideo.videoGeneration.prompt')}
          />
        )}
      </div>

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

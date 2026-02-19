/**
 * CreateTabForm Component
 *
 * Thin orchestrator for the Create tab. Routes to the correct config form
 * based on outcome.type:
 * - null → OutcomeTypePicker
 * - 'photo' → OutcomeTypeSelector + PhotoConfigForm + RemoveOutcomeAction
 * - 'ai.image' → OutcomeTypeSelector + AIImageConfigForm + RemoveOutcomeAction
 *
 * Implements autosave pattern using react-hook-form + useAutoSave (2s debounce).
 *
 * @see specs/072-outcome-schema-redesign
 */
import { useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { PromptComposer } from './PromptComposer'
import { OutcomeTypePicker } from './outcome-picker/OutcomeTypePicker'
import { OutcomeTypeSelector } from './outcome-picker/OutcomeTypeSelector'
import { RemoveOutcomeAction } from './outcome-picker/RemoveOutcomeAction'
import { PhotoConfigForm } from './photo-config/PhotoConfigForm'
import { SourceImageSelector } from './shared-controls/SourceImageSelector'
import { AspectRatioSelector } from './shared-controls/AspectRatioSelector'
import { useUpdateOutcome } from '../hooks'
import { useRefMediaUpload } from '../hooks/useRefMediaUpload'
import {
  getFieldError,
  useOutcomeValidation,
} from '../hooks/useOutcomeValidation'
import {
  createDefaultOutcome,
  initializeOutcomeType,
  sanitizeDisplayName,
} from '../lib/outcome-operations'
import type {
  AIImageModel,
  AIImageOutcomeConfig,
  AspectRatio,
  Experience,
  ExperienceStep,
  MediaReference,
  Outcome,
  OutcomeType,
  PhotoOutcomeConfig,
} from '@clementine/shared'
import { useAuth } from '@/domains/auth'
import { useAutoSave } from '@/shared/forms'
import { useExperienceDesignerStore } from '@/domains/experience/designer'
import { useTrackedMutation } from '@/shared/editor-status'

/** Debounce delay for all changes (ms) */
const AUTOSAVE_DEBOUNCE_MS = 2000

export interface CreateTabFormProps {
  /** Experience data */
  experience: Experience
  /** Workspace ID for media uploads */
  workspaceId: string
}

/**
 * CreateTabForm - Thin orchestrator for Create tab configuration
 */
export function CreateTabForm({ experience, workspaceId }: CreateTabFormProps) {
  const { user } = useAuth()
  const store = useExperienceDesignerStore()

  // Server outcome (source of truth for resets)
  const serverOutcome = experience.draft.outcome ?? createDefaultOutcome()
  const steps = experience.draft.steps

  // Mutation for saving outcome changes (tracked for save status indicator)
  const baseMutation = useUpdateOutcome(workspaceId, experience.id)
  const updateOutcomeMutation = useTrackedMutation(baseMutation, store)

  // Form setup - manages outcome state locally
  const form = useForm<Outcome>({
    defaultValues: serverOutcome,
    resetOptions: {
      keepDirtyValues: true,
      keepErrors: true,
    },
  })

  // Reset form when experience changes (e.g., navigating to different experience)
  useEffect(() => {
    form.reset(serverOutcome)
  }, [experience.id])

  // Auto-save with debounce (2 seconds)
  const { triggerSave } = useAutoSave({
    form,
    originalValues: serverOutcome,
    onUpdate: async () => {
      try {
        const outcome = form.getValues()
        await updateOutcomeMutation.mutateAsync({ outcome })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save output'
        toast.error(message)
      }
    },
    debounceMs: AUTOSAVE_DEBOUNCE_MS,
  })

  // Watch form values for reactive rendering
  const outcome = form.watch()

  // Ref to track current refMedia count for upload hook
  const refMediaRef = useRef(
    outcome.aiImage?.imageGeneration.refMedia ?? [],
  )
  refMediaRef.current = outcome.aiImage?.imageGeneration.refMedia ?? []

  // ── Outcome Type Selection ──────────────────────────────────

  const handleOutcomeTypeSelect = useCallback(
    (type: OutcomeType) => {
      const updated = initializeOutcomeType(outcome, type, steps)
      form.reset(updated, { keepDefaultValues: true })
      triggerSave()
    },
    [form, outcome, steps, triggerSave],
  )

  const handleRemoveOutcome = useCallback(() => {
    // Set type to null — preserve per-type configs for re-selection
    form.setValue('type', null, { shouldDirty: true })
    triggerSave()
  }, [form, triggerSave])

  // ── Photo Config Changes ────────────────────────────────────

  const handlePhotoConfigChange = useCallback(
    (updates: Partial<PhotoOutcomeConfig>) => {
      const currentConfig = form.getValues('photo')
      const newConfig = { ...currentConfig, ...updates }
      form.setValue('photo', newConfig as PhotoOutcomeConfig, {
        shouldDirty: true,
      })

      // Aspect ratio cascade: update capture step's aspect ratio
      if (updates.aspectRatio && newConfig.captureStepId) {
        cascadeAspectRatio(newConfig.captureStepId, updates.aspectRatio)
      }

      triggerSave()
    },
    [form, triggerSave],
  )

  // ── AI Image Config Changes ─────────────────────────────────

  const handleAIImageConfigChange = useCallback(
    (updates: Partial<AIImageOutcomeConfig>) => {
      const currentConfig = form.getValues('aiImage')
      const newConfig = { ...currentConfig, ...updates }
      form.setValue('aiImage', newConfig as AIImageOutcomeConfig, {
        shouldDirty: true,
      })

      // Aspect ratio cascade for i2i
      if (updates.aspectRatio && newConfig.captureStepId) {
        cascadeAspectRatio(newConfig.captureStepId, updates.aspectRatio)
      }

      triggerSave()
    },
    [form, triggerSave],
  )

  // Aspect ratio cascade helper — not a hook, just a function
  // Updates the referenced capture step's aspect ratio to stay in sync
  function cascadeAspectRatio(
    _captureStepId: string,
    _aspectRatio: AspectRatio,
  ) {
    // The capture step's aspect ratio is cascaded during the save mutation
    // in updateExperienceConfigField. This is handled server-side.
    // No client-side cascade needed as the autosave writes the full outcome.
  }

  // ── PromptComposer Handlers (for AI Image) ─────────────────

  const handlePromptChange = useCallback(
    (prompt: string) => {
      const currentConfig = form.getValues('aiImage')
      if (!currentConfig) return
      form.setValue(
        'aiImage',
        {
          ...currentConfig,
          imageGeneration: { ...currentConfig.imageGeneration, prompt },
        },
        { shouldDirty: true },
      )
      triggerSave()
    },
    [form, triggerSave],
  )

  const handleModelChange = useCallback(
    (model: string) => {
      const currentConfig = form.getValues('aiImage')
      if (!currentConfig) return
      form.setValue(
        'aiImage',
        {
          ...currentConfig,
          imageGeneration: {
            ...currentConfig.imageGeneration,
            model: model as AIImageModel,
          },
        },
        { shouldDirty: true },
      )
      triggerSave()
    },
    [form, triggerSave],
  )

  const handleAspectRatioChange = useCallback(
    (aspectRatio: string) => {
      const currentConfig = form.getValues('aiImage')
      if (!currentConfig) return
      form.setValue(
        'aiImage',
        {
          ...currentConfig,
          imageGeneration: {
            ...currentConfig.imageGeneration,
            aspectRatio: aspectRatio as AspectRatio,
          },
        },
        { shouldDirty: true },
      )
      triggerSave()
    },
    [form, triggerSave],
  )

  const handleRemoveRefMedia = useCallback(
    (mediaAssetId: string) => {
      const currentConfig = form.getValues('aiImage')
      if (!currentConfig) return
      form.setValue(
        'aiImage',
        {
          ...currentConfig,
          imageGeneration: {
            ...currentConfig.imageGeneration,
            refMedia: currentConfig.imageGeneration.refMedia.filter(
              (m) => m.mediaAssetId !== mediaAssetId,
            ),
          },
        },
        { shouldDirty: true },
      )
      triggerSave()
    },
    [form, triggerSave],
  )

  const handleMediaUploaded = useCallback(
    (mediaRef: MediaReference) => {
      const sanitizedMediaRef = {
        ...mediaRef,
        displayName: sanitizeDisplayName(mediaRef.displayName),
      }
      const currentConfig = form.getValues('aiImage')
      if (!currentConfig) return
      form.setValue(
        'aiImage',
        {
          ...currentConfig,
          imageGeneration: {
            ...currentConfig.imageGeneration,
            refMedia: [
              ...currentConfig.imageGeneration.refMedia,
              sanitizedMediaRef,
            ],
          },
        },
        { shouldDirty: true },
      )
      triggerSave()
    },
    [form, triggerSave],
  )

  // Reference media upload hook
  const { uploadingFiles, uploadFiles, canAddMore, isUploading } =
    useRefMediaUpload({
      workspaceId,
      userId: user?.uid,
      outcome,
      onMediaUploaded: handleMediaUploaded,
    })

  // Filter steps for @mention (exclude info steps)
  const mentionableSteps = steps.filter(
    (s: ExperienceStep) => s.type !== 'info',
  )

  // Validation - computes errors based on current outcome state
  const validationErrors = useOutcomeValidation(outcome, steps)

  // ── Render ──────────────────────────────────────────────────

  // No outcome type selected → show picker
  if (!outcome.type) {
    return (
      <OutcomeTypePicker onTypeSelect={handleOutcomeTypeSelect} />
    )
  }

  // Photo type
  if (outcome.type === 'photo' && outcome.photo) {
    return (
      <div className="space-y-6">
        <OutcomeTypeSelector
          value={outcome.type}
          onChange={handleOutcomeTypeSelect}
        />
        <PhotoConfigForm
          config={outcome.photo}
          onConfigChange={handlePhotoConfigChange}
          steps={steps}
          errors={validationErrors}
        />
        <div className="border-t pt-4">
          <RemoveOutcomeAction onRemove={handleRemoveOutcome} />
        </div>
      </div>
    )
  }

  // AI Image type
  if (outcome.type === 'ai.image' && outcome.aiImage) {
    return (
      <div className="space-y-6">
        <OutcomeTypeSelector
          value={outcome.type}
          onChange={handleOutcomeTypeSelect}
        />

        {/* Source Image (visible only for image-to-image) */}
        {outcome.aiImage.task === 'image-to-image' && (
          <div className="grid grid-cols-2 gap-4">
            <SourceImageSelector
              value={outcome.aiImage.captureStepId}
              onChange={(captureStepId) =>
                handleAIImageConfigChange({ captureStepId })
              }
              steps={steps}
              error={getFieldError(
                validationErrors,
                'aiImage.captureStepId',
              )}
            />
            <AspectRatioSelector
              value={outcome.aiImage.aspectRatio}
              onChange={(aspectRatio) =>
                handleAIImageConfigChange({ aspectRatio })
              }
            />
          </div>
        )}

        {/* Aspect ratio only (for text-to-image, no source step needed) */}
        {outcome.aiImage.task === 'text-to-image' && (
          <div className="grid grid-cols-2 gap-4">
            <div /> {/* Empty slot */}
            <AspectRatioSelector
              value={outcome.aiImage.aspectRatio}
              onChange={(aspectRatio) =>
                handleAIImageConfigChange({ aspectRatio })
              }
            />
          </div>
        )}

        {/* PromptComposer - reused as-is */}
        <PromptComposer
          prompt={outcome.aiImage.imageGeneration.prompt}
          onPromptChange={handlePromptChange}
          model={outcome.aiImage.imageGeneration.model}
          onModelChange={handleModelChange}
          aspectRatio={outcome.aiImage.imageGeneration.aspectRatio ?? outcome.aiImage.aspectRatio}
          onAspectRatioChange={handleAspectRatioChange}
          refMedia={outcome.aiImage.imageGeneration.refMedia}
          onRefMediaRemove={handleRemoveRefMedia}
          uploadingFiles={uploadingFiles}
          onFilesSelected={uploadFiles}
          canAddMore={canAddMore}
          isUploading={isUploading}
          steps={mentionableSteps}
          disabled={false}
          error={getFieldError(
            validationErrors,
            'aiImage.imageGeneration.prompt',
          )}
        />

        <div className="border-t pt-4">
          <RemoveOutcomeAction onRemove={handleRemoveOutcome} />
        </div>
      </div>
    )
  }

  // Fallback — type set but config not initialized
  return (
    <OutcomeTypePicker onTypeSelect={handleOutcomeTypeSelect} />
  )
}

/**
 * CreateTabForm Component
 *
 * Main form container for configuring AI image generation outcome.
 * Composes OutcomeTypeSelector and PromptComposer for complete configuration.
 *
 * Implements autosave pattern using react-hook-form + useAutoSave:
 * - All changes update local form state immediately (responsive UI)
 * - Single debounced save (2s) batches all changes to Firestore
 * - Avoids race conditions and stale closures
 *
 * @see spec.md - US1 (Configure AI Image Generation) + US2 (Select Outcome Type)
 */
import { useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { PromptComposer } from '../PromptComposer'
import { useUpdateOutcome } from '../../hooks'
import { useRefMediaUpload } from '../../hooks/useRefMediaUpload'
import {
  getFieldError,
  useOutcomeValidation,
} from '../../hooks/useOutcomeValidation'
import {
  createDefaultOutcome,
  sanitizeDisplayName,
} from '../../lib/outcome-operations'
import { AIGenerationToggle } from './AIGenerationToggle'
import { OutcomeTypePicker } from './OutcomeTypePicker'
import { OutcomeTypeSelector } from './OutcomeTypeSelector'
import { RemoveOutcomeAction } from './RemoveOutcomeAction'
import { SourceImageSelector } from './SourceImageSelector'
import type {
  AIImageAspectRatio,
  AIImageModel,
  Experience,
  ExperienceStep,
  MediaReference,
  Outcome,
  OutcomeType,
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
 * CreateTabForm - Main form for Create tab configuration
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
          error instanceof Error ? error.message : 'Failed to save outcome'
        toast.error(message)
      }
    },
    debounceMs: AUTOSAVE_DEBOUNCE_MS,
  })

  // Watch form values for reactive rendering
  const outcome = form.watch()

  // Ref to track current refMedia count for upload hook
  const refMediaRef = useRef(outcome.imageGeneration.refMedia)
  refMediaRef.current = outcome.imageGeneration.refMedia

  // Handle outcome type selection from picker
  const handleOutcomeTypeSelect = useCallback(
    (type: OutcomeType) => {
      form.setValue('type', type, { shouldDirty: true })
      triggerSave()
    },
    [form, triggerSave],
  )

  // Handle outcome removal - reset to default (type: null)
  const handleRemoveOutcome = useCallback(() => {
    const defaultOutcome = createDefaultOutcome()
    form.reset(defaultOutcome)
    triggerSave()
  }, [form, triggerSave])

  // Handle model change
  const handleModelChange = useCallback(
    (model: string) => {
      form.setValue('imageGeneration.model', model as AIImageModel, {
        shouldDirty: true,
      })
      triggerSave()
    },
    [form, triggerSave],
  )

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback(
    (aspectRatio: string) => {
      form.setValue(
        'imageGeneration.aspectRatio',
        aspectRatio as AIImageAspectRatio,
        { shouldDirty: true },
      )
      triggerSave()
    },
    [form, triggerSave],
  )

  // Handle capture step ID change
  const handleCaptureStepIdChange = useCallback(
    (captureStepId: string | null) => {
      form.setValue('captureStepId', captureStepId, { shouldDirty: true })
      triggerSave()
    },
    [form, triggerSave],
  )

  // Handle AI enabled toggle change
  const handleAiEnabledChange = useCallback(
    (aiEnabled: boolean) => {
      form.setValue('aiEnabled', aiEnabled, { shouldDirty: true })
      triggerSave()
    },
    [form, triggerSave],
  )

  // Handle prompt change
  const handlePromptChange = useCallback(
    (prompt: string) => {
      form.setValue('imageGeneration.prompt', prompt, { shouldDirty: true })
      triggerSave()
    },
    [form, triggerSave],
  )

  // Handle reference media removal
  const handleRemoveRefMedia = useCallback(
    (mediaAssetId: string) => {
      const current = form.getValues('imageGeneration.refMedia')
      const updated = current.filter((m) => m.mediaAssetId !== mediaAssetId)
      form.setValue('imageGeneration.refMedia', updated, { shouldDirty: true })
      triggerSave()
    },
    [form, triggerSave],
  )

  // Handle media upload complete
  // Sanitize displayName to remove invalid characters (}, {, :)
  const handleMediaUploaded = useCallback(
    (mediaRef: MediaReference) => {
      const sanitizedMediaRef = {
        ...mediaRef,
        displayName: sanitizeDisplayName(mediaRef.displayName),
      }
      const current = form.getValues('imageGeneration.refMedia')
      form.setValue(
        'imageGeneration.refMedia',
        [...current, sanitizedMediaRef],
        {
          shouldDirty: true,
        },
      )
      triggerSave()
    },
    [form, triggerSave],
  )

  // Reference media upload hook
  // Uses ref to get current refMedia count to avoid stale closure
  const { uploadingFiles, uploadFiles, canAddMore, isUploading } =
    useRefMediaUpload({
      workspaceId,
      userId: user?.uid,
      outcome: {
        ...outcome,
        imageGeneration: {
          ...outcome.imageGeneration,
          refMedia: refMediaRef.current,
        },
      },
      onMediaUploaded: handleMediaUploaded,
    })

  // Filter steps for @mention (exclude info steps)
  const mentionableSteps = steps.filter(
    (s: ExperienceStep) => s.type !== 'info',
  )

  // Validation - computes errors based on current outcome state
  const validationErrors = useOutcomeValidation(outcome, steps)

  // No outcome type selected - show picker
  if (!outcome.type) {
    return <OutcomeTypePicker onSelect={handleOutcomeTypeSelect} />
  }

  // Outcome type selected - show editor form
  return (
    <div className="space-y-6">
      {/* Outcome Type Selector - switch between types */}
      <OutcomeTypeSelector
        value={outcome.type}
        onChange={handleOutcomeTypeSelect}
      />

      {/* Source Image Selection */}
      <SourceImageSelector
        value={outcome.captureStepId}
        onChange={handleCaptureStepIdChange}
        steps={steps}
        error={getFieldError(validationErrors, 'captureStepId')}
      />

      {/* AI Generation Toggle */}
      <AIGenerationToggle
        value={outcome.aiEnabled}
        onChange={handleAiEnabledChange}
      />

      {/* AI Generation Configuration - disabled when AI is off */}
      <PromptComposer
        prompt={outcome.imageGeneration.prompt}
        onPromptChange={handlePromptChange}
        model={outcome.imageGeneration.model}
        onModelChange={handleModelChange}
        aspectRatio={outcome.imageGeneration.aspectRatio}
        onAspectRatioChange={handleAspectRatioChange}
        refMedia={outcome.imageGeneration.refMedia}
        onRefMediaRemove={handleRemoveRefMedia}
        uploadingFiles={uploadingFiles}
        onFilesSelected={uploadFiles}
        canAddMore={canAddMore}
        isUploading={isUploading}
        steps={mentionableSteps}
        disabled={!outcome.aiEnabled}
        error={getFieldError(validationErrors, 'prompt')}
      />

      {/* Remove Outcome Action */}
      <div className="border-t pt-4">
        <RemoveOutcomeAction onRemove={handleRemoveOutcome} />
      </div>
    </div>
  )
}

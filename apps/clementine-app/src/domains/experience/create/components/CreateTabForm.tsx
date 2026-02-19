/**
 * CreateTabForm Component
 *
 * Thin orchestrator for the Create tab. Routes to the correct config form
 * based on outcome.type:
 * - null → OutcomeTypePicker
 * - 'photo' → OutcomeTypeSelector + PhotoConfigForm + RemoveOutcomeAction
 * - 'ai.image' → OutcomeTypeSelector + AIImageConfigForm + RemoveOutcomeAction
 *
 * Each config form is self-contained — it owns its own handlers and hooks.
 * This orchestrator only manages form state, type selection, and autosave.
 *
 * @see specs/072-outcome-schema-redesign
 */
import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { useUpdateOutcome } from '../hooks'
import { useOutcomeValidation } from '../hooks/useOutcomeValidation'
import {
  createDefaultOutcome,
  initializeOutcomeType,
} from '../lib/outcome-operations'
import { AIImageConfigForm } from './ai-image-config/AIImageConfigForm'
import { OutcomeTypePicker } from './outcome-picker/OutcomeTypePicker'
import { OutcomeTypeSelector } from './outcome-picker/OutcomeTypeSelector'
import { RemoveOutcomeAction } from './outcome-picker/RemoveOutcomeAction'
import { PhotoConfigForm } from './photo-config/PhotoConfigForm'
import type {
  AIImageOutcomeConfig,
  Experience,
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

  // Validation - computes errors based on current outcome state
  const validationErrors = useOutcomeValidation(outcome, steps)

  // ── Type Selection & Removal ──────────────────────────────

  const handleOutcomeTypeSelect = useCallback(
    (type: OutcomeType) => {
      const updated = initializeOutcomeType(outcome, type, steps)
      form.reset(updated, { keepDefaultValues: true })
      triggerSave()
    },
    [form, outcome, steps, triggerSave],
  )

  const handleRemoveOutcome = useCallback(() => {
    form.setValue('type', null, { shouldDirty: true })
    triggerSave()
  }, [form, triggerSave])

  // ── Per-Type Config Change Handlers ───────────────────────

  const handlePhotoConfigChange = useCallback(
    (updates: Partial<PhotoOutcomeConfig>) => {
      const currentConfig = form.getValues('photo')
      form.setValue(
        'photo',
        { ...currentConfig, ...updates } as PhotoOutcomeConfig,
        { shouldDirty: true },
      )
      triggerSave()
    },
    [form, triggerSave],
  )

  const handleAIImageConfigChange = useCallback(
    (updates: Partial<AIImageOutcomeConfig>) => {
      const currentConfig = form.getValues('aiImage')
      form.setValue(
        'aiImage',
        { ...currentConfig, ...updates } as AIImageOutcomeConfig,
        { shouldDirty: true },
      )
      triggerSave()
    },
    [form, triggerSave],
  )

  // ── Render ────────────────────────────────────────────────

  // No outcome type selected → show picker
  if (!outcome.type) {
    return <OutcomeTypePicker onTypeSelect={handleOutcomeTypeSelect} />
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
        <AIImageConfigForm
          config={outcome.aiImage}
          onConfigChange={handleAIImageConfigChange}
          steps={steps}
          errors={validationErrors}
          workspaceId={workspaceId}
          userId={user?.uid}
        />
        <div className="border-t pt-4">
          <RemoveOutcomeAction onRemove={handleRemoveOutcome} />
        </div>
      </div>
    )
  }

  // Fallback — type set but config not initialized
  return <OutcomeTypePicker onTypeSelect={handleOutcomeTypeSelect} />
}

/**
 * StepConfigPanelContainer
 *
 * Container that manages step config editing with debounced auto-save.
 * Uses react-hook-form + useAutoSave pattern (aligned with WelcomeEditorPage).
 */
import { useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { StepConfigPanel } from '../components/StepConfigPanel'
import { useExperienceDesignerStore } from '../stores'
import { useUpdateExperienceDraft } from '../hooks/useUpdateExperienceDraft'
import type { Step, StepConfig } from '../../steps/registry/step-registry'
import type { Experience } from '../../shared/schemas/experience.schema'
import { useTrackedMutation } from '@/shared/editor-status'
import { useAutoSave } from '@/shared/forms'

interface StepConfigPanelContainerProps {
  /** Currently selected step */
  step: Step | null
  /** All steps in the experience (needed for updating) */
  steps: Step[]
  /** Experience document */
  experience: Experience
  /** Workspace ID */
  workspaceId: string
  /** Callback to update local steps state */
  onStepsChange: (steps: Step[]) => void
  /** Optional disabled state */
  disabled?: boolean
}

/**
 * Generic config type for react-hook-form.
 * StepConfig is a union type, so we use Record<string, unknown> for form management.
 */
type FormConfig = Record<string, unknown>

/**
 * Container for step config editing
 *
 * Architecture (aligned with WelcomeEditorPage):
 * - Uses react-hook-form to manage selected step's config
 * - Uses useAutoSave for 2s debounced saves
 * - Updates local steps state immediately for live preview
 * - Saves to Firestore after debounce period
 *
 * @example
 * ```tsx
 * <StepConfigPanelContainer
 *   step={selectedStep}
 *   steps={steps}
 *   experience={experience}
 *   workspaceId={workspaceId}
 *   onStepsChange={setSteps}
 * />
 * ```
 */
export function StepConfigPanelContainer({
  step,
  steps,
  experience,
  workspaceId,
  onStepsChange,
  disabled,
}: StepConfigPanelContainerProps) {
  const store = useExperienceDesignerStore()
  const baseMutation = useUpdateExperienceDraft()
  const updateDraft = useTrackedMutation(baseMutation, store)

  // Track current steps for save (updated via ref to avoid stale closures)
  const stepsRef = useRef(steps)
  stepsRef.current = steps

  // Form setup - manages the selected step's config
  // Use FormConfig (Record<string, unknown>) since StepConfig is a union type
  const form = useForm<FormConfig>({
    defaultValues: (step?.config ?? {}) as FormConfig,
  })

  // Reset form when selected step changes
  useEffect(() => {
    if (step) {
      form.reset(step.config as FormConfig)
    }
  }, [step?.id, step?.config, form])

  // Auto-save with debounce (2 seconds)
  // fieldsToCompare omitted = compare all fields automatically
  const { triggerSave } = useAutoSave({
    form,
    originalValues: (step?.config ?? {}) as FormConfig,
    onUpdate: async () => {
      if (!step) return

      try {
        // Get current steps from ref (avoids stale closure)
        const currentSteps = stepsRef.current

        // Save full steps array with updated config
        await updateDraft.mutateAsync({
          workspaceId,
          experienceId: experience.id,
          draft: {
            ...experience.draft,
            steps: currentSteps as unknown as typeof experience.draft.steps,
          },
        })
        // No toast - EditorSaveStatus indicator handles feedback
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save step config'
        toast.error(message)
      }
    },
    debounceMs: 2000,
  })

  // Handle config changes from config panels
  const handleConfigChange = useCallback(
    (updates: Partial<StepConfig>) => {
      if (!step) return

      // Update form values
      for (const [key, value] of Object.entries(updates)) {
        form.setValue(key, value, {
          shouldDirty: true,
        })
      }

      // Update local steps state immediately for live preview
      const updatedSteps = steps.map((s) =>
        s.id === step.id
          ? ({ ...s, config: { ...s.config, ...updates } } as Step)
          : s,
      )
      onStepsChange(updatedSteps)

      // Trigger debounced save
      triggerSave()
    },
    [step, steps, form, onStepsChange, triggerSave],
  )

  return (
    <StepConfigPanel
      step={step}
      onConfigChange={handleConfigChange}
      disabled={disabled}
    />
  )
}

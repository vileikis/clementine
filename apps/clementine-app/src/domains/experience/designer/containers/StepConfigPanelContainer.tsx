/**
 * StepConfigPanelContainer
 *
 * Container that manages step config editing with debounced auto-save.
 * Separates config editing concerns from the main designer page.
 */
import { useCallback, useEffect, useRef } from 'react'

import { StepConfigPanel } from '../components/StepConfigPanel'
import { useExperienceDesignerStore } from '../stores'
import { useUpdateExperienceDraft } from '../hooks/useUpdateExperienceDraft'
import type { Step, StepConfig } from '../../steps/registry/step-registry'
import type { Experience } from '../../shared/schemas/experience.schema'
import { useTrackedMutation } from '@/shared/editor-status'

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

/** Debounce delay for config changes (2 seconds) */
const CONFIG_DEBOUNCE_MS = 2000

/**
 * Container for step config editing
 *
 * Responsibilities:
 * - Provides debounced onConfigChange handler
 * - Updates local state immediately for live preview
 * - Saves to Firestore after 2s of inactivity
 * - Tracks save status via editor store
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

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const pendingStepsRef = useRef<Step[] | null>(null)

  // Save function
  const saveConfig = useCallback(
    async (stepsToSave: Step[]) => {
      await updateDraft.mutateAsync({
        workspaceId,
        experienceId: experience.id,
        draft: {
          ...experience.draft,
          steps: stepsToSave as unknown as typeof experience.draft.steps,
        },
      })
    },
    [workspaceId, experience.id, experience.draft, updateDraft],
  )

  // Debounced config change handler
  const handleConfigChange = useCallback(
    (updates: Partial<StepConfig>) => {
      if (!step) return

      // Update local state immediately for live preview
      const updatedSteps = steps.map((s) =>
        s.id === step.id
          ? ({ ...s, config: { ...s.config, ...updates } } as Step)
          : s,
      )
      onStepsChange(updatedSteps)

      // Store pending steps for debounced save
      pendingStepsRef.current = updatedSteps

      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // Schedule save after debounce
      debounceRef.current = setTimeout(() => {
        if (pendingStepsRef.current) {
          saveConfig(pendingStepsRef.current)
          pendingStepsRef.current = null
        }
      }, CONFIG_DEBOUNCE_MS)
    },
    [step, steps, onStepsChange, saveConfig],
  )

  // Cleanup on unmount or step change
  useEffect(() => {
    return () => {
      // Save any pending changes before cleanup
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (pendingStepsRef.current) {
        saveConfig(pendingStepsRef.current)
        pendingStepsRef.current = null
      }
    }
  }, [step?.id, saveConfig])

  return (
    <StepConfigPanel
      step={step}
      onConfigChange={handleConfigChange}
      disabled={disabled}
    />
  )
}

/**
 * ExperienceDesignerPage Container
 *
 * Main content area for the experience designer with 3-column layout.
 * Left: Step list | Center: Preview | Right: Config panel
 *
 * Handles:
 * - Step list operations (add, delete, reorder) with immediate save
 * - Config editing is delegated to StepConfigPanelContainer (debounced save)
 */
import { useCallback, useState } from 'react'

import { createStep } from '../../steps/registry/step-utils'
import { AddStepDialog } from '../components/AddStepDialog'
import { StepList } from '../components/StepList'
import { StepPreview } from '../components/StepPreview'
import { useStepSelection } from '../hooks/useStepSelection'
import { useUpdateDraftSteps } from '../hooks/useUpdateDraftSteps'
import { StepConfigPanelContainer } from './StepConfigPanelContainer'
import type { Step, StepType } from '../../steps/registry/step-registry'
import type { Experience } from '@/domains/experience/shared'

interface ExperienceDesignerPageProps {
  experience: Experience
  workspaceSlug: string
  workspaceId: string
}

/**
 * Experience designer with 3-column responsive layout
 *
 * Architecture:
 * - List operations (add/delete/reorder): Save immediately via useUpdateDraftSteps
 * - Config editing: Delegated to StepConfigPanelContainer with 2s debounce
 *
 * Layout:
 * - Desktop (lg+): 3 columns
 * - Tablet (md): 2 columns with collapsible config panel
 * - Mobile: Single column with bottom sheet (Phase 8)
 */
export function ExperienceDesignerPage({
  experience,
  workspaceId,
}: ExperienceDesignerPageProps) {
  // Local step state for immediate UI updates
  const [steps, setSteps] = useState<Step[]>(
    () => (experience.draft.steps ?? []) as unknown as Step[],
  )

  // Step selection with URL sync
  const { selectedStep, selectStep, clearSelection } = useStepSelection(steps)

  // Add step dialog state
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Mutation for immediate saves (list operations)
  const updateSteps = useUpdateDraftSteps(workspaceId, experience.id)

  // Handle adding a new step (immediate save)
  const handleAddStep = useCallback(
    (type: StepType) => {
      const newStep = createStep(type)
      const newSteps = [...steps, newStep]

      // Update local state
      setSteps(newSteps)

      // Save immediately
      updateSteps.mutate({ steps: newSteps })

      // Auto-select the new step
      selectStep(newStep.id)
    },
    [steps, selectStep, updateSteps],
  )

  // Handle reordering steps (immediate save)
  const handleReorderSteps = useCallback(
    (newSteps: Step[]) => {
      // Update local state
      setSteps(newSteps)

      // Save immediately
      updateSteps.mutate({ steps: newSteps })
    },
    [updateSteps],
  )

  // Handle deleting a step (immediate save)
  const handleDeleteStep = useCallback(
    (stepId: string) => {
      const stepIndex = steps.findIndex((step) => step.id === stepId)
      const newSteps = steps.filter((step) => step.id !== stepId)

      // Update local state
      setSteps(newSteps)

      // Save immediately
      updateSteps.mutate({ steps: newSteps })

      // Update selection if we deleted the selected step
      if (selectedStep?.id === stepId) {
        if (newSteps.length === 0) {
          clearSelection()
        } else if (stepIndex >= newSteps.length) {
          // Deleted the last step, select the new last step
          selectStep(newSteps[newSteps.length - 1].id)
        } else {
          // Select the step that's now at the deleted step's position
          selectStep(newSteps[stepIndex].id)
        }
      }
    },
    [steps, selectedStep?.id, selectStep, clearSelection, updateSteps],
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left column: Step list */}
      <aside className="hidden w-64 shrink-0 border-r bg-background md:block lg:w-72">
        <StepList
          steps={steps}
          selectedStepId={selectedStep?.id ?? null}
          onSelectStep={selectStep}
          onReorderSteps={handleReorderSteps}
          onDeleteStep={handleDeleteStep}
          onAddStep={() => setShowAddDialog(true)}
        />
      </aside>

      {/* Center column: Preview */}
      <main className="flex min-w-0 flex-1 flex-col">
        <StepPreview step={selectedStep} />
      </main>

      {/* Right column: Config panel (with debounced auto-save) */}
      <aside className="hidden w-80 shrink-0 border-l bg-background lg:block">
        <StepConfigPanelContainer
          step={selectedStep}
          steps={steps}
          experience={experience}
          workspaceId={workspaceId}
          onStepsChange={setSteps}
        />
      </aside>

      {/* Add step dialog */}
      <AddStepDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        profile={experience.profile}
        onAddStep={handleAddStep}
      />
    </div>
  )
}

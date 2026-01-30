/**
 * ExperienceCollectPage Container
 *
 * Main content area for the Collect tab with 3-column layout.
 * Left: Step list | Center: Preview | Right: Config panel
 *
 * Handles:
 * - Step list operations (add, delete, reorder) with immediate save
 * - Config editing is delegated to StepConfigPanelContainer (debounced save)
 * - Mobile responsive layout with Sheet for step list and config panel
 */
import { useCallback, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { List, Settings } from 'lucide-react'

import { ensureAllStepsHaveNames } from '../../steps/registry/step-name.helpers'
import { createStep } from '../../steps/registry/step-utils'
import { AddStepDialog } from '../components/AddStepDialog'
import { StepList } from '../components/StepList'
import { StepPreview } from '../components/StepPreview'
import { useStepSelection } from '../hooks/useStepSelection'
import { useUpdateDraftSteps } from '../hooks/useUpdateDraftSteps'
import { StepConfigPanelContainer } from './StepConfigPanelContainer'
import type { Step, StepType } from '../../steps/registry/step-registry'
import { useWorkspace } from '@/domains/workspace'
import { useWorkspaceExperience } from '@/domains/experience'
import { Button } from '@/ui-kit/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/ui-kit/ui/sheet'

/**
 * Experience Collect tab with 3-column responsive layout
 *
 * Architecture:
 * - List operations (add/delete/reorder): Save immediately via useUpdateDraftSteps
 * - Config editing: Delegated to StepConfigPanelContainer with 2s debounce
 *
 * Layout:
 * - Desktop (lg+): 3 columns
 * - Tablet (md): 2 columns with collapsible config panel
 * - Mobile: Single column with bottom sheet
 */
export function ExperienceCollectPage() {
  const { workspaceSlug, experienceId } = useParams({ strict: false })
  const { data: workspace } = useWorkspace(workspaceSlug ?? '')
  const { data: experience } = useWorkspaceExperience(
    workspace?.id ?? '',
    experienceId ?? '',
  )

  // Safety check - should not happen due to parent route
  if (!experience || !workspace) {
    return null
  }

  const workspaceId = workspace.id
  // Local step state for immediate UI updates
  // Apply lazy migration to ensure all steps have names (for backward compatibility)
  const [steps, setSteps] = useState<Step[]>(() =>
    ensureAllStepsHaveNames(experience.draft.steps ?? []),
  )

  // Step selection with URL sync
  const { selectedStep, selectStep, clearSelection } = useStepSelection(steps)

  // Add step dialog state
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Mobile sheet states
  const [showStepListSheet, setShowStepListSheet] = useState(false)
  const [showConfigSheet, setShowConfigSheet] = useState(false)

  // Mutation for immediate saves (list operations)
  const updateSteps = useUpdateDraftSteps(workspaceId, experience.id)

  // Handle adding a new step (immediate save)
  const handleAddStep = useCallback(
    (type: StepType) => {
      const newStep = createStep(type, steps)
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

  // Handle renaming a step (immediate save)
  const handleRenameStep = useCallback(
    (stepId: string, newName: string) => {
      const newSteps = steps.map((step) =>
        step.id === stepId ? { ...step, name: newName } : step,
      )

      // Update local state
      setSteps(newSteps)

      // Save immediately
      updateSteps.mutate({ steps: newSteps })
    },
    [steps, updateSteps],
  )

  // Mobile step selection handler - opens config sheet
  const handleMobileSelectStep = useCallback(
    (stepId: string) => {
      selectStep(stepId)
      setShowStepListSheet(false)
      setShowConfigSheet(true)
    },
    [selectStep],
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden h-full">
      {/* Mobile action bar - visible on small screens */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-2 md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStepListSheet(true)}
        >
          <List className="mr-2 h-4 w-4" />
          Steps ({steps.length})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfigSheet(true)}
          disabled={!selectedStep}
        >
          <Settings className="mr-2 h-4 w-4" />
          Configure
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Step list - hidden on mobile */}
        <aside className="hidden w-64 shrink-0 border-r bg-background md:block lg:w-72">
          <StepList
            steps={steps}
            selectedStepId={selectedStep?.id ?? null}
            onSelectStep={selectStep}
            onReorderSteps={handleReorderSteps}
            onRenameStep={handleRenameStep}
            onDeleteStep={handleDeleteStep}
            onAddStep={() => setShowAddDialog(true)}
          />
        </aside>

        {/* Center column: Preview */}
        <main className="flex min-w-0 flex-1 flex-col">
          <StepPreview step={selectedStep} />
        </main>

        {/* Right column: Config panel - hidden on mobile and tablet */}
        <aside className="hidden w-80 shrink-0 border-l bg-background lg:block">
          <StepConfigPanelContainer
            step={selectedStep}
            steps={steps}
            experience={experience}
            workspaceId={workspaceId}
            onStepsChange={setSteps}
          />
        </aside>
      </div>

      {/* Mobile sheet: Step list */}
      <Sheet open={showStepListSheet} onOpenChange={setShowStepListSheet}>
        <SheetContent side="left" className="w-[300px] p-0 sm:max-w-[300px]">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle>Steps</SheetTitle>
          </SheetHeader>
          <div className="flex h-[calc(100%-57px)] flex-col">
            <StepList
              steps={steps}
              selectedStepId={selectedStep?.id ?? null}
              onSelectStep={handleMobileSelectStep}
              onReorderSteps={handleReorderSteps}
              onRenameStep={handleRenameStep}
              onDeleteStep={handleDeleteStep}
              onAddStep={() => {
                setShowStepListSheet(false)
                setShowAddDialog(true)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile/Tablet sheet: Config panel */}
      <Sheet open={showConfigSheet} onOpenChange={setShowConfigSheet}>
        <SheetContent side="right" className="w-[320px] p-0 sm:max-w-[320px]">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle>Configure Step</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100%-57px)] overflow-y-auto">
            <StepConfigPanelContainer
              step={selectedStep}
              steps={steps}
              experience={experience}
              workspaceId={workspaceId}
              onStepsChange={setSteps}
            />
          </div>
        </SheetContent>
      </Sheet>

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

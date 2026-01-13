/**
 * ExperienceDesignerPage Container
 *
 * Main content area for the experience designer with 3-column layout.
 * Left: Step list | Center: Preview | Right: Config panel
 */
import { useCallback, useState } from 'react'

import { createStep } from '../../steps/registry/step-utils'
import { AddStepDialog } from '../components/AddStepDialog'
import { StepList } from '../components/StepList'
import { StepPreview } from '../components/StepPreview'
import { StepConfigPanel } from '../components/StepConfigPanel'
import { useStepSelection } from '../hooks/useStepSelection'
import type {
  Step,
  StepConfig,
  StepType,
} from '../../steps/registry/step-registry'
import type { Experience } from '@/domains/experience/shared'

interface ExperienceDesignerPageProps {
  experience: Experience
  workspaceSlug: string
}

/**
 * Experience designer with 3-column responsive layout
 *
 * Manages local step state for immediate UI updates.
 * Auto-save to draft will be added in Phase 5 (US3).
 *
 * Layout:
 * - Desktop (lg+): 3 columns
 * - Tablet (md): 2 columns with collapsible config panel
 * - Mobile: Single column with bottom sheet (Phase 8)
 */
export function ExperienceDesignerPage({
  experience,
}: ExperienceDesignerPageProps) {
  // Local step state for immediate UI updates
  // This starts with the draft steps from the experience
  // We use unknown as an intermediate type since Firestore returns a loose schema
  const [steps, setSteps] = useState<Step[]>(
    () => (experience.draft.steps ?? []) as unknown as Step[],
  )

  // Step selection with URL sync
  const { selectedStep, selectStep } = useStepSelection(steps)

  // Add step dialog state
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Handle adding a new step
  const handleAddStep = useCallback(
    (type: StepType) => {
      const newStep = createStep(type)
      setSteps((prev) => [...prev, newStep])
      // Auto-select the new step
      selectStep(newStep.id)
    },
    [selectStep],
  )

  // Handle step config changes
  const handleConfigChange = useCallback(
    (updates: Partial<StepConfig>) => {
      if (!selectedStep) return

      setSteps((prev) =>
        prev.map((step) =>
          step.id === selectedStep.id
            ? ({ ...step, config: { ...step.config, ...updates } } as Step)
            : step,
        ),
      )
    },
    [selectedStep],
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left column: Step list */}
      <aside className="hidden w-64 shrink-0 border-r bg-background md:block lg:w-72">
        <StepList
          steps={steps}
          selectedStepId={selectedStep?.id ?? null}
          onSelectStep={selectStep}
          onAddStep={() => setShowAddDialog(true)}
        />
      </aside>

      {/* Center column: Preview */}
      <main className="flex min-w-0 flex-1 flex-col">
        <StepPreview step={selectedStep} />
      </main>

      {/* Right column: Config panel */}
      <aside className="hidden w-80 shrink-0 border-l bg-background lg:block">
        <StepConfigPanel
          step={selectedStep}
          onConfigChange={handleConfigChange}
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

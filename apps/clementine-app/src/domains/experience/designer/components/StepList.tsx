/**
 * StepList Component
 *
 * Left sidebar showing the list of steps in the experience.
 * Includes "Add Step" button and step items with selection handling.
 *
 * Note: DnD reordering will be added in Phase 4 (US2).
 */
import { Plus } from 'lucide-react'

import { StepListItem } from './StepListItem'
import type { Step } from '../../steps/registry/step-registry'
import { Button } from '@/ui-kit/ui/button'
import { ScrollArea } from '@/ui-kit/ui/scroll-area'

interface StepListProps {
  /** Array of steps in the experience */
  steps: Step[]
  /** Currently selected step ID */
  selectedStepId: string | null
  /** Callback when a step is selected */
  onSelectStep: (stepId: string) => void
  /** Callback when "Add Step" is clicked */
  onAddStep: () => void
  /** Optional disabled state */
  disabled?: boolean
}

/**
 * Step list sidebar with add button
 *
 * Displays a vertical list of steps with selection state.
 * Shows empty state when no steps exist.
 *
 * @example
 * ```tsx
 * <StepList
 *   steps={experience.draft.steps}
 *   selectedStepId={selectedStepId}
 *   onSelectStep={(id) => navigate({ search: { step: id } })}
 *   onAddStep={() => setShowAddDialog(true)}
 * />
 * ```
 */
export function StepList({
  steps,
  selectedStepId,
  onSelectStep,
  onAddStep,
  disabled,
}: StepListProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header with Add button */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Steps</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddStep}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Step list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">No steps yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click "Add" to create your first step
              </p>
            </div>
          ) : (
            steps.map((step) => (
              <StepListItem
                key={step.id}
                step={step}
                isSelected={selectedStepId === step.id}
                onClick={() => onSelectStep(step.id)}
                disabled={disabled}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

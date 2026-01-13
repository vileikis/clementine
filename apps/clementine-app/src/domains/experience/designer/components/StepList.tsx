/**
 * StepList Component
 *
 * Left sidebar showing the list of steps in the experience.
 * Includes "Add Step" button, step items with selection handling,
 * and drag-and-drop reordering support.
 */
import {
  DndContext,
  
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'

import { StepListItem } from './StepListItem'
import type {DragEndEvent} from '@dnd-kit/core';
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
  /** Callback when steps are reordered */
  onReorderSteps: (steps: Step[]) => void
  /** Callback when a step is deleted */
  onDeleteStep: (stepId: string) => void
  /** Callback when "Add Step" is clicked */
  onAddStep: () => void
  /** Optional disabled state */
  disabled?: boolean
}

/**
 * Step list sidebar with add button and drag-and-drop reordering
 *
 * Displays a vertical list of steps with selection state.
 * Shows empty state when no steps exist.
 * Supports keyboard and pointer-based drag-and-drop.
 *
 * @example
 * ```tsx
 * <StepList
 *   steps={experience.draft.steps}
 *   selectedStepId={selectedStepId}
 *   onSelectStep={(id) => navigate({ search: { step: id } })}
 *   onReorderSteps={(newSteps) => setSteps(newSteps)}
 *   onDeleteStep={(id) => handleDeleteStep(id)}
 *   onAddStep={() => setShowAddDialog(true)}
 * />
 * ```
 */
export function StepList({
  steps,
  selectedStepId,
  onSelectStep,
  onReorderSteps,
  onDeleteStep,
  onAddStep,
  disabled,
}: StepListProps) {
  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Handle drag end to reorder steps
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((step) => step.id === active.id)
      const newIndex = steps.findIndex((step) => step.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSteps = [...steps]
        const [movedStep] = newSteps.splice(oldIndex, 1)
        newSteps.splice(newIndex, 0, movedStep)
        onReorderSteps(newSteps)
      }
    }
  }

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={steps.map((step) => step.id)}
                strategy={verticalListSortingStrategy}
              >
                {steps.map((step) => (
                  <StepListItem
                    key={step.id}
                    step={step}
                    isSelected={selectedStepId === step.id}
                    onClick={() => onSelectStep(step.id)}
                    onDelete={() => onDeleteStep(step.id)}
                    disabled={disabled}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

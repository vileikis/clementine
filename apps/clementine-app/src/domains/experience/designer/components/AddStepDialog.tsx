/**
 * AddStepDialog Component
 *
 * Modal dialog for adding new steps to an experience.
 * Shows step types grouped by category, filtered by experience type.
 */
import {
  getCategoryColorClasses,
  getCategoryLabel,
  getStepsByCategoryForType,
} from '../../steps/registry/step-utils'
import type { ExperienceType } from '@clementine/shared'
import type { StepCategory, StepType } from '../../steps/registry/step-registry'
import { Button } from '@/ui-kit/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/ui/dialog'
import { cn } from '@/shared/utils'

interface AddStepDialogProps {
  /** Dialog open state */
  open: boolean
  /** Dialog state change handler */
  onOpenChange: (open: boolean) => void
  /** Experience type for filtering available step types */
  type: ExperienceType
  /** Callback when a step type is selected */
  onAddStep: (type: StepType) => void
}

export function AddStepDialog({
  open,
  onOpenChange,
  type,
  onAddStep,
}: AddStepDialogProps) {
  const stepsByCategory = getStepsByCategoryForType(type)

  // Filter out empty categories
  const categories = (
    Object.entries(stepsByCategory) as [
      StepCategory,
      typeof stepsByCategory.info,
    ][]
  ).filter(([, steps]) => steps.length > 0)

  const handleStepSelect = (stepType: StepType) => {
    onAddStep(stepType)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Step</DialogTitle>
          <DialogDescription>
            Choose a step type to add to your experience.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {categories.map(([category, steps]) => (
            <div key={category} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {getCategoryLabel(category)}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {steps.map((stepDef) => {
                  const Icon = stepDef.icon
                  const colorClasses = getCategoryColorClasses(stepDef.category)
                  return (
                    <Button
                      key={stepDef.type}
                      variant="outline"
                      className={cn(
                        'h-auto flex-col items-start gap-1 p-3 text-left',
                        'hover:bg-accent hover:text-accent-foreground',
                      )}
                      onClick={() => handleStepSelect(stepDef.type)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                            colorClasses.wrapper,
                          )}
                        >
                          <Icon className={cn('h-4 w-4', colorClasses.icon)} />
                        </div>
                        <span className="font-medium">{stepDef.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {stepDef.description}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

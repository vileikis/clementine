/**
 * AddStepDialog Component
 *
 * Modal dialog for adding new steps to an experience.
 * Shows step types grouped by category, filtered by experience profile.
 */
import {
  getCategoryLabel,
  getStepsByCategoryForProfile,
} from '../../steps/registry/step-utils'
import type { ExperienceProfile } from '../../shared/schemas/experience.schema'
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
  /** Experience profile for filtering available step types */
  profile: ExperienceProfile
  /** Callback when a step type is selected */
  onAddStep: (type: StepType) => void
}

/**
 * Dialog for adding new steps to an experience
 *
 * Shows step types grouped by category (Information, Input, Capture, Transform).
 * Available step types are filtered based on the experience profile.
 *
 * @example
 * ```tsx
 * <AddStepDialog
 *   open={showAddStep}
 *   onOpenChange={setShowAddStep}
 *   profile={experience.profile}
 *   onAddStep={(type) => {
 *     const step = createStep(type)
 *     setSteps([...steps, step])
 *     setShowAddStep(false)
 *   }}
 * />
 * ```
 */
export function AddStepDialog({
  open,
  onOpenChange,
  profile,
  onAddStep,
}: AddStepDialogProps) {
  const stepsByCategory = getStepsByCategoryForProfile(profile)

  // Filter out empty categories
  const categories = (
    Object.entries(stepsByCategory) as [
      StepCategory,
      typeof stepsByCategory.info,
    ][]
  ).filter(([, steps]) => steps.length > 0)

  const handleStepSelect = (type: StepType) => {
    onAddStep(type)
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
                        <Icon className="h-4 w-4 shrink-0" />
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

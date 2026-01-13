/**
 * StepListItem Component
 *
 * Individual step item in the step list sidebar.
 * Shows step icon, label, and selected state indicator.
 */
import { getStepDefinition } from '../../steps/registry/step-utils'
import type { Step } from '../../steps/registry/step-registry'
import { cn } from '@/shared/utils'

interface StepListItemProps {
  /** Step data */
  step: Step
  /** Whether this step is currently selected */
  isSelected: boolean
  /** Callback when step is clicked */
  onClick: () => void
  /** Optional disabled state */
  disabled?: boolean
}

/**
 * Step list item with icon and label
 *
 * Displays step type icon and label with visual selection state.
 * Click to select the step for editing.
 *
 * @example
 * ```tsx
 * <StepListItem
 *   step={step}
 *   isSelected={selectedStepId === step.id}
 *   onClick={() => selectStep(step.id)}
 * />
 * ```
 */
export function StepListItem({
  step,
  isSelected,
  onClick,
  disabled,
}: StepListItemProps) {
  const definition = getStepDefinition(step.type)

  if (!definition) {
    return null
  }

  const Icon = definition.icon

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm',
        'transition-colors duration-150',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        isSelected && 'bg-accent text-accent-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{definition.label}</span>
      {isSelected && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </button>
  )
}

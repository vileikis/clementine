/**
 * StepTypeIcon Component
 *
 * Displays a colored icon representing a step type.
 * Uses the step definition to determine the icon and category colors.
 */
import {
  getCategoryColorClasses,
  getStepDefinition,
} from '../registry/step-utils'
import type { StepType } from '../registry/step-registry'
import { cn } from '@/shared/utils'

interface StepTypeIconProps {
  /** The step type to display */
  stepType: StepType
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Optional additional classes for the wrapper */
  className?: string
}

const sizeClasses = {
  sm: {
    wrapper: 'h-5 w-5',
    icon: 'h-3 w-3',
  },
  md: {
    wrapper: 'h-6 w-6',
    icon: 'h-4 w-4',
  },
  lg: {
    wrapper: 'h-8 w-8',
    icon: 'h-5 w-5',
  },
}

/**
 * Renders a step type icon with category-based coloring
 *
 * @example
 * ```tsx
 * <StepTypeIcon stepType="info" />
 * <StepTypeIcon stepType="input.scale" size="lg" />
 * ```
 */
export function StepTypeIcon({
  stepType,
  size = 'md',
  className,
}: StepTypeIconProps) {
  const definition = getStepDefinition(stepType)

  if (!definition) {
    return null
  }

  const Icon = definition.icon
  const colorClasses = getCategoryColorClasses(definition.category)
  const sizes = sizeClasses[size]

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md',
        sizes.wrapper,
        colorClasses.wrapper,
        className,
      )}
    >
      <Icon className={cn(sizes.icon, colorClasses.icon)} />
    </div>
  )
}

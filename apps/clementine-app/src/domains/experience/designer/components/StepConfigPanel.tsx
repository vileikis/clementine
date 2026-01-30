/**
 * StepConfigPanel Component
 *
 * Right sidebar that shows the configuration panel for the selected step.
 * Routes to the correct config panel based on step type.
 */
import {
  getCategoryColorClasses,
  getStepDefinition,
} from '../../steps/registry/step-utils'
import {
  CapturePhotoConfigPanel,
  InfoStepConfigPanel,
  InputLongTextConfigPanel,
  InputMultiSelectConfigPanel,
  InputScaleConfigPanel,
  InputShortTextConfigPanel,
  InputYesNoConfigPanel,
  TransformPipelineConfigPanel,
} from '../../steps/config-panels'
import type { Step, StepConfig } from '../../steps/registry/step-registry'
import { ScrollArea } from '@/ui-kit/ui/scroll-area'
import { cn } from '@/shared/utils/style-utils'

interface StepConfigPanelProps {
  /** The currently selected step, or null if no step selected */
  step: Step | null
  /** Callback when step config changes */
  onConfigChange: (updates: Partial<StepConfig>) => void
  /** Optional disabled state */
  disabled?: boolean
}

/**
 * Configuration panel router for steps
 *
 * Shows the appropriate config panel based on the selected step's type.
 * Shows a placeholder message when no step is selected.
 *
 * @example
 * ```tsx
 * <StepConfigPanel
 *   step={selectedStep}
 *   onConfigChange={(updates) => {
 *     const newSteps = steps.map(s =>
 *       s.id === selectedStep.id
 *         ? { ...s, config: { ...s.config, ...updates } }
 *         : s
 *     )
 *     setSteps(newSteps)
 *   }}
 * />
 * ```
 */
export function StepConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  // No step selected
  if (!step) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Configuration</h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-center text-sm text-muted-foreground">
            Select a step to configure
          </p>
        </div>
      </div>
    )
  }

  const definition = getStepDefinition(step.type)

  if (!definition) {
    return null
  }
  const Icon = definition.icon
  const colorClasses = getCategoryColorClasses(definition.category)

  return (
    <div className="flex h-full flex-col">
      {/* Header with step type label */}
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <div
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
            colorClasses.wrapper,
          )}
        >
          <Icon className={cn('h-4 w-4', colorClasses.icon)} />
        </div>
        <h2 className="text-sm font-semibold">
          {step.name || definition?.label || 'Configuration'}
        </h2>
      </div>

      {/* Config panel content */}
      <ScrollArea className="flex-1">
        <ConfigPanelRouter
          step={step}
          onConfigChange={onConfigChange}
          disabled={disabled}
        />
      </ScrollArea>
    </div>
  )
}

/**
 * Routes to the correct config panel based on step type
 */
function ConfigPanelRouter({
  step,
  onConfigChange,
  disabled,
}: {
  step: Step
  onConfigChange: (updates: Partial<StepConfig>) => void
  disabled?: boolean
}) {
  const props = { step, onConfigChange, disabled }

  switch (step.type) {
    case 'info':
      return <InfoStepConfigPanel {...props} />
    case 'input.scale':
      return <InputScaleConfigPanel {...props} />
    case 'input.yesNo':
      return <InputYesNoConfigPanel {...props} />
    case 'input.multiSelect':
      return <InputMultiSelectConfigPanel {...props} />
    case 'input.shortText':
      return <InputShortTextConfigPanel {...props} />
    case 'input.longText':
      return <InputLongTextConfigPanel {...props} />
    case 'capture.photo':
      return <CapturePhotoConfigPanel {...props} />
    case 'transform.pipeline':
      return <TransformPipelineConfigPanel {...props} />
    default:
      // Type-safe exhaustive check - this should never happen
      return (
        <p className="text-sm text-muted-foreground">
          Unknown step type: {(step as Step).type}
        </p>
      )
  }
}

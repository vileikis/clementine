/**
 * Step Name Helpers
 *
 * Functions for generating and ensuring step names.
 * Names are used for human identification and transform variable mapping.
 */
import { stepRegistry } from '../registry/step-registry'
import type { Step, StepType } from '../schemas/step.schema'

/**
 * Generate a human-readable step name based on step type and existing steps.
 *
 * Format: "{StepTypeDisplayName} {N}" where N is count of that step type + 1
 * Examples: "Photo Capture 1", "Photo Capture 2", "Opinion Scale 1"
 *
 * @param existingSteps - Current array of steps in the experience
 * @param stepType - The type of step being added
 * @returns A human-readable step name
 */
export function generateStepName(
  existingSteps: Pick<Step, 'type'>[],
  stepType: StepType,
): string {
  const definition = stepRegistry[stepType]
  const label = definition.label
  const count = existingSteps.filter((s) => s.type === stepType).length + 1
  return `${label} ${count}`
}

/**
 * Ensure a step has a name, generating one if missing.
 *
 * This function supports lazy migration of existing steps that were created
 * before the name field was added. Names are generated based on the step's
 * position among steps of the same type.
 *
 * @param step - The step to ensure has a name
 * @param allSteps - All steps in the experience (for counting same-type steps)
 * @returns The step with a guaranteed name
 */
export function ensureStepHasName<T extends Step>(step: T, allSteps: T[]): T {
  // If step already has a name, return as-is
  if (step.name) {
    return step
  }

  // Count steps of the same type that appear before this step
  const sameTypeSteps = allSteps.filter((s) => s.type === step.type)
  const index = sameTypeSteps.findIndex((s) => s.id === step.id)
  const position = index >= 0 ? index + 1 : sameTypeSteps.length + 1

  // Get the display label from the registry
  const definition = stepRegistry[step.type]
  const label = definition?.label ?? step.type

  return {
    ...step,
    name: `${label} ${position}`,
  }
}

/**
 * Ensure all steps in an array have names.
 *
 * This function applies lazy migration to all steps, generating names
 * for any steps that don't have one.
 *
 * @param steps - Array of steps to process
 * @returns Array of steps with guaranteed names
 */
export function ensureAllStepsHaveNames<T extends Step>(steps: T[]): T[] {
  return steps.map((step) => ensureStepHasName(step, steps))
}

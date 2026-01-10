/**
 * Profile Validation Rules
 *
 * Validates experience step configurations against profile constraints.
 * Each profile type determines which step categories are allowed.
 *
 * Profile → Allowed Categories:
 * - freeform: info, input, capture, transform, share (all steps)
 * - survey: info, input, capture, share (no transform)
 * - informational: info only
 */
import type { ExperienceProfile } from '../shared/schemas'

/**
 * Step categories for grouping step types
 */
export type StepCategory = 'info' | 'input' | 'capture' | 'transform' | 'share'

/**
 * Mapping of step types to their categories
 */
export const STEP_TYPE_CATEGORIES: Record<string, StepCategory> = {
  // Info category
  info: 'info',

  // Input category
  'input.scale': 'input',
  'input.yesNo': 'input',
  'input.multiSelect': 'input',
  'input.shortText': 'input',
  'input.longText': 'input',

  // Capture category
  'capture.photo': 'capture',
  'capture.video': 'capture',
  'capture.gif': 'capture',

  // Transform category
  'transform.pipeline': 'transform',

  // Share category
  share: 'share',
}

/**
 * Allowed step categories per profile type
 */
export const PROFILE_ALLOWED_STEP_CATEGORIES: Record<
  ExperienceProfile,
  StepCategory[]
> = {
  freeform: ['info', 'input', 'capture', 'transform', 'share'],
  survey: ['info', 'input', 'capture', 'share'],
  informational: ['info'],
}

/**
 * Step representation for validation
 */
export interface StepForValidation {
  id: string
  type: string
}

/**
 * Validation violation details
 */
export interface ProfileViolation {
  stepId: string
  stepType: string
  message: string
}

/**
 * Validation result
 */
export interface ProfileValidationResult {
  valid: boolean
  violations: ProfileViolation[]
}

/**
 * Get the category for a step type
 *
 * @param stepType - The step type (e.g., 'input.scale', 'capture.photo')
 * @returns The category or undefined if unknown
 */
export function getStepCategory(stepType: string): StepCategory | undefined {
  return STEP_TYPE_CATEGORIES[stepType]
}

/**
 * Validate experience steps against profile constraints
 *
 * Checks that all steps in the experience use step types
 * that are allowed for the specified profile.
 *
 * @param profile - The experience profile type
 * @param steps - Array of steps to validate
 * @returns Validation result with violations if any
 *
 * @example
 * ```typescript
 * const result = validateExperienceSteps('survey', [
 *   { id: '1', type: 'info' },
 *   { id: '2', type: 'input.scale' },
 *   { id: '3', type: 'transform.pipeline' }, // Invalid for survey!
 * ])
 *
 * if (!result.valid) {
 *   console.error('Violations:', result.violations)
 *   // [{ stepId: '3', stepType: 'transform.pipeline', message: '...' }]
 * }
 * ```
 */
export function validateExperienceSteps(
  profile: ExperienceProfile,
  steps: StepForValidation[],
): ProfileValidationResult {
  const allowedCategories = PROFILE_ALLOWED_STEP_CATEGORIES[profile]
  const violations: ProfileViolation[] = []

  for (const step of steps) {
    const category = getStepCategory(step.type)

    // Unknown step type - flag as violation
    if (category === undefined) {
      violations.push({
        stepId: step.id,
        stepType: step.type,
        message: `Unknown step type "${step.type}"`,
      })
      continue
    }

    // Check if category is allowed for this profile
    if (!allowedCategories.includes(category)) {
      violations.push({
        stepId: step.id,
        stepType: step.type,
        message: `Step type "${step.type}" (category: ${category}) is not allowed for profile "${profile}"`,
      })
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  }
}

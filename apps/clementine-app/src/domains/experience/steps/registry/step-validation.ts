/**
 * Step Input Validation
 *
 * Centralized validation logic for step inputs in run mode.
 * Each step type defines its own validation rules based on config.
 */
import type {
  ExperienceInputLongTextStepConfig,
  ExperienceInputMultiSelectStepConfig,
  ExperienceInputScaleStepConfig,
  ExperienceInputShortTextStepConfig,
  ExperienceInputYesNoStepConfig,
  ExperienceStep,
} from '@clementine/shared'

/**
 * Validation result for a step input
 */
export interface StepValidationResult {
  /** Whether the input is valid */
  isValid: boolean
  /** Error message if invalid */
  error?: string
}

/**
 * Validate step input based on step type and configuration
 *
 * Returns true if the input is valid for the step, false otherwise.
 * Used to determine if the user can proceed to the next step.
 *
 * @param step - The step being validated (ExperienceStep from runtime)
 * @param input - The user's input value (may be undefined if not yet answered)
 * @returns Validation result with isValid and optional error message
 *
 * @example
 * ```tsx
 * const result = validateStepInput(step, userInput)
 * if (result.isValid) {
 *   // Allow proceeding to next step
 * } else {
 *   // Show error message
 *   toast.error(result.error)
 * }
 * ```
 */
export function validateStepInput(
  step: ExperienceStep,
  input: unknown,
): StepValidationResult {
  const config = step.config as Record<string, unknown>
  const isRequired = config.required === true

  switch (step.type) {
    case 'info':
      // Info steps don't collect input, always valid
      return { isValid: true }

    case 'input.scale':
      return validateScaleInput(
        config as ExperienceInputScaleStepConfig,
        input,
        isRequired,
      )

    case 'input.yesNo':
      return validateYesNoInput(
        config as ExperienceInputYesNoStepConfig,
        input,
        isRequired,
      )

    case 'input.multiSelect':
      return validateMultiSelectInput(
        config as ExperienceInputMultiSelectStepConfig,
        input,
        isRequired,
      )

    case 'input.shortText':
    case 'input.longText':
      return validateTextInput(
        config as
          | ExperienceInputShortTextStepConfig
          | ExperienceInputLongTextStepConfig,
        input,
        isRequired,
      )

    case 'capture.photo':
      // Capture steps: validation handled by the renderer
      // The renderer controls canProceed based on having captured media
      // and calls onSubmit directly after successful upload
      return { isValid: true }

    default:
      // Unknown step type - treat as valid
      return { isValid: true }
  }
}

/**
 * Validate input.scale step input
 */
function validateScaleInput(
  config: ExperienceInputScaleStepConfig,
  input: unknown,
  isRequired: boolean,
): StepValidationResult {
  // No input yet
  if (input === undefined || input === null) {
    return isRequired
      ? { isValid: false, error: 'Please select a value' }
      : { isValid: true }
  }

  // Must be a string
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Invalid selection' }
  }

  // Parse string to number for validation
  const numValue = Number(input)

  // Must be a valid number
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Invalid selection' }
  }

  // Must be within range
  const min = config.min ?? 1
  const max = config.max ?? 5
  if (numValue < min || numValue > max) {
    return { isValid: false, error: `Value must be between ${min} and ${max}` }
  }

  // Must be an integer
  if (!Number.isInteger(numValue)) {
    return { isValid: false, error: 'Please select a whole number' }
  }

  return { isValid: true }
}

/**
 * Validate input.yesNo step input
 */
function validateYesNoInput(
  _config: ExperienceInputYesNoStepConfig,
  input: unknown,
  isRequired: boolean,
): StepValidationResult {
  // No input yet
  if (input === undefined || input === null) {
    return isRequired
      ? { isValid: false, error: 'Please select Yes or No' }
      : { isValid: true }
  }

  // Must be a string with value "yes" or "no"
  if (typeof input !== 'string' || (input !== 'yes' && input !== 'no')) {
    return { isValid: false, error: 'Invalid selection' }
  }

  return { isValid: true }
}

/**
 * Validate input.multiSelect step input
 */
function validateMultiSelectInput(
  config: ExperienceInputMultiSelectStepConfig,
  input: unknown,
  isRequired: boolean,
): StepValidationResult {
  // No input yet
  if (
    input === undefined ||
    input === null ||
    (Array.isArray(input) && input.length === 0)
  ) {
    return isRequired
      ? { isValid: false, error: 'Please select at least one option' }
      : { isValid: true }
  }

  // Must be an array
  if (!Array.isArray(input)) {
    return { isValid: false, error: 'Invalid selection' }
  }

  // All values must be valid option values
  // Options are objects with { value, promptFragment, promptMedia }
  const optionsArray = config.options ?? []
  const validValues = optionsArray.map((opt) => opt.value)

  // Input validation now only checks string[] (primitive values)
  // The context field stores full MultiSelectOption[] separately
  const allValid = input.every((v) => {
    return typeof v === 'string' && validValues.includes(v)
  })

  if (!allValid) {
    return { isValid: false, error: 'Invalid option selected' }
  }

  // Single select: exactly 1
  if (!config.multiSelect && input.length !== 1) {
    return { isValid: false, error: 'Please select exactly one option' }
  }

  // Multi select: at least 1
  if (config.multiSelect && input.length === 0) {
    return { isValid: false, error: 'Please select at least one option' }
  }

  return { isValid: true }
}

/**
 * Validate input.shortText and input.longText step inputs
 */
function validateTextInput(
  config:
    | ExperienceInputShortTextStepConfig
    | ExperienceInputLongTextStepConfig,
  input: unknown,
  isRequired: boolean,
): StepValidationResult {
  // No input yet
  if (input === undefined || input === null) {
    return isRequired
      ? { isValid: false, error: 'Please enter a response' }
      : { isValid: true }
  }

  // Must be a string
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Invalid response' }
  }

  // Check if empty when required
  if (isRequired && input.trim().length === 0) {
    return { isValid: false, error: 'Please enter a response' }
  }

  // Check max length
  const maxLength = config.maxLength ?? 1000
  if (input.length > maxLength) {
    return {
      isValid: false,
      error: `Response is too long (max ${maxLength} characters)`,
    }
  }

  return { isValid: true }
}

/**
 * Check if a step type is an input step (collects user data)
 */
export function isInputStep(stepType: string): boolean {
  return stepType.startsWith('input.')
}

/**
 * Check if a step type is a capture step (captures media)
 */
export function isCaptureStep(stepType: string): boolean {
  return stepType.startsWith('capture.')
}

/**
 * Check if a step type is a transform step (processes media)
 */
export function isTransformStep(stepType: string): boolean {
  return stepType.startsWith('transform.')
}

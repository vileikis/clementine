/**
 * Validator Function Contracts
 *
 * Type definitions for step validator functions after refactor.
 * These contracts define the expected type signatures for all validators.
 */

import type {
  ExperienceInputScaleStepConfig,
  ExperienceInputYesNoStepConfig,
  ExperienceInputMultiSelectStepConfig,
  ExperienceInputShortTextStepConfig,
  ExperienceInputLongTextStepConfig,
} from '@clementine/shared'

/**
 * Validation result returned by all validators
 */
export interface StepValidationResult {
  /** Whether the input is valid */
  isValid: boolean
  /** Error message if invalid */
  error?: string
}

/**
 * Scale Input Validator Contract
 *
 * Validates numeric scale input (e.g., 1-5 rating)
 * Input value is expected to be string representation of number
 */
export type ValidateScaleInput = (
  config: ExperienceInputScaleStepConfig,
  input: unknown,
  isRequired: boolean,
) => StepValidationResult

/**
 * Example usage:
 *
 * const result = validateScaleInput(config, "3", true)
 * if (result.isValid) {
 *   // Proceed
 * } else {
 *   toast.error(result.error)
 * }
 *
 * TypeScript autocomplete for config:
 * - config.min: number
 * - config.max: number
 * - config.minLabel?: string
 * - config.maxLabel?: string
 */

/**
 * Yes/No Input Validator Contract
 *
 * Validates binary yes/no input
 * Input value is expected to be "yes" or "no" string
 */
export type ValidateYesNoInput = (
  config: ExperienceInputYesNoStepConfig,
  input: unknown,
  isRequired: boolean,
) => StepValidationResult

/**
 * Example usage:
 *
 * const result = validateYesNoInput(config, "yes", true)
 *
 * TypeScript autocomplete for config:
 * - config.title: string
 * - config.required: boolean
 */

/**
 * Multi-Select Input Validator Contract
 *
 * Validates multiple choice selection
 * Input value is expected to be string[] of selected option values
 */
export type ValidateMultiSelectInput = (
  config: ExperienceInputMultiSelectStepConfig,
  input: unknown,
  isRequired: boolean,
) => StepValidationResult

/**
 * Example usage:
 *
 * const result = validateMultiSelectInput(config, ["option1", "option2"], true)
 *
 * TypeScript autocomplete for config:
 * - config.options: MultiSelectOption[]
 * - config.multiSelect: boolean
 * - config.required: boolean
 */

/**
 * Text Input Validator Contract
 *
 * Validates short text and long text inputs
 * Input value is expected to be string
 */
export type ValidateTextInput = (
  config: ExperienceInputShortTextStepConfig | ExperienceInputLongTextStepConfig,
  input: unknown,
  isRequired: boolean,
) => StepValidationResult

/**
 * Example usage:
 *
 * const result = validateTextInput(config, "Hello world", true)
 *
 * TypeScript autocomplete for config (union type):
 * - config.title: string
 * - config.placeholder?: string
 * - config.maxLength: number
 * - config.required: boolean
 */

/**
 * Main Validator Contract
 *
 * Entry point for step validation
 * Uses discriminated union pattern to dispatch to specific validators
 */
export type ValidateStepInput = (
  step: ExperienceStep,
  input: unknown,
) => StepValidationResult

/**
 * Example usage:
 *
 * const result = validateStepInput(step, userInput)
 * if (!result.isValid) {
 *   setError(result.error)
 *   return
 * }
 *
 * Implementation uses switch statement with type narrowing:
 *
 * switch (step.type) {
 *   case 'input.scale':
 *     return validateScaleInput(
 *       step.config as ExperienceInputScaleStepConfig,
 *       input,
 *       (step.config as ExperienceInputScaleStepConfig).required
 *     )
 *   // ... other cases
 * }
 */

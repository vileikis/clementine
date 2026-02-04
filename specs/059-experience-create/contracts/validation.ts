/**
 * Create Outcome Validation Contract
 *
 * Type definitions for publish-time validation of create outcome configuration.
 * These types define the interface between validation logic and consumers.
 *
 * @see spec.md Section 2 - Publish-Time Validation
 */

import type { CreateOutcome } from '@clementine/shared'
import type { ExperienceStep } from '@clementine/shared'

/**
 * Validation error for create outcome
 */
export interface CreateOutcomeValidationError {
  /** Field path that has the error (e.g., 'create.type', 'create.imageGeneration.prompt') */
  field: string
  /** Human-readable error message */
  message: string
  /** Step ID if error relates to captureStepId validation */
  stepId?: string
}

/**
 * Result of create outcome validation
 */
export interface CreateOutcomeValidationResult {
  /** Whether validation passed */
  valid: boolean
  /** Array of validation errors (empty if valid) */
  errors: CreateOutcomeValidationError[]
}

/**
 * Input for create outcome validation function
 */
export interface ValidateCreateOutcomeInput {
  /** Create outcome configuration to validate */
  create: CreateOutcome
  /** Experience steps for captureStepId validation */
  steps: ExperienceStep[]
}

/**
 * Validate create outcome configuration for publishing
 *
 * @param input - Create outcome and steps to validate
 * @returns Validation result with errors if any
 *
 * @example
 * ```ts
 * const result = validateCreateOutcome({
 *   create: experience.draft.create,
 *   steps: experience.draft.steps,
 * })
 *
 * if (!result.valid) {
 *   // Handle validation errors
 *   result.errors.forEach(e => console.log(e.message))
 * }
 * ```
 */
export type ValidateCreateOutcome = (
  input: ValidateCreateOutcomeInput
) => CreateOutcomeValidationResult

/**
 * Validation error codes for programmatic handling
 */
export const CREATE_OUTCOME_VALIDATION_ERRORS = {
  TYPE_NULL: 'create.type.null',
  PASSTHROUGH_NO_SOURCE: 'create.passthrough.no_source',
  CAPTURE_STEP_NOT_FOUND: 'create.captureStepId.not_found',
  CAPTURE_STEP_WRONG_TYPE: 'create.captureStepId.wrong_type',
  PROMPT_REQUIRED: 'create.imageGeneration.prompt.required',
  REFMEDIA_DUPLICATE: 'create.imageGeneration.refMedia.duplicate',
  TYPE_NOT_IMPLEMENTED: 'create.type.not_implemented',
  OPTIONS_KIND_MISMATCH: 'create.options.kind_mismatch',
} as const

export type CreateOutcomeValidationErrorCode =
  (typeof CREATE_OUTCOME_VALIDATION_ERRORS)[keyof typeof CREATE_OUTCOME_VALIDATION_ERRORS]

/**
 * Experience Profile Types
 *
 * Defines experience profile validators and metadata.
 * Profiles determine valid step sequences and constraints for an experience.
 *
 * Available Profiles:
 * - freeform: Full flexibility with info, input, capture, transform steps
 * - survey: Data collection with info, input, capture steps
 * - story: Display only with info steps
 *
 * Note: Profile is immutable after experience creation.
 */
import type { ExperienceConfig, ExperienceProfile } from '../schemas'
import type { StepCategory } from './step.types'

/**
 * Slot types where experiences can be used
 */
export type SlotType = 'main' | 'pregate' | 'preshare'

/**
 * Profile metadata describing capabilities
 */
export interface ProfileMetadata {
  /** Human-readable label */
  label: string
  /** Description for users */
  description: string
  /** Allowed step categories */
  allowedStepCategories: StepCategory[]
  /** Compatible slot types */
  slotCompatibility: SlotType[]
}

/**
 * Profile metadata record
 * Static information about each profile type
 */
export const profileMetadata: Record<ExperienceProfile, ProfileMetadata> = {
  freeform: {
    label: 'Freeform',
    description: 'Full flexibility with any step types',
    allowedStepCategories: ['info', 'input', 'capture', 'transform'],
    slotCompatibility: ['main'],
  },
  survey: {
    label: 'Survey',
    description: 'Data collection with info, input, and capture steps',
    allowedStepCategories: ['info', 'input', 'capture'],
    slotCompatibility: ['main', 'pregate', 'preshare'],
  },
  story: {
    label: 'Story',
    description: 'Display-only with info steps',
    allowedStepCategories: ['info'],
    slotCompatibility: ['pregate', 'preshare'],
  },
}

/**
 * Profile validation result
 * Returned by profile validators
 */
export interface ProfileValidationResult {
  /** Whether the configuration is valid for this profile */
  valid: boolean

  /** List of validation errors (blocking issues) */
  errors: string[]

  /** List of validation warnings (non-blocking suggestions) */
  warnings: string[]
}

/**
 * Profile validator function type
 * Takes an experience config and returns validation result
 */
export type ProfileValidator = (
  config: ExperienceConfig,
) => ProfileValidationResult

/**
 * Empty validator factory
 * Creates a validator that always passes
 *
 * E1 Scope: All profiles use empty validators (validation deferred to E2)
 */
const createEmptyValidator = (): ProfileValidator => {
  return () => ({
    valid: true,
    errors: [],
    warnings: [],
  })
}

/**
 * Profile validators record
 * Maps each profile to its validator function
 *
 * E1 Scope: All validators return valid=true
 * E2 will implement actual validation logic using profileMetadata
 */
export const profileValidators: Record<ExperienceProfile, ProfileValidator> = {
  freeform: createEmptyValidator(),
  survey: createEmptyValidator(),
  story: createEmptyValidator(),
}

/**
 * Validate an experience configuration against its profile
 *
 * @param profile - The profile to validate against
 * @param config - The experience configuration to validate
 * @returns Validation result with valid flag, errors, and warnings
 *
 * @example
 * ```typescript
 * const result = validateExperienceProfile('survey', experienceConfig)
 *
 * if (!result.valid) {
 *   console.error('Validation failed:', result.errors)
 * }
 * ```
 */
export function validateExperienceProfile(
  profile: ExperienceProfile,
  config: ExperienceConfig,
): ProfileValidationResult {
  const validator = profileValidators[profile]
  return validator(config)
}

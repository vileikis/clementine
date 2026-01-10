/**
 * Experience Profile Types
 *
 * Defines experience profile validators.
 * Profiles determine valid step sequences and constraints for an experience.
 *
 * Available Profiles:
 * - freeform: info, input, capture, transform, share (all steps)
 * - survey: info, input, capture, share (no transform)
 * - informational: info only
 */
import type {
  ExperienceConfig,
  ExperienceProfile,
} from '../schemas/experience.schema'

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
 * Creates a validator that always passes (for Phase 0)
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
 * Phase 0: All validators return valid=true
 * Future phases will implement actual validation logic
 */
export const profileValidators: Record<ExperienceProfile, ProfileValidator> = {
  freeform: createEmptyValidator(),
  survey: createEmptyValidator(),
  informational: createEmptyValidator(),
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

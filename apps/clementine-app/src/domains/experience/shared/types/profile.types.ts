/**
 * Experience Profile Types
 *
 * Defines experience profiles and their validators.
 * Profiles determine valid step sequences and constraints for an experience.
 *
 * Available Profiles:
 * - Free: Any valid step sequence
 * - Photobooth: Requires capture → transform → share
 * - Survey: Input steps only, no media
 * - Gallery: View-only, no capture
 */
import { z } from 'zod'
import type { ExperienceConfig } from '../schemas/experience.schema'

/**
 * Experience Profile enum
 * Defines the preset patterns for experience validation
 */
export enum ExperienceProfile {
  /** Any valid step sequence - no constraints */
  Free = 'free',

  /** Requires capture → transform → share flow */
  Photobooth = 'photobooth',

  /** Input steps only, no media capture/transform */
  Survey = 'survey',

  /** View-only gallery, no capture allowed */
  Gallery = 'gallery',
}

/**
 * Zod schema for ExperienceProfile enum
 * Use for runtime validation
 */
export const experienceProfileEnumSchema = z.nativeEnum(ExperienceProfile)

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
  [ExperienceProfile.Free]: createEmptyValidator(),
  [ExperienceProfile.Photobooth]: createEmptyValidator(),
  [ExperienceProfile.Survey]: createEmptyValidator(),
  [ExperienceProfile.Gallery]: createEmptyValidator(),
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
 * const result = validateExperienceProfile(
 *   ExperienceProfile.Photobooth,
 *   experienceConfig
 * )
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

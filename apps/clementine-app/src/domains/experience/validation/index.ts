/**
 * Experience Validation Domain
 *
 * Profile validation rules and slot compatibility.
 * Publicly exported via the main experience barrel.
 */

// Slot validation (legacy)
export {
  SLOT_ALLOWED_PROFILES as SLOT_ALLOWED_PROFILES_LEGACY,
  isProfileAllowedInSlot,
} from './slot-validation'

// Profile validation (from shared - legacy)
export {
  validateExperienceProfile,
  profileValidators,
  type ProfileValidator,
  type ProfileValidationResult,
} from '../shared'

// Profile rules (new implementation)
export {
  STEP_TYPE_CATEGORIES,
  PROFILE_ALLOWED_STEP_CATEGORIES,
  getStepCategory,
  validateExperienceSteps,
  type StepCategory as ProfileStepCategory,
  type StepForValidation,
  type ProfileViolation,
  type ProfileValidationResult as StepValidationResult,
} from './profile-rules'

// Slot compatibility (new implementation)
export {
  SLOT_ALLOWED_PROFILES,
  isProfileCompatibleWithSlot,
  getCompatibleProfiles,
  getCompatibleSlots,
} from './slot-compatibility'

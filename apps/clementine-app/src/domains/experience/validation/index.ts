/**
 * Experience Validation Domain
 *
 * Profile validation rules and slot compatibility.
 * Publicly exported via the main experience barrel.
 */

// Profile validation (from shared)
export {
  validateExperienceProfile,
  profileValidators,
  type ProfileValidator,
  type ProfileValidationResult,
} from '../shared'

// Profile rules
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

// Slot compatibility
export {
  SLOT_ALLOWED_PROFILES,
  isProfileCompatibleWithSlot,
  getCompatibleProfiles,
  getCompatibleSlots,
} from './slot-compatibility'

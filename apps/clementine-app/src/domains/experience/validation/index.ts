/**
 * Experience Validation Domain
 *
 * Profile validation rules and slot compatibility.
 * Publicly exported via the main experience barrel.
 */

// Slot validation
export {
  SLOT_ALLOWED_PROFILES,
  isProfileAllowedInSlot,
} from './slot-validation'

// Profile validation (from shared)
export {
  validateExperienceProfile,
  profileValidators,
  type ProfileValidator,
  type ProfileValidationResult,
} from '../shared'

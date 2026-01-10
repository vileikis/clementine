/**
 * Experience Validation Domain
 *
 * Profile validation rules and slot compatibility.
 *
 * IMPORT BOUNDARY: This subdomain is internal to experience domain.
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
} from '../shared/types/profile.types'

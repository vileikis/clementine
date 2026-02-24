/**
 * Experience Domain - Shared Lib Barrel Export
 *
 * Exports utility functions for the experience domain.
 */

export { updateExperienceConfigField } from './updateExperienceConfigField'
export { switchExperienceType } from './switchExperienceType'
export {
  isCaptureStep,
  validateOutcome,
  type OutcomeValidationError,
  type OutcomeValidationResult,
} from './outcome-validation'

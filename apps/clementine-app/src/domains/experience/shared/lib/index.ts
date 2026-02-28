/**
 * Experience Domain - Shared Lib Barrel Export
 *
 * Exports utility functions for the experience domain.
 */

export { updateExperienceConfigField } from './updateExperienceConfigField'
export { switchExperienceType } from './switchExperienceType'
export {
  isCaptureStep,
  validateConfig,
  type ConfigValidationError,
  type ConfigValidationResult,
} from './config-validation'

/**
 * Designer Hooks Barrel Export
 *
 * Hooks for the experience designer.
 */
export { useStepSelection } from './useStepSelection'
export type { ExperienceDesignerSearch } from './useStepSelection'

// Draft mutation hooks
export { useUpdateExperienceDraft } from './useUpdateExperienceDraft'
export type {
  UpdateExperienceDraftInput,
  UpdateExperienceDraftResult,
} from './useUpdateExperienceDraft'

export { useUpdateDraftSteps } from './useUpdateDraftSteps'
export type { UpdateDraftStepsInput } from './useUpdateDraftSteps'

// Publish hooks
export {
  usePublishExperience,
  validateForPublish,
  formatValidationErrors,
  isValidationError,
  isPublishSuccess,
} from './usePublishExperience'
export type {
  PublishExperienceInput,
  PublishExperienceResult,
  PublishValidationError,
  PublishValidationResult,
} from './usePublishExperience'

// Cover image upload
export { useUploadExperienceCover } from './useUploadExperienceCover'

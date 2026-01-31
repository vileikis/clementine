/**
 * Experience Domain - Schemas Barrel Export
 *
 * Exports all Zod schemas and inferred types for the experience domain.
 * Core experience schemas are imported from @clementine/shared.
 */

// Re-export core experience schemas from shared kernel
export {
  // Experience schemas
  experienceSchema,
  experienceConfigSchema,
  experienceStatusSchema,
  experienceProfileSchema,
  experienceMediaSchema,
  // Transform schemas
  transformNodeSchema,
  // Step schemas (discriminated union)
  experienceStepSchema,
  experienceStepTypeSchema,
  experienceStepCategorySchema,
  experienceStepNameSchema,
  experienceInfoStepSchema,
  experienceInputScaleStepSchema,
  experienceInputYesNoStepSchema,
  experienceInputMultiSelectStepSchema,
  experienceInputShortTextStepSchema,
  experienceInputLongTextStepSchema,
  experienceCapturePhotoStepSchema,
  // Step config schemas
  experienceInfoStepConfigSchema,
  experienceInputScaleStepConfigSchema,
  experienceInputYesNoStepConfigSchema,
  experienceInputMultiSelectStepConfigSchema,
  experienceInputShortTextStepConfigSchema,
  experienceInputLongTextStepConfigSchema,
  experienceCapturePhotoStepConfigSchema,
  experienceAspectRatioSchema,
  experienceMediaAssetSchema,
  // Types
  type Experience,
  type ExperienceConfig,
  type ExperienceStatus,
  type ExperienceProfile,
  type ExperienceMedia,
  type TransformNode,
  // Step types
  type ExperienceStep,
  type ExperienceStepType,
  type ExperienceStepCategory,
  type ExperienceStepConfig,
  // Step config types
  type ExperienceInfoStepConfig,
  type ExperienceInputScaleStepConfig,
  type ExperienceInputYesNoStepConfig,
  type ExperienceInputMultiSelectStepConfig,
  type ExperienceInputShortTextStepConfig,
  type ExperienceInputLongTextStepConfig,
  type ExperienceCapturePhotoStepConfig,
  type ExperienceAspectRatio,
  type ExperienceMediaAsset,
} from '@clementine/shared'

// Experience input schemas (for mutations) - app-specific
export * from './experience.input.schemas'

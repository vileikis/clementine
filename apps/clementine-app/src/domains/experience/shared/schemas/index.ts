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
  transformConfigSchema,
  transformNodeSchema,
  variableMappingSchema,
  outputFormatSchema,
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
  experienceTransformPipelineStepSchema,
  // Step config schemas
  experienceInfoStepConfigSchema,
  experienceInputScaleStepConfigSchema,
  experienceInputYesNoStepConfigSchema,
  experienceInputMultiSelectStepConfigSchema,
  experienceInputShortTextStepConfigSchema,
  experienceInputLongTextStepConfigSchema,
  experienceCapturePhotoStepConfigSchema,
  experienceTransformPipelineStepConfigSchema,
  experienceAspectRatioSchema,
  experienceMediaAssetSchema,
  // Legacy aliases (deprecated)
  baseStepSchema,
  experienceStepBaseSchema,
  // Types
  type Experience,
  type ExperienceConfig,
  type ExperienceStatus,
  type ExperienceProfile,
  type ExperienceMedia,
  type TransformConfig,
  type TransformNode,
  type VariableMapping,
  type OutputFormat,
  // Step types
  type ExperienceStep,
  type ExperienceStepType,
  type ExperienceStepCategory,
  type ExperienceStepConfig,
  type ExperienceStepBase,
  // Step config types
  type ExperienceInfoStepConfig,
  type ExperienceInputScaleStepConfig,
  type ExperienceInputYesNoStepConfig,
  type ExperienceInputMultiSelectStepConfig,
  type ExperienceInputShortTextStepConfig,
  type ExperienceInputLongTextStepConfig,
  type ExperienceCapturePhotoStepConfig,
  type ExperienceTransformPipelineStepConfig,
  type ExperienceAspectRatio,
  type ExperienceMediaAsset,
  // Legacy type aliases (deprecated)
  type BaseStep,
} from '@clementine/shared'

// Experience input schemas (for mutations) - app-specific
export * from './experience.input.schemas'

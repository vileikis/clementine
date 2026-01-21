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

// Backward compatibility aliases (will be removed in Phase 3)
export {
  experienceStepSchema as stepSchema,
  experienceStepTypeSchema as stepTypeSchema,
  experienceStepCategorySchema as stepCategorySchema,
  experienceStepNameSchema as stepNameSchema,
  experienceInfoStepSchema as infoStepSchema,
  experienceInputScaleStepSchema as inputScaleStepSchema,
  experienceInputYesNoStepSchema as inputYesNoStepSchema,
  experienceInputMultiSelectStepSchema as inputMultiSelectStepSchema,
  experienceInputShortTextStepSchema as inputShortTextStepSchema,
  experienceInputLongTextStepSchema as inputLongTextStepSchema,
  experienceCapturePhotoStepSchema as capturePhotoStepSchema,
  experienceTransformPipelineStepSchema as transformPipelineStepSchema,
  experienceInfoStepConfigSchema as infoStepConfigSchema,
  experienceInputScaleStepConfigSchema as inputScaleStepConfigSchema,
  experienceInputYesNoStepConfigSchema as inputYesNoStepConfigSchema,
  experienceInputMultiSelectStepConfigSchema as inputMultiSelectStepConfigSchema,
  experienceInputShortTextStepConfigSchema as inputShortTextStepConfigSchema,
  experienceInputLongTextStepConfigSchema as inputLongTextStepConfigSchema,
  experienceCapturePhotoStepConfigSchema as capturePhotoStepConfigSchema,
  experienceTransformPipelineStepConfigSchema as transformPipelineStepConfigSchema,
  experienceAspectRatioSchema as aspectRatioSchema,
  experienceMediaAssetSchema as mediaAssetSchema,
  type ExperienceStep as Step,
  type ExperienceStepType as StepType,
  type ExperienceStepCategory as StepCategory,
  type ExperienceStepConfig as StepConfig,
  type ExperienceInfoStepConfig as InfoStepConfig,
  type ExperienceInputScaleStepConfig as InputScaleStepConfig,
  type ExperienceInputYesNoStepConfig as InputYesNoStepConfig,
  type ExperienceInputMultiSelectStepConfig as InputMultiSelectStepConfig,
  type ExperienceInputShortTextStepConfig as InputShortTextStepConfig,
  type ExperienceInputLongTextStepConfig as InputLongTextStepConfig,
  type ExperienceCapturePhotoStepConfig as CapturePhotoStepConfig,
  type ExperienceTransformPipelineStepConfig as TransformPipelineStepConfig,
  type ExperienceAspectRatio as AspectRatio,
  type ExperienceMediaAsset as MediaAsset,
} from '@clementine/shared'

// Experience input schemas (for mutations) - app-specific
export * from './experience.input.schemas'

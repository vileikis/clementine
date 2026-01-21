/**
 * Experience Domain - Schemas Barrel Export
 *
 * Exports all Zod schemas and inferred types for the experience domain.
 * Core experience schemas are imported from @clementine/shared.
 */

// Re-export core experience schemas from shared kernel
export {
  experienceSchema,
  experienceConfigSchema,
  experienceStatusSchema,
  experienceProfileSchema,
  experienceMediaSchema,
  baseStepSchema,
  transformConfigSchema,
  transformNodeSchema,
  variableMappingSchema,
  outputFormatSchema,
  type Experience,
  type ExperienceConfig,
  type ExperienceStatus,
  type ExperienceProfile,
  type ExperienceMedia,
  type BaseStep,
  type TransformConfig,
  type TransformNode,
  type VariableMapping,
  type OutputFormat,
} from '@clementine/shared'

// Domain-specific alias: BaseStep → ExperienceStep
// BaseStep is the shared kernel name (minimal Firestore schema)
// ExperienceStep is more contextual for this domain's usage
export type { BaseStep as ExperienceStep } from '@clementine/shared'

// Experience input schemas (for mutations) - app-specific
export * from './experience.input.schemas'

// Step registry schemas - app-specific (placeholder)
export * from './step-registry.schema'

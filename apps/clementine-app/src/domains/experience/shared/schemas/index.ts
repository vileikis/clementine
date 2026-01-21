/**
 * Experience Domain - Schemas Barrel Export
 *
 * Exports all Zod schemas and inferred types for the experience domain.
 * Core experience schemas are imported from @clementine/shared.
 */

import type { BaseStep as _BaseStep } from '@clementine/shared'

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
  type TransformConfig,
  type TransformNode,
  type VariableMapping,
  type OutputFormat,
} from '@clementine/shared'

// Backward compatibility: export both BaseStep and ExperienceStep
export type BaseStep = _BaseStep
export type ExperienceStep = _BaseStep

// Experience input schemas (for mutations) - app-specific
export * from './experience.input.schemas'

// Step registry schemas - app-specific (placeholder)
export * from './step-registry.schema'

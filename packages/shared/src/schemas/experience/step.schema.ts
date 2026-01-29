/**
 * Experience Step Schema (Shared)
 *
 * Complete step schema with discriminated union for type-specific configs.
 * This is the single source of truth for step validation across app and functions.
 *
 * Naming Convention:
 * - All step-related types use `Experience*` prefix to avoid generic names
 * - e.g., `ExperienceStep`, `ExperienceStepType`, `ExperienceInfoStepConfig`
 */
import { z } from 'zod'
import { experienceInfoStepConfigSchema } from './steps/info.schema'
import { experienceInputScaleStepConfigSchema } from './steps/input-scale.schema'
import { experienceInputYesNoStepConfigSchema } from './steps/input-yes-no.schema'
import { experienceInputMultiSelectStepConfigSchema } from './steps/input-multi-select.schema'
import { experienceInputShortTextStepConfigSchema } from './steps/input-short-text.schema'
import { experienceInputLongTextStepConfigSchema } from './steps/input-long-text.schema'
import { experienceCapturePhotoStepConfigSchema } from './steps/capture-photo.schema'
import { experienceTransformPipelineStepConfigSchema } from './steps/transform-pipeline.schema'

/**
 * Experience step name schema
 * Human-readable name for identification and AI prompt references
 * Required field with strict validation for AI-safe identifiers
 * Trims whitespace before validation so whitespace-only names are rejected
 */
export const experienceStepNameSchema = z
  .string()
  .trim()
  .min(1, 'Step name is required')
  .max(50, 'Step name must be 50 characters or less')
  .regex(
    /^[a-zA-Z0-9 \-_]+$/,
    'Step name can only contain letters, numbers, spaces, hyphens, and underscores'
  )

/**
 * Experience step type enumeration schema
 */
export const experienceStepTypeSchema = z.enum([
  'info',
  'input.scale',
  'input.yesNo',
  'input.multiSelect',
  'input.shortText',
  'input.longText',
  'capture.photo',
  'transform.pipeline',
])

/**
 * Experience step category enumeration schema
 */
export const experienceStepCategorySchema = z.enum([
  'info',
  'input',
  'capture',
  'transform',
])

/**
 * Individual step schemas with type discriminator
 * Each step includes an optional name field for identification
 */
export const experienceInfoStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('info'),
  name: experienceStepNameSchema,
  config: experienceInfoStepConfigSchema,
})

export const experienceInputScaleStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('input.scale'),
  name: experienceStepNameSchema,
  config: experienceInputScaleStepConfigSchema,
})

export const experienceInputYesNoStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('input.yesNo'),
  name: experienceStepNameSchema,
  config: experienceInputYesNoStepConfigSchema,
})

export const experienceInputMultiSelectStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('input.multiSelect'),
  name: experienceStepNameSchema,
  config: experienceInputMultiSelectStepConfigSchema,
})

export const experienceInputShortTextStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('input.shortText'),
  name: experienceStepNameSchema,
  config: experienceInputShortTextStepConfigSchema,
})

export const experienceInputLongTextStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('input.longText'),
  name: experienceStepNameSchema,
  config: experienceInputLongTextStepConfigSchema,
})

export const experienceCapturePhotoStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('capture.photo'),
  name: experienceStepNameSchema,
  config: experienceCapturePhotoStepConfigSchema,
})

export const experienceTransformPipelineStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('transform.pipeline'),
  name: experienceStepNameSchema,
  config: experienceTransformPipelineStepConfigSchema,
})

/**
 * Experience step schema - discriminated union based on type field
 */
export const experienceStepSchema = z.discriminatedUnion('type', [
  experienceInfoStepSchema,
  experienceInputScaleStepSchema,
  experienceInputYesNoStepSchema,
  experienceInputMultiSelectStepSchema,
  experienceInputShortTextStepSchema,
  experienceInputLongTextStepSchema,
  experienceCapturePhotoStepSchema,
  experienceTransformPipelineStepSchema,
])

/**
 * TypeScript types inferred from schemas
 */
export type ExperienceStepType = z.infer<typeof experienceStepTypeSchema>
export type ExperienceStepCategory = z.infer<typeof experienceStepCategorySchema>
export type ExperienceStep = z.infer<typeof experienceStepSchema>

/**
 * Union of all step config types
 */
export type ExperienceStepConfig =
  | z.infer<typeof experienceInfoStepConfigSchema>
  | z.infer<typeof experienceInputScaleStepConfigSchema>
  | z.infer<typeof experienceInputYesNoStepConfigSchema>
  | z.infer<typeof experienceInputMultiSelectStepConfigSchema>
  | z.infer<typeof experienceInputShortTextStepConfigSchema>
  | z.infer<typeof experienceInputLongTextStepConfigSchema>
  | z.infer<typeof experienceCapturePhotoStepConfigSchema>
  | z.infer<typeof experienceTransformPipelineStepConfigSchema>

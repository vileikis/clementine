/**
 * Step Schema
 *
 * Zod schema for step entities with discriminated union for type-specific configs.
 * This schema is used for validating steps from Firestore and composing into experience schemas.
 */
import { z } from 'zod'
import { capturePhotoStepConfigSchema } from './capture-photo.schema'
import { infoStepConfigSchema } from './info.schema'
import { inputLongTextStepConfigSchema } from './input-long-text.schema'
import { inputMultiSelectStepConfigSchema } from './input-multi-select.schema'
import { inputScaleStepConfigSchema } from './input-scale.schema'
import { inputShortTextStepConfigSchema } from './input-short-text.schema'
import { inputYesNoStepConfigSchema } from './input-yes-no.schema'
import { transformPipelineStepConfigSchema } from './transform-pipeline.schema'

/**
 * Step name schema
 * Human-readable name for identification and transform variable mapping
 * Trims whitespace before validation so whitespace-only names are rejected
 */
export const stepNameSchema = z.string().trim().min(1).max(50).optional()

/**
 * Step type enumeration schema
 */
export const stepTypeSchema = z.enum([
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
 * Step category enumeration schema
 */
export const stepCategorySchema = z.enum([
  'info',
  'input',
  'capture',
  'transform',
])

/**
 * Individual step schemas with type discriminator
 * Each step now includes an optional name field for identification
 */
export const infoStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('info'),
  name: stepNameSchema,
  config: infoStepConfigSchema,
})

export const inputScaleStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('input.scale'),
  name: stepNameSchema,
  config: inputScaleStepConfigSchema,
})

export const inputYesNoStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('input.yesNo'),
  name: stepNameSchema,
  config: inputYesNoStepConfigSchema,
})

export const inputMultiSelectStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('input.multiSelect'),
  name: stepNameSchema,
  config: inputMultiSelectStepConfigSchema,
})

export const inputShortTextStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('input.shortText'),
  name: stepNameSchema,
  config: inputShortTextStepConfigSchema,
})

export const inputLongTextStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('input.longText'),
  name: stepNameSchema,
  config: inputLongTextStepConfigSchema,
})

export const capturePhotoStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('capture.photo'),
  name: stepNameSchema,
  config: capturePhotoStepConfigSchema,
})

export const transformPipelineStepSchema = z.object({
  id: z.uuid(),
  type: z.literal('transform.pipeline'),
  name: stepNameSchema,
  config: transformPipelineStepConfigSchema,
})

/**
 * Step schema - discriminated union based on type field
 */
export const stepSchema = z.discriminatedUnion('type', [
  infoStepSchema,
  inputScaleStepSchema,
  inputYesNoStepSchema,
  inputMultiSelectStepSchema,
  inputShortTextStepSchema,
  inputLongTextStepSchema,
  capturePhotoStepSchema,
  transformPipelineStepSchema,
])

/**
 * TypeScript types inferred from schemas
 */
export type StepType = z.infer<typeof stepTypeSchema>
export type StepCategory = z.infer<typeof stepCategorySchema>
export type Step = z.infer<typeof stepSchema>

/**
 * Union of all step config types
 */
export type StepConfig =
  | z.infer<typeof infoStepConfigSchema>
  | z.infer<typeof inputScaleStepConfigSchema>
  | z.infer<typeof inputYesNoStepConfigSchema>
  | z.infer<typeof inputMultiSelectStepConfigSchema>
  | z.infer<typeof inputShortTextStepConfigSchema>
  | z.infer<typeof inputLongTextStepConfigSchema>
  | z.infer<typeof capturePhotoStepConfigSchema>
  | z.infer<typeof transformPipelineStepConfigSchema>

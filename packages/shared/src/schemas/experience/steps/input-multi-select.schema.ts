/**
 * Experience Input Multi-Select Step Config Schema
 *
 * Configuration for multiple choice selection input steps.
 */
import { z } from 'zod'
import { mediaReferenceSchema } from '../../media/media-reference.schema'

/**
 * Multi-select option schema with optional AI context fields
 * Each option can have a text fragment and/or media reference for AI prompts
 */
export const multiSelectOptionSchema = z.object({
  /** Display value for the option (1-100 chars, defaults to 'Option' if empty) */
  value: z.string().min(1).max(100).catch('Option'),
  /** Optional text to insert into prompt when this option is selected (max 500 chars) */
  promptFragment: z.string().max(500).nullable().default(null),
  /** Optional media reference to insert into prompt when this option is selected */
  promptMedia: mediaReferenceSchema.nullable().default(null),
})

export type MultiSelectOption = z.infer<typeof multiSelectOptionSchema>

/**
 * Experience input multi-select step configuration schema
 */
export const experienceInputMultiSelectStepConfigSchema = z.object({
  /** Title text (max 200 chars, empty allowed for drafts) */
  title: z.string().max(200),
  /** Whether this step is required */
  required: z.boolean().default(false),
  /** Available options (2-10 items with AI-aware fields) */
  options: z.array(multiSelectOptionSchema).min(2).max(10),
  /** Allow multiple selections (false = single select) */
  multiSelect: z.boolean().default(false),
})

export type ExperienceInputMultiSelectStepConfig = z.infer<
  typeof experienceInputMultiSelectStepConfigSchema
>

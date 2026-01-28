/**
 * Preset Variable Schemas
 *
 * Variable definitions for AI presets - discriminated union of text and image types.
 * Variables are placeholders in prompt templates that get replaced with actual values.
 */
import { z } from 'zod'

/**
 * Value mapping entry for text variables
 * Maps input values to prompt text (can include @media references)
 */
export const valueMappingEntrySchema = z.object({
  /** The input value to match */
  value: z.string().min(1),

  /** Text to substitute in prompt (can include @media references) */
  text: z.string(),
})

export type ValueMappingEntry = z.infer<typeof valueMappingEntrySchema>

/**
 * Text variable schema
 * Used for text inputs from step answers or pass-through input
 */
export const textVariableSchema = z.object({
  /** Unique identifier for the variable (UUID, stable across name changes) */
  id: z.uuid(),

  type: z.literal('text'),

  /** Variable name used in prompt (alphanumeric + underscore) */
  name: z
    .string()
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Variable name must start with a letter or underscore and contain only alphanumeric characters and underscores',
    ),

  /** Default value if not provided or unmapped */
  defaultValue: z.string().nullable().default(null),

  /** Value mappings (if not provided, pass-through) */
  valueMap: z.array(valueMappingEntrySchema).nullable().default(null),
})

/**
 * Image variable schema
 * Used for image inputs from capture steps or node outputs
 */
export const imageVariableSchema = z.object({
  /** Unique identifier for the variable (UUID, stable across name changes) */
  id: z.uuid(),

  type: z.literal('image'),

  /** Variable name used in prompt (alphanumeric + underscore) */
  name: z
    .string()
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Variable name must start with a letter or underscore and contain only alphanumeric characters and underscores',
    ),
})

/**
 * Preset variable schema
 * Discriminated union of text and image variable types
 */
export const presetVariableSchema = z.discriminatedUnion('type', [
  textVariableSchema,
  imageVariableSchema,
])

export type TextVariable = z.infer<typeof textVariableSchema>
export type ImageVariable = z.infer<typeof imageVariableSchema>
export type PresetVariable = z.infer<typeof presetVariableSchema>

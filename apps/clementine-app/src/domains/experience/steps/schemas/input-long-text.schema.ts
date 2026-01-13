/**
 * Input Long Text Step Config Schema
 *
 * Configuration for long text input steps (multi-line textarea).
 */
import { z } from 'zod'

/**
 * Input long text step configuration schema
 */
export const inputLongTextStepConfigSchema = z.object({
  /** Title text (required, 1-200 chars) */
  title: z.string().min(1).max(200),
  /** Whether this step is required */
  required: z.boolean().default(false),
  /** Placeholder text (max 200 chars) */
  placeholder: z.string().max(200).default(''),
  /** Maximum length of response (1-2000 chars, default 500) */
  maxLength: z.number().int().min(1).max(2000).default(500),
})

export type InputLongTextStepConfig = z.infer<
  typeof inputLongTextStepConfigSchema
>

/**
 * Default config factory for input long text steps
 */
export function createDefaultInputLongTextConfig(): InputLongTextStepConfig {
  return {
    title: '',
    required: false,
    placeholder: '',
    maxLength: 500,
  }
}

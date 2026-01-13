/**
 * Input Short Text Step Config Schema
 *
 * Configuration for short text input steps (single-line).
 */
import { z } from 'zod'

/**
 * Input short text step configuration schema
 */
export const inputShortTextStepConfigSchema = z.object({
  /** Question text (required, 1-200 chars) */
  question: z.string().min(1).max(200),
  /** Placeholder text (max 100 chars) */
  placeholder: z.string().max(100).default(''),
  /** Maximum length of response (1-200 chars, default 100) */
  maxLength: z.number().int().min(1).max(200).default(100),
})

export type InputShortTextStepConfig = z.infer<
  typeof inputShortTextStepConfigSchema
>

/**
 * Default config factory for input short text steps
 */
export function createDefaultInputShortTextConfig(): InputShortTextStepConfig {
  return {
    question: '',
    placeholder: '',
    maxLength: 100,
  }
}

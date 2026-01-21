/**
 * Experience Input Short Text Step Config Schema
 *
 * Configuration for short text input steps (single-line).
 */
import { z } from 'zod'

/**
 * Experience input short text step configuration schema
 */
export const experienceInputShortTextStepConfigSchema = z.object({
  /** Title text (max 200 chars, empty allowed for drafts) */
  title: z.string().max(200),
  /** Whether this step is required */
  required: z.boolean().default(false),
  /** Placeholder text (max 100 chars) */
  placeholder: z.string().max(100).default(''),
  /** Maximum length of response (1-200 chars, default 100) */
  maxLength: z.number().int().min(1).max(200).default(100),
})

export type ExperienceInputShortTextStepConfig = z.infer<
  typeof experienceInputShortTextStepConfigSchema
>

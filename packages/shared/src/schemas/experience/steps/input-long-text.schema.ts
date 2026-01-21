/**
 * Experience Input Long Text Step Config Schema
 *
 * Configuration for long text input steps (multi-line textarea).
 */
import { z } from 'zod'

/**
 * Experience input long text step configuration schema
 */
export const experienceInputLongTextStepConfigSchema = z.object({
  /** Title text (max 200 chars, empty allowed for drafts) */
  title: z.string().max(200),
  /** Whether this step is required */
  required: z.boolean().default(false),
  /** Placeholder text (max 200 chars) */
  placeholder: z.string().max(200).default(''),
  /** Maximum length of response (1-2000 chars, default 500) */
  maxLength: z.number().int().min(1).max(2000).default(500),
})

export type ExperienceInputLongTextStepConfig = z.infer<
  typeof experienceInputLongTextStepConfigSchema
>

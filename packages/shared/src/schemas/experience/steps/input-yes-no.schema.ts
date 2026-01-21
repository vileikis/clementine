/**
 * Experience Input Yes/No Step Config Schema
 *
 * Configuration for binary choice (yes/no) input steps.
 */
import { z } from 'zod'

/**
 * Experience input yes/no step configuration schema
 */
export const experienceInputYesNoStepConfigSchema = z.object({
  /** Title text (max 200 chars, empty allowed for drafts) */
  title: z.string().max(200),
  /** Whether this step is required */
  required: z.boolean().default(false),
})

export type ExperienceInputYesNoStepConfig = z.infer<
  typeof experienceInputYesNoStepConfigSchema
>

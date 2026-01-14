/**
 * Input Yes/No Step Config Schema
 *
 * Configuration for binary choice (yes/no) input steps.
 */
import { z } from 'zod'

/**
 * Input yes/no step configuration schema
 */
export const inputYesNoStepConfigSchema = z.object({
  /** Title text (max 200 chars, empty allowed for drafts) */
  title: z.string().max(200),
  /** Whether this step is required */
  required: z.boolean().default(false),
})

export type InputYesNoStepConfig = z.infer<typeof inputYesNoStepConfigSchema>

/**
 * Default config factory for input yes/no steps
 */
export function createDefaultInputYesNoConfig(): InputYesNoStepConfig {
  return {
    title: '',
    required: false,
  }
}

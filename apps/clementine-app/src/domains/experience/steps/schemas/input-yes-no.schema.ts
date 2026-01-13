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
  /** Title text (required, 1-200 chars) */
  title: z.string().min(1).max(200),
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

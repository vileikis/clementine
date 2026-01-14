/**
 * Input Multi-Select Step Config Schema
 *
 * Configuration for multiple choice selection input steps.
 */
import { z } from 'zod'

/**
 * Input multi-select step configuration schema
 */
export const inputMultiSelectStepConfigSchema = z.object({
  /** Title text (max 200 chars, empty allowed for drafts) */
  title: z.string().max(200),
  /** Whether this step is required */
  required: z.boolean().default(false),
  /** Available options (2-10 items, each 1-100 chars) */
  options: z.array(z.string().min(1).max(100)).min(2).max(10),
  /** Allow multiple selections (false = single select) */
  multiSelect: z.boolean().default(false),
})

export type InputMultiSelectStepConfig = z.infer<
  typeof inputMultiSelectStepConfigSchema
>

/**
 * Default config factory for input multi-select steps
 */
export function createDefaultInputMultiSelectConfig(): InputMultiSelectStepConfig {
  return {
    title: '',
    required: false,
    options: ['Option 1', 'Option 2'],
    multiSelect: false,
  }
}

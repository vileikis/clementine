/**
 * Input Multi-Select Step Config Schema
 *
 * Configuration for multiple choice selection input steps.
 */
import { z } from 'zod'

/**
 * Input multi-select step configuration schema
 */
export const inputMultiSelectStepConfigSchema = z
  .object({
    /** Question text (required, 1-200 chars) */
    question: z.string().min(1).max(200),
    /** Available options (2-10 items, each 1-100 chars) */
    options: z.array(z.string().min(1).max(100)).min(2).max(10),
    /** Minimum selections required (default 0) */
    minSelect: z.number().int().min(0).default(0),
    /** Maximum selections allowed (default: options.length) */
    maxSelect: z.number().int().min(1).optional(),
  })
  .refine(
    (data) => {
      const maxAllowed = data.maxSelect ?? data.options.length
      return maxAllowed >= data.minSelect
    },
    {
      message: 'Maximum selections must be >= minimum selections',
      path: ['maxSelect'],
    },
  )
  .refine(
    (data) => {
      const maxAllowed = data.maxSelect ?? data.options.length
      return maxAllowed <= data.options.length
    },
    {
      message: 'Maximum selections cannot exceed number of options',
      path: ['maxSelect'],
    },
  )

export type InputMultiSelectStepConfig = z.infer<
  typeof inputMultiSelectStepConfigSchema
>

/**
 * Default config factory for input multi-select steps
 */
export function createDefaultInputMultiSelectConfig(): InputMultiSelectStepConfig {
  return {
    question: '',
    options: ['Option 1', 'Option 2'],
    minSelect: 0,
    maxSelect: undefined,
  }
}

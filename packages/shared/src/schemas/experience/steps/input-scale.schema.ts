/**
 * Experience Input Scale Step Config Schema
 *
 * Configuration for opinion/rating scale input steps.
 * Used for collecting numeric ratings or opinions.
 */
import { z } from 'zod'

/**
 * Experience input scale step configuration schema
 */
export const experienceInputScaleStepConfigSchema = z
  .object({
    /** Title text (max 200 chars, empty allowed for drafts) */
    title: z.string().max(200),
    /** Whether this step is required */
    required: z.boolean().default(false),
    /** Minimum value on scale (0-10, default 1) */
    min: z.number().int().min(0).max(10).default(1),
    /** Maximum value on scale (1-10, default 5, must be > min) */
    max: z.number().int().min(1).max(10).default(5),
    /** Optional label for minimum value (max 50 chars) */
    minLabel: z.string().max(50).optional(),
    /** Optional label for maximum value (max 50 chars) */
    maxLabel: z.string().max(50).optional(),
  })
  .refine((data) => data.max > data.min, {
    message: 'Maximum value must be greater than minimum value',
    path: ['max'],
  })

export type ExperienceInputScaleStepConfig = z.infer<
  typeof experienceInputScaleStepConfigSchema
>

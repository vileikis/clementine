/**
 * Experience Transform Pipeline Step Config Schema
 *
 * Configuration for AI transform pipeline steps.
 * Note: This is a placeholder for MVP - no configuration available yet.
 */
import { z } from 'zod'

/**
 * Experience transform pipeline step configuration schema
 * Empty for MVP - will be extended in future phases
 */
export const experienceTransformPipelineStepConfigSchema = z.object({})

export type ExperienceTransformPipelineStepConfig = z.infer<
  typeof experienceTransformPipelineStepConfigSchema
>

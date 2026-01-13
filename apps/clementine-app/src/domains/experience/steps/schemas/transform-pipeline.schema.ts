/**
 * Transform Pipeline Step Config Schema
 *
 * Configuration for AI transform pipeline steps.
 * Note: This is a placeholder for MVP - no configuration available yet.
 */
import { z } from 'zod'

/**
 * Transform pipeline step configuration schema
 * Empty for MVP - will be extended in future phases
 */
export const transformPipelineStepConfigSchema = z.object({})

export type TransformPipelineStepConfig = z.infer<
  typeof transformPipelineStepConfigSchema
>

/**
 * Default config factory for transform pipeline steps
 */
export function createDefaultTransformPipelineConfig(): TransformPipelineStepConfig {
  return {}
}

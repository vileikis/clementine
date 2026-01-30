/**
 * Transform Configuration Schema
 *
 * Configuration for the transform pipeline.
 * Embedded within ExperienceConfig.
 */
import { z } from 'zod'

// Re-export node schemas for convenience
export * from './nodes'

/**
 * Transform node definition
 * Represents a single node in the pipeline graph
 */
export const transformNodeSchema = z.looseObject({
  /** Unique node identifier */
  id: z.string(),
  /** Node type (e.g., 'ai.imageGeneration', 'filter.resize') */
  type: z.string(),
  /** Node-specific configuration */
  config: z.record(z.string(), z.unknown()).default({}),
})

/**
 * Aspect ratio options for transform output
 */
export const outputAspectRatioSchema = z.enum(['1:1', '9:16', '3:2', '2:3'])

/**
 * Output format configuration
 *
 * Defines post-processing settings for the pipeline output.
 * Note: The output TYPE (image/gif/video) is determined by the pipeline nodes,
 * not by this configuration. This controls resize/crop and quality.
 */
export const outputFormatSchema = z.looseObject({
  /** Target aspect ratio for resize/crop */
  aspectRatio: outputAspectRatioSchema.nullable().default(null),
  /** Compression quality (0-100) */
  quality: z.number().min(0).max(100).nullable().default(null),
})

/**
 * Transform pipeline configuration
 * Embedded within ExperienceConfig
 */
export const transformConfigSchema = z.looseObject({
  /** Pipeline node definitions */
  nodes: z.array(transformNodeSchema).default([]),
  /** Output format specification */
  outputFormat: outputFormatSchema.nullable().default(null),
})

export type TransformConfig = z.infer<typeof transformConfigSchema>
export type TransformNode = z.infer<typeof transformNodeSchema>
export type OutputFormat = z.infer<typeof outputFormatSchema>
export type OutputAspectRatio = z.infer<typeof outputAspectRatioSchema>

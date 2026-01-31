/**
 * Transform Configuration Schema
 *
 * Configuration for the transform pipeline.
 * Embedded within ExperienceConfig.
 */
import { z } from 'zod'

import { aiImageNodeSchema } from './nodes'

// Re-export node schemas for convenience
export * from './nodes'

/**
 * Transform node discriminated union
 *
 * Each node type has its own schema with a literal `type` discriminator.
 * Add new node types to this union as they are implemented.
 *
 * @example
 * ```ts
 * // Type narrowing works automatically
 * if (node.type === 'ai.imageGeneration') {
 *   // node.config is typed as AIImageNodeConfig
 *   console.log(node.config.model)
 * }
 * ```
 */
export const transformNodeSchema = z.discriminatedUnion('type', [
  aiImageNodeSchema,
  // Add future node types here:
  // filterNodeSchema,
  // videoNodeSchema,
])

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

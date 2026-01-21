/**
 * Transform Configuration Schema
 *
 * Configuration for the transform pipeline.
 * Embedded within ExperienceConfig.
 */
import { z } from 'zod'

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
 * Variable mapping from session data to transform inputs
 */
export const variableMappingSchema = z.looseObject({
  /** Source identifier (step name or special identifier) */
  source: z.string(),
  /** Target node input parameter */
  target: z.string(),
  /** Mapping type for data transformation */
  mappingType: z.enum(['direct', 'template', 'computed']).default('direct'),
})

/**
 * Output format configuration
 */
export const outputFormatSchema = z.looseObject({
  /** Output type */
  type: z.enum(['image', 'gif', 'video']),
  /** Output width in pixels */
  width: z.number().int().positive().optional(),
  /** Output height in pixels */
  height: z.number().int().positive().optional(),
  /** Quality (0-100) */
  quality: z.number().min(0).max(100).optional(),
})

/**
 * Transform pipeline configuration
 * Embedded within ExperienceConfig
 */
export const transformConfigSchema = z.looseObject({
  /** Pipeline node definitions */
  nodes: z.array(transformNodeSchema).default([]),
  /** Variable bindings from session data to node inputs */
  variableMappings: z.array(variableMappingSchema).default([]),
  /** Output format specification */
  outputFormat: outputFormatSchema.nullable().default(null),
})

export type TransformConfig = z.infer<typeof transformConfigSchema>
export type TransformNode = z.infer<typeof transformNodeSchema>
export type VariableMapping = z.infer<typeof variableMappingSchema>
export type OutputFormat = z.infer<typeof outputFormatSchema>

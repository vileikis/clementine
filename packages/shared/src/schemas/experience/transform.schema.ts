/**
 * Transform Node Schema
 *
 * Defines the discriminated union for transform pipeline nodes.
 * Nodes are stored directly in ExperienceConfig.transformNodes array.
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

export type TransformNode = z.infer<typeof transformNodeSchema>

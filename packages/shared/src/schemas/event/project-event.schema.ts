/**
 * Project Event Full Schema (Shared)
 *
 * Complete event document schema including admin metadata and guest-facing configuration.
 * This represents the Firestore document structure.
 */
import { z } from 'zod'
import { projectEventConfigSchema } from './project-event-config.schema'

/**
 * Event status enum
 */
export const projectEventStatusSchema = z.enum(['active', 'deleted'])

/**
 * Complete ProjectEvent document schema
 *
 * Combines admin metadata with guest-facing configuration.
 * Uses looseObject for forward compatibility.
 */
export const projectEventFullSchema = z.looseObject({
  /**
   * ADMIN METADATA
   */
  id: z.string(),
  name: z.string(),
  status: projectEventStatusSchema.default('active'),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().default(null),

  /**
   * GUEST-FACING CONFIGURATION
   */
  draftConfig: projectEventConfigSchema.nullable().default(null),
  publishedConfig: projectEventConfigSchema.nullable().default(null),

  /**
   * PUBLISH TRACKING
   */
  draftVersion: z.number().default(1),
  publishedVersion: z.number().nullable().default(null),
  publishedAt: z.number().nullable().default(null),
})

/**
 * TypeScript type for complete event document
 */
export type ProjectEventFull = z.infer<typeof projectEventFullSchema>
export type ProjectEventStatus = z.infer<typeof projectEventStatusSchema>

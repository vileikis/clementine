/**
 * Project Event Full Schema
 *
 * Complete event document schema including both admin metadata and guest-facing configuration.
 * This schema represents the full Firestore document structure.
 *
 * Cross-reference: See project-event-config.schema.ts for config-only schema
 * Related: @domains/project/events/schemas/project-event.schema.ts (lightweight admin view)
 */
import { z } from 'zod'
import { projectEventConfigSchema } from './project-event-config.schema'

/**
 * Complete ProjectEvent document schema
 *
 * Combines:
 * - Admin metadata (id, name, status, timestamps)
 * - Guest-facing configuration (draftConfig, publishedConfig)
 * - Publish tracking (versions, timestamps)
 *
 * Domain responsibilities:
 * - @domains/project/events/ manages admin metadata
 * - @domains/event/ manages guest-facing configuration
 *
 * This schema uses Firestore-safe patterns:
 * - Optional fields use `.nullable().default(null)` (Firestore doesn't support undefined)
 * - Uses `.passthrough()` for forward compatibility with future fields
 */
export const projectEventFullSchema = z
  .object({
    /**
     * ADMIN METADATA
     * Managed by @domains/project/events/
     */

    /** Unique event identifier (Firestore document ID) */
    id: z.string(),

    /** Event display name */
    name: z.string(),

    /** Event lifecycle status */
    status: z.enum(['active', 'deleted']).default('active'),

    /** Creation timestamp (Unix ms) */
    createdAt: z.number(),

    /** Last update timestamp (Unix ms) */
    updatedAt: z.number(),

    /** Soft delete timestamp (Unix ms) */
    deletedAt: z.number().nullable().default(null),

    /**
     * GUEST-FACING CONFIGURATION
     * Managed by @domains/event/
     */

    /** Draft configuration (work in progress) */
    draftConfig: projectEventConfigSchema.nullable().default(null),

    /** Published configuration (live for guests) */
    publishedConfig: projectEventConfigSchema.nullable().default(null),

    /**
     * PUBLISH TRACKING
     * Managed by @domains/event/
     */

    /** Draft version number (starts at 1, not 0) */
    draftVersion: z.number().default(1),

    /** Published version number */
    publishedVersion: z.number().nullable().default(null),

    /** Publish timestamp (Unix ms) */
    publishedAt: z.number().nullable().default(null),
  })
  .passthrough() // Allow unknown fields for future evolution

/**
 * TypeScript type for complete event document
 */
export type ProjectEventFull = z.infer<typeof projectEventFullSchema>

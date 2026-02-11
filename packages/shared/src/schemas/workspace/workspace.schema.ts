/**
 * Workspace Entity Schema
 *
 * Core Workspace entity definition for Firestore.
 * Collection: workspaces/{workspaceId}
 */
import { z } from 'zod'
import { workspaceIntegrationsSchema } from './workspace-integration.schema'

/**
 * Workspace status enum
 * Represents the lifecycle state of a workspace
 */
export const workspaceStatusSchema = z.enum(['active', 'deleted'])

/**
 * Workspace entity schema
 * Represents a workspace document in Firestore
 */
export const workspaceSchema = z.object({
  id: z.string().min(1, 'Workspace ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(50, 'Slug too long'),
  status: workspaceStatusSchema,
  deletedAt: z.number().nullable(),
  integrations: workspaceIntegrationsSchema.optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

/**
 * Type exports
 */
export type Workspace = z.infer<typeof workspaceSchema>
export type WorkspaceStatus = z.infer<typeof workspaceStatusSchema>

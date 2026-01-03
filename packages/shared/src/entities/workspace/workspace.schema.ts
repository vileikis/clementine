// Workspace entity schema
// Core Workspace entity definition for Firestore

import { z } from 'zod'

/**
 * Workspace status enum
 * Represents the lifecycle state of a workspace
 */
export const workspaceStatusSchema = z.enum(['active', 'deleted'])

/**
 * Workspace entity schema
 * Represents a workspace document in Firestore
 *
 * Collection: workspaces/{workspaceId}
 */
export const workspaceSchema = z.object({
  id: z.string().min(1, 'Workspace ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(50, 'Slug too long'),
  status: workspaceStatusSchema,
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

/**
 * Type exports
 */
export type Workspace = z.infer<typeof workspaceSchema>
export type WorkspaceStatus = z.infer<typeof workspaceStatusSchema>

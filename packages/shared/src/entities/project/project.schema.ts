// Project entity schema
// Core Project entity definition for Firestore

import { z } from 'zod'

/**
 * Project status enum
 * Represents the lifecycle state of a project
 */
export const projectStatusSchema = z.enum(['draft', 'live', 'deleted'])

/**
 * Project type enum
 * Distinguishes between standard projects and system-managed ghost projects
 */
export const projectTypeSchema = z.enum(['standard', 'ghost'])

/**
 * Project entity schema
 * Represents a project in Firestore
 *
 * Collection: projects/{projectId}
 */
export const projectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  status: projectStatusSchema,
  type: projectTypeSchema.default('standard'),
  activeEventId: z.string().nullable(),
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

/**
 * Type exports
 */
export type Project = z.infer<typeof projectSchema>
export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type ProjectType = z.infer<typeof projectTypeSchema>

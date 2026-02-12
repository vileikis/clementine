/**
 * Project Entity Schema
 *
 * Core Project entity definition for Firestore.
 * Collection: projects/{projectId}
 *
 * The project document contains:
 * - Admin metadata (name, status, timestamps)
 * - Draft and published configuration for guest-facing experience
 */
import { z } from 'zod'
import { projectConfigSchema } from './project-config.schema'
import { projectExportsSchema } from './project-exports.schema'

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
 * Uses looseObject for forward compatibility with future fields.
 */
export const projectSchema = z.looseObject({
  /**
   * IDENTITY
   */
  id: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  status: projectStatusSchema,
  type: projectTypeSchema.default('standard'),

  /**
   * CONFIGURATION
   * Draft config is for editing, published config is for guests
   */
  draftConfig: projectConfigSchema.nullable().default(null),
  publishedConfig: projectConfigSchema.nullable().default(null),

  /**
   * EXPORTS
   * Per-integration export configuration (e.g., Dropbox)
   */
  exports: projectExportsSchema.nullable().default(null),

  /**
   * PUBLISH TRACKING
   */
  draftVersion: z.number().default(1),
  publishedVersion: z.number().nullable().default(null),
  publishedAt: z.number().nullable().default(null),

  /**
   * TIMESTAMPS
   */
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

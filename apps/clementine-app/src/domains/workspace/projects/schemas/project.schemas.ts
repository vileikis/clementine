// Project operation schemas
// Input validation for project operations (app-specific)
// Note: Core Project entity schema is in @clementine/shared

import { z } from 'zod'

/**
 * Create project input schema
 * Validates input for creating a new project
 */
export const createProjectInputSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long')
    .optional()
    .default('Untitled project'),
})

/**
 * Delete project input schema
 * Validates input for soft-deleting a project
 */
export const deleteProjectInputSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
})

/**
 * Update project input schema
 * Validates input for updating project fields (rename operation)
 */
export const updateProjectInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long'),
})

/**
 * Duplicate project input schema
 * Validates input for duplicating a project
 */
export const duplicateProjectInputSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
})

/**
 * Type exports
 */
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>
export type DeleteProjectInput = z.infer<typeof deleteProjectInputSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>
export type DuplicateProjectInput = z.infer<typeof duplicateProjectInputSchema>

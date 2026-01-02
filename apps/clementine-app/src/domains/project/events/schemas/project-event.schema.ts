// ProjectEvent Zod schemas
// Runtime validation for project events and all operations

import { z } from 'zod'

// ============================================================================
// Entity Schemas
// ============================================================================

/**
 * Project event lifecycle status schema
 */
export const projectEventStatusSchema = z.enum(['active', 'deleted'])

/**
 * ProjectEvent entity schema
 * Validates the complete project event object from Firestore
 */
export const projectEventSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
  name: z
    .string()
    .min(1, 'Event name cannot be empty')
    .max(100, 'Event name cannot exceed 100 characters'),
  status: projectEventStatusSchema,
  createdAt: z.number().int().positive('Creation timestamp must be a positive integer'),
  updatedAt: z.number().int().positive('Update timestamp must be a positive integer'),
  deletedAt: z
    .number()
    .int()
    .positive('Deletion timestamp must be a positive integer')
    .nullable(),
})

// ============================================================================
// Operation Input Schemas
// ============================================================================

/**
 * Create project event input schema
 * Note: projectId is NOT in the input - it's derived from the subcollection path
 */
export const createProjectEventInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Event name cannot be empty')
    .max(100, 'Event name cannot exceed 100 characters')
    .optional()
    .default('Untitled event'),
})

/**
 * Update project event input schema
 */
export const updateProjectEventInputSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100, 'Event name too long'),
})

/**
 * Activate project event input schema
 */
export const activateProjectEventInputSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
})

/**
 * Deactivate project event input schema
 */
export const deactivateProjectEventInputSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
})

/**
 * Delete project event input schema
 */
export const deleteProjectEventInputSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
})

// ============================================================================
// Type Exports
// ============================================================================

export type ProjectEvent = z.infer<typeof projectEventSchema>
export type ProjectEventStatus = z.infer<typeof projectEventStatusSchema>
export type CreateProjectEventInput = z.infer<typeof createProjectEventInputSchema>
export type UpdateProjectEventInput = z.infer<typeof updateProjectEventInputSchema>
export type ActivateProjectEventInput = z.infer<typeof activateProjectEventInputSchema>
export type DeactivateProjectEventInput = z.infer<typeof deactivateProjectEventInputSchema>
export type DeleteProjectEventInput = z.infer<typeof deleteProjectEventInputSchema>

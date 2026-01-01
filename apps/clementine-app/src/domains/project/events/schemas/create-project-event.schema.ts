// Create project event input schema
// Validation for creating new project events

import { z } from 'zod'

/**
 * Create project event input schema
 * Validates input for creating a new project event
 *
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

// Type inference
export type CreateProjectEventInput = z.infer<typeof createProjectEventInputSchema>

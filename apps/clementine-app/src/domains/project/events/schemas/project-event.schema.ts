// ProjectEvent Zod schemas
// Runtime validation for project events

import { z } from 'zod'

/**
 * Project event lifecycle status schema
 */
export const projectEventStatusSchema = z.enum(['draft', 'deleted'], {
  errorMap: () => ({ message: 'Status must be either "draft" or "deleted"' }),
})

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

// Type inference
export type ProjectEvent = z.infer<typeof projectEventSchema>
export type ProjectEventStatus = z.infer<typeof projectEventStatusSchema>

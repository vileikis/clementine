import { z } from 'zod'
import {
  WORKSPACE_NAME,
  WORKSPACE_SLUG,
} from '../constants/workspace.constants'

/**
 * Workspace status enum schema
 */
export const workspaceStatusSchema = z.enum(['active', 'deleted'])

/**
 * Slug validation schema
 */
export const slugSchema = z
  .string()
  .min(WORKSPACE_SLUG.min, 'Slug is required')
  .max(
    WORKSPACE_SLUG.max,
    `Slug must be ${WORKSPACE_SLUG.max} characters or less`,
  )
  .regex(
    WORKSPACE_SLUG.pattern,
    'Slug must contain only lowercase letters, numbers, and hyphens (no leading/trailing hyphens)',
  )

/**
 * Complete workspace entity schema
 */
export const workspaceSchema = z
  .object({
    id: z.string(),
    name: z
      .string()
      .min(WORKSPACE_NAME.min, 'Name is required')
      .max(
        WORKSPACE_NAME.max,
        `Name must be ${WORKSPACE_NAME.max} characters or less`,
      ),
    slug: slugSchema,
    status: workspaceStatusSchema,
    deletedAt: z.number().nullable(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .refine((data) => data.status === 'active' || data.deletedAt !== null, {
    message: 'deletedAt must be set when workspace is deleted',
    path: ['deletedAt'],
  })

/**
 * Input schema for creating a new workspace
 */
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(WORKSPACE_NAME.min, 'Name is required')
    .max(
      WORKSPACE_NAME.max,
      `Name must be ${WORKSPACE_NAME.max} characters or less`,
    ),
  slug: slugSchema.optional(), // Optional - auto-generated from name if not provided
})

/**
 * Input schema for soft deleting a workspace
 */
export const deleteWorkspaceSchema = z.object({
  id: z.string().min(1, 'Workspace ID is required'),
})

/**
 * Type inference from schemas
 */
export type WorkspaceSchema = z.infer<typeof workspaceSchema>
export type CreateWorkspaceSchemaType = z.infer<typeof createWorkspaceSchema>
export type DeleteWorkspaceSchemaType = z.infer<typeof deleteWorkspaceSchema>

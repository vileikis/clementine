import { z } from 'zod'

export const projectStatusSchema = z.enum(['draft', 'live', 'deleted'])

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  workspaceId: z.string().min(1),
  status: projectStatusSchema,
  activeEventId: z.string().nullable(),
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const createProjectInputSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(100).optional().default('Untitled project'),
})

export const deleteProjectInputSchema = z.object({
  id: z.string().min(1),
})

export type ProjectSchemaType = z.infer<typeof projectSchema>
export type CreateProjectInputSchemaType = z.infer<
  typeof createProjectInputSchema
>
export type DeleteProjectInputSchemaType = z.infer<
  typeof deleteProjectInputSchema
>

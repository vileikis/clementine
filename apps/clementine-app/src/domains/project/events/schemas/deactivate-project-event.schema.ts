import { z } from 'zod'

export const deactivateProjectEventInputSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
})

export type DeactivateProjectEventInput = z.infer<
  typeof deactivateProjectEventInputSchema
>

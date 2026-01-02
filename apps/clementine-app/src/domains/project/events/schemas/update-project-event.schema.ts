import { z } from 'zod'

export const updateProjectEventInputSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100, 'Event name too long'),
})

export type UpdateProjectEventInput = z.infer<
  typeof updateProjectEventInputSchema
>

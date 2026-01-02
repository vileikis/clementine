import { z } from 'zod'

export const deleteProjectEventInputSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
})

export type DeleteProjectEventInput = z.infer<
  typeof deleteProjectEventInputSchema
>

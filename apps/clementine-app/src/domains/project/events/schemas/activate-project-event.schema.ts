import { z } from 'zod'

export const activateProjectEventInputSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
})

export type ActivateProjectEventInput = z.infer<
  typeof activateProjectEventInputSchema
>

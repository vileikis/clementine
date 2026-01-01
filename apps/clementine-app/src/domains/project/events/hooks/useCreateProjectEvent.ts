// useCreateProjectEvent hook
// Mutation hook for creating new project events

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, addDoc, type Firestore } from 'firebase/firestore'
import { createProjectEventInputSchema } from '../schemas/create-project-event.schema'
import type { CreateProjectEventInput, ProjectEvent } from '../types/project-event.types'

export function useCreateProjectEvent(firestore: Firestore, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectEventInput = {}) => {
      const validated = createProjectEventInputSchema.parse(input)

      const eventsRef = collection(firestore, `projects/${projectId}/events`)

      const now = Date.now()
      const docRef = await addDoc(eventsRef, {
        name: validated.name,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      })

      const newEvent: ProjectEvent = {
        id: docRef.id,
        name: validated.name,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }

      // T029: Navigation to event detail page will be added here
      // TODO: Add navigation after event creation
      // Example: navigate({ to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId', params: { eventId: newEvent.id } })

      return newEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectEvents', projectId] })
    },
  })
}

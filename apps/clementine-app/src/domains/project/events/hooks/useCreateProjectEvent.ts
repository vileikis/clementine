// useCreateProjectEvent hook
// Mutation hook for creating new project events

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { createProjectEventInputSchema } from '../schemas'
import type { WithFieldValue } from 'firebase/firestore'
import type { CreateProjectEventInput, ProjectEvent } from '../types/project-event.types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Create project event mutation (admin-only operation)
 *
 * Creates a new project event with default values.
 * Uses transaction to ensure serverTimestamp() resolves before returning,
 * preventing Zod parse errors from real-time listeners.
 * Security enforced via Firestore rules.
 */
export function useCreateProjectEvent(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectEventInput = {}) => {
      const validated = createProjectEventInputSchema.parse(input)

      const eventsRef = collection(firestore, `projects/${projectId}/events`)

      // ALWAYS use transaction with serverTimestamp()
      return await runTransaction(firestore, (transaction) => {
        const newEventRef = doc(eventsRef)

        const newEvent: WithFieldValue<ProjectEvent> = {
          id: newEventRef.id,
          name: validated.name,
          status: 'active' as const,
          createdAt: serverTimestamp(), // Transaction ensures this resolves
          updatedAt: serverTimestamp(),
          deletedAt: null,
        }

        transaction.set(newEventRef, newEvent)

        return Promise.resolve({
          eventId: newEventRef.id,
          projectId,
        })
      })
    },
    onSuccess: () => {
      // Invalidate project events list
      queryClient.invalidateQueries({
        queryKey: ['projectEvents', projectId],
      })

      // T029: Navigation to event detail page will be added here
      // TODO: Add navigation after event creation
      // Example: navigate({ to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId', params: { eventId } })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'project/events',
          action: 'create-project-event',
        },
        extra: {
          errorType: 'event-creation-failure',
        },
      })
    },
  })
}

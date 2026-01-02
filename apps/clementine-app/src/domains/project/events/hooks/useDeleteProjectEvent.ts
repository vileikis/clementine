// useDeleteProjectEvent hook
// Mutation hook for soft-deleting project events with transaction logic

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { deleteProjectEventInputSchema } from '../schemas/delete-project-event.schema'
import { firestore } from '@/integrations/firebase/client'

export interface DeleteProjectEventInput {
  projectId: string
  eventId: string
}

/**
 * Delete project event mutation (admin-only operation)
 *
 * Soft-deletes the project event (sets status to "deleted").
 * Uses Firestore transaction to atomically:
 * 1. Soft-delete the event (status = "deleted", deletedAt = timestamp)
 * 2. Clear project.activeEventId if the deleted event was active
 *
 * Security enforced via Firestore rules.
 */
export function useDeleteProjectEvent(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId: pid, eventId }: DeleteProjectEventInput) => {
      const validated = deleteProjectEventInputSchema.parse({
        projectId: pid,
        eventId,
      })

      return await runTransaction(firestore, async (transaction) => {
        const eventRef = doc(
          firestore,
          `projects/${validated.projectId}/events`,
          validated.eventId,
        )
        const projectRef = doc(firestore, 'projects', validated.projectId)

        // Soft delete event
        transaction.update(eventRef, {
          status: 'deleted',
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        // Clear activeEventId if this event was active
        const projectDoc = await transaction.get(projectRef)
        const projectData = projectDoc.data()
        if (projectData?.activeEventId === validated.eventId) {
          transaction.update(projectRef, {
            activeEventId: null,
            updatedAt: serverTimestamp(),
          })
        }

        return { projectId: validated.projectId, eventId: validated.eventId }
      })
    },
    onSuccess: () => {
      // Invalidate project events list (deleted event will disappear)
      queryClient.invalidateQueries({
        queryKey: ['projectEvents', projectId],
      })

      // Invalidate project query (activeEventId may have changed)
      queryClient.invalidateQueries({
        queryKey: ['project', projectId],
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'project/events',
          action: 'delete-project-event',
        },
        extra: {
          errorType: 'event-deletion-failure',
        },
      })
    },
  })
}

// useActivateProjectEvent hook
// Mutation hook for activating/deactivating project events with transaction logic

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import {
  activateProjectEventInputSchema,
  deactivateProjectEventInputSchema,
} from '../schemas'
import { firestore } from '@/integrations/firebase/client'

type ActivateProjectEventInput =
  | { eventId: string; projectId: string }
  | { eventId: null; projectId: string } // Deactivate

/**
 * Activate/deactivate project event mutation (admin-only operation)
 *
 * Atomically activates a project event or deactivates all events (eventId: null).
 * Uses Firestore transaction to ensure single active event constraint.
 * Verifies event exists and is not deleted before activation.
 * Security enforced via Firestore rules.
 */
export function useActivateProjectEvent(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ActivateProjectEventInput) => {
      if (input.eventId === null) {
        // Deactivate all events (set activeEventId to null)
        const validated = deactivateProjectEventInputSchema.parse({
          projectId: input.projectId,
        })

        return await runTransaction(firestore, async (transaction) => {
          const projectRef = doc(firestore, 'projects', validated.projectId)

          // Atomically clear activeEventId
          transaction.update(projectRef, {
            activeEventId: null,
            updatedAt: serverTimestamp(),
          })

          return Promise.resolve({ projectId: validated.projectId })
        })
      } else {
        // Activate specific event
        const validated = activateProjectEventInputSchema.parse({
          projectId: input.projectId,
          eventId: input.eventId,
        })

        return await runTransaction(firestore, async (transaction) => {
          const projectRef = doc(firestore, 'projects', validated.projectId)
          const eventRef = doc(
            firestore,
            `projects/${validated.projectId}/events`,
            validated.eventId,
          )

          // Verify event exists and is not deleted
          const eventDoc = await transaction.get(eventRef)
          if (!eventDoc.exists()) {
            throw new Error('Project event not found')
          }

          const eventData = eventDoc.data()
          if (eventData?.status === 'deleted') {
            throw new Error('Cannot activate deleted project event')
          }

          // Atomically update activeEventId (clears previous active event)
          transaction.update(projectRef, {
            activeEventId: validated.eventId,
            updatedAt: serverTimestamp(),
          })

          return Promise.resolve({
            projectId: validated.projectId,
            eventId: validated.eventId,
          })
        })
      }
    },
    onSuccess: () => {
      // Invalidate project events list (to reflect active status change)
      queryClient.invalidateQueries({
        queryKey: ['projectEvents', projectId],
      })

      // Invalidate project query (to reflect activeEventId change)
      queryClient.invalidateQueries({
        queryKey: ['project', projectId],
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'project/events',
          action: 'activate-project-event',
        },
        extra: {
          errorType: 'event-activation-failure',
        },
      })
    },
  })
}

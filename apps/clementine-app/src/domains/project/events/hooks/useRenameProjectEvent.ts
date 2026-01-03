// useRenameProjectEvent hook
// Mutation hook for renaming project events

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { updateProjectEventInputSchema } from '../schemas'
import { firestore } from '@/integrations/firebase/client'

export interface RenameProjectEventInput {
  eventId: string
  name: string
}

/**
 * Rename project event mutation (admin-only operation)
 *
 * Updates the project event name with real-time sync.
 * Uses transaction to ensure serverTimestamp() resolves before returning,
 * preventing Zod parse errors from real-time listeners.
 * Security enforced via Firestore rules.
 */
export function useRenameProjectEvent(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, name }: RenameProjectEventInput) => {
      const validated = updateProjectEventInputSchema.parse({ name })

      return await runTransaction(firestore, async (transaction) => {
        const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)

        // Read event to validate it exists (all reads must happen before writes)
        const eventDoc = await transaction.get(eventRef)
        if (!eventDoc.exists()) {
          throw new Error(`Event ${eventId} not found`)
        }

        // Update event name and timestamp
        transaction.update(eventRef, {
          name: validated.name,
          updatedAt: serverTimestamp(),
        })

        return { eventId, name: validated.name }
      })
    },
    onSuccess: () => {
      // Invalidate project events list to reflect new name
      queryClient.invalidateQueries({
        queryKey: ['projectEvents', projectId],
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'project/events',
          action: 'rename-project-event',
        },
        extra: {
          errorType: 'event-rename-failure',
        },
      })
    },
  })
}

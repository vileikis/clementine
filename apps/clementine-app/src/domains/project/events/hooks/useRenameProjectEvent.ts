// useRenameProjectEvent hook
// Mutation hook for renaming project events

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
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
 * Security enforced via Firestore rules.
 */
export function useRenameProjectEvent(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, name }: RenameProjectEventInput) => {
      const validated = updateProjectEventInputSchema.parse({ name })

      const eventRef = doc(
        firestore,
        `projects/${projectId}/events`,
        eventId,
      )

      await updateDoc(eventRef, {
        name: validated.name,
        updatedAt: serverTimestamp(),
      })

      return { eventId, name: validated.name }
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

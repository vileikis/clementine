/**
 * Mutation Hook: usePublishEvent
 *
 * Publishes draft configuration by copying draftConfig → publishedConfig.
 * Syncs versions and updates timestamp.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import type { UpdateData } from 'firebase/firestore'
import type { ProjectEventFull } from '@/domains/event/shared/schemas'
import { firestore } from '@/integrations/firebase/client'

/**
 * Hook for publishing event changes
 *
 * Copies draft configuration to published configuration, making changes
 * visible to guests. Syncs version numbers and updates timestamp.
 *
 * @param projectId - Parent project ID
 * @param eventId - Event ID to publish
 * @returns TanStack Query mutation
 *
 * @example
 * ```tsx
 * const publishEvent = usePublishEvent(projectId, eventId)
 *
 * // Publish changes
 * await publishEvent.mutateAsync()
 *
 * // Show loading state
 * {publishEvent.isPending && <Spinner />}
 * ```
 */
export function usePublishEvent(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await runTransaction(firestore, async (transaction) => {
        const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)
        const eventDoc = await transaction.get(eventRef)

        if (!eventDoc.exists()) {
          throw new Error(`Event ${eventId} not found`)
        }

        const currentEvent = eventDoc.data() as ProjectEventFull

        // Validate draftConfig exists
        if (!currentEvent.draftConfig) {
          throw new Error('Cannot publish: no draft configuration exists')
        }

        // Copy draft → published
        transaction.update(eventRef, {
          publishedConfig: currentEvent.draftConfig,
          publishedVersion: currentEvent.draftVersion,
          publishedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        } as UpdateData<ProjectEventFull>)

        return {
          eventId,
          publishedVersion: currentEvent.draftVersion,
        }
      })
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-event', projectId, eventId],
      })
    },

    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'event/designer',
          action: 'publish-event',
        },
        extra: {
          errorType: 'event-publish-failure',
          projectId,
          eventId,
        },
      })
    },
  })
}

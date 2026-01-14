/**
 * useUpdateEventExperiences Hook
 *
 * Mutation hook for updating event experiences configuration.
 * Uses Firestore transactions for atomic updates to prevent race conditions.
 *
 * Pattern: TanStack Query mutation with Firestore transaction
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import type { UpdateData } from 'firebase/firestore'

import type { ProjectEventFull } from '@/domains/event/shared/schemas'
import type {
  ExperienceReference,
  MainExperienceReference,
} from '../schemas/event-experiences.schema'
import { firestore } from '@/integrations/firebase/client'

/**
 * Input for updating experiences configuration
 * Partial updates allowed - only provide fields you want to change
 */
export interface UpdateExperiencesInput {
  /** Update main experiences array */
  main?: MainExperienceReference[]
  /** Update pregate experience */
  pregate?: ExperienceReference | null
  /** Update preshare experience */
  preshare?: ExperienceReference | null
}

/**
 * Parameters for the hook
 */
export interface UseUpdateEventExperiencesParams {
  projectId: string
  eventId: string
}

/**
 * Hook to update event experiences configuration with transactions
 *
 * Features:
 * - Atomic updates using Firestore transactions
 * - Prevents race conditions during rapid updates
 * - Automatic query invalidation (triggers re-render)
 * - Error handling with Sentry
 * - Supports partial updates (main, pregate, or preshare independently)
 *
 * Implementation:
 * - Uses runTransaction for atomic read-modify-write
 * - Merges input with existing experiences config
 * - Increments draftVersion for change tracking
 * - Invalidates event query on success
 *
 * @param params - Project and event identifiers
 * @returns TanStack Query mutation result
 *
 * @example
 * ```tsx
 * const updateExperiences = useUpdateEventExperiences({ projectId, eventId })
 *
 * // Add experience to main slot
 * await updateExperiences.mutateAsync({
 *   main: [
 *     ...currentMain,
 *     { experienceId: 'exp_123', enabled: true, applyOverlay: true }
 *   ]
 * })
 *
 * // Update pregate slot
 * await updateExperiences.mutateAsync({
 *   pregate: { experienceId: 'exp_456', enabled: true }
 * })
 *
 * // Remove preshare experience
 * await updateExperiences.mutateAsync({
 *   preshare: null
 * })
 * ```
 */
export function useUpdateEventExperiences({
  projectId,
  eventId,
}: UseUpdateEventExperiencesParams) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateExperiencesInput) => {
      await runTransaction(firestore, async (transaction) => {
        const eventRef = doc(
          firestore,
          `projects/${projectId}/events/${eventId}`,
        )

        // Read current state
        const eventDoc = await transaction.get(eventRef)
        if (!eventDoc.exists()) {
          throw new Error('Event not found')
        }

        const currentConfig = eventDoc.data().draftConfig ?? {}
        const currentExperiences = currentConfig.experiences ?? {
          main: [],
          pregate: null,
          preshare: null,
        }

        // Merge input with current state
        const updatedExperiences = {
          ...currentExperiences,
          ...input,
        }

        // Atomic update with version increment
        const updateData: UpdateData<ProjectEventFull> = {
          'draftConfig.experiences': updatedExperiences,
          draftVersion: increment(1),
          updatedAt: serverTimestamp(),
        }

        transaction.update(eventRef, updateData)

        return Promise.resolve()
      })
    },

    // Success: invalidate queries to trigger re-fetch
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-event', projectId, eventId],
      })
    },

    // Error: report to Sentry
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'event/experiences',
          action: 'update-event-experiences',
        },
        extra: {
          errorType: 'event-experiences-update-failure',
          projectId,
          eventId,
        },
      })
    },
  })
}

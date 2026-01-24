/**
 * useMarkExperienceComplete Hook
 *
 * Mutation hook for recording completed experiences in guest's completedExperiences array.
 * Used for pregate/preshare skip logic - tracks which experiences a guest has completed.
 *
 * Path: /projects/{projectId}/guests/{guestId}
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { guestKeys } from '../queries/guest.query'
import { firestore } from '@/integrations/firebase/client'

export interface MarkExperienceCompleteInput {
  /** Project ID */
  projectId: string
  /** Guest document ID */
  guestId: string
  /** Experience ID that was completed */
  experienceId: string
  /** Session ID for analytics linking */
  sessionId: string
}

/**
 * Hook for marking an experience as complete in the guest record
 *
 * Features:
 * - Uses Firestore arrayUnion for atomic append
 * - Invalidates guest query cache on success
 * - Captures errors to Sentry
 *
 * Used when:
 * - Guest completes pregate experience
 * - Guest completes main experience
 * - Guest completes preshare experience
 *
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function PregatePage({ sessionId }) {
 *   const markComplete = useMarkExperienceComplete()
 *
 *   const handleComplete = async () => {
 *     await markComplete.mutateAsync({
 *       projectId: project.id,
 *       guestId: guest.id,
 *       experienceId: pregateExperienceId,
 *       sessionId,
 *     })
 *     // Navigate to main experience
 *   }
 * }
 * ```
 */
export function useMarkExperienceComplete() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, MarkExperienceCompleteInput>({
    mutationFn: async ({ projectId, guestId, experienceId, sessionId }) => {
      const guestRef = doc(firestore, 'projects', projectId, 'guests', guestId)

      await updateDoc(guestRef, {
        completedExperiences: arrayUnion({
          experienceId,
          completedAt: Date.now(),
          sessionId,
        }),
      })
    },
    onSuccess: (_, { projectId, guestId }) => {
      // Invalidate guest query to refetch updated completedExperiences
      void queryClient.invalidateQueries({
        queryKey: guestKeys.record(projectId, guestId),
      })
    },
    onError: (error, input) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'guest',
          action: 'mark-experience-complete',
        },
        extra: {
          projectId: input.projectId,
          guestId: input.guestId,
          experienceId: input.experienceId,
        },
      })
    },
  })
}

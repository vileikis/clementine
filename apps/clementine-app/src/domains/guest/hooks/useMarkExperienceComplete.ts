/**
 * useMarkExperienceComplete Hook
 *
 * Mutation hook for recording completed experiences in guest's completedExperiences array.
 * Used for pregate/preshare skip logic - tracks which experiences a guest has completed.
 *
 * Path: /projects/{projectId}/guests/{guestId}
 *
 * Note: No cache invalidation needed - useGuest's onSnapshot listener
 * automatically updates the cache when the guest document changes.
 */
import { useMutation } from '@tanstack/react-query'
import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { firestore } from '@/integrations/firebase/client'

export interface MarkExperienceCompleteInput {
  /** Project ID */
  projectId: string
  /** Guest document ID */
  guestId: string
  /** Experience ID that was completed */
  experienceId: string
}

/**
 * Hook for marking an experience as complete in the guest record
 *
 * Features:
 * - Uses Firestore arrayUnion for atomic append
 * - Cache updates automatically via useGuest's onSnapshot listener
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
 * function PregatePage() {
 *   const markComplete = useMarkExperienceComplete()
 *
 *   const handleComplete = async () => {
 *     await markComplete.mutateAsync({
 *       projectId: project.id,
 *       guestId: guest.id,
 *       experienceId: pregateExperienceId,
 *     })
 *     // Navigate to main experience
 *   }
 * }
 * ```
 */
export function useMarkExperienceComplete() {
  return useMutation<void, Error, MarkExperienceCompleteInput>({
    mutationFn: async ({ projectId, guestId, experienceId }) => {
      const guestRef = doc(firestore, 'projects', projectId, 'guests', guestId)

      // Simple string array - Firestore's arrayUnion deduplicates automatically
      await updateDoc(guestRef, {
        completedExperiences: arrayUnion(experienceId),
      })
    },
    // No onSuccess needed - useGuest's onSnapshot listener
    // automatically updates the cache when the document changes
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

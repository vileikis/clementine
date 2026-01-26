/**
 * useCreateGuest Hook
 *
 * Mutation hook for creating a new guest in Firestore.
 * Used when a user (anonymous or admin) first visits a project.
 *
 * Path: /projects/{projectId}/guests/{guestId}
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { createGuestInputSchema, guestSchema } from '../schemas/guest.schema'
import { guestKeys } from '../queries/guest.query'
import type { WithFieldValue } from 'firebase/firestore'
import type { CreateGuestInput, Guest } from '../schemas/guest.schema'
import { firestore } from '@/integrations/firebase/client'

/**
 * Result returned on successful guest creation
 */
export interface CreateGuestResult {
  /** Created guest document */
  guest: Guest
}

/**
 * Hook for creating a new guest
 *
 * Features:
 * - Validates input with Zod schema
 * - Creates document with serverTimestamp() for createdAt
 * - Uses authUid as document ID for simplicity
 * - Updates query cache on success
 * - Captures errors to Sentry
 *
 * @returns TanStack Mutation result
 *
 * @example
 * ```tsx
 * function GuestInit({ projectId }: { projectId: string }) {
 *   const { user } = useAuth()
 *   const createGuest = useCreateGuest()
 *
 *   useEffect(() => {
 *     if (user && !guestExists) {
 *       createGuest.mutate({
 *         projectId,
 *         authUid: user.uid,
 *       })
 *     }
 *   }, [user, guestExists])
 * }
 * ```
 */
export function useCreateGuest() {
  const queryClient = useQueryClient()

  return useMutation<CreateGuestResult, Error, CreateGuestInput>({
    mutationFn: async (input) => {
      // Validate input
      const validated = createGuestInputSchema.parse(input)

      const guestRef = doc(
        firestore,
        `projects/${validated.projectId}/guests/${validated.authUid}`,
      )

      // Create in transaction to ensure serverTimestamp() resolves correctly
      // eslint-disable-next-line @typescript-eslint/require-await -- callback must be async for TypeScript inference
      return await runTransaction(firestore, async (transaction) => {
        const now = Date.now()

        const newGuest: WithFieldValue<Omit<Guest, 'createdAt'>> & {
          createdAt: ReturnType<typeof serverTimestamp>
        } = {
          id: validated.authUid,
          projectId: validated.projectId,
          authUid: validated.authUid,
          createdAt: serverTimestamp(),
          completedExperiences: [], // Initialize empty for new guests
        }

        transaction.set(guestRef, newGuest)

        // Return a client-side copy with estimated timestamp
        const clientGuest = guestSchema.parse({
          id: validated.authUid,
          projectId: validated.projectId,
          authUid: validated.authUid,
          createdAt: now,
          completedExperiences: [],
        })

        return {
          guest: clientGuest,
        }
      })
    },
    onSuccess: (result, input) => {
      // Update query cache with the new guest
      queryClient.setQueryData(
        guestKeys.record(input.projectId, input.authUid),
        result.guest,
      )
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'guest',
          action: 'create-guest',
        },
      })
    },
  })
}

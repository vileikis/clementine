/**
 * useInitGuest Hook
 *
 * Orchestration hook that initializes a guest for the current user.
 * Handles fetching existing guest or creating one if needed.
 *
 * Prerequisites:
 * - User must be authenticated (anonymous or admin)
 * - Uses useAuth() to get current user
 *
 * Flow:
 * 1. Wait for authentication to complete
 * 2. Fetch existing guest
 * 3. If no guest exists, create one
 * 4. Return ready state with guest data
 */
import { useEffect, useRef } from 'react'
import { useGuest } from './useGuest'
import { useCreateGuest } from './useCreateGuest'
import type { Guest } from '../schemas/guest.schema'
import { useAuth } from '@/domains/auth'

export type InitGuestState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; guest: Guest }

/**
 * Hook that initializes a guest for the authenticated user
 *
 * Handles the complete flow:
 * 1. Waits for user authentication
 * 2. Checks for existing guest
 * 3. Creates guest if it doesn't exist
 *
 * @param projectId - Project ID for the guest
 * @returns State object with loading, error, or ready status
 *
 * @example
 * ```tsx
 * function GuestContent({ projectId }: { projectId: string }) {
 *   const guestState = useInitGuest(projectId)
 *
 *   if (guestState.status === 'loading') {
 *     return <Loading />
 *   }
 *
 *   if (guestState.status === 'error') {
 *     return <Error message={guestState.error.message} />
 *   }
 *
 *   // guestState.status === 'ready'
 *   return <div>Welcome, guest {guestState.guest.id}!</div>
 * }
 * ```
 */
export function useInitGuest(projectId: string): InitGuestState {
  const { user, isLoading: authLoading } = useAuth()
  const createGuestMutation = useCreateGuest()
  const createAttemptedRef = useRef(false)

  // Only fetch if user is authenticated
  const guestQuery = useGuest(projectId, user?.uid ?? '')

  // Auto-create guest if it doesn't exist
  useEffect(() => {
    // Wait for auth and query to complete
    if (authLoading || guestQuery.isLoading || !user) {
      return
    }

    // If guest already exists, nothing to do
    if (guestQuery.data) {
      return
    }

    // Prevent duplicate create attempts (React Strict Mode)
    if (createAttemptedRef.current || createGuestMutation.isPending) {
      return
    }

    // Create guest
    createAttemptedRef.current = true
    createGuestMutation.mutate({
      projectId,
      authUid: user.uid,
    })
  }, [
    authLoading,
    user,
    projectId,
    guestQuery.isLoading,
    guestQuery.data,
    createGuestMutation.mutate,
  ])

  // Reset create attempt flag if projectId changes
  useEffect(() => {
    createAttemptedRef.current = false
  }, [projectId])

  // Loading state: auth loading, query loading, or create pending
  if (authLoading || guestQuery.isLoading || createGuestMutation.isPending) {
    return { status: 'loading' }
  }

  // Error state: query error or mutation error
  if (guestQuery.error) {
    return { status: 'error', error: guestQuery.error }
  }

  if (createGuestMutation.error) {
    return { status: 'error', error: createGuestMutation.error }
  }

  // Not authenticated yet (shouldn't happen if used correctly)
  if (!user) {
    return { status: 'loading' }
  }

  // Ready state: guest exists (either fetched or just created)
  const guest = guestQuery.data ?? createGuestMutation.data?.guest

  if (guest) {
    return { status: 'ready', guest }
  }

  // Still loading/creating
  return { status: 'loading' }
}

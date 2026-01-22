/**
 * useGuestPageInit Hook
 *
 * Composite hook that combines auth, guest validation, and guest initialization
 * into a single discriminated union state for the GuestLayout container.
 *
 * Handles:
 * 1. Anonymous authentication (auto sign-in if not authenticated)
 * 2. Guest validation (project, event existence and publish status)
 * 3. Guest record initialization (fetch or create)
 *
 * Note: Experience loading is NOT handled here. GuestLayout fetches
 * experiences separately after this hook returns 'ready' for lazy loading.
 *
 * Returns a discriminated union state that covers all possible states:
 * - loading: Still initializing
 * - auth-error: Failed to authenticate
 * - not-found: Project or event doesn't exist
 * - coming-soon: Event not yet published or no active event
 * - error: Generic error state
 * - ready: All data loaded and ready to render
 */
import { useEffect } from 'react'
import { useGuestValidation } from './useGuestValidation'
import { useInitGuest } from './useInitGuest'
import type { Project } from '@clementine/shared'
import type { User } from 'firebase/auth'
import type { ProjectEventFull } from '@/domains/event/shared'
import type { Guest } from '../schemas/guest.schema'
import { useAnonymousSignIn, useAuth } from '@/domains/auth'

/**
 * Discriminated union for guest page initialization states
 */
export type GuestPageInitState =
  | { status: 'loading' }
  | { status: 'auth-error'; message: string }
  | { status: 'not-found'; reason: 'project' | 'event' }
  | { status: 'coming-soon'; reason: 'no-active-event' | 'not-published' }
  | { status: 'error'; error: Error }
  | {
      status: 'ready'
      user: User
      project: Project
      event: ProjectEventFull
      guest: Guest
    }

/**
 * Composite hook for initializing guest pages
 *
 * Combines:
 * - useAuth() + useAnonymousSignIn() + auto-sign-in effect
 * - useGuestValidation(projectId) for project/event validation
 * - useInitGuest(projectId) for guest record
 *
 * Note: Experience loading is handled separately by GuestLayout
 * after this hook returns 'ready' for lazy loading.
 *
 * @param projectId - Project ID from URL params
 * @returns Discriminated union state for rendering
 *
 * @example
 * ```tsx
 * function GuestLayout({ projectId }: { projectId: string }) {
 *   const state = useGuestPageInit(projectId)
 *
 *   if (state.status === 'loading') return <LoadingScreen />
 *   if (state.status === 'auth-error') return <ErrorPage message={state.message} />
 *   if (state.status === 'not-found') return <NotFoundPage />
 *   if (state.status === 'coming-soon') return <ComingSoonPage />
 *   if (state.status === 'error') return <ErrorPage error={state.error} />
 *
 *   // state.status === 'ready' - now fetch experiences...
 * }
 * ```
 */
export function useGuestPageInit(projectId: string): GuestPageInitState {
  // Authentication
  const { user, isLoading: authLoading } = useAuth()
  const {
    signIn: signInAnonymously,
    isSigningIn,
    error: signInError,
  } = useAnonymousSignIn()

  // Auto-trigger anonymous sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user && !isSigningIn) {
      void signInAnonymously()
    }
  }, [authLoading, user, isSigningIn, signInAnonymously])

  // Guest validation (project, event existence and publish status)
  const validation = useGuestValidation(projectId)

  // Guest record initialization (only runs once authenticated)
  const guestState = useInitGuest(projectId)

  // Handle auth error
  if (signInError) {
    return {
      status: 'auth-error',
      message: 'Failed to sign in. Please refresh the page.',
    }
  }

  // Handle not-found state (project or event missing)
  if (validation.status === 'not-found') {
    return { status: 'not-found', reason: validation.reason }
  }

  // Handle coming-soon state (no active event or not published)
  if (validation.status === 'coming-soon') {
    return { status: 'coming-soon', reason: validation.reason }
  }

  // Show loading state while authenticating, fetching data, or creating guest
  if (
    authLoading ||
    isSigningIn ||
    validation.status === 'loading' ||
    guestState.status === 'loading'
  ) {
    return { status: 'loading' }
  }

  // Handle guest record error
  if (guestState.status === 'error') {
    return { status: 'error', error: guestState.error }
  }

  // At this point, validation.status === 'ready' and guestState.status === 'ready'
  if (
    validation.status === 'ready' &&
    guestState.status === 'ready' &&
    user !== null
  ) {
    return {
      status: 'ready',
      user,
      project: validation.project,
      event: validation.event,
      guest: guestState.guest,
    }
  }

  // Default to loading for any other state
  return { status: 'loading' }
}

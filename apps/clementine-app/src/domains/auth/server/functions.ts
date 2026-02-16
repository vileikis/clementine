import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import * as Sentry from '@sentry/tanstackstart-react'
import { useAppSession } from './session.server'
import type { SessionUser } from '../types/session.types'
import { adminAuth } from '@/integrations/firebase/server'

/**
 * Get current authenticated user from server session
 *
 * Returns user data from HTTP-only session cookie. This function works on
 * both server and client (via RPC). Use it in route guards (beforeLoad).
 *
 * @returns User data or null if unauthenticated
 */
export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    return Sentry.startSpan(
      { name: 'getCurrentUserFn', op: 'auth.session' },
      async () => {
        const session = await useAppSession()
        const {
          userId,
          email,
          isAdmin,
          isAnonymous,
          lastVisitedWorkspaceSlug,
        } = session.data

        try {
          throw new Error('Sentry Test Error function')
        } catch (error) {
          Sentry.captureException(error, {
            tags: { function: 'getCurrentUserFn', action: 'error' },
          })
        }

        if (!userId) {
          return null
        }

        return {
          userId,
          email: email || undefined,
          isAdmin: isAdmin || false,
          isAnonymous: isAnonymous || false,
          lastVisitedWorkspaceSlug,
        }
      },
    )
  },
)

/**
 * Verify Firebase ID token and create server session
 *
 * Called from client after Firebase Auth state changes. Verifies the ID token
 * with Firebase Admin SDK and stores user data in server session.
 *
 * @param data.idToken - Firebase ID token from client
 * @returns Success result
 */
export const createSessionFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { idToken: string }) => data)
  .handler(async ({ data }) => {
    return Sentry.startSpan(
      { name: 'createSessionFn', op: 'auth.session.create' },
      async () => {
        try {
          // Verify ID token with Firebase Admin SDK
          const decodedToken = await adminAuth.verifyIdToken(data.idToken)

          // Extract custom claims and user metadata
          const isAdmin = decodedToken.admin === true
          const isAnonymous =
            decodedToken.firebase.sign_in_provider === 'anonymous'

          // Update server session with user data
          const session = await useAppSession()

          // Preserve existing workspace preference during token refresh
          const existingWorkspaceSlug = session.data.lastVisitedWorkspaceSlug

          await session.update({
            userId: decodedToken.uid,
            email: decodedToken.email,
            isAdmin,
            isAnonymous,
            lastVisitedWorkspaceSlug: existingWorkspaceSlug,
          })

          return { success: true }
        } catch (error) {
          Sentry.captureException(error, {
            tags: { function: 'createSessionFn', action: 'session-creation' },
          })
          return { success: false, error: 'Invalid token' }
        }
      },
    )
  })

/**
 * Update last visited workspace in server session
 *
 * Called from workspace layout route after workspace data is confirmed valid.
 * Preserves all existing session data while updating workspace preference.
 *
 * @param data.workspaceSlug - Workspace slug to store in session
 * @returns Success result
 */
export const setLastVisitedWorkspaceFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { workspaceSlug: string }) => data)
  .handler(async ({ data }) => {
    return Sentry.startSpan(
      { name: 'setLastVisitedWorkspaceFn', op: 'workspace.session.update' },
      async () => {
        const session = await useAppSession()

        // Require authentication
        if (!session.data.userId) {
          return { success: false, error: 'Unauthenticated' }
        }

        // Preserve all existing session fields
        await session.update({
          ...session.data,
          lastVisitedWorkspaceSlug: data.workspaceSlug,
        })

        return { success: true }
      },
    )
  })

/**
 * Clear server session
 *
 * Clears HTTP-only session cookie. Does NOT redirect or sign out from Firebase.
 * Use this from AuthProvider's logout method for centralized logout logic.
 *
 * @returns Success result
 */
export const clearSessionFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ success: true }> => {
    return Sentry.startSpan(
      { name: 'clearSessionFn', op: 'auth.session.clear' },
      async () => {
        const session = await useAppSession()
        await session.clear()
        return { success: true }
      },
    )
  },
)

/**
 * @deprecated Use AuthProvider's logout method instead
 *
 * Legacy logout function with redirect.
 * This function will be removed in a future version.
 *
 * Clears HTTP-only session cookie and redirects to /login.
 * Client must also call Firebase Auth signOut() separately.
 *
 * @throws Redirect to /login after logout
 */
export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  return Sentry.startSpan(
    { name: 'logoutFn', op: 'auth.session.logout' },
    async () => {
      const session = await useAppSession()
      await session.clear()
      throw redirect({ to: '/login' })
    },
  )
})

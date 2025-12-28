import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import * as Sentry from '@sentry/tanstackstart-react'
import { useAppSession } from './session'
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
    const session = await useAppSession()
    const { userId, email, isAdmin, isAnonymous } = session.data

    if (!userId) {
      return null
    }

    return {
      userId,
      email: email || undefined,
      isAdmin: isAdmin || false,
      isAnonymous: isAnonymous || false,
    }
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
    try {
      // Verify ID token with Firebase Admin SDK
      const decodedToken = await adminAuth.verifyIdToken(data.idToken)

      // Extract custom claims and user metadata
      const isAdmin = decodedToken.admin === true
      const isAnonymous = decodedToken.firebase.sign_in_provider === 'anonymous'

      // Update server session with user data
      const session = await useAppSession()
      await session.update({
        userId: decodedToken.uid,
        email: decodedToken.email,
        isAdmin,
        isAnonymous,
      })

      return { success: true }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: 'createSessionFn', action: 'session-creation' },
      })
      return { success: false, error: 'Invalid token' }
    }
  })

/**
 * Logout user and clear server session
 *
 * Clears HTTP-only session cookie and redirects to home page.
 * Client must also call Firebase Auth signOut() separately.
 *
 * @throws Redirect to home page after logout
 */
export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()
  await session.clear()
  throw redirect({ to: '/login' })
})

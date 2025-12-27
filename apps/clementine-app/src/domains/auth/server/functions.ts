import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { useAppSession } from './session'
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
  async () => {
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
      console.error('Session creation failed:', error)
      return { success: false, error: 'Invalid token' }
    }
  })

/**
 * Sign out user and clear server session
 *
 * Clears HTTP-only session cookie and redirects to home page.
 * Client must also call Firebase Auth signOut() separately.
 *
 * @throws Redirect to home page after sign out
 */
export const signOutFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    const session = await useAppSession()
    await session.clear()
    throw redirect({ to: '/' })
  },
)

/**
 * Grant admin privileges to user by email
 *
 * Server function for admin management. Sets admin: true custom claim
 * on user's Firebase Auth account. User must re-authenticate to receive
 * the updated claim.
 *
 * @param data.email - User email to grant admin privileges
 * @returns Success result with user info or error
 */
export const grantAdminFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Look up user by email
      const user = await adminAuth.getUserByEmail(data.email)

      // Reject anonymous users (they don't have providerData)
      if (user.providerData.length === 0) {
        return {
          success: false,
          error: 'Cannot grant admin privileges to anonymous users',
        }
      }

      // Set admin custom claim
      await adminAuth.setCustomUserClaims(user.uid, { admin: true })

      return {
        success: true,
        uid: user.uid,
        email: user.email || data.email,
      }
    } catch (error) {
      console.error('Grant admin failed:', error)
      return { success: false, error: 'User not found or operation failed' }
    }
  })

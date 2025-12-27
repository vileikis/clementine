import { useSession } from '@tanstack/react-start/server'

/**
 * Session data structure for authenticated users
 *
 * This data is stored in an HTTP-only cookie and is NOT accessible from client code.
 * It represents the server-side authentication state.
 */
export type SessionData = {
  /** Firebase user ID */
  userId?: string
  /** User email (for OAuth users, undefined for anonymous) */
  email?: string
  /** Whether user has admin: true custom claim */
  isAdmin?: boolean
  /** Whether user is an anonymous user */
  isAnonymous?: boolean
}

/**
 * Get or create server-side session for auth state
 *
 * This hook must be called from server functions only (createServerFn).
 * Session data is stored in an encrypted HTTP-only cookie.
 *
 * @example
 * ```ts
 * const getCurrentUser = createServerFn().handler(async () => {
 *   const session = await useAppSession()
 *   return session.data
 * })
 * ```
 */
export function useAppSession() {
  return useSession<SessionData>({
    name: 'clementine-session',
    password: process.env.SESSION_SECRET!,
  })
}

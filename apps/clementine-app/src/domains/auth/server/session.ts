import { useSession } from '@tanstack/react-start/server'

// Validate SESSION_SECRET at module load time (fail fast)
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim()
  if (!secret) {
    throw new Error(
      'SESSION_SECRET environment variable is required for session encryption',
    )
  }
  return secret
}

const SESSION_SECRET = getSessionSecret()

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
    password: SESSION_SECRET,
  })
}

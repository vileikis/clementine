import { useSession } from '@tanstack/react-start/server'
import type { SessionData } from '../types/session.types'

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
 * Get or create server-side session for auth state
 *
 * This hook must be called from server functions only (createServerFn).
 * Session data is stored in an encrypted HTTP-only cookie.
 *
 * Security features:
 * - HTTP-only cookie (XSS protection - JavaScript cannot access)
 * - Secure flag in production (HTTPS only)
 * - SameSite=lax (CSRF protection)
 * - 7-day expiration (better UX for admin users)
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
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      httpOnly: true, // XSS protection (prevents JavaScript access)
      maxAge: 7 * 24 * 60 * 60, // 7 days (in seconds)
    },
  })
}

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

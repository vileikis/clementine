import { redirect } from '@tanstack/react-router'
import type { MyRouterContext } from '@/routes/__root'

// T027: Create AuthGuard component (reusable guard)

/**
 * Reusable auth guard helper for route protection
 *
 * Usage in route beforeLoad:
 * ```tsx
 * beforeLoad: async ({ context }) => {
 *   requireAdmin(context)
 * }
 * ```
 */

export function requireAdmin(context: MyRouterContext) {
  const { auth } = context

  if (!auth) {
    throw new Error('Auth not available in context')
  }

  // Wait for auth to initialize
  if (auth.isLoading) {
    // This shouldn't happen due to root route wait, but defensive check
    throw new Error('Auth not initialized')
  }

  // Check if user is authenticated
  if (!auth.user) {
    throw redirect({ to: '/' as const })
  }

  // Check if user is not anonymous
  if (auth.isAnonymous) {
    throw redirect({ to: '/' as const })
  }

  // Check if user has admin claim
  if (!auth.isAdmin) {
    throw redirect({ to: '/' as const })
  }

  // User is authenticated, non-anonymous, and has admin claim
  return
}

/**
 * Require authenticated user (non-anonymous)
 */
export function requireAuth(context: MyRouterContext) {
  const { auth } = context

  if (!auth) {
    throw new Error('Auth not available in context')
  }

  if (auth.isLoading) {
    throw new Error('Auth not initialized')
  }

  if (!auth.user) {
    throw redirect({ to: '/' as const })
  }

  if (auth.isAnonymous) {
    throw redirect({ to: '/' as const })
  }

  return
}

/**
 * Require any user (authenticated or anonymous)
 */
export function requireUser(context: MyRouterContext) {
  const { auth } = context

  if (!auth) {
    throw new Error('Auth not available in context')
  }

  if (auth.isLoading) {
    throw new Error('Auth not initialized')
  }

  if (!auth.user) {
    throw redirect({ to: '/' as const })
  }

  return
}

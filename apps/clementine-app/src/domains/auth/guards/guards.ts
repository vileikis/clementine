/**
 * Route guards for authentication and authorization
 *
 * These functions use server functions (getCurrentUserFn) to validate auth state,
 * which means they work on both server (SSR) and client (navigation).
 *
 * All guards throw redirects when requirements are not met.
 *
 * Usage in route beforeLoad:
 * ```tsx
 * beforeLoad: async () => {
 *   await requireAdmin()
 * }
 * ```
 */

import { redirect } from '@tanstack/react-router'
import { getCurrentUserFn } from '../server/functions'
import {
  isAdmin,
  isAnyUser,
  isAuthenticated,
  isNonAdmin,
} from '../utils/authChecks'

/**
 * Require admin user (works on both server and client)
 *
 * Validates that user is:
 * 1. Authenticated
 * 2. Not anonymous
 * 3. Has admin: true custom claim
 *
 * @throws Redirect to /login if requirements not met
 */
export async function requireAdmin() {
  const user = await getCurrentUserFn()

  if (!isAdmin(user)) {
    throw redirect({ to: '/login' })
  }

  return user
}

/**
 * Require authenticated non-anonymous user
 *
 * Validates that user is:
 * 1. Authenticated
 * 2. Not anonymous
 *
 * @throws Redirect to / if requirements not met
 */
export async function requireAuth() {
  const user = await getCurrentUserFn()

  if (isAuthenticated(user)) {
    throw redirect({ to: '/' })
  }

  return user
}

/**
 * Require any authenticated user (including anonymous)
 *
 * Validates that user is authenticated (can be anonymous).
 *
 * @throws Redirect to / if unauthenticated
 */
export async function requireUser() {
  const user = await getCurrentUserFn()

  if (!isAnyUser(user)) {
    throw redirect({ to: '/' })
  }

  return user
}

/**
 * Redirect if user is already authenticated and admin
 *
 * Useful for login page - if admin user visits /login, redirect to /admin.
 *
 * @throws Redirect to /admin if user is admin
 */
export async function redirectIfAdmin() {
  const user = await getCurrentUserFn()

  if (isAdmin(user)) {
    throw redirect({ to: '/workspace' })
  }

  return user
}

/**
 * Root route handler - smart redirect based on user type
 *
 * Redirects:
 * - Admin users → last visited workspace (if exists) or /admin
 * - Non-admin authenticated users → /login (will see waiting message)
 * - Anonymous/unauthenticated users → render root page (friendly message)
 *
 * Session persistence: If admin has previously visited a workspace,
 * redirect to that workspace for continuity.
 *
 * @throws Redirect based on user type and workspace history
 */
export async function handleRootRoute() {
  const user = await getCurrentUserFn()

  if (isAdmin(user)) {
    // Admin users go directly to workspace management
    // The workspace routes will handle session persistence (last visited workspace)
    throw redirect({ to: '/workspace' })
  }

  if (isNonAdmin(user)) {
    throw redirect({ to: '/login' })
  }

  // Anonymous or unauthenticated users - render root page
  return { user }
}

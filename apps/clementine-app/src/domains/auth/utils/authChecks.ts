/**
 * Pure user type checking helpers
 *
 * These functions are pure - they have no side effects and can be used
 * anywhere in the application for conditional logic (components, hooks, guards).
 */

import type { getCurrentUserFn } from '../server/functions'

type User = Awaited<ReturnType<typeof getCurrentUserFn>>

/**
 * Check if user is an admin
 *
 * Requirements:
 * - Authenticated
 * - Not anonymous
 * - Has admin: true custom claim
 */
export function isAdmin(user: User): boolean {
  return !!(user && !user.isAnonymous && user.isAdmin)
}

/**
 * Check if user is authenticated but not an admin
 *
 * Requirements:
 * - Authenticated
 * - Not anonymous
 * - Does NOT have admin claim
 */
export function isNonAdmin(user: User): boolean {
  return !!(user && !user.isAnonymous && !user.isAdmin)
}

/**
 * Check if user is authenticated anonymously
 */
export function isAnonymous(user: User): boolean {
  return !!(user?.isAnonymous)
}

/**
 * Check if user is authenticated (including anonymous)
 */
export function isAnyUser(user: User): boolean {
  return !!user
}

/**
 * Check if user is not authenticated
 */
export function isUnauthenticated(user: User): boolean {
  return !user
}

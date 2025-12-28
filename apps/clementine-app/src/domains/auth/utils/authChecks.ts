/**
 * Pure user type checking helpers
 *
 * These functions are pure - they have no side effects and can be used
 * anywhere in the application for conditional logic (components, hooks, guards).
 */

import type { SessionUser } from '../types/session.types'

/**
 * Check if user is an admin
 *
 * Requirements:
 * - Authenticated
 * - Not anonymous
 * - Has admin: true custom claim
 */
export function isAdmin(user: SessionUser | null): boolean {
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
export function isNonAdmin(user: SessionUser | null): boolean {
  return !!(user && !user.isAnonymous && !user.isAdmin)
}

/**
 * Check if user is authenticated anonymously
 */
export function isAnonymous(user: SessionUser | null): boolean {
  return !!user?.isAnonymous
}

/**
 * Check if user is authenticated (including anonymous)
 */
export function isAnyUser(user: SessionUser | null): boolean {
  return !!user
}

/**
 * Check if user is not authenticated
 */
export function isUnauthenticated(user: SessionUser | null): boolean {
  return !user
}

/**
 * Session data structure stored in HTTP-only cookie
 *
 * All fields are optional because an empty session is valid (unauthenticated user).
 * This is the raw data stored in the encrypted session cookie.
 */
export interface SessionData {
  /** Firebase user ID */
  userId?: string

  /** User email (undefined for anonymous users) */
  email?: string

  /** Whether user has admin: true custom claim */
  isAdmin?: boolean

  /** Whether user is authenticated anonymously */
  isAnonymous?: boolean
}

/**
 * Authenticated user data from server session
 *
 * Returned by getCurrentUserFn() when a user is authenticated.
 * All auth-related fields are required (userId always present for authenticated users).
 */
export interface SessionUser {
  /** Firebase user ID */
  userId: string

  /** User email (undefined for anonymous users) */
  email?: string

  /** Whether user has admin: true custom claim */
  isAdmin: boolean

  /** Whether user is authenticated anonymously */
  isAnonymous: boolean
}

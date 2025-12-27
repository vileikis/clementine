/**
 * Server-side auth module exports
 *
 * This barrel file exports all server-side authentication functionality.
 * These exports should ONLY be used in:
 * - Server functions (createServerFn)
 * - Route guards (beforeLoad hooks - they run on server and client)
 * - Server-side scripts
 *
 * DO NOT import these in client components - they will fail at runtime.
 */

// Session management
export { useAppSession, type SessionData } from './session'

// Server functions for auth
export {
  getCurrentUserFn,
  createSessionFn,
  signOutFn,
  grantAdminFn,
} from './functions'

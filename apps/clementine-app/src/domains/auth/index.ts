// Public API for auth domain

// Client-side components and providers
export { AuthProvider, useAuth } from './providers/AuthProvider'
export { LoginPage } from './components/LoginPage'
export { WaitingMessage } from './components/WaitingMessage'

// Route guards (server-side, work on both server and client)
export {
  requireAdmin,
  requireAuth,
  requireUser,
  redirectIfAdmin,
} from './lib/guards'

// Server functions (for direct use in components/routes)
export {
  getCurrentUserFn,
  createSessionFn,
  signOutFn,
  grantAdminFn,
} from './server/functions'

// TypeScript types
export type {
  AuthState,
  CustomClaims,
  TypedIdTokenResult,
  RouterContext,
} from './types/auth.types'

export type { SessionData } from './server/session'

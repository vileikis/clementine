// Public API for auth domain
export { AuthProvider, useAuth } from './providers/AuthProvider'
export { LoginPage } from './components/LoginPage'
export { WaitingMessage } from './components/WaitingMessage'
export { requireAdmin, requireAuth, requireUser } from './components/AuthGuard'
export type {
  AuthState,
  CustomClaims,
  TypedIdTokenResult,
  RouterContext,
} from './types/auth.types'

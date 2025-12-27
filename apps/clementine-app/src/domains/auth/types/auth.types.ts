import type { IdTokenResult, User } from 'firebase/auth'

/**
 * Custom claims structure in ID token
 */
export interface CustomClaims {
  admin?: boolean
}

/**
 * Extended ID token result with typed custom claims
 */
export interface TypedIdTokenResult extends IdTokenResult {
  claims: IdTokenResult['claims'] & CustomClaims
}

/**
 * Auth state managed by AuthProvider
 */
export interface AuthState {
  /** Current Firebase Auth user (null if unauthenticated) */
  user: User | null

  /** Whether user has admin: true custom claim */
  isAdmin: boolean

  /** Whether user is anonymous */
  isAnonymous: boolean

  /** Whether auth state is being initialized */
  isLoading: boolean

  /** ID token result with custom claims (null if unauthenticated) */
  idTokenResult: TypedIdTokenResult | null
}

/**
 * Router context including auth state
 */
export interface RouterContext {
  auth: AuthState
}

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
 * Auth state data (managed by AuthProvider)
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
 * Auth actions (methods provided by AuthProvider)
 */
export interface AuthActions {
  /**
   * Logout user (clears both Firebase auth and server session)
   * Automatically navigates to /login after logout
   */
  logout: () => Promise<void>
}

/**
 * Complete auth context value (state + actions)
 * This is what useAuth() returns
 */
export type AuthContextValue = AuthState & AuthActions

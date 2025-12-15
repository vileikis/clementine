// Guest flow TypeScript types
// Re-export Zod-inferred types from schemas (single source of truth)

export type { Guest, SessionState, Session } from "../schemas/guest.schemas"

/**
 * Guest authentication state returned by useGuestAuth hook
 */
export interface GuestAuthState {
  /** Firebase anonymous user or null if not authenticated */
  user: {
    uid: string
    isAnonymous: boolean
  } | null

  /** User ID convenience accessor */
  userId: string | null

  /** True while auth state is being determined */
  loading: boolean

  /** Error if authentication failed */
  error: Error | null
}

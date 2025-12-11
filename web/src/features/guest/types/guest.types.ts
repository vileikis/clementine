// Guest flow TypeScript types

/**
 * Represents an anonymous visitor to a project.
 * Created when a guest first authenticates on the welcome screen.
 * Document ID = Firebase Auth anonymous user UID
 */
export interface Guest {
  /** Firebase Auth anonymous user UID (also the document ID) */
  id: string

  /** Reference to the project this guest visited */
  projectId: string

  /** Firebase Auth UID (same as id, for querying) */
  authUid: string

  /** Timestamp when guest first visited (ms since epoch) */
  createdAt: number

  /** Last activity timestamp (updated on session creation) */
  lastSeenAt: number
}

/**
 * Session lifecycle state
 */
export type SessionState =
  | "created" // Initial state after creation
  | "in_progress" // Guest is actively interacting
  | "completed" // Guest finished the experience
  | "abandoned" // Session timed out or guest left
  | "error" // Something went wrong

/**
 * Represents a single guest interaction with an experience.
 * Created when a guest taps an experience to start it.
 */
export interface Session {
  /** Firestore auto-generated document ID */
  id: string

  /** Reference to the project */
  projectId: string

  /** Reference to the guest who started this session */
  guestId: string

  /** Reference to the experience being run */
  experienceId: string

  /** Reference to the active event at session creation */
  eventId: string

  /** Session lifecycle state */
  state: SessionState

  /** Current step index in experience flow (for future use) */
  currentStepIndex: number

  /** Collected input data keyed by step ID (for future use) */
  data: Record<string, unknown>

  /** Timestamp when session was created */
  createdAt: number

  /** Timestamp when session was last updated */
  updatedAt: number
}

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

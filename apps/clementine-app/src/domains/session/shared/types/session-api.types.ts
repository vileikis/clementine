/**
 * Session API Types
 *
 * Type shapes for session API operations.
 * These are interface definitions only for Phase 0 - implementation comes in Phase 3.
 */
import type { MediaReference } from '@/shared/theming/schemas/media-reference.schema'
import type {
  ConfigSource,
  Session,
  SessionMode,
} from '../schemas/session.schema'

/**
 * Input for creating a new session
 */
export interface CreateSessionInput {
  /** Parent project ID */
  projectId: string

  /** Parent event ID */
  eventId: string

  /** Experience to execute */
  experienceId: string

  /** Session mode (preview or guest) */
  mode: SessionMode

  /** Config source (draft or published) */
  configSource: ConfigSource
}

/**
 * Input for updating session progress
 */
export interface UpdateSessionProgressInput {
  /** Session to update */
  sessionId: string

  /** New step index */
  currentStepIndex: number

  /** Updated answers (optional, merged with existing) */
  answers?: Record<string, unknown>

  /** Updated outputs (optional, merged with existing) */
  outputs?: Record<string, MediaReference>
}

/**
 * Create session function type
 * Creates a new session and returns the session document
 */
export type CreateSessionFn = (input: CreateSessionInput) => Promise<Session>

/**
 * Subscribe to session updates function type
 * Subscribes to real-time session updates
 * Returns an unsubscribe function
 */
export type SubscribeSessionFn = (
  sessionId: string,
  callback: (session: Session) => void,
) => () => void

/**
 * Update session progress function type
 * Updates the current step and accumulated data
 */
export type UpdateSessionProgressFn = (
  input: UpdateSessionProgressInput,
) => Promise<void>

/**
 * Close session function type
 * Marks a session as completed or abandoned
 */
export type CloseSessionFn = (sessionId: string) => Promise<void>

/**
 * Session API Schemas and Types
 *
 * Zod schemas and types for session API operations.
 */
import { z } from 'zod'

import { configSourceSchema, sessionModeSchema } from '../schemas'
import type { Session } from '../schemas'
import type { SessionResponse } from '@clementine/shared'

/**
 * Create session input schema
 *
 * Note: eventId has been removed - config is now embedded directly in project.
 */
export const createSessionInputSchema = z.object({
  /** Parent project ID */
  projectId: z.string(),

  /** Workspace ID for cross-project analytics */
  workspaceId: z.string(),

  /** Experience to execute */
  experienceId: z.string(),

  /** Session mode (preview or guest) */
  mode: sessionModeSchema,

  /** Config source (draft or published) */
  configSource: configSourceSchema,
})

/**
 * Complete session input schema
 */
export const completeSessionInputSchema = z.object({
  /** Session to complete */
  sessionId: z.string().min(1),
})

/**
 * Abandon session input schema
 */
export const abandonSessionInputSchema = z.object({
  /** Session to abandon */
  sessionId: z.string().min(1),
})

/**
 * TypeScript types inferred from schemas
 */
export type CreateSessionInput = z.infer<typeof createSessionInputSchema>
export type CompleteSessionInput = z.infer<typeof completeSessionInputSchema>
export type AbandonSessionInput = z.infer<typeof abandonSessionInputSchema>

/**
 * Update session progress input type
 * Uses SessionResponse[] for responses
 */
export interface UpdateSessionProgressInput {
  /** Session to update */
  sessionId: string
  /** Responses to set - overwrites existing */
  responses: SessionResponse[]
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
 * Updates the responses array
 */
export type UpdateSessionProgressFn = (
  input: UpdateSessionProgressInput,
) => Promise<void>

/**
 * Close session function type
 * Marks a session as completed or abandoned
 */
export type CloseSessionFn = (sessionId: string) => Promise<void>

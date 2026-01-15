/**
 * Session API Schemas and Types
 *
 * Zod schemas and types for session API operations.
 */
import { z } from 'zod'

import {
  answerSchema,
  capturedMediaSchema,
  configSourceSchema,
  sessionModeSchema,
} from '../schemas/session.schema'
import type { Session } from '../schemas/session.schema'

/**
 * Create session input schema
 */
export const createSessionInputSchema = z.object({
  /** Parent project ID */
  projectId: z.string(),

  /** Workspace ID for cross-project analytics */
  workspaceId: z.string(),

  /** Parent event ID */
  eventId: z.string(),

  /** Experience to execute */
  experienceId: z.string(),

  /** Session mode (preview or guest) */
  mode: sessionModeSchema,

  /** Config source (draft or published) */
  configSource: configSourceSchema,
})

/**
 * Update session progress input schema
 *
 * Note: resultMedia is intentionally excluded - it's written by cloud functions only.
 */
export const updateSessionProgressInputSchema = z.object({
  /** Session to update */
  sessionId: z.string(),

  /** New step index (optional) */
  currentStepIndex: z.number().optional(),

  /** Answers to set (optional) - overwrites existing */
  answers: z.array(answerSchema).optional(),

  /** Captured media to set (optional) - overwrites existing */
  capturedMedia: z.array(capturedMediaSchema).optional(),
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
export type UpdateSessionProgressInput = z.infer<
  typeof updateSessionProgressInputSchema
>
export type CompleteSessionInput = z.infer<typeof completeSessionInputSchema>
export type AbandonSessionInput = z.infer<typeof abandonSessionInputSchema>

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

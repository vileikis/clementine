/**
 * Session API Schemas and Types
 *
 * Zod schemas and types for session API operations.
 * These are schema definitions only for Phase 0 - implementation comes in Phase 3.
 */
import { z } from 'zod'

import {
  configSourceSchema,
  sessionModeSchema,
} from '../schemas/session.schema'
import type { Session } from '../schemas/session.schema'
import { mediaReferenceSchema } from '@/shared/theming'

/**
 * Create session input schema
 */
export const createSessionInputSchema = z.object({
  /** Parent project ID */
  projectId: z.string(),

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
 */
export const updateSessionProgressInputSchema = z.object({
  /** Session to update */
  sessionId: z.string(),

  /** New step index */
  currentStepIndex: z.number(),

  /** Updated inputs (optional, merged with existing) */
  inputs: z.record(z.string(), z.unknown()).optional(),

  /** Updated outputs (optional, merged with existing) */
  outputs: z.record(z.string(), mediaReferenceSchema).optional(),
})

/**
 * TypeScript types inferred from schemas
 */
export type CreateSessionInput = z.infer<typeof createSessionInputSchema>
export type UpdateSessionProgressInput = z.infer<
  typeof updateSessionProgressInputSchema
>

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

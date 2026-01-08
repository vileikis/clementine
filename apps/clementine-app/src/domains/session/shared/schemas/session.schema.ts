/**
 * Session Schema
 *
 * Defines the structure for Session documents stored in Firestore.
 * A session tracks guest or admin preview progress through an experience.
 *
 * Firestore Path: /projects/{projectId}/sessions/{sessionId}
 *
 * This schema uses Firestore-safe patterns:
 * - Optional fields use `.nullable().default(null)` (Firestore doesn't support undefined)
 * - Uses `z.looseObject()` for forward compatibility with future fields
 */
import { z } from 'zod'
import { mediaReferenceSchema } from '@/shared/theming/schemas/media-reference.schema'

/**
 * Session mode schema
 * Determines the context of the session
 */
export const sessionModeSchema = z.enum(['preview', 'guest'])

/**
 * Config source schema
 * Determines which experience config to use
 */
export const configSourceSchema = z.enum(['draft', 'published'])

/**
 * Session status schema
 * Tracks the lifecycle state of a session
 */
export const sessionStatusSchema = z.enum([
  'active',
  'completed',
  'abandoned',
  'error',
])

/**
 * Session Schema
 *
 * Complete session document schema for tracking experience execution.
 */
export const sessionSchema = z.looseObject({
  /**
   * IDENTITY
   */

  /** Unique session identifier (Firestore document ID) */
  id: z.string(),

  /**
   * CONTEXT
   */

  /** Parent project ID */
  projectId: z.string(),

  /** Parent event ID */
  eventId: z.string(),

  /** Experience being executed */
  experienceId: z.string(),

  /**
   * MODE
   */

  /** Session mode (preview for admins, guest for public) */
  mode: sessionModeSchema,

  /** Which config to use (draft for preview, published for guest) */
  configSource: configSourceSchema,

  /**
   * STATE
   */

  /** Current session status */
  status: sessionStatusSchema.default('active'),

  /** Current step index (0-based) */
  currentStepIndex: z.number().default(0),

  /**
   * ACCUMULATED DATA
   */

  /** Answers collected during the session, keyed by step ID */
  answers: z.record(z.string(), z.unknown()).default({}),

  /** Media outputs generated during the session, keyed by step ID */
  outputs: z.record(z.string(), mediaReferenceSchema).default({}),

  /**
   * TRANSFORM JOB TRACKING
   */

  /** Active transform job ID (for async processing) */
  activeJobId: z.string().nullable().default(null),

  /** Result asset ID from transform job */
  resultAssetId: z.string().nullable().default(null),

  /**
   * TIMESTAMPS
   */

  /** Creation timestamp (Unix ms) */
  createdAt: z.number(),

  /** Last update timestamp (Unix ms) */
  updatedAt: z.number(),

  /** Completion timestamp (Unix ms) */
  completedAt: z.number().nullable().default(null),
})

/**
 * TypeScript types exported from schemas
 */
export type Session = z.infer<typeof sessionSchema>
export type SessionMode = z.infer<typeof sessionModeSchema>
export type ConfigSource = z.infer<typeof configSourceSchema>
export type SessionStatus = z.infer<typeof sessionStatusSchema>

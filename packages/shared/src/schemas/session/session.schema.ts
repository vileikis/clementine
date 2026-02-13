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
import { jobStatusSchema } from '../job/job-status.schema'
import { mediaReferenceSchema } from '../media/media-reference.schema'
import { sessionResponseSchema } from './session-response.schema'

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
 * SessionResultMedia schema
 * Represents the final output from transform/capture
 */
export const sessionResultMediaSchema = z.object({
  /** Step that produced the result */
  stepId: z.string(),
  /** Result asset ID */
  assetId: z.string(),
  /** Public URL to the result */
  url: z.string(),
  /** Result creation timestamp (Unix ms) */
  createdAt: z.number(),
})

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

  /** Workspace ID for cross-project analytics */
  workspaceId: z.string(),

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

  /**
   * ACCUMULATED DATA
   */

  /**
   * Unified responses from all steps (input + capture).
   * Replaces separate `answers` and `capturedMedia` arrays.
   *
   * Each response contains:
   * - stepId, stepName, stepType: Links to the step definition
   * - data: Step-specific structured data (string | MultiSelectOption[] | MediaReference[] | null)
   * - createdAt, updatedAt: Timestamps (Unix ms)
   *
   * @see sessionResponseSchema for full structure
   */
  responses: z.array(sessionResponseSchema).default([]),

  /** Final result media from transform/capture */
  resultMedia: mediaReferenceSchema.nullable().default(null),

  /** Guest email for result delivery (PII — do not log) */
  guestEmail: z.string().email().nullable().default(null),

  /** Timestamp when result email was sent (Unix ms, duplicate guard) */
  emailSentAt: z.number().nullable().default(null),

  /**
   * JOURNEY LINKING
   * For pregate/preshare sessions: references the main session ID
   * For main sessions: null (they are the anchor)
   *
   * Linking Flow:
   * 1. Pregate session created → mainSessionId: null
   * 2. Main session created → if pregate exists, update pregate: mainSessionId = main.id
   * 3. Preshare session created → mainSessionId from URL param (main session ID)
   *
   * Query: where mainSessionId == "main-456" returns all related sessions
   */
  mainSessionId: z.string().nullable().default(null),

  /**
   * TRANSFORM JOB TRACKING
   */

  /** Transform job ID (for async processing) */
  jobId: z.string().nullable().default(null),

  /** Transform job status (synced from job document) */
  jobStatus: jobStatusSchema.nullable().default(null),

  /**
   * OWNERSHIP
   */

  /** User ID who created this session (for security rules) */
  createdBy: z.string().nullable().default(null),

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
export type SessionResultMedia = z.infer<typeof sessionResultMediaSchema>

// Re-export JobStatus for convenience
export { jobStatusSchema, type JobStatus } from '../job/job-status.schema'

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
import { jobStatusSchema } from '../job/job.schema'

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
 * Answer schema
 * Represents a collected answer from an input step
 */
export const answerSchema = z.object({
  /** Step that collected this answer */
  stepId: z.string(),
  /** Step type (e.g., 'input.scale', 'input.yesNo') */
  stepType: z.string(),
  /** The answer value - type varies by step type */
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  /** Timestamp when answered (Unix ms) */
  answeredAt: z.number(),
})

/**
 * CapturedMedia schema
 * Represents media captured from a capture step
 */
export const capturedMediaSchema = z.object({
  /** Step that captured this media */
  stepId: z.string(),
  /** Media asset ID in storage */
  assetId: z.string(),
  /** Public URL to the asset */
  url: z.string(),
  /** Capture timestamp (Unix ms) */
  createdAt: z.number(),
})

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

  /** Parent event ID (null for preview sessions) */
  eventId: z.string().nullable(),

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

  /** Answers collected from input steps */
  answers: z.array(answerSchema).default([]),

  /** Media captured from capture steps */
  capturedMedia: z.array(capturedMediaSchema).default([]),

  /** Final result media from transform/capture */
  resultMedia: sessionResultMediaSchema.nullable().default(null),

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
export type Answer = z.infer<typeof answerSchema>
export type CapturedMedia = z.infer<typeof capturedMediaSchema>
export type SessionResultMedia = z.infer<typeof sessionResultMediaSchema>

// Re-export JobStatus for convenience
export { jobStatusSchema, type JobStatus } from '../job/job.schema'

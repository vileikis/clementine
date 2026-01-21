/**
 * Job Schema
 *
 * Tracks execution of a transform pipeline.
 * Contains full execution context snapshot for reproducibility.
 *
 * Firestore Path: /projects/{projectId}/jobs/{jobId}
 *
 * Snapshot schemas use z.looseObject() for forward compatibility:
 * - Old jobs with extra fields (e.g., stepName) still parse
 * - New jobs use current schema definitions
 * - Schema evolution is natural as the system evolves
 */
import { z } from 'zod'
import { answerSchema, capturedMediaSchema } from '../session/session.schema'
import { overlayReferenceSchema } from '../event/project-event-config.schema'
import { transformConfigSchema } from '../experience/transform.schema'

/**
 * Job status schema (for transform job tracking)
 */
export const jobStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
])

/**
 * Job progress tracking
 */
export const jobProgressSchema = z.object({
  currentStep: z.string(),
  percentage: z.number().min(0).max(100),
  message: z.string().optional(),
})

/**
 * Job error details
 */
export const jobErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  step: z.string().optional(),
  isRetryable: z.boolean(),
  timestamp: z.number().int().positive(),
})

/**
 * Job output reference
 */
export const jobOutputSchema = z.object({
  assetId: z.string(),
  url: z.url(),
  format: z.enum(['image', 'gif', 'video']),
  dimensions: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  sizeBytes: z.number().int().positive(),
  processingTimeMs: z.number().int().nonnegative(),
})

/**
 * Snapshot of session inputs at job creation
 *
 * Reuses session schemas for consistency. z.looseObject() ensures
 * old jobs with extra fields (e.g., stepName from earlier versions)
 * still parse successfully.
 */
export const sessionInputsSnapshotSchema = z.looseObject({
  answers: z.array(answerSchema),
  capturedMedia: z.array(capturedMediaSchema),
})

/**
 * Snapshot of transform configuration at job creation
 *
 * Reuses transformConfigSchema from experience for consistency.
 * Schema is already a z.looseObject() so old jobs with extra fields still parse.
 */
export const transformConfigSnapshotSchema = transformConfigSchema

/**
 * Snapshot of event context at job creation
 *
 * Captures overlay reference and whether to apply it.
 * Reuses overlayReferenceSchema for consistency.
 */
export const eventContextSnapshotSchema = z.looseObject({
  overlay: overlayReferenceSchema,
  applyOverlay: z.boolean(),
})

/**
 * Version snapshot for audit trail
 */
export const versionSnapshotSchema = z.object({
  experienceVersion: z.number().int().positive(),
  eventVersion: z.number().int().positive().nullable(),
})

/**
 * Complete job execution snapshot
 */
export const jobSnapshotSchema = z.looseObject({
  sessionInputs: sessionInputsSnapshotSchema,
  transformConfig: transformConfigSnapshotSchema,
  eventContext: eventContextSnapshotSchema,
  versions: versionSnapshotSchema,
})

/**
 * Job Document Schema
 */
export const jobSchema = z.looseObject({
  // IDENTITY
  id: z.string(),

  // CONTEXT REFERENCES
  projectId: z.string(),
  sessionId: z.string(),
  experienceId: z.string(),
  stepId: z.string().nullable().default(null),

  // STATUS TRACKING
  status: jobStatusSchema.default('pending'),
  progress: jobProgressSchema.nullable().default(null),

  // RESULTS
  output: jobOutputSchema.nullable().default(null),
  error: jobErrorSchema.nullable().default(null),

  // EXECUTION SNAPSHOT
  snapshot: jobSnapshotSchema,

  // TIMESTAMPS
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  startedAt: z.number().int().positive().nullable().default(null),
  completedAt: z.number().int().positive().nullable().default(null),
})

export type Job = z.infer<typeof jobSchema>
export type JobStatus = z.infer<typeof jobStatusSchema>
export type JobProgress = z.infer<typeof jobProgressSchema>
export type JobError = z.infer<typeof jobErrorSchema>
export type JobOutput = z.infer<typeof jobOutputSchema>
export type JobSnapshot = z.infer<typeof jobSnapshotSchema>
export type SessionInputsSnapshot = z.infer<typeof sessionInputsSnapshotSchema>
export type TransformConfigSnapshot = z.infer<typeof transformConfigSnapshotSchema>
export type EventContextSnapshot = z.infer<typeof eventContextSnapshotSchema>
export type VersionSnapshot = z.infer<typeof versionSnapshotSchema>

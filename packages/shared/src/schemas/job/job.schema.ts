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
import {
  overlayReferenceSchema,
  overlaysConfigSchema,
} from '../project/project-config.schema'
import { mainExperienceReferenceSchema } from '../project/experiences.schema'
import { sessionResponseSchema } from '../session/session-response.schema'
import { outcomeSchema } from '../experience/outcome.schema'
import { jobStatusSchema } from './job-status.schema'

// Re-export jobStatusSchema for convenience
export { jobStatusSchema, type JobStatus } from './job-status.schema'

/**
 * Job progress tracking
 */
export const jobProgressSchema = z.object({
  currentStep: z.string(),
  percentage: z.number().min(0).max(100),
  message: z.string().nullable().default(null),
})

/**
 * Job error details
 */
export const jobErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  step: z.string().nullable().default(null),
  isRetryable: z.boolean(),
  timestamp: z.number().int().positive(),
})

/**
 * Job output reference
 *
 * Contains metadata about the final output produced by the transform pipeline.
 * The format is determined by the pipeline nodes, not configuration.
 */
export const jobOutputSchema = z.object({
  /** Output asset ID in storage */
  assetId: z.string(),
  /** Public URL to the output */
  url: z.url(),
  /** Storage bucket path to the output file */
  filePath: z.string(),
  /** Actual output format (determined by pipeline) */
  format: z.enum(['image', 'gif', 'video']),
  /** Output dimensions after resize/crop */
  dimensions: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  /** Output file size in bytes */
  sizeBytes: z.number().int().positive(),
  /** Thumbnail URL (generated during post-processing) */
  thumbnailUrl: z.url().nullable().default(null),
  /** Total processing time in milliseconds */
  processingTimeMs: z.number().int().nonnegative(),
})

/**
 * Snapshot of project context at job creation
 *
 * Captures overlay reference and experience reference for applyOverlay tracking.
 * Reuses overlayReferenceSchema and mainExperienceReferenceSchema for consistency.
 */
export const projectContextSnapshotSchema = z.looseObject({
  /** @deprecated Use overlays map instead */
  overlay: overlayReferenceSchema.nullable().default(null),
  /** @deprecated Use overlays map instead */
  applyOverlay: z.boolean().default(false),
  /** Overlays by aspect ratio (from project config) */
  overlays: overlaysConfigSchema.nullable().default(null),
  /** Experience reference snapshot (from mainExperienceReferenceSchema) */
  experienceRef: mainExperienceReferenceSchema.nullable().default(null),
})

// Backward compatibility alias
/** @deprecated Use projectContextSnapshotSchema instead */
export const eventContextSnapshotSchema = projectContextSnapshotSchema

/**
 * Complete job execution snapshot
 */
export const jobSnapshotSchema = z.looseObject({
  /** Session responses at job creation (unified from all steps) */
  sessionResponses: z.array(sessionResponseSchema).default([]),
  /** Project context (overlays, etc.) */
  projectContext: projectContextSnapshotSchema,
  /** Experience version at time of job creation */
  experienceVersion: z.number().int().positive(),
  /** Outcome configuration (from experience.published.outcome) */
  outcome: outcomeSchema.nullable().default(null),
})

// Backward compatibility: eventContext is now projectContext
// Old jobs with eventContext will still parse due to looseObject()

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
export type JobProgress = z.infer<typeof jobProgressSchema>
export type JobError = z.infer<typeof jobErrorSchema>
export type JobOutput = z.infer<typeof jobOutputSchema>
export type JobSnapshot = z.infer<typeof jobSnapshotSchema>
export type ProjectContextSnapshot = z.infer<
  typeof projectContextSnapshotSchema
>
/** @deprecated Use ProjectContextSnapshot instead */
export type EventContextSnapshot = ProjectContextSnapshot

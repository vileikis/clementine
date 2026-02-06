/**
 * Job Schema
 *
 * Tracks execution of a transform pipeline.
 * Contains full execution context snapshot for reproducibility.
 *
 * Firestore Path: /projects/{projectId}/jobs/{jobId}
 *
 * Feature 065 Changes:
 * - Flattened snapshot: removed `projectContext` wrapper
 * - Added `overlayChoice` (resolved at job creation, not execution)
 * - Added `experienceRef` at top level for audit trail
 */
import { z } from 'zod'
import { overlayReferenceSchema } from '../project/project-config.schema'
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
 * Complete job execution snapshot
 *
 * Flattened structure (Feature 065):
 * - `overlayChoice`: Resolved overlay at job creation (exact match → default → null)
 * - `experienceRef`: Experience reference for audit trail
 *
 * Overlay resolution happens in `startTransformPipeline.ts`, not at execution time.
 * The transform uses `snapshot.overlayChoice` directly.
 */
export const jobSnapshotSchema = z.object({
  /** Session responses at job creation (unified from all steps) */
  sessionResponses: z.array(sessionResponseSchema).default([]),
  /** Experience version at time of job creation */
  experienceVersion: z.number().int().positive(),
  /** Outcome configuration (from experience.published.outcome) */
  outcome: outcomeSchema.nullable().default(null),
  /** Resolved overlay to apply (null = no overlay) */
  overlayChoice: overlayReferenceSchema.nullable().default(null),
  /** Experience reference for audit trail */
  experienceRef: mainExperienceReferenceSchema.nullable().default(null),
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

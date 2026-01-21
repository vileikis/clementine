/**
 * Job Schema
 *
 * Tracks execution of a transform pipeline.
 * Contains full execution context snapshot for reproducibility.
 *
 * Firestore Path: /projects/{projectId}/jobs/{jobId}
 */
import { z } from 'zod'

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
  url: z.string().url(),
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
 */
export const sessionInputsSnapshotSchema = z.object({
  answers: z.array(
    z.object({
      stepId: z.string(),
      stepType: z.string(),
      stepName: z.string(),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
      answeredAt: z.number(),
    }),
  ),
  capturedMedia: z.array(
    z.object({
      stepId: z.string(),
      stepName: z.string(),
      assetId: z.string(),
      url: z.string(),
      createdAt: z.number(),
    }),
  ),
})

/**
 * Snapshot of transform configuration at job creation
 */
export const transformConfigSnapshotSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      config: z.record(z.string(), z.unknown()),
    }),
  ),
  variableMappings: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      mappingType: z.string(),
    }),
  ),
  outputFormat: z
    .object({
      type: z.enum(['image', 'gif', 'video']),
      width: z.number().optional(),
      height: z.number().optional(),
      quality: z.number().optional(),
    })
    .nullable(),
})

/**
 * Snapshot of event context at job creation
 */
export const eventContextSnapshotSchema = z.object({
  overlaySettings: z
    .object({
      enabled: z.boolean(),
      mediaAssetId: z.string().nullable(),
      position: z.string().optional(),
      opacity: z.number().optional(),
    })
    .nullable(),
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
export const jobSnapshotSchema = z.object({
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

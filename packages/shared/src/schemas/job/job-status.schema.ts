/**
 * Job Status Schema
 *
 * Separated to avoid circular dependency between session and job schemas.
 * Both session (for jobStatus field) and job (for status field) need this.
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

export type JobStatus = z.infer<typeof jobStatusSchema>

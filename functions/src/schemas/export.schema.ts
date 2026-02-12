/**
 * Export Cloud Task Payload Schemas
 *
 * Validation schemas for export dispatch and worker tasks.
 */
import { z } from 'zod'

/**
 * Result media reference passed through export pipeline
 */
const resultMediaSchema = z.object({
  url: z.string().min(1),
  filePath: z.string().min(1),
  displayName: z.string().min(1),
})

/**
 * Payload for dispatchExports Cloud Task
 * Enqueued by transformPipelineJob after successful completion
 */
export const dispatchExportsPayloadSchema = z.object({
  jobId: z.string().min(1),
  projectId: z.string().min(1),
  sessionId: z.string().min(1),
  experienceId: z.string().min(1),
  resultMedia: resultMediaSchema,
  /** Stable timestamp (epoch ms) set at the original enqueue site, propagated through the pipeline */
  createdAt: z.number(),
})

export type DispatchExportsPayload = z.infer<typeof dispatchExportsPayloadSchema>

/**
 * Payload for dropboxExportWorker Cloud Task
 * Enqueued by dispatchExports for each enabled integration
 */
export const dropboxExportPayloadSchema = z.object({
  jobId: z.string().min(1),
  projectId: z.string().min(1),
  sessionId: z.string().min(1),
  workspaceId: z.string().min(1),
  experienceId: z.string().min(1),
  resultMedia: resultMediaSchema,
  /** Stable timestamp (epoch ms) set at dispatch time for idempotent file paths across retries */
  createdAt: z.number(),
})

export type DropboxExportPayload = z.infer<typeof dropboxExportPayloadSchema>

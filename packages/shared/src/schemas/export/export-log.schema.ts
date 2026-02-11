/**
 * Export Log Schema
 *
 * Records of export attempts for audit and debugging.
 * Collection: projects/{projectId}/exportLogs/{logId}
 */
import { z } from 'zod'

/**
 * Export provider enum (extensible for future integrations)
 */
export const exportProviderSchema = z.enum(['dropbox'])

/**
 * Export log status
 */
export const exportLogStatusSchema = z.enum(['success', 'failed'])

/**
 * Export log entry
 */
export const exportLogSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  sessionId: z.string(),
  provider: exportProviderSchema,
  status: exportLogStatusSchema,
  destinationPath: z.string().nullable().default(null),
  error: z.string().nullable().default(null),
  createdAt: z.number(),
})

/**
 * Type exports
 */
export type ExportProvider = z.infer<typeof exportProviderSchema>
export type ExportLogStatus = z.infer<typeof exportLogStatusSchema>
export type ExportLog = z.infer<typeof exportLogSchema>

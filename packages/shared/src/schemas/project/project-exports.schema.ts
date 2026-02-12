/**
 * Project Export Configuration Schemas
 *
 * Per-project export toggle for Dropbox and future integrations.
 * Field: projects/{projectId}.exports.dropbox
 */
import { z } from 'zod'

/**
 * Dropbox export config for a project
 */
export const dropboxExportConfigSchema = z.object({
  enabled: z.boolean(),
  enabledBy: z.string(),
  enabledAt: z.number(),
})

/**
 * Project exports map
 */
export const projectExportsSchema = z.object({
  dropbox: dropboxExportConfigSchema.nullable().default(null),
})

/**
 * Type exports
 */
export type DropboxExportConfig = z.infer<typeof dropboxExportConfigSchema>
export type ProjectExports = z.infer<typeof projectExportsSchema>

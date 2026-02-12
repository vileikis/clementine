/**
 * Workspace Integration Schemas
 *
 * Dropbox integration configuration stored at workspace level.
 * Field: workspaces/{workspaceId}.integrations.dropbox
 */
import { z } from 'zod'

/**
 * Dropbox integration status
 */
export const dropboxIntegrationStatusSchema = z.enum([
  'connected',
  'disconnected',
  'needs_reauth',
])

/**
 * Dropbox integration config
 */
export const dropboxIntegrationSchema = z.object({
  status: dropboxIntegrationStatusSchema,
  accountEmail: z.string(),
  accountDisplayName: z.string(),
  encryptedRefreshToken: z.string(),
  connectedBy: z.string(),
  connectedAt: z.number(),
  scopes: z.array(z.string()),
})

/**
 * Workspace integrations map
 */
export const workspaceIntegrationsSchema = z.object({
  dropbox: dropboxIntegrationSchema.nullable().default(null),
})

/**
 * Type exports
 */
export type DropboxIntegrationStatus = z.infer<typeof dropboxIntegrationStatusSchema>
export type DropboxIntegration = z.infer<typeof dropboxIntegrationSchema>
export type WorkspaceIntegrations = z.infer<typeof workspaceIntegrationsSchema>

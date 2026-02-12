/**
 * Cloud Task Handler: dropboxExportWorker
 *
 * Exports a single result file to the workspace's Dropbox App Folder.
 * Self-contained: fetches all context, handles auth, uploads, and logs.
 *
 * Includes needs_reauth handling (US5/T033): when token refresh returns
 * invalid_grant, marks workspace as needs_reauth and exits without retry.
 *
 * See contracts/export-tasks.yaml CT-002 for full spec.
 */
import { onTaskDispatched } from 'firebase-functions/v2/tasks'
import { logger } from 'firebase-functions/v2'
import type { DropboxIntegration } from '@clementine/shared'
import {
  dropboxExportPayloadSchema,
  type DropboxExportPayload,
} from '../schemas/export.schema'
import {
  fetchWorkspaceIntegration,
  updateWorkspaceIntegration,
} from '../repositories/workspace'
import { fetchProject } from '../repositories/project'
import { fetchExperience } from '../repositories/experience'
import { createExportLog } from '../repositories/export-log'
import {
  decrypt,
  refreshAccessToken,
  uploadFile,
  DropboxInvalidGrantError,
  DropboxInsufficientSpaceError,
} from '../services/export'
import { storage } from '../infra/firebase-admin'

// ============================================================================
// Types
// ============================================================================

interface ExportContext {
  integration: DropboxIntegration
  projectName: string
  experienceName: string
}

// ============================================================================
// Main Handler
// ============================================================================

export const dropboxExportWorker = onTaskDispatched(
  {
    region: 'europe-west1',
    memory: '512MiB',
    timeoutSeconds: 120,
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 30,
      maxBackoffSeconds: 300,
    },
  },
  async (req) => {
    const parseResult = dropboxExportPayloadSchema.safeParse(req.data)
    if (!parseResult.success) {
      logger.error('[DropboxExportWorker] Invalid payload', {
        issues: parseResult.error.issues,
      })
      return
    }

    const payload = parseResult.data
    const { jobId, projectId, sessionId, workspaceId } = payload

    logger.info('[DropboxExportWorker] Processing', {
      jobId,
      projectId,
      workspaceId,
    })

    try {
      // 1. Validate prerequisites (workspace connected, export enabled)
      const context = await validateExportContext(payload)
      if (!context) return

      // 2. Get a fresh Dropbox access token
      const accessToken = await getDropboxAccessToken(
        context.integration,
        payload,
      )
      if (!accessToken) return

      // 3. Download, compute path, upload to Dropbox
      const destinationPath = await executeDropboxUpload(
        accessToken,
        context,
        payload,
      )

      // 4. Log success
      await createExportLog(projectId, {
        jobId,
        sessionId,
        provider: 'dropbox',
        status: 'success',
        destinationPath,
        error: null,
        createdAt: Date.now(),
      })

      logger.info('[DropboxExportWorker] Export complete', {
        jobId,
        destinationPath,
      })
    } catch (error) {
      logger.error('[DropboxExportWorker] Export failed', {
        jobId,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      await createExportLog(projectId, {
        jobId,
        sessionId,
        provider: 'dropbox',
        status: 'failed',
        destinationPath: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: Date.now(),
      }).catch((logError) => {
        logger.error('[DropboxExportWorker] Failed to write export log', {
          logError,
        })
      })

      throw error // Re-throw to trigger Cloud Task retry
    }
  },
)

// ============================================================================
// Step Functions
// ============================================================================

/**
 * Validate that the workspace is connected and the project has export enabled.
 * Returns context needed for the export, or null if the export should be skipped.
 */
async function validateExportContext(
  payload: DropboxExportPayload,
): Promise<ExportContext | null> {
  const { projectId, workspaceId, experienceId } = payload

  // Check workspace connection
  const integration = await fetchWorkspaceIntegration(workspaceId)
  if (!integration || integration.status !== 'connected') {
    logger.warn('[DropboxExportWorker] Workspace not connected, skipping', {
      workspaceId,
      status: integration?.status ?? 'null',
    })
    return null
  }

  // Check project export config (live check)
  const project = await fetchProject(projectId)
  if (!project) {
    logger.warn('[DropboxExportWorker] Project not found, skipping', {
      projectId,
    })
    return null
  }

  const dropboxExport = (project as Record<string, unknown>)['exports'] as
    | { dropbox?: { enabled?: boolean } | null }
    | undefined
  if (dropboxExport?.dropbox?.enabled !== true) {
    logger.info('[DropboxExportWorker] Export disabled, skipping', {
      projectId,
    })
    return null
  }

  // Fetch names for folder path
  const projectName = project.name || 'Untitled Project'
  const experience = await fetchExperience(workspaceId, experienceId)
  const experienceName = experience?.name || 'Untitled Experience'

  return { integration, projectName, experienceName }
}

/**
 * Decrypt the refresh token and exchange it for a fresh access token.
 * Handles invalid_grant by marking the workspace as needs_reauth.
 * Returns the access token, or null if auth failed (non-retryable).
 */
async function getDropboxAccessToken(
  integration: DropboxIntegration,
  payload: DropboxExportPayload,
): Promise<string | null> {
  const refreshToken = decrypt(integration.encryptedRefreshToken)

  try {
    return await refreshAccessToken(refreshToken)
  } catch (error) {
    if (error instanceof DropboxInvalidGrantError) {
      logger.warn('[DropboxExportWorker] Token invalid, marking needs_reauth', {
        workspaceId: payload.workspaceId,
      })

      await updateWorkspaceIntegration(payload.workspaceId, {
        ...integration,
        status: 'needs_reauth',
      })

      await createExportLog(payload.projectId, {
        jobId: payload.jobId,
        sessionId: payload.sessionId,
        provider: 'dropbox',
        status: 'failed',
        destinationPath: null,
        error:
          'Dropbox connection lost — token is invalid. Reconnection required.',
        createdAt: Date.now(),
      })

      return null // Don't retry auth errors
    }
    throw error // Retry other errors
  }
}

/**
 * Download the result from Firebase Storage and upload it to Dropbox.
 * Returns the destination path on success.
 */
async function executeDropboxUpload(
  accessToken: string,
  context: ExportContext,
  payload: DropboxExportPayload,
): Promise<string> {
  const { resultMedia, sessionId } = payload

  // Download from Firebase Storage
  const bucket = storage.bucket()
  const file = bucket.file(resultMedia.filePath)
  const [fileBuffer] = await file.download()

  // Compute destination path
  const destinationPath = buildDestinationPath(
    context.projectName,
    context.experienceName,
    sessionId,
    resultMedia.filePath,
  )

  // Upload to Dropbox
  try {
    await uploadFile(accessToken, destinationPath, fileBuffer)
  } catch (error) {
    if (error instanceof DropboxInsufficientSpaceError) {
      await createExportLog(payload.projectId, {
        jobId: payload.jobId,
        sessionId: payload.sessionId,
        provider: 'dropbox',
        status: 'failed',
        destinationPath,
        error: 'Dropbox account has insufficient storage space',
        createdAt: Date.now(),
      })
      return destinationPath // Return path for logging, caller won't use it
    }
    throw error
  }

  return destinationPath
}

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Build the Dropbox destination path:
 * /<ProjectName>/<ExperienceName>/<date>_<time>_session-<shortCode>_result.<ext>
 */
function buildDestinationPath(
  projectName: string,
  experienceName: string,
  sessionId: string,
  filePath: string,
): string {
  const ext = getFileExtension(filePath)
  const now = new Date()
  const dateStr = formatDate(now)
  const timeStr = formatTime(now)
  const shortCode = sessionId.slice(0, 4).toUpperCase()
  const fileName = `${dateStr}_${timeStr}_session-${shortCode}_result.${ext}`

  return `/${sanitizePath(projectName)}/${sanitizePath(experienceName)}/${fileName}`
}

function getFileExtension(filePath: string): string {
  const parts = filePath.split('.')
  return parts.length > 1 ? (parts.pop() ?? 'jpg') : 'jpg'
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!
}

function formatTime(date: Date): string {
  return date.toISOString().split('T')[1]!.split('.')[0]!.replace(/:/g, '-')
}

/**
 * Sanitize a string for use in a Dropbox file path.
 * Replaces characters that are invalid in Dropbox paths.
 */
function sanitizePath(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '_').trim() || 'Untitled'
}

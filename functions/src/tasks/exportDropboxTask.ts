/**
 * Cloud Task Handler: exportDropboxTask
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
  uploadLargeFile,
  DropboxInvalidGrantError,
  DropboxInsufficientSpaceError,
} from '../services/export'
import { storage } from '../infra/firebase-admin'
import {
  DROPBOX_APP_KEY,
  DROPBOX_APP_SECRET,
  DROPBOX_TOKEN_ENCRYPTION_KEY,
} from '../infra/params'

// ============================================================================
// Types
// ============================================================================

interface ExportContext {
  integration: DropboxIntegration
  projectName: string
  experienceName: string
}

/** Resolved param values passed to step functions */
interface DropboxCredentials {
  appKey: string
  appSecret: string
  encryptionKey: string
}

// ============================================================================
// Main Handler
// ============================================================================

export const exportDropboxTask = onTaskDispatched(
  {
    region: 'europe-west1',
    memory: '512MiB',
    timeoutSeconds: 120,
    secrets: [DROPBOX_APP_SECRET, DROPBOX_TOKEN_ENCRYPTION_KEY],
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 30,
      maxBackoffSeconds: 300,
    },
  },
  async (req) => {
    const parseResult = dropboxExportPayloadSchema.safeParse(req.data)
    if (!parseResult.success) {
      logger.error('[ExportDropboxTask] Invalid payload', {
        issues: parseResult.error.issues,
      })
      return
    }

    const payload = parseResult.data
    const { jobId, projectId, sessionId, workspaceId, sizeBytes } = payload

    // Resolve credentials once at the top
    const credentials: DropboxCredentials = {
      appKey: DROPBOX_APP_KEY.value(),
      appSecret: DROPBOX_APP_SECRET.value(),
      encryptionKey: DROPBOX_TOKEN_ENCRYPTION_KEY.value(),
    }

    logger.info('[ExportDropboxTask] Processing', {
      jobId,
      projectId,
      workspaceId,
      sizeBytes,
    })

    // Reject files exceeding 500MB limit
    const MAX_FILE_SIZE = 524_288_000
    if (sizeBytes > MAX_FILE_SIZE) {
      logger.warn('[ExportDropboxTask] File size exceeded limit', {
        jobId,
        sizeBytes,
        maxSize: MAX_FILE_SIZE,
      })
      await createExportLog(projectId, {
        jobId,
        sessionId,
        provider: 'dropbox',
        status: 'failed',
        destinationPath: null,
        error: 'file_size_exceeded',
        createdAt: Date.now(),
      })
      return
    }

    try {
      // 1. Validate prerequisites (workspace connected, export enabled)
      const context = await validateExportContext(payload)
      if (!context) return

      // 2. Get a fresh Dropbox access token
      const accessToken = await getDropboxAccessToken(
        context.integration,
        credentials,
        payload,
      )
      if (!accessToken) return

      // 3. Download, compute path, upload to Dropbox
      const destinationPath = await executeDropboxUpload(
        accessToken,
        context,
        payload,
      )

      // If upload returned undefined, it was a non-retryable failure
      // (e.g. insufficient space) — already logged, skip success log
      if (!destinationPath) return

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

      logger.info('[ExportDropboxTask] Export complete', {
        jobId,
        destinationPath,
      })
    } catch (error) {
      logger.error('[ExportDropboxTask] Export failed', {
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
        logger.error('[ExportDropboxTask] Failed to write export log', {
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
    logger.warn('[ExportDropboxTask] Workspace not connected, skipping', {
      workspaceId,
      status: integration?.status ?? 'null',
    })
    return null
  }

  // Check project export config (live check)
  const project = await fetchProject(projectId)
  if (!project) {
    logger.warn('[ExportDropboxTask] Project not found, skipping', {
      projectId,
    })
    return null
  }

  if (project.exports?.dropbox?.enabled !== true) {
    logger.info('[ExportDropboxTask] Export disabled, skipping', {
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
  credentials: DropboxCredentials,
  payload: DropboxExportPayload,
): Promise<string | null> {
  const refreshToken = decrypt(
    integration.encryptedRefreshToken,
    credentials.encryptionKey,
  )

  try {
    return await refreshAccessToken(
      refreshToken,
      credentials.appKey,
      credentials.appSecret,
    )
  } catch (error) {
    if (error instanceof DropboxInvalidGrantError) {
      logger.warn('[ExportDropboxTask] Token invalid, marking needs_reauth', {
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
): Promise<string | undefined> {
  const { resultMedia, sessionId } = payload

  // Pre-validate source file exists and has non-zero size
  const bucket = storage.bucket()
  const file = bucket.file(resultMedia.filePath)
  const [exists] = await file.exists()
  if (!exists) {
    logger.warn('[ExportDropboxTask] Source file missing', {
      filePath: resultMedia.filePath,
      jobId: payload.jobId,
    })
    await createExportLog(payload.projectId, {
      jobId: payload.jobId,
      sessionId: payload.sessionId,
      provider: 'dropbox',
      status: 'failed',
      destinationPath: null,
      error: 'source_file_missing',
      createdAt: Date.now(),
    })
    return // Don't retry — file won't appear
  }

  const [metadata] = await file.getMetadata()
  if (!metadata.size || Number(metadata.size) === 0) {
    logger.warn('[ExportDropboxTask] Source file has zero size', {
      filePath: resultMedia.filePath,
      jobId: payload.jobId,
    })
    await createExportLog(payload.projectId, {
      jobId: payload.jobId,
      sessionId: payload.sessionId,
      provider: 'dropbox',
      status: 'failed',
      destinationPath: null,
      error: 'source_file_empty',
      createdAt: Date.now(),
    })
    return // Don't retry — zero-size file
  }

  // Download from Firebase Storage
  const [fileBuffer] = await file.download()

  // Compute destination path (uses stable timestamp from dispatch for retry idempotency)
  const destinationPath = buildDestinationPath(
    context.projectName,
    context.experienceName,
    sessionId,
    resultMedia.filePath,
    payload.createdAt,
  )

  // Upload to Dropbox — route to chunked upload for files > 150MB
  const CHUNKED_UPLOAD_THRESHOLD = 157_286_400
  // const CHUNKED_UPLOAD_THRESHOLD = 1_000_000
  try {
    if (payload.sizeBytes > CHUNKED_UPLOAD_THRESHOLD) {
      logger.info('[ExportDropboxTask] Using chunked upload', {
        sizeBytes: payload.sizeBytes,
      })
      await uploadLargeFile(
        accessToken,
        destinationPath,
        fileBuffer,
        payload.sizeBytes,
      )
    } else {
      await uploadFile(accessToken, destinationPath, fileBuffer)
    }
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
      return // Return without path — caller checks for undefined
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
  createdAt: number,
): string {
  const ext = getFileExtension(filePath)
  const timestamp = new Date(createdAt)
  const dateStr = formatDate(timestamp)
  const timeStr = formatTime(timestamp)
  const shortCode = sessionId.slice(0, 4).toUpperCase()
  const fileName = `${dateStr}_${timeStr}_session-${shortCode}_result.${ext}`

  return `/${sanitizePath(projectName)}/${sanitizePath(experienceName)}/${fileName}`
}

function getFileExtension(filePath: string): string {
  const parts = filePath.split('.')
  const ext = parts.length > 1 ? parts.pop() : undefined
  return ext || 'jpg'
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

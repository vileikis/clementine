/**
 * Cloud Task Handler: dispatchExports
 *
 * Reads live project export config and fans out to per-integration
 * export worker tasks. This is the routing layer — it determines
 * which integrations are enabled and creates individual worker tasks.
 *
 * See contracts/export-tasks.yaml CT-001 for full spec.
 */
import { onTaskDispatched } from 'firebase-functions/v2/tasks'
import { getFunctions } from 'firebase-admin/functions'
import { logger } from 'firebase-functions/v2'
import {
  dispatchExportsPayloadSchema,
  type DropboxExportPayload,
} from '../schemas/export.schema'
import { fetchProject } from '../repositories/project'
import { fetchSession } from '../repositories/session'

export const dispatchExports = onTaskDispatched(
  {
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 60,
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 10,
      maxBackoffSeconds: 60,
    },
  },
  async (req) => {
    // Validate payload
    const parseResult = dispatchExportsPayloadSchema.safeParse(req.data)
    if (!parseResult.success) {
      logger.error('[DispatchExports] Invalid payload', {
        issues: parseResult.error.issues,
      })
      return // Don't retry invalid payloads
    }

    const { jobId, projectId, sessionId, resultMedia } = parseResult.data

    logger.info('[DispatchExports] Processing', { jobId, projectId, sessionId })

    // Fetch project to check export config
    const project = await fetchProject(projectId)
    if (!project) {
      logger.warn('[DispatchExports] Project not found, skipping', { projectId })
      return // Don't retry — project deleted
    }

    // Fetch session for workspaceId and experienceId
    const session = await fetchSession(projectId, sessionId)
    if (!session) {
      logger.warn('[DispatchExports] Session not found, skipping', { sessionId })
      return // Don't retry — session deleted
    }

    // Check if Dropbox export is enabled for this project
    const dropboxExport = (project as Record<string, unknown>)['exports'] as
      | { dropbox?: { enabled?: boolean } | null }
      | undefined
    const isDropboxEnabled = dropboxExport?.dropbox?.enabled === true

    if (isDropboxEnabled) {
      const payload: DropboxExportPayload = {
        jobId,
        projectId,
        sessionId,
        workspaceId: session.workspaceId,
        experienceId: session.experienceId,
        resultMedia,
      }

      await queueDropboxExportWorker(payload)

      logger.info('[DispatchExports] Enqueued dropboxExportWorker', {
        jobId,
        projectId,
        workspaceId: session.workspaceId,
      })
    } else {
      logger.info('[DispatchExports] No exports enabled, skipping', {
        jobId,
        projectId,
      })
    }
  },
)

/**
 * Enqueue a dropboxExportWorker Cloud Task
 */
async function queueDropboxExportWorker(
  payload: DropboxExportPayload,
): Promise<void> {
  const queue = getFunctions().taskQueue(
    'locations/europe-west1/functions/dropboxExportWorker',
  )
  await queue.enqueue(payload, {
    scheduleDelaySeconds: 0,
  })
}

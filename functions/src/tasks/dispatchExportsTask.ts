/**
 * Cloud Task Handler: dispatchExportsTask
 *
 * Reads live project export config and fans out to per-integration
 * export worker tasks. This is the routing layer — it determines
 * which integrations are enabled and creates individual worker tasks.
 *
 * See contracts/export-tasks.yaml CT-001 for full spec.
 */
import { onTaskDispatched } from 'firebase-functions/v2/tasks'
import { logger } from 'firebase-functions/v2'
import { dispatchExportsPayloadSchema } from '../schemas/export.schema'
import { fetchProject } from '../repositories/project'
import { queueExportDropboxTask } from '../infra/task-queues'

export const dispatchExportsTask = onTaskDispatched(
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

    const { jobId, projectId, sessionId, experienceId, resultMedia, createdAt } =
      parseResult.data

    logger.info('[DispatchExports] Processing', { jobId, projectId })

    // Fetch project to check export config and get workspaceId
    const project = await fetchProject(projectId)
    if (!project) {
      logger.warn('[DispatchExports] Project not found, skipping', { projectId })
      return // Don't retry — project deleted
    }

    // Check if Dropbox export is enabled for this project
    const isDropboxEnabled = project.exports?.dropbox?.enabled === true

    if (isDropboxEnabled) {
      await queueExportDropboxTask({
        jobId,
        projectId,
        sessionId,
        workspaceId: project.workspaceId,
        experienceId,
        resultMedia,
        createdAt,
      })

      logger.info('[DispatchExports] Enqueued exportDropboxTask', {
        jobId,
        projectId,
        workspaceId: project.workspaceId,
      })
    } else {
      logger.info('[DispatchExports] No exports enabled, skipping', {
        jobId,
        projectId,
      })
    }
  },
)

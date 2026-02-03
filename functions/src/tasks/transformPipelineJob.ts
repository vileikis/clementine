/**
 * Cloud Task Handler: transformPipelineJob
 *
 * Executes transform pipeline jobs asynchronously.
 * Manages job lifecycle: pending → running → completed/failed
 *
 * See contracts/transform-pipeline-job.yaml for full spec.
 */
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs/promises'
import { onTaskDispatched } from 'firebase-functions/v2/tasks'
import { logger } from 'firebase-functions/v2'
import { transformPipelineJobPayloadSchema } from '../schemas/transform-pipeline.schema'
import { updateSessionJobStatus, updateSessionResultMedia } from '../repositories/session'
import {
  fetchJob,
  updateJobStarted,
  updateJobProgress,
  updateJobComplete,
  updateJobError,
  createSanitizedError,
} from '../repositories/job'
import type { JobOutput } from '@clementine/shared'
import {
  executeTransformPipeline,
  uploadPipelineOutput,
  type ExecutionContext,
} from '../services/transform'

/**
 * Create a temporary directory for pipeline execution
 *
 * @param jobId - Job ID for unique naming
 * @returns Path to temporary directory
 */
async function createTempDir(jobId: string): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), `transform-${jobId}`)
  await fs.mkdir(tmpDir, { recursive: true })
  return tmpDir
}

/**
 * Clean up temporary directory
 *
 * @param tmpDir - Path to temporary directory
 */
async function cleanupTempDir(tmpDir: string): Promise<void> {
  try {
    await fs.rm(tmpDir, { recursive: true, force: true })
    logger.info('[TransformJob] Cleaned up temp directory', { tmpDir })
  } catch (error) {
    logger.warn('[TransformJob] Failed to cleanup temp directory', {
      tmpDir,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Cloud Task handler: transformPipelineJob
 *
 * Processes transform pipeline jobs with the following lifecycle:
 * 1. Validate payload and fetch job
 * 2. Update job status to 'running'
 * 3. Execute pipeline (download input, run transforms, apply overlay)
 * 4. Upload output and update session
 * 5. Update job status to 'completed' with output
 */
export const transformPipelineJob = onTaskDispatched(
  {
    region: 'europe-west1',
    timeoutSeconds: 600, // 10 minutes
    retryConfig: {
      maxAttempts: 0, // No retries
    },
    rateLimits: {
      maxConcurrentDispatches: 10,
    },
  },
  async (req) => {
    let projectId: string | undefined
    let jobId: string | undefined
    let sessionId: string | undefined
    let tmpDir: string | undefined

    try {
      // Validate payload
      const parseResult = transformPipelineJobPayloadSchema.safeParse(req.data)
      if (!parseResult.success) {
        logger.error('Invalid task payload:', parseResult.error.issues)
        throw new Error('Invalid task payload')
      }

      const payload = parseResult.data
      projectId = payload.projectId
      jobId = payload.jobId
      sessionId = payload.sessionId

      logger.info(`[TransformJob] Processing transform job ${jobId}`, {
        projectId,
        sessionId,
      })

      // Fetch job document
      const job = await fetchJob(projectId, jobId)
      if (!job) {
        logger.error(`[TransformJob] Job not found: ${jobId}`)
        throw new Error(`Job not found: ${jobId}`)
      }

      // Validate job status is 'pending'
      if (job.status !== 'pending') {
        logger.warn(`[TransformJob] Job ${jobId} has unexpected status: ${job.status}`)
        return
      }

      // Update job status to 'running'
      await updateJobStarted(projectId, jobId)
      await updateSessionJobStatus(projectId, sessionId, jobId, 'running')

      logger.info(`[TransformJob] Job ${jobId} started, executing pipeline...`)

      // Create temp directory
      tmpDir = await createTempDir(jobId)

      // Build execution context
      const context: ExecutionContext = {
        jobId,
        projectId,
        sessionId,
        snapshot: job.snapshot,
      }

      // Progress: initializing
      await updateJobProgress(projectId, jobId, {
        currentStep: 'initializing',
        percentage: 10,
        message: 'Initializing pipeline...',
      })

      const startTime = Date.now()

      // Execute transform pipeline
      await updateJobProgress(projectId, jobId, {
        currentStep: 'processing',
        percentage: 30,
        message: 'Processing transform...',
      })

      const pipelineResult = await executeTransformPipeline(context, tmpDir)

      // Upload output and generate thumbnail
      await updateJobProgress(projectId, jobId, {
        currentStep: 'uploading',
        percentage: 80,
        message: 'Uploading result...',
      })

      const uploadedOutput = await uploadPipelineOutput(pipelineResult, context, tmpDir)

      // Calculate processing time
      const processingTimeMs = Date.now() - startTime

      // Build job output
      const output: JobOutput = {
        assetId: uploadedOutput.assetId,
        url: uploadedOutput.url,
        format: pipelineResult.format,
        dimensions: uploadedOutput.dimensions,
        sizeBytes: uploadedOutput.sizeBytes,
        thumbnailUrl: uploadedOutput.thumbnailUrl,
        processingTimeMs,
      }

      // Update session with result media
      await updateSessionResultMedia(projectId, sessionId, {
        stepId: 'transform', // Virtual step ID for transform output
        assetId: uploadedOutput.assetId,
        url: uploadedOutput.url,
        createdAt: Date.now(),
      })

      // Update job status to 'completed'
      await updateJobComplete(projectId, jobId, output)
      await updateSessionJobStatus(projectId, sessionId, jobId, 'completed')

      logger.info(`[TransformJob] Job ${jobId} completed successfully`, {
        format: output.format,
        processingTimeMs: output.processingTimeMs,
        url: output.url,
      })
    } catch (error) {
      logger.error('[TransformJob] Error processing transform job:', error)

      // Update job and session to failed state
      if (projectId && jobId && sessionId) {
        try {
          const sanitizedError = createSanitizedError('PROCESSING_FAILED', 'pipeline')
          await updateJobError(projectId, jobId, sanitizedError)
          await updateSessionJobStatus(projectId, sessionId, jobId, 'failed')

          logger.error('[TransformJob] Full error details:', {
            jobId,
            sessionId,
            projectId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          })
        } catch (updateError) {
          logger.error('[TransformJob] Failed to update job/session error state:', updateError)
        }
      }
    } finally {
      // Cleanup temp directory
      if (tmpDir) {
        await cleanupTempDir(tmpDir)
      }
    }
  }
)

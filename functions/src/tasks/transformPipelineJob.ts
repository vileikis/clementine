/**
 * Cloud Task Handler: transformPipelineJob
 *
 * Executes transform pipeline jobs asynchronously.
 * Manages job lifecycle: pending → running → completed/failed
 *
 * See contracts/transform-pipeline-job.yaml for full spec.
 */
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
  type PipelineContext,
  type PipelineResult,
  type UploadedOutput,
} from '../services/transform'
import { createTempDir, cleanupTempDir } from '../infra/temp-dir'

/**
 * Job handler context - extends PipelineContext with cleanup
 */
interface JobHandlerContext extends PipelineContext {
  cleanup: () => Promise<void>
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Cloud Task handler: transformPipelineJob
 *
 * Flow:
 * 1. Validate payload & prepare execution context
 * 2. Mark job as running
 * 3. Execute transform pipeline
 * 4. Upload output & finalize
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
    let context: JobHandlerContext | undefined

    try {
      // 1. Validate & prepare
      context = await prepareJobExecution(req.data)

      // 2. Mark as running
      await markJobRunning(context)

      // 3. Execute transform pipeline
      const pipelineResult = await executeTransformPipeline(context)

      // 4. Upload & finalize
      await finalizeJobSuccess(pipelineResult, context)
    } catch (error) {
      logger.error('[TransformJob] Pipeline failed', { error })
      if (context) {
        await handleJobFailure(context, error)
      }
    } finally {
      await context?.cleanup()
    }
  }
)

// ============================================================================
// Job Execution Helpers
// ============================================================================

/**
 * Validate payload and prepare execution context
 *
 * @throws Error if payload invalid, job not found, or job not pending
 */
async function prepareJobExecution(data: unknown): Promise<JobHandlerContext> {
  // Validate payload
  const parseResult = transformPipelineJobPayloadSchema.safeParse(data)
  if (!parseResult.success) {
    logger.error('[TransformJob] Invalid payload', { issues: parseResult.error.issues })
    throw new Error('Invalid task payload')
  }

  const { projectId, jobId, sessionId } = parseResult.data

  logger.info('[TransformJob] Processing job', { jobId, projectId, sessionId })

  // Fetch job document
  const job = await fetchJob(projectId, jobId)
  if (!job) {
    logger.error('[TransformJob] Job not found', { jobId })
    throw new Error(`Job not found: ${jobId}`)
  }

  // Validate job status
  if (job.status !== 'pending') {
    logger.warn('[TransformJob] Unexpected job status', { jobId, status: job.status })
    throw new Error(`Job ${jobId} has unexpected status: ${job.status}`)
  }

  // Create temp directory
  const tmpDir = await createTempDir(jobId, 'transform')

  return {
    jobId,
    projectId,
    sessionId,
    snapshot: job.snapshot,
    tmpDir,
    cleanup: () => cleanupTempDir(tmpDir),
  }
}

/**
 * Mark job as running with initial progress
 */
async function markJobRunning(context: JobHandlerContext): Promise<void> {
  const { projectId, jobId, sessionId } = context

  // Combined write: status + progress in one update
  await updateJobStarted(projectId, jobId, {
    currentStep: 'transforming',
    percentage: 20,
    message: 'Processing transform...',
  })
  await updateSessionJobStatus(projectId, sessionId, jobId, 'running')

  logger.info('[TransformJob] Job started', { jobId })
}

/**
 * Upload output and finalize job as successful
 */
async function finalizeJobSuccess(
  pipelineResult: PipelineResult,
  context: JobHandlerContext
): Promise<void> {
  const { projectId, jobId, sessionId } = context
  const startTime = Date.now()

  // Update progress: uploading (before the upload starts)
  await updateJobProgress(projectId, jobId, {
    currentStep: 'uploading',
    percentage: 80,
    message: 'Uploading result...',
  })

  // Upload output and generate thumbnail
  const uploadedOutput = await uploadPipelineOutput(pipelineResult, context)

  // Build job output
  const output = buildJobOutput(pipelineResult, uploadedOutput, startTime)

  // Update session with result media
  await updateSessionResultMedia(projectId, sessionId, {
    stepId: 'transform',
    assetId: uploadedOutput.assetId,
    url: uploadedOutput.url,
    createdAt: Date.now(),
  })

  // Mark job as completed (sets progress to 100% completed)
  await updateJobComplete(projectId, jobId, output)
  await updateSessionJobStatus(projectId, sessionId, jobId, 'completed')

  logger.info('[TransformJob] Job completed', {
    jobId,
    format: output.format,
    processingTimeMs: output.processingTimeMs,
    url: output.url,
  })
}

/**
 * Handle job failure - update job and session to failed state
 */
async function handleJobFailure(
  context: JobHandlerContext,
  error: unknown
): Promise<void> {
  const { projectId, jobId, sessionId } = context

  try {
    const sanitizedError = createSanitizedError('PROCESSING_FAILED', 'pipeline')
    await updateJobError(projectId, jobId, sanitizedError)
    await updateSessionJobStatus(projectId, sessionId, jobId, 'failed')

    logger.error('[TransformJob] Error details', {
      jobId,
      sessionId,
      projectId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
  } catch (updateError) {
    logger.error('[TransformJob] Failed to update error state', { updateError })
  }
}

/**
 * Build JobOutput from pipeline and upload results
 */
function buildJobOutput(
  pipelineResult: PipelineResult,
  uploadedOutput: UploadedOutput,
  startTime: number
): JobOutput {
  return {
    assetId: uploadedOutput.assetId,
    url: uploadedOutput.url,
    format: pipelineResult.format,
    dimensions: uploadedOutput.dimensions,
    sizeBytes: uploadedOutput.sizeBytes,
    thumbnailUrl: uploadedOutput.thumbnailUrl,
    processingTimeMs: Date.now() - startTime,
  }
}

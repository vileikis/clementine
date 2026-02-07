/**
 * Cloud Task Handler: transformPipelineJob
 *
 * Executes transform jobs asynchronously using outcome-based execution.
 * Manages job lifecycle: pending → running → completed/failed
 *
 * See contracts/transform-pipeline-job.yaml for full spec.
 */
import { onTaskDispatched } from 'firebase-functions/v2/tasks'
import { logger } from 'firebase-functions/v2'
import { transformPipelineJobPayloadSchema } from '../schemas/transform-pipeline.schema'
import {
  updateSessionJobStatus,
  updateSessionResultMedia,
} from '../repositories/session'
import {
  fetchJob,
  updateJobStarted,
  updateJobProgress,
  updateJobComplete,
  updateJobError,
  createSanitizedError,
} from '../repositories/job'
import type { Job, JobOutput } from '@clementine/shared'
import { runOutcome, type OutcomeContext } from '../services/transform'
import { createTempDir, cleanupTempDir } from '../infra/temp-dir'

/**
 * Job handler context for cleanup management
 */
interface JobHandlerContext {
  job: Job
  projectId: string
  sessionId: string
  tmpDir: string
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
 * 3. Execute outcome via runOutcome()
 * 4. Update session with result & finalize
 */
export const transformPipelineJob = onTaskDispatched(
  {
    region: 'europe-west1',
    memory: '512MiB',
    cpu: 1,
    timeoutSeconds: 300, // 5 minutes
    minInstances: 1, // Keep one warm instance to reduce cold starts
    maxInstances: 20, // Control max scaling
    concurrency: 1, // One job per instance (FFmpeg is resource-intensive)
    retryConfig: {
      maxAttempts: 0, // No retries - job recovery handles this
    },
    rateLimits: {
      maxConcurrentDispatches: 20, // Match maxInstances for full parallelism
    },
  },
  async (req) => {
    let context: JobHandlerContext | undefined

    try {
      // 1. Validate & prepare
      context = await prepareJobExecution(req.data)

      // 2. Mark as running
      await markJobRunning(context)

      // 3. Execute outcome
      const outcomeContext: OutcomeContext = {
        job: context.job,
        snapshot: context.job.snapshot,
        startTime: Date.now(),
        tmpDir: context.tmpDir,
      }
      const output = await runOutcome(outcomeContext)

      // 4. Finalize success
      await finalizeJobSuccess(output, context)
    } catch (error) {
      logger.error('[TransformJob] Job execution failed', { error })
      if (context) {
        await handleJobFailure(context, error)
      }
    } finally {
      await context?.cleanup()
    }
  },
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
    logger.error('[TransformJob] Invalid payload', {
      issues: parseResult.error.issues,
    })
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
  if (job.status === 'completed' || job.status === 'failed') {
    // Job already finished, skip silently (could be duplicate task delivery)
    logger.info('[TransformJob] Job already finished, skipping', {
      jobId,
      status: job.status,
    })
    throw new Error(`Job ${jobId} already ${job.status}, skipping`)
  }

  if (job.status === 'running') {
    // Previous instance crashed - allow recovery
    logger.warn('[TransformJob] Recovering crashed job', {
      jobId,
      status: job.status,
    })
  }

  // Create temp directory
  const tmpDir = await createTempDir(jobId, 'transform')

  return {
    job,
    projectId,
    sessionId,
    tmpDir,
    cleanup: () => cleanupTempDir(tmpDir),
  }
}

/**
 * Mark job as running with initial progress
 */
async function markJobRunning(context: JobHandlerContext): Promise<void> {
  const { projectId, job, sessionId } = context

  // Combined write: status + progress in one update
  await updateJobStarted(projectId, job.id, {
    currentStep: 'processing',
    percentage: 20,
    message: 'Processing outcome...',
  })
  await updateSessionJobStatus(projectId, sessionId, job.id, 'running')

  logger.info('[TransformJob] Job started', { jobId: job.id })
}

/**
 * Finalize job as successful with output
 */
async function finalizeJobSuccess(
  output: JobOutput,
  context: JobHandlerContext,
): Promise<void> {
  const { projectId, job, sessionId } = context

  // Update progress: uploading (output already uploaded by outcome executor)
  await updateJobProgress(projectId, job.id, {
    currentStep: 'finalizing',
    percentage: 90,
    message: 'Finalizing result...',
  })

  // Update session with result media (MediaReference format)
  await updateSessionResultMedia(projectId, sessionId, {
    mediaAssetId: output.assetId,
    url: output.url,
    filePath: output.filePath,
    displayName: 'Result',
  })

  // Mark job as completed (sets progress to 100% completed)
  await updateJobComplete(projectId, job.id, output)
  await updateSessionJobStatus(projectId, sessionId, job.id, 'completed')

  logger.info('[TransformJob] Job completed', {
    jobId: job.id,
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
  error: unknown,
): Promise<void> {
  const { projectId, job, sessionId } = context

  try {
    const sanitizedError = createSanitizedError('PROCESSING_FAILED', 'outcome')
    await updateJobError(projectId, job.id, sanitizedError)
    await updateSessionJobStatus(projectId, sessionId, job.id, 'failed')

    logger.error('[TransformJob] Error details', {
      jobId: job.id,
      sessionId,
      projectId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
  } catch (updateError) {
    logger.error('[TransformJob] Failed to update error state', { updateError })
  }
}

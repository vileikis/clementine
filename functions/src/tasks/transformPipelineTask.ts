/**
 * Cloud Task Handler: transformPipelineTask
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
  createJobError,
  SANITIZED_ERROR_MESSAGES,
} from '../repositories/job'
import type { Job, JobError, JobOutput } from '@clementine/shared'
import { AiTransformError } from '../services/ai/providers/types'
import { runOutcome, type OutcomeContext } from '../services/transform'
import { logMemoryUsage } from '../services/transform/helpers'
import { createTempDir, cleanupTempDir } from '../infra/temp-dir'
import {
  queueDispatchExports,
  queueSendSessionEmail,
} from '../infra/task-queues'
import { APP_DOMAIN } from '../infra/params'

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
 * Cloud Task handler: transformPipelineTask
 *
 * Flow:
 * 1. Validate payload & prepare execution context
 * 2. Mark job as running
 * 3. Execute outcome via runOutcome()
 * 4. Update session with result & finalize
 */
export const transformPipelineTask = onTaskDispatched(
  {
    region: 'europe-west1',
    memory: '2GiB',
    cpu: 1,
    timeoutSeconds: 600, // 10 minutes (accommodates Veo video generation)
    minInstances: 0,
    maxInstances: 20, // Control max scaling
    concurrency: 1, // One job per instance (FFmpeg is resource-intensive)
    retryConfig: {
      maxAttempts: 2, // Allow 1 retry after OOM crash
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

      logMemoryUsage('job-start', context.job.id)

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
    // Check for OOM restart loop — fail after second crash
    if ((job.attemptCount ?? 0) >= 2) {
      logger.error('[TransformJob] Job exceeded max attempts, failing', {
        jobId,
        attemptCount: job.attemptCount,
      })
      const jobError = createJobError({
        code: 'PROCESSING_FAILED',
        message: SANITIZED_ERROR_MESSAGES['PROCESSING_FAILED']!,
        step: 'restart-guard',
      })
      await updateJobError(projectId, jobId, jobError)
      await updateSessionJobStatus(projectId, sessionId, jobId, 'failed', {
        code: jobError.code,
        message: jobError.message,
      })
      throw new Error(`Job ${jobId} exceeded max attempts (${job.attemptCount}), aborting`)
    }

    // Previous instance crashed - allow recovery
    logger.warn('[TransformJob] Recovering crashed job', {
      jobId,
      status: job.status,
      attemptCount: job.attemptCount,
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
  logMemoryUsage('job-success', job.id)

  // Update progress: uploading (output already uploaded by outcome executor)
  await updateJobProgress(projectId, job.id, {
    currentStep: 'finalizing',
    percentage: 90,
    message: 'Finalizing result...',
  })

  // Update session with result media (MediaReference format) + format metadata
  await updateSessionResultMedia(
    projectId,
    sessionId,
    {
      mediaAssetId: output.assetId,
      url: output.url,
      filePath: output.filePath,
      displayName: 'Result',
    },
    {
      format: output.format,
      thumbnailUrl: output.thumbnailUrl,
    },
  )

  // Mark job as completed (sets progress to 100% completed)
  await updateJobComplete(projectId, job.id, output)
  await updateSessionJobStatus(projectId, sessionId, job.id, 'completed')

  logger.info('[TransformJob] Job completed', {
    jobId: job.id,
    format: output.format,
    processingTimeMs: output.processingTimeMs,
    url: output.url,
  })

  // Dispatch export tasks (best-effort — failure does not affect the guest experience)
  try {
    await queueDispatchExports({
      jobId: job.id,
      projectId,
      sessionId,
      experienceId: job.experienceId,
      resultMedia: {
        url: output.url,
        filePath: output.filePath,
        displayName: 'Result',
      },
      createdAt: Date.now(),
      sizeBytes: output.sizeBytes,
    })
  } catch (error) {
    logger.warn('[TransformJob] Failed to enqueue export dispatch', {
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Queue email send (best-effort — failure does not affect the guest experience)
  try {
    const resultPageUrl = `${APP_DOMAIN.value()}/join/${projectId}/share?session=${sessionId}`
    await queueSendSessionEmail({
      projectId,
      sessionId,
      resultMedia: {
        url: output.url,
        filePath: output.filePath,
        displayName: 'Result',
      },
      format: output.format,
      thumbnailUrl: output.thumbnailUrl ?? null,
      resultPageUrl,
    })
  } catch (error) {
    logger.warn('[TransformJob] Failed to enqueue email send', {
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Build a JobError from an error, preserving AiTransformError fields directly
 */
export function buildJobError(error: unknown): JobError {
  if (error instanceof AiTransformError) {
    return createJobError({
      code: error.code,
      message: error.message,
      step: 'outcome',
      metadata: error.metadata,
    })
  }

  // Check for OutcomeError (not exported, check by name)
  if (error instanceof Error && error.name === 'OutcomeError') {
    const outcomeCode = (error as Error & { code?: string }).code
    return createJobError({
      code: outcomeCode ?? 'PROCESSING_FAILED',
      message: error.message,
      step: 'outcome',
    })
  }

  return createJobError({
    code: 'PROCESSING_FAILED',
    message: SANITIZED_ERROR_MESSAGES['PROCESSING_FAILED']!,
    step: 'outcome',
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
  logMemoryUsage('job-failure', job.id)

  try {
    // Guard: re-fetch job to avoid overwriting a completed job (at-least-once delivery)
    const currentJob = await fetchJob(projectId, job.id)
    if (currentJob?.status === 'completed') {
      logger.warn('[TransformJob] Job already completed, skipping failure update', {
        jobId: job.id,
      })
      return
    }

    const jobError = buildJobError(error)
    await updateJobError(projectId, job.id, jobError)
    await updateSessionJobStatus(projectId, sessionId, job.id, 'failed', {
      code: jobError.code,
      message:
        SANITIZED_ERROR_MESSAGES[jobError.code] ??
        SANITIZED_ERROR_MESSAGES['PROCESSING_FAILED']!,
    })

    logger.error('[TransformJob] Error details', {
      jobId: job.id,
      sessionId,
      projectId,
      errorCode: jobError.code,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
  } catch (updateError) {
    logger.error('[TransformJob] Failed to update error state', { updateError })
  }
}

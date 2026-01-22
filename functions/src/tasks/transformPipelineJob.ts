/**
 * Cloud Task Handler: transformPipelineJob
 *
 * Executes transform pipeline jobs asynchronously.
 * Manages job lifecycle: pending → running → completed/failed
 *
 * See contracts/transform-pipeline-job.yaml for full spec.
 */
import { onTaskDispatched } from 'firebase-functions/v2/tasks'
import { transformPipelineJobPayloadSchema } from '../lib/schemas/transform-pipeline.schema'
import { updateSessionJobStatus } from '../lib/session-v2'
import {
  fetchJob,
  updateJobStarted,
  updateJobProgress,
  updateJobComplete,
  updateJobError,
  createSanitizedError,
} from '../lib/job'
import type { JobOutput } from '@clementine/shared'

/**
 * Stub pipeline execution
 *
 * Simulates processing for infrastructure validation.
 * Actual node execution will be implemented in Phase 5-7.
 */
async function executeStubPipeline(
  projectId: string,
  jobId: string
): Promise<JobOutput> {
  // Simulate processing delay (2 seconds total)
  await updateJobProgress(projectId, jobId, {
    currentStep: 'initializing',
    percentage: 10,
    message: 'Initializing pipeline...',
  })

  await new Promise((resolve) => setTimeout(resolve, 500))

  await updateJobProgress(projectId, jobId, {
    currentStep: 'processing',
    percentage: 50,
    message: 'Processing transform...',
  })

  await new Promise((resolve) => setTimeout(resolve, 1000))

  await updateJobProgress(projectId, jobId, {
    currentStep: 'finalizing',
    percentage: 90,
    message: 'Finalizing output...',
  })

  await new Promise((resolve) => setTimeout(resolve, 500))

  // Create stub output
  const processingTimeMs = 2000
  const output: JobOutput = {
    assetId: `stub-asset-${jobId}`,
    url: `https://storage.googleapis.com/stub-bucket/outputs/${jobId}.png`,
    format: 'image',
    dimensions: {
      width: 1024,
      height: 1024,
    },
    sizeBytes: 512000,
    thumbnailUrl: null,
    processingTimeMs,
  }

  return output
}

/**
 * Cloud Task handler: transformPipelineJob
 *
 * Processes transform pipeline jobs with the following lifecycle:
 * 1. Validate payload and fetch job
 * 2. Update job status to 'running'
 * 3. Execute pipeline (stub in Phase 2)
 * 4. Update job status to 'completed' with output
 */
export const transformPipelineJob = onTaskDispatched(
  {
    region: 'europe-west1',
    timeoutSeconds: 600, // 10 minutes (FR-009)
    retryConfig: {
      maxAttempts: 0, // No retries (D9)
    },
    rateLimits: {
      maxConcurrentDispatches: 10,
    },
  },
  async (req) => {
    let projectId: string | undefined
    let jobId: string | undefined
    let sessionId: string | undefined

    try {
      // Validate payload
      const parseResult = transformPipelineJobPayloadSchema.safeParse(req.data)
      if (!parseResult.success) {
        console.error('Invalid task payload:', parseResult.error.issues)
        throw new Error('Invalid task payload')
      }

      const payload = parseResult.data
      projectId = payload.projectId
      jobId = payload.jobId
      sessionId = payload.sessionId

      console.log(`Processing transform job ${jobId}`, {
        projectId,
        sessionId,
      })

      // Fetch job document
      const job = await fetchJob(projectId, jobId)
      if (!job) {
        console.error(`Job not found: ${jobId}`)
        throw new Error(`Job not found: ${jobId}`)
      }

      // Validate job status is 'pending'
      if (job.status !== 'pending') {
        console.warn(`Job ${jobId} has unexpected status: ${job.status}`)
        // Don't process jobs that aren't pending
        return
      }

      // Update job status to 'running', set startedAt (FR-004)
      await updateJobStarted(projectId, jobId)

      // Update session jobStatus to 'running' (FR-005)
      await updateSessionJobStatus(projectId, sessionId, jobId, 'running')

      console.log(`Job ${jobId} started, executing pipeline...`)

      // Execute stub pipeline (FR-015)
      const output = await executeStubPipeline(projectId, jobId)

      // Update job status to 'completed' (FR-006)
      await updateJobComplete(projectId, jobId, output)

      // Update session jobStatus to 'completed' (FR-005)
      await updateSessionJobStatus(projectId, sessionId, jobId, 'completed')

      console.log(`Job ${jobId} completed successfully`, {
        format: output.format,
        processingTimeMs: output.processingTimeMs,
      })
    } catch (error) {
      console.error('Error processing transform job:', error)

      // If we have enough context, update job and session to failed state
      if (projectId && jobId && sessionId) {
        try {
          // Update job status to 'failed' (FR-007)
          const sanitizedError = createSanitizedError(
            'PROCESSING_FAILED',
            'pipeline'
          )
          await updateJobError(projectId, jobId, sanitizedError)

          // Update session jobStatus to 'failed'
          await updateSessionJobStatus(projectId, sessionId, jobId, 'failed')

          // Log full error details server-side (SC-005)
          console.error('Full error details:', {
            jobId,
            sessionId,
            projectId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          })
        } catch (updateError) {
          console.error('Failed to update job/session error state:', updateError)
        }
      }

      // Don't re-throw - we've already marked the job as failed
      // Re-throwing would cause Cloud Tasks to log an error, but since
      // maxAttempts=0, it won't retry anyway
    }
  }
)

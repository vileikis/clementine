/**
 * Callable Function: startTransformPipeline
 *
 * Initiates a transform pipeline job for a session.
 * Creates a job document, queues a Cloud Task for processing,
 * and updates the session with job tracking information.
 *
 * This is a Firebase Callable Function (onCall) invoked via httpsCallable
 * from the frontend.
 *
 * See contracts/start-transform-pipeline.yaml for full API spec.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFunctions } from 'firebase-admin/functions'
import {
  fetchSession,
  updateSessionJobStatus,
  hasActiveJob,
} from '../repositories/session'
import { fetchExperience } from '../repositories/experience'
import { createJob, buildJobData, buildJobSnapshot } from '../repositories/job'
import {
  startTransformPipelineRequestSchema,
  type TransformPipelineJobPayload,
} from '../schemas/transform-pipeline.schema'

/**
 * Callable Cloud Function: startTransformPipeline
 *
 * Initiates a transform pipeline job for a session.
 * Called from frontend via httpsCallable.
 */
export const startTransformPipelineV2 = onCall(
  {
    region: 'europe-west1',
  },
  async (request) => {
    // Check authentication
    const isEmulator = process.env['FUNCTIONS_EMULATOR'] === 'true'
    if (!isEmulator && !request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Must be authenticated to start a transform pipeline',
      )
    }

    // Validate request data
    const parseResult = startTransformPipelineRequestSchema.safeParse(
      request.data,
    )
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]
      throw new HttpsError(
        'invalid-argument',
        `Invalid request: ${firstIssue?.message ?? 'validation failed'}`,
      )
    }

    const { projectId, sessionId } = parseResult.data

    // Fetch session from Firestore
    const session = await fetchSession(projectId, sessionId)
    if (!session) {
      throw new HttpsError('not-found', 'Session not found')
    }

    // Check if job already in progress
    if (hasActiveJob(session)) {
      throw new HttpsError(
        'already-exists',
        'A job is already in progress for this session',
      )
    }

    // Fetch experience and validate transform config exists
    const experience = await fetchExperience(
      session.workspaceId,
      session.experienceId,
    )
    if (!experience) {
      throw new HttpsError('not-found', 'Experience not found')
    }

    // Determine which config to use based on session mode
    const configSource = session.configSource
    const config =
      configSource === 'draft' ? experience.draft : experience.published

    const transformNodes = config?.transformNodes ?? []
    if (transformNodes.length === 0) {
      throw new HttpsError(
        'not-found',
        'Experience has no transform configuration',
      )
    }

    // Build job snapshot
    const snapshot = buildJobSnapshot(session, experience, configSource)

    // Create job document with snapshot
    const jobData = buildJobData({
      projectId,
      sessionId,
      experienceId: session.experienceId,
      snapshot,
    })

    const jobId = await createJob(projectId, jobData)

    // Update session with jobId and jobStatus='pending'
    await updateSessionJobStatus(projectId, sessionId, jobId, 'pending')

    // Queue Cloud Task for transformPipelineJob
    const payload: TransformPipelineJobPayload = {
      jobId,
      sessionId,
      projectId,
    }
    try {
      await queueTransformJob(payload)
    } catch (error) {
      await updateSessionJobStatus(projectId, sessionId, jobId, 'failed')
      throw new HttpsError('internal', 'Failed to enqueue transform job')
    }

    // Return success response
    return {
      success: true,
      jobId,
      message: 'Transform pipeline job created',
    }
  },
)

/**
 * Queue Cloud Task for job processing
 */
async function queueTransformJob(
  payload: TransformPipelineJobPayload,
): Promise<void> {
  const queue = getFunctions().taskQueue(
    'locations/europe-west1/functions/transformPipelineJob',
  )
  await queue.enqueue(payload, {
    scheduleDelaySeconds: 0, // Run immediately
  })
}

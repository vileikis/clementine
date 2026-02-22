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
 * @see specs/072-outcome-schema-redesign
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import type { AspectRatio } from '@clementine/shared'
import {
  fetchSession,
  updateSessionJobStatus,
  hasActiveJob,
} from '../repositories/session'
import { fetchExperience } from '../repositories/experience'
import { fetchProject, pickOverlay } from '../repositories/project'
import { createJob, buildJobData, buildJobSnapshot } from '../repositories/job'
import {
  startTransformPipelineRequestSchema,
  TransformPipelineJobPayload,
} from '../schemas/transform-pipeline.schema'
import { queueTransformJob } from '../infra/task-queues'

/** Outcome types that have implemented executors */
const IMPLEMENTED_OUTCOME_TYPES = new Set(['photo', 'ai.image', 'ai.video'])

/**
 * Get the aspect ratio from the active outcome type's config.
 */
function getOutcomeAspectRatio(outcome: {
  type: string | null
  photo?: { aspectRatio?: string } | null
  aiImage?: { aspectRatio?: string } | null
  aiVideo?: { aspectRatio?: string } | null
}): AspectRatio {
  if (outcome.type === 'photo' && outcome.photo?.aspectRatio) {
    return outcome.photo.aspectRatio as AspectRatio
  }
  if (outcome.type === 'ai.image' && outcome.aiImage?.aspectRatio) {
    return outcome.aiImage.aspectRatio as AspectRatio
  }
  if (outcome.type === 'ai.video' && outcome.aiVideo?.aspectRatio) {
    return outcome.aiVideo.aspectRatio as AspectRatio
  }
  return '1:1'
}

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

    // JC-001: Published config check (for guest sessions)
    if (configSource === 'published' && !experience.published) {
      throw new HttpsError(
        'invalid-argument',
        'Cannot create job: experience is not published',
      )
    }

    // JC-002/003: Validate outcome is configured
    const outcome = config?.outcome
    if (!outcome?.type) {
      throw new HttpsError(
        'invalid-argument',
        'Cannot create job: experience has no outcome configured',
      )
    }

    // JC-004: Validate session has responses
    if (!session.responses || session.responses.length === 0) {
      throw new HttpsError(
        'invalid-argument',
        'Cannot create job: session has no responses',
      )
    }

    // JC-005: Validate outcome type is implemented
    if (!IMPLEMENTED_OUTCOME_TYPES.has(outcome.type)) {
      throw new HttpsError(
        'invalid-argument',
        `Cannot create job: outcome type '${outcome.type}' is not implemented`,
      )
    }

    // Validate the active type's config exists
    if (outcome.type === 'photo' && !outcome.photo) {
      throw new HttpsError(
        'invalid-argument',
        'Cannot create job: photo configuration is missing',
      )
    }
    if (outcome.type === 'ai.image' && !outcome.aiImage) {
      throw new HttpsError(
        'invalid-argument',
        'Cannot create job: AI image configuration is missing',
      )
    }
    if (outcome.type === 'ai.video' && !outcome.aiVideo) {
      throw new HttpsError(
        'invalid-argument',
        'Cannot create job: AI video configuration is missing',
      )
    }

    // Fetch project for overlay resolution
    const project = await fetchProject(projectId)

    // Get aspect ratio from active type's config
    const aspectRatio = getOutcomeAspectRatio(outcome)

    // Pick overlay at job creation time
    const overlayChoice = pickOverlay(
      project,
      configSource,
      session.experienceId,
      aspectRatio,
    )

    // Build job snapshot with resolved overlay
    const snapshot = buildJobSnapshot(session, experience, configSource, {
      overlayChoice,
    })

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

    // Queue Cloud Task for transformPipelineTask
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

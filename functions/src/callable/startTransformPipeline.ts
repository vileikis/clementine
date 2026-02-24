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
 * @see specs/081-experience-type-flattening
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import type { CallableRequest } from 'firebase-functions/v2/https'
import type {
  AspectRatio,
  ExperienceType,
  Session,
  Experience,
  ExperienceConfig,
} from '@clementine/shared'
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

/** Experience types that have implemented executors (excludes survey) */
const IMPLEMENTED_TYPES = new Set<ExperienceType>([
  'photo',
  'ai.image',
  'ai.video',
])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertAuthenticated(request: CallableRequest): void {
  const isEmulator = process.env['FUNCTIONS_EMULATOR'] === 'true'
  if (!isEmulator && !request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Must be authenticated to start a transform pipeline',
    )
  }
}

function parseRequest(data: unknown): { projectId: string; sessionId: string } {
  const result = startTransformPipelineRequestSchema.safeParse(data)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    throw new HttpsError(
      'invalid-argument',
      `Invalid request: ${firstIssue?.message ?? 'validation failed'}`,
    )
  }
  return result.data
}

/**
 * Fetch session + experience and run all precondition checks (JC-001 → JC-005).
 * Returns the validated entities needed to build the job.
 */
async function validateJobPreconditions(
  projectId: string,
  sessionId: string,
): Promise<{
  session: Session
  experience: Experience
  config: ExperienceConfig
  experienceType: ExperienceType
}> {
  const session = await fetchSession(projectId, sessionId)
  if (!session) {
    throw new HttpsError('not-found', 'Session not found')
  }

  if (hasActiveJob(session)) {
    throw new HttpsError(
      'already-exists',
      'A job is already in progress for this session',
    )
  }

  const experience = await fetchExperience(
    session.workspaceId,
    session.experienceId,
  )
  if (!experience) {
    throw new HttpsError('not-found', 'Experience not found')
  }

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

  // JC-002: Validate experience type is set
  const experienceType = experience.type
  if (!experienceType) {
    throw new HttpsError(
      'invalid-argument',
      'Cannot create job: experience has no type configured',
    )
  }

  // JC-003: Reject unsupported types (e.g. survey — no transform output)
  if (!IMPLEMENTED_TYPES.has(experienceType)) {
    throw new HttpsError(
      'invalid-argument',
      `Cannot create job: experience type '${experienceType}' is not supported for transform`,
    )
  }

  // JC-004: Validate session has responses
  if (!session.responses || session.responses.length === 0) {
    throw new HttpsError(
      'invalid-argument',
      'Cannot create job: session has no responses',
    )
  }

  // JC-005: Validate the active type's config exists (flattened paths)
  if (experienceType === 'photo' && !config?.photo) {
    throw new HttpsError(
      'invalid-argument',
      'Cannot create job: photo configuration is missing',
    )
  }
  if (experienceType === 'ai.image' && !config?.aiImage) {
    throw new HttpsError(
      'invalid-argument',
      'Cannot create job: AI image configuration is missing',
    )
  }
  if (experienceType === 'ai.video' && !config?.aiVideo) {
    throw new HttpsError(
      'invalid-argument',
      'Cannot create job: AI video configuration is missing',
    )
  }

  // config is guaranteed non-null after JC-001 + JC-005
  return { session, experience, config: config!, experienceType }
}

/**
 * Get the aspect ratio from the active type's config.
 * Reads from flattened config paths (config.[type]).
 */
function getOutcomeAspectRatio(
  type: ExperienceType,
  config: ExperienceConfig,
): AspectRatio {
  if (type === 'photo' && config.photo?.aspectRatio) {
    return config.photo.aspectRatio as AspectRatio
  }
  if (type === 'ai.image' && config.aiImage?.aspectRatio) {
    return config.aiImage.aspectRatio as AspectRatio
  }
  if (type === 'ai.video' && config.aiVideo?.aspectRatio) {
    return config.aiVideo.aspectRatio as AspectRatio
  }
  return '1:1'
}

/**
 * Resolve overlay and aspect ratio from project + config.
 */
async function resolveJobConfig(
  projectId: string,
  session: Session,
  config: ExperienceConfig,
  experienceType: ExperienceType,
) {
  const project = await fetchProject(projectId)
  const aspectRatio = getOutcomeAspectRatio(experienceType, config)
  const overlayChoice = pickOverlay(
    project,
    session.configSource,
    session.experienceId,
    aspectRatio,
  )
  return { overlayChoice, aspectRatio }
}

/**
 * Build job document, persist it, update session status, and queue the task.
 */
async function createAndDispatchJob(opts: {
  projectId: string
  sessionId: string
  session: Session
  experience: Experience
  overlayChoice: ReturnType<typeof pickOverlay>
}): Promise<string> {
  const { projectId, sessionId, session, experience, overlayChoice } = opts

  const snapshot = buildJobSnapshot(
    session,
    experience,
    session.configSource,
    { overlayChoice },
  )

  const jobData = buildJobData({
    projectId,
    sessionId,
    experienceId: session.experienceId,
    snapshot,
  })

  const jobId = await createJob(projectId, jobData)
  await updateSessionJobStatus(projectId, sessionId, jobId, 'pending')

  const payload: TransformPipelineJobPayload = {
    jobId,
    sessionId,
    projectId,
  }

  try {
    await queueTransformJob(payload)
  } catch {
    await updateSessionJobStatus(projectId, sessionId, jobId, 'failed')
    throw new HttpsError('internal', 'Failed to enqueue transform job')
  }

  return jobId
}

// ---------------------------------------------------------------------------
// Callable Cloud Function
// ---------------------------------------------------------------------------

export const startTransformPipelineV2 = onCall(
  { region: 'europe-west1' },
  async (request) => {
    assertAuthenticated(request)

    const { projectId, sessionId } = parseRequest(request.data)

    const { session, experience, config, experienceType } =
      await validateJobPreconditions(projectId, sessionId)

    const { overlayChoice } = await resolveJobConfig(
      projectId,
      session,
      config,
      experienceType,
    )

    const jobId = await createAndDispatchJob({
      projectId,
      sessionId,
      session,
      experience,
      overlayChoice,
    })

    return {
      success: true,
      jobId,
      message: 'Transform pipeline job created',
    }
  },
)

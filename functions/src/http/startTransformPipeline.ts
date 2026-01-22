/**
 * HTTP Endpoint: startTransformPipeline
 *
 * Initiates a transform pipeline job for a session.
 * Creates a job document, queues a Cloud Task for processing,
 * and updates the session with job tracking information.
 *
 * See contracts/start-transform-pipeline.yaml for full API spec.
 */
import { onRequest } from 'firebase-functions/v2/https'
import { getFunctions } from 'firebase-admin/functions'
import { db } from '../lib/firebase-admin'
import { fetchSession, updateSessionJobStatus, hasActiveJob } from '../lib/session-v2'
import { createJob, buildJobData } from '../lib/job'
import {
  startTransformPipelineRequestSchema,
  type TransformPipelineJobPayload,
} from '../lib/schemas/transform-pipeline.schema'
import {
  experienceSchema,
  type Experience,
  type JobSnapshot,
  type Session,
} from '@clementine/shared'

/**
 * Fetch experience from Firestore
 */
async function fetchExperience(
  workspaceId: string,
  experienceId: string
): Promise<Experience | null> {
  const doc = await db
    .collection('workspaces')
    .doc(workspaceId)
    .collection('experiences')
    .doc(experienceId)
    .get()

  if (!doc.exists) {
    return null
  }

  const data = doc.data()
  if (!data) {
    return null
  }

  return experienceSchema.parse({ id: doc.id, ...data })
}

/**
 * Build job snapshot from session and experience
 */
function buildJobSnapshot(
  session: Session,
  experience: Experience,
  configSource: 'draft' | 'published'
): JobSnapshot {
  const config = configSource === 'draft' ? experience.draft : experience.published

  if (!config) {
    throw new Error('Experience config not found')
  }

  return {
    sessionInputs: {
      answers: session.answers,
      capturedMedia: session.capturedMedia,
    },
    transformConfig: config.transform!,
    eventContext: {
      overlay: null, // Will be populated from event if applicable
      applyOverlay: false,
      experienceRef: null,
    },
    versions: {
      experienceVersion:
        configSource === 'draft'
          ? experience.draftVersion
          : (experience.publishedVersion ?? 1),
      eventVersion: null, // Will be populated from event if applicable
    },
  }
}

/**
 * Queue Cloud Task for job processing
 */
async function queueTransformJob(payload: TransformPipelineJobPayload): Promise<void> {
  const queue = getFunctions().taskQueue(
    'locations/europe-west1/functions/transformPipelineJob'
  )
  await queue.enqueue(payload, {
    scheduleDelaySeconds: 0, // Run immediately
  })
}

/**
 * HTTP Cloud Function: startTransformPipeline
 *
 * Initiates a transform pipeline job for a session.
 */
export const startTransformPipeline = onRequest(
  {
    region: 'europe-west1',
    cors: true,
  },
  async (req, res) => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).json({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'Method not allowed' },
        })
        return
      }

      // Validate request body
      const parseResult = startTransformPipelineRequestSchema.safeParse(req.body)
      if (!parseResult.success) {
        const firstIssue = parseResult.error.issues[0]
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: `Invalid request: ${firstIssue?.message ?? 'validation failed'}`,
          },
        })
        return
      }

      const { sessionId, stepId } = parseResult.data

      // Extract projectId from URL query parameter
      // The URL format is: /startTransformPipeline?projectId=xxx
      const projectId = req.query['projectId'] as string
      if (!projectId) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'Missing projectId query parameter' },
        })
        return
      }

      // Fetch session from Firestore
      const session = await fetchSession(projectId, sessionId)
      if (!session) {
        res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
        })
        return
      }

      // Check if job already in progress (FR-011)
      if (hasActiveJob(session)) {
        res.status(409).json({
          success: false,
          error: { code: 'JOB_IN_PROGRESS', message: 'A job is already in progress for this session' },
        })
        return
      }

      // Fetch experience and validate transform config exists (FR-013)
      const experience = await fetchExperience(session.workspaceId, session.experienceId)
      if (!experience) {
        res.status(404).json({
          success: false,
          error: { code: 'TRANSFORM_NOT_FOUND', message: 'Experience not found' },
        })
        return
      }

      // Determine which config to use based on session mode
      const configSource = session.configSource
      const config = configSource === 'draft' ? experience.draft : experience.published

      if (!config || !config.transform) {
        res.status(404).json({
          success: false,
          error: { code: 'TRANSFORM_NOT_FOUND', message: 'Experience has no transform configuration' },
        })
        return
      }

      // Build job snapshot (FR-002)
      const snapshot = buildJobSnapshot(session, experience, configSource)

      // Create job document with snapshot
      const jobData = buildJobData({
        projectId,
        sessionId,
        experienceId: session.experienceId,
        stepId,
        snapshot,
      })

      const jobId = await createJob(projectId, jobData)

      // Update session with jobId and jobStatus='pending' (FR-003)
      await updateSessionJobStatus(projectId, sessionId, jobId, 'pending')

      // Queue Cloud Task for transformPipelineJob
      const payload: TransformPipelineJobPayload = {
        jobId,
        sessionId,
        projectId,
      }
      await queueTransformJob(payload)

      // Return jobId (FR-014)
      res.status(200).json({
        success: true,
        jobId,
        message: 'Transform pipeline job created',
      })
    } catch (error) {
      console.error('Error in startTransformPipeline endpoint:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      })
    }
  }
)

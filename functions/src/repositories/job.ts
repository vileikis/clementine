/**
 * Job Helpers
 *
 * CRUD operations for Job documents in Firestore.
 * Path: /projects/{projectId}/jobs/{jobId}
 */
import { db } from '../infra/firebase-admin'
import {
  jobSchema,
  type Job,
  type JobStatus,
  type JobProgress,
  type JobOutput,
  type JobError,
  type JobSnapshot,
  type Session,
  type Experience,
} from '@clementine/shared'

/**
 * Get the Firestore reference for a job document
 */
function getJobRef(projectId: string, jobId: string) {
  return db
    .collection('projects')
    .doc(projectId)
    .collection('jobs')
    .doc(jobId)
}

/**
 * Get the Firestore reference for the jobs collection
 */
function getJobsCollectionRef(projectId: string) {
  return db.collection('projects').doc(projectId).collection('jobs')
}

/**
 * Create a new job document
 *
 * @param projectId - Project ID (parent collection)
 * @param data - Job data (without id)
 * @returns The created job ID
 */
export async function createJob(
  projectId: string,
  data: Omit<Job, 'id'>
): Promise<string> {
  const docRef = getJobsCollectionRef(projectId).doc()
  const jobId = docRef.id

  const jobData = {
    ...data,
    id: jobId,
  }

  // Validate with Zod before writing
  jobSchema.parse(jobData)

  await docRef.set(jobData)
  return jobId
}

/**
 * Fetch a job document from Firestore
 *
 * @param projectId - Project ID
 * @param jobId - Job document ID
 * @returns Parsed job or null if not found
 */
export async function fetchJob(
  projectId: string,
  jobId: string
): Promise<Job | null> {
  const doc = await getJobRef(projectId, jobId).get()

  if (!doc.exists) {
    return null
  }

  const data = doc.data()
  if (!data) {
    return null
  }

  return jobSchema.parse({ id: doc.id, ...data })
}

/**
 * Update job status
 *
 * @param projectId - Project ID
 * @param jobId - Job document ID
 * @param status - New status
 */
export async function updateJobStatus(
  projectId: string,
  jobId: string,
  status: JobStatus
): Promise<void> {
  await getJobRef(projectId, jobId).update({
    status,
    updatedAt: Date.now(),
  })
}

/**
 * Update job progress
 *
 * @param projectId - Project ID
 * @param jobId - Job document ID
 * @param progress - Progress data
 */
export async function updateJobProgress(
  projectId: string,
  jobId: string,
  progress: JobProgress
): Promise<void> {
  await getJobRef(projectId, jobId).update({
    progress,
    updatedAt: Date.now(),
  })
}

/**
 * Update job with output data (on success)
 *
 * @param projectId - Project ID
 * @param jobId - Job document ID
 * @param output - Output data
 */
export async function updateJobOutput(
  projectId: string,
  jobId: string,
  output: JobOutput
): Promise<void> {
  await getJobRef(projectId, jobId).update({
    output,
    updatedAt: Date.now(),
  })
}

/**
 * Mark job as completed with output
 *
 * @param projectId - Project ID
 * @param jobId - Job document ID
 * @param output - Final output data
 */
export async function updateJobComplete(
  projectId: string,
  jobId: string,
  output: JobOutput
): Promise<void> {
  const now = Date.now()
  await getJobRef(projectId, jobId).update({
    status: 'completed' as JobStatus,
    output,
    completedAt: now,
    updatedAt: now,
  })
}

/**
 * Update job with error data (on failure)
 *
 * @param projectId - Project ID
 * @param jobId - Job document ID
 * @param error - Error data
 */
export async function updateJobError(
  projectId: string,
  jobId: string,
  error: JobError
): Promise<void> {
  const now = Date.now()
  await getJobRef(projectId, jobId).update({
    status: 'failed' as JobStatus,
    error,
    completedAt: now,
    updatedAt: now,
  })
}

/**
 * Mark job as started (pending -> running)
 *
 * @param projectId - Project ID
 * @param jobId - Job document ID
 */
export async function updateJobStarted(
  projectId: string,
  jobId: string
): Promise<void> {
  const now = Date.now()
  await getJobRef(projectId, jobId).update({
    status: 'running' as JobStatus,
    startedAt: now,
    updatedAt: now,
  })
}

/**
 * Sanitized error messages mapping
 *
 * Maps internal error codes to client-safe messages.
 * See spec FR-008: sanitized errors prevent prompt/config leakage
 */
export const SANITIZED_ERROR_MESSAGES: Record<string, string> = {
  INVALID_INPUT: 'The request could not be processed due to invalid input.',
  PROCESSING_FAILED: 'An error occurred while processing your request.',
  AI_MODEL_ERROR: 'The AI service is temporarily unavailable.',
  STORAGE_ERROR: 'Unable to save the result. Please try again.',
  TIMEOUT: 'Processing took too long and was cancelled.',
  CANCELLED: 'The request was cancelled.',
  UNKNOWN: 'An unexpected error occurred.',
}

/**
 * Create a sanitized error object for client display
 *
 * @param code - Error code
 * @param step - Optional step where error occurred
 * @returns Sanitized JobError object
 */
export function createSanitizedError(
  code: string,
  step: string | null = null
): JobError {
  const message =
    SANITIZED_ERROR_MESSAGES[code] ?? SANITIZED_ERROR_MESSAGES['UNKNOWN'] ?? 'An unexpected error occurred.'

  return {
    code,
    message,
    step,
    isRetryable: false, // All errors are non-retryable per spec D9
    timestamp: Date.now(),
  }
}

/**
 * Create initial job data for a new job
 *
 * @param params - Job creation parameters
 * @returns Job data ready for createJob()
 */
export function buildJobData(params: {
  projectId: string
  sessionId: string
  experienceId: string
  stepId: string | null
  snapshot: JobSnapshot
}): Omit<Job, 'id'> {
  const now = Date.now()

  return {
    projectId: params.projectId,
    sessionId: params.sessionId,
    experienceId: params.experienceId,
    stepId: params.stepId,
    status: 'pending',
    progress: null,
    output: null,
    error: null,
    snapshot: params.snapshot,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
  }
}

/**
 * Build job snapshot from session and experience
 *
 * Captures the current state of session inputs and experience config
 * at the time of job creation for immutable processing.
 *
 * @param session - Session with answers and captured media
 * @param experience - Experience with transform nodes
 * @param configSource - Which config to use ('draft' or 'published')
 * @returns JobSnapshot for the job document
 */
export function buildJobSnapshot(
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
    transformNodes: config.transformNodes,
    projectContext: {
      overlay: null, // Will be populated from project if applicable
      applyOverlay: false,
      experienceRef: null,
    },
    versions: {
      experienceVersion:
        configSource === 'draft'
          ? experience.draftVersion
          : (experience.publishedVersion ?? 1),
      eventVersion: null, // Deprecated - kept for backward compatibility with old jobs
    },
  }
}

/**
 * Session Repository
 *
 * Session CRUD operations using the new Phase 1 schema.
 * Firestore path: /projects/{projectId}/sessions/{sessionId}
 *
 * Note: session-legacy.ts uses old path (/sessions/{id}) for legacy media pipeline
 */
import { db } from '../infra/firebase-admin'
import { sessionSchema, type Session, type JobStatus, type MediaReference } from '@clementine/shared'
import { convertFirestoreDoc } from '../utils/firestore-utils'

/**
 * Get the Firestore reference for a session document
 */
function getSessionRef(projectId: string, sessionId: string) {
  return db
    .collection('projects')
    .doc(projectId)
    .collection('sessions')
    .doc(sessionId)
}

/**
 * Fetch a session document from Firestore
 *
 * @param projectId - Project ID (parent collection)
 * @param sessionId - Session document ID
 * @returns Parsed session or null if not found
 */
export async function fetchSession(
  projectId: string,
  sessionId: string
): Promise<Session | null> {
  const doc = await getSessionRef(projectId, sessionId).get()

  if (!doc.exists) {
    return null
  }

  return convertFirestoreDoc(doc, sessionSchema)
}

/**
 * Update session with job tracking information
 *
 * @param projectId - Project ID
 * @param sessionId - Session document ID
 * @param jobId - Job document ID
 * @param jobStatus - Current job status
 */
export async function updateSessionJobStatus(
  projectId: string,
  sessionId: string,
  jobId: string,
  jobStatus: JobStatus
): Promise<void> {
  await getSessionRef(projectId, sessionId).update({
    jobId,
    jobStatus,
    updatedAt: Date.now(),
  })
}

/**
 * Check if session has an active job (pending or running)
 *
 * @param session - Session document
 * @returns True if a job is in progress
 */
export function hasActiveJob(session: Session): boolean {
  return session.jobStatus === 'pending' || session.jobStatus === 'running'
}

/**
 * Update session with guest email address
 *
 * @param projectId - Project ID
 * @param sessionId - Session document ID
 * @param guestEmail - Guest email address (PII — never log)
 */
export async function updateSessionGuestEmail(
  projectId: string,
  sessionId: string,
  guestEmail: string
): Promise<void> {
  await getSessionRef(projectId, sessionId).update({
    guestEmail,
    updatedAt: Date.now(),
  })
}

/**
 * Update session with email sent timestamp
 *
 * @param projectId - Project ID
 * @param sessionId - Session document ID
 */
export async function updateSessionEmailSentAt(
  projectId: string,
  sessionId: string
): Promise<void> {
  await getSessionRef(projectId, sessionId).update({
    emailSentAt: Date.now(),
    updatedAt: Date.now(),
  })
}

/**
 * Update session with result media
 *
 * Sets the resultMedia field with the transform pipeline output.
 *
 * @param projectId - Project ID
 * @param sessionId - Session document ID
 * @param resultMedia - Result media to set
 */
export async function updateSessionResultMedia(
  projectId: string,
  sessionId: string,
  resultMedia: MediaReference
): Promise<void> {
  await getSessionRef(projectId, sessionId).update({
    resultMedia,
    updatedAt: Date.now(),
  })
}

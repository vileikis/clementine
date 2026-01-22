/**
 * Session Repository
 *
 * Session CRUD operations using the new Phase 1 schema.
 * Firestore path: /projects/{projectId}/sessions/{sessionId}
 *
 * Note: session-legacy.ts uses old path (/sessions/{id}) for legacy media pipeline
 */
import { db } from '../infra/firebase-admin'
import { sessionSchema, type Session, type JobStatus } from '@clementine/shared'

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

  const data = doc.data()
  if (!data) {
    return null
  }

  // Parse with Zod schema for runtime validation
  return sessionSchema.parse({ id: doc.id, ...data })
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

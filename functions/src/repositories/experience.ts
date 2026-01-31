/**
 * Experience Helpers
 *
 * CRUD operations for Experience documents in Firestore.
 * Path: /workspaces/{workspaceId}/experiences/{experienceId}
 */
import { db } from '../infra/firebase-admin'
import { experienceSchema, type Experience } from '@clementine/shared'
import { convertFirestoreDoc } from '../utils/firestore-utils'

/**
 * Get the Firestore reference for an experience document
 */
function getExperienceRef(workspaceId: string, experienceId: string) {
  return db
    .collection('workspaces')
    .doc(workspaceId)
    .collection('experiences')
    .doc(experienceId)
}

/**
 * Fetch an experience document from Firestore
 *
 * @param workspaceId - Workspace ID (parent collection)
 * @param experienceId - Experience document ID
 * @returns Parsed experience or null if not found
 */
export async function fetchExperience(
  workspaceId: string,
  experienceId: string
): Promise<Experience | null> {
  const doc = await getExperienceRef(workspaceId, experienceId).get()

  if (!doc.exists) {
    return null
  }

  return convertFirestoreDoc(doc, experienceSchema)
}

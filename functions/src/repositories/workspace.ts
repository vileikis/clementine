/**
 * Workspace Repository
 *
 * CRUD operations for workspace integration fields in Firestore.
 * Path: /workspaces/{workspaceId}
 */
import { db } from '../infra/firebase-admin'
import type { DropboxIntegration } from '@clementine/shared'

/**
 * Get the Firestore reference for a workspace document
 */
function getWorkspaceRef(workspaceId: string) {
  return db.collection('workspaces').doc(workspaceId)
}

/**
 * Fetch workspace Dropbox integration config
 *
 * @param workspaceId - Workspace document ID
 * @returns Dropbox integration data or null if not connected
 */
export async function fetchWorkspaceIntegration(
  workspaceId: string
): Promise<DropboxIntegration | null> {
  const doc = await getWorkspaceRef(workspaceId).get()

  if (!doc.exists) {
    return null
  }

  const data = doc.data()
  const dropbox = data?.['integrations']?.['dropbox'] ?? null
  return dropbox as DropboxIntegration | null
}

/**
 * Update workspace Dropbox integration config
 *
 * @param workspaceId - Workspace document ID
 * @param integration - Dropbox integration data, or null to clear
 */
export async function updateWorkspaceIntegration(
  workspaceId: string,
  integration: DropboxIntegration | null
): Promise<void> {
  await getWorkspaceRef(workspaceId).update({
    'integrations.dropbox': integration,
    updatedAt: Date.now(),
  })
}

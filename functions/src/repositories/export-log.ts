/**
 * Export Log Repository
 *
 * Write operations for export log entries in Firestore.
 * Path: /projects/{projectId}/exportLogs/{logId}
 */
import { db } from '../infra/firebase-admin'
import type { ExportLog } from '@clementine/shared'

/**
 * Get the Firestore reference for the exportLogs collection
 */
function getExportLogsCollectionRef(projectId: string) {
  return db.collection('projects').doc(projectId).collection('exportLogs')
}

/**
 * Create an export log entry
 *
 * @param projectId - Project ID (parent collection)
 * @param data - Export log data (without id)
 * @returns The created log ID
 */
export async function createExportLog(
  projectId: string,
  data: Omit<ExportLog, 'id'>
): Promise<string> {
  const docRef = getExportLogsCollectionRef(projectId).doc()
  const logId = docRef.id

  const logData: ExportLog = {
    ...data,
    id: logId,
  }

  await docRef.set(logData)
  return logId
}

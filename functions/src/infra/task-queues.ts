/**
 * Centralized Cloud Task Queue Functions
 *
 * All Cloud Task enqueue operations in one place.
 * Each function wraps getFunctions().taskQueue() for a specific task handler.
 */
import { getFunctions } from 'firebase-admin/functions'
import type { TransformPipelineJobPayload } from '../schemas/transform-pipeline.schema'
import type { DispatchExportsPayload, DropboxExportPayload } from '../schemas/export.schema'

const REGION = 'europe-west1'

function taskQueuePath(functionName: string): string {
  return `locations/${REGION}/functions/${functionName}`
}

/**
 * Enqueue a transformPipelineJob Cloud Task
 */
export async function queueTransformJob(
  payload: TransformPipelineJobPayload,
): Promise<void> {
  const queue = getFunctions().taskQueue(taskQueuePath('transformPipelineJob'))
  await queue.enqueue(payload, { scheduleDelaySeconds: 0 })
}

/**
 * Enqueue a dispatchExports Cloud Task
 *
 * Called from transformPipelineJob after successful job completion.
 * Best-effort — callers should catch and log errors without failing.
 */
export async function queueDispatchExports(
  payload: DispatchExportsPayload,
): Promise<void> {
  const queue = getFunctions().taskQueue(taskQueuePath('dispatchExports'))
  await queue.enqueue(payload, { scheduleDelaySeconds: 0 })
}

/**
 * Enqueue a dropboxExportWorker Cloud Task
 */
export async function queueDropboxExportWorker(
  payload: DropboxExportPayload,
): Promise<void> {
  const queue = getFunctions().taskQueue(taskQueuePath('dropboxExportWorker'))
  await queue.enqueue(payload, { scheduleDelaySeconds: 0 })
}

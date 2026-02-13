/**
 * Centralized Cloud Task Queue Functions
 *
 * All Cloud Task enqueue operations in one place.
 * Each function wraps getFunctions().taskQueue() for a specific task handler.
 */
import { getFunctions } from 'firebase-admin/functions'
import type { TransformPipelineJobPayload } from '../schemas/transform-pipeline.schema'
import type { DispatchExportsPayload, DropboxExportPayload } from '../schemas/export.schema'
import type { SendSessionEmailPayload } from '../schemas/email.schema'

const REGION = 'europe-west1'

function taskQueuePath(functionName: string): string {
  return `locations/${REGION}/functions/${functionName}`
}

/**
 * Enqueue a transformPipelineTask Cloud Task
 */
export async function queueTransformJob(
  payload: TransformPipelineJobPayload,
): Promise<void> {
  const queue = getFunctions().taskQueue(taskQueuePath('transformPipelineTask'))
  await queue.enqueue(payload, { scheduleDelaySeconds: 0 })
}

/**
 * Enqueue a dispatchExportsTask Cloud Task
 *
 * Called from transformPipelineTask after successful job completion.
 * Best-effort — callers should catch and log errors without failing.
 */
export async function queueDispatchExports(
  payload: DispatchExportsPayload,
): Promise<void> {
  const queue = getFunctions().taskQueue(taskQueuePath('dispatchExportsTask'))
  await queue.enqueue(payload, { scheduleDelaySeconds: 0 })
}

/**
 * Enqueue an exportDropboxTask Cloud Task
 */
export async function queueExportDropboxTask(
  payload: DropboxExportPayload,
): Promise<void> {
  const queue = getFunctions().taskQueue(taskQueuePath('exportDropboxTask'))
  await queue.enqueue(payload, { scheduleDelaySeconds: 0 })
}

/**
 * Enqueue a sendSessionEmailTask Cloud Task
 *
 * Called from transformPipelineTask after successful completion
 * and from submitGuestEmail callable when job is already done.
 * Best-effort — callers should catch and log errors without failing.
 */
export async function queueSendSessionEmail(
  payload: SendSessionEmailPayload,
): Promise<void> {
  const queue = getFunctions().taskQueue(taskQueuePath('sendSessionEmailTask'))
  await queue.enqueue(payload, { scheduleDelaySeconds: 0 })
}

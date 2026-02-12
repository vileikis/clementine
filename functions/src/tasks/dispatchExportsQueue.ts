/**
 * Dispatch Exports Queue Helper
 *
 * Enqueues a dispatchExports Cloud Task.
 * Separated from the task handler to avoid circular imports.
 */
import { getFunctions } from 'firebase-admin/functions'
import type { DispatchExportsPayload } from '../schemas/export.schema'

/**
 * Enqueue a dispatchExports Cloud Task
 *
 * Called from transformPipelineJob after successful job completion.
 * Best-effort — callers should catch and log errors without failing.
 */
export async function queueDispatchExports(
  payload: DispatchExportsPayload,
): Promise<void> {
  const queue = getFunctions().taskQueue(
    'locations/europe-west1/functions/dispatchExports',
  )
  await queue.enqueue(payload, {
    scheduleDelaySeconds: 0,
  })
}

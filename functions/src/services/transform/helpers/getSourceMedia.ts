/**
 * Get Source Media Helper
 *
 * Extracts the first media reference from session responses for a given capture step.
 * Fail-fast: throws if step not found, has no media, or has invalid media reference.
 */
import type { MediaReference, SessionResponse } from '@clementine/shared'

/**
 * Get source media from session responses by capture step ID
 *
 * Finds the response for the specified capture step and returns the first media reference.
 */
export function getSourceMedia(
  responses: SessionResponse[],
  captureStepId: string,
): MediaReference {
  const response = responses.find((r) => r.stepId === captureStepId)

  if (!response) {
    throw new Error(`Capture step not found: ${captureStepId}`)
  }

  if (!Array.isArray(response.data) || response.data.length === 0) {
    throw new Error(`Capture step has no media: ${response.stepName}`)
  }

  const firstMedia = response.data[0] as MediaReference
  if (!firstMedia?.mediaAssetId) {
    throw new Error(
      `Capture step has invalid media reference: ${response.stepName}`,
    )
  }

  return firstMedia
}

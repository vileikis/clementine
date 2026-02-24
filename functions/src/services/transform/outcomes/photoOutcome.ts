/**
 * Photo Outcome Executor
 *
 * Passthrough executor: returns captured media with optional overlay.
 * Reads config from snapshot.config.photo.
 *
 * Flow:
 * 1. Read photo config from snapshot
 * 2. Get source media from session responses using captureStepId
 * 3. Download to tmpDir
 * 4. Apply overlay if overlayChoice exists
 * 5. Upload output and generate thumbnail
 *
 * @see specs/072-outcome-schema-redesign — US1
 */
import { logger } from 'firebase-functions/v2'
import type { JobOutput } from '@clementine/shared'
import type { OutcomeContext } from '../types'
import { getSourceMedia } from '../helpers/getSourceMedia'
import { applyOverlay } from '../operations/applyOverlay'
import { uploadOutput } from '../operations/uploadOutput'
import {
  downloadFromStorage,
  getStoragePathFromMediaReference,
} from '../../../infra/storage'

/**
 * Execute photo outcome (passthrough)
 */
export async function photoOutcome(ctx: OutcomeContext): Promise<JobOutput> {
  const { job, snapshot, tmpDir, startTime } = ctx
  const { config, overlayChoice } = snapshot

  if (!config?.photo) {
    throw new Error('Photo outcome configuration is required')
  }

  const { captureStepId, aspectRatio } = config.photo

  logger.info('[PhotoOutcome] Starting photo outcome execution', {
    jobId: job.id,
    captureStepId,
    aspectRatio,
    hasOverlayChoice: !!overlayChoice,
  })

  // Get source media from capture step
  const sourceMedia = getSourceMedia(
    snapshot.sessionResponses,
    captureStepId,
  )

  // Download captured media to temp directory
  let outputPath = `${tmpDir}/passthrough-output.jpg`
  const storagePath = getStoragePathFromMediaReference(sourceMedia)
  await downloadFromStorage(storagePath, outputPath)

  logger.info('[PhotoOutcome] Passthrough mode - using captured media', {
    jobId: job.id,
    mediaAssetId: sourceMedia.mediaAssetId,
    displayName: sourceMedia.displayName,
  })

  // Apply overlay if resolved at job creation
  if (overlayChoice) {
    logger.info('[PhotoOutcome] Applying overlay', {
      jobId: job.id,
      aspectRatio,
      overlayDisplayName: overlayChoice.displayName,
    })
    outputPath = await applyOverlay(outputPath, overlayChoice, tmpDir)
  }

  // Upload output and generate thumbnail
  const result = await uploadOutput({
    outputPath,
    projectId: job.projectId,
    sessionId: job.sessionId,
    tmpDir,
  })

  const output: JobOutput = {
    ...result,
    processingTimeMs: Date.now() - startTime,
  }

  logger.info('[PhotoOutcome] Photo outcome completed', {
    jobId: job.id,
    assetId: output.assetId,
    processingTimeMs: output.processingTimeMs,
  })

  return output
}

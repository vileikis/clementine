/**
 * Photo Outcome Executor
 *
 * Passthrough executor: returns captured media with optional overlay.
 * Reads config from snapshot.outcome.photo.
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
import * as fs from 'fs/promises'
import type {
  JobOutput,
  MediaReference,
  SessionResponse,
} from '@clementine/shared'
import type { OutcomeContext } from '../types'
import { applyOverlay } from '../operations/applyOverlay'
import {
  downloadFromStorage,
  uploadToStorage,
  getOutputStoragePath,
  getStoragePathFromMediaReference,
} from '../../../infra/storage'
import { generateThumbnail } from '../../ffmpeg'

/**
 * Execute photo outcome (passthrough)
 */
export async function photoOutcome(ctx: OutcomeContext): Promise<JobOutput> {
  const { job, snapshot, tmpDir, startTime } = ctx
  const { outcome, overlayChoice } = snapshot

  if (!outcome?.photo) {
    throw new Error('Photo outcome configuration is required')
  }

  const { captureStepId, aspectRatio } = outcome.photo

  logger.info('[PhotoOutcome] Starting photo outcome execution', {
    jobId: job.id,
    captureStepId,
    aspectRatio,
    hasOverlayChoice: !!overlayChoice,
  })

  // Get source media from capture step
  const sourceMedia = getSourceMediaFromResponses(
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
  const output = await uploadOutput(
    outputPath,
    job.projectId,
    job.sessionId,
    tmpDir,
    startTime,
  )

  logger.info('[PhotoOutcome] Photo outcome completed', {
    jobId: job.id,
    assetId: output.assetId,
    processingTimeMs: output.processingTimeMs,
  })

  return output
}

/**
 * Get source media from session responses by capture step ID
 */
function getSourceMediaFromResponses(
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

/**
 * Upload output to storage and generate thumbnail
 */
async function uploadOutput(
  outputPath: string,
  projectId: string,
  sessionId: string,
  tmpDir: string,
  startTime: number,
): Promise<JobOutput> {
  const stats = await fs.stat(outputPath)

  const storagePath = getOutputStoragePath(
    projectId,
    sessionId,
    'output',
    'jpg',
  )
  const url = await uploadToStorage(outputPath, storagePath)

  const thumbPath = `${tmpDir}/thumb.jpg`
  await generateThumbnail(outputPath, thumbPath, 300)

  const thumbStoragePath = getOutputStoragePath(
    projectId,
    sessionId,
    'thumb',
    'jpg',
  )
  const thumbnailUrl = await uploadToStorage(thumbPath, thumbStoragePath)

  const assetId = `${sessionId}-output`

  return {
    assetId,
    url,
    filePath: storagePath,
    format: 'image',
    dimensions: {
      width: 1024,
      height: 1024,
    },
    sizeBytes: stats.size,
    thumbnailUrl,
    processingTimeMs: Date.now() - startTime,
  }
}

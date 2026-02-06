/**
 * Image Outcome Executor
 *
 * Orchestrates the execution of image outcomes.
 * Supports two modes:
 * 1. AI Generation (aiEnabled=true): Generate image using Vertex AI
 * 2. Passthrough (aiEnabled=false): Return captured media with optional overlay
 *
 * @see data-model.md for outcome configuration
 */
import { logger } from 'firebase-functions/v2'
import * as fs from 'fs/promises'
import type {
  JobOutput,
  MediaReference,
  SessionResponse,
} from '@clementine/shared'
import type { OutcomeContext } from '../types'
import { resolvePromptMentions } from '../bindings/resolvePromptMentions'
import { aiGenerateImage } from '../operations/aiGenerateImage'
import {
  applyOverlay,
  getOverlayForAspectRatio,
} from '../operations/applyOverlay'
import {
  downloadFromStorage,
  uploadToStorage,
  getOutputStoragePath,
  getStoragePathFromMediaReference,
} from '../../../infra/storage'
import { generateThumbnail } from '../../ffmpeg'

/**
 * Execute image outcome
 *
 * Orchestrates the complete image generation flow:
 * 1. Extract source media (if captureStepId set)
 * 2. Resolve prompt mentions
 * 3. Generate image via AI (or passthrough)
 * 4. Apply overlay (if configured)
 * 5. Upload output and generate thumbnail
 *
 * @param ctx - Outcome execution context
 * @returns JobOutput with generated image metadata
 */
export async function imageOutcome(ctx: OutcomeContext): Promise<JobOutput> {
  const { job, snapshot, tmpDir, startTime } = ctx
  const { outcome, sessionResponses, projectContext } = snapshot

  if (!outcome) {
    throw new Error('Outcome configuration is required')
  }

  const { aiEnabled, captureStepId, imageGeneration } = outcome
  const aspectRatio = imageGeneration?.aspectRatio ?? '1:1'

  logger.info('[ImageOutcome] Starting image outcome execution', {
    jobId: job.id,
    aiEnabled,
    captureStepId,
    aspectRatio,
    hasProjectContext: !!projectContext,
  })

  // Extract source media from capture step (if configured)
  // This will throw an error if captureStepId is set but step not found or has no media
  const sourceMedia: MediaReference | null = captureStepId
    ? getSourceMediaFromResponses(sessionResponses, captureStepId)
    : null

  let outputPath: string

  if (aiEnabled) {
    // AI Generation mode
    outputPath = await executeAIGeneration(snapshot, sourceMedia, tmpDir)
  } else {
    // Passthrough mode - return captured media
    outputPath = await executePassthrough(sourceMedia, captureStepId, tmpDir)
  }

  if (!outputPath) {
    throw new Error('No output path generated')
  }

  // Apply overlay if configured
  const overlay = getOverlayForAspectRatio(
    projectContext?.overlays,
    aspectRatio,
  )
  if (overlay) {
    logger.info('[ImageOutcome] Applying overlay', {
      jobId: job.id,
      aspectRatio,
      overlayDisplayName: overlay.displayName,
    })
    outputPath = await applyOverlay(outputPath, overlay, tmpDir)
  } else {
    logger.info('[ImageOutcome] No overlay configured for aspect ratio', {
      jobId: job.id,
      aspectRatio,
    })
  }

  // Upload output and generate thumbnail
  const output = await uploadOutput(
    outputPath,
    job.projectId,
    job.sessionId,
    tmpDir,
    startTime,
  )

  logger.info('[ImageOutcome] Image outcome completed', {
    jobId: job.id,
    assetId: output.assetId,
    url: output.url,
    processingTimeMs: output.processingTimeMs,
  })

  return output
}

// =============================================================================
// Mode Execution Functions
// =============================================================================

/**
 * Execute AI generation mode
 *
 * Resolves prompt mentions, builds generation request, and calls AI service.
 */
async function executeAIGeneration(
  snapshot: OutcomeContext['snapshot'],
  sourceMedia: MediaReference | null,
  tmpDir: string,
): Promise<string> {
  const { outcome, sessionResponses } = snapshot

  if (!outcome?.imageGeneration) {
    throw new Error('Image outcome missing configuration')
  }

  const { prompt, refMedia, model, aspectRatio } = outcome.imageGeneration

  // RT-002: Validate prompt is not empty when AI enabled
  if (!prompt.trim()) {
    throw new Error('Image outcome has empty prompt')
  }

  // Resolve prompt mentions
  const resolved = resolvePromptMentions(prompt, sessionResponses, refMedia)

  logger.info('[ImageOutcome] Prompt resolved', {
    originalLength: prompt.length,
    resolvedLength: resolved.text.length,
    mediaRefsCount: resolved.mediaRefs.length,
  })

  // Build generation request
  // Combine media refs from prompt resolution with source media
  const referenceMedia = resolved.mediaRefs

  // Generate image
  const result = await aiGenerateImage(
    {
      prompt: resolved.text,
      model,
      aspectRatio,
      sourceMedia,
      referenceMedia,
    },
    tmpDir,
  )

  return result.outputPath
}

/**
 * Execute passthrough mode
 *
 * Downloads the captured media to use as output (no AI processing).
 */
async function executePassthrough(
  sourceMedia: MediaReference | null,
  captureStepId: string | null,
  tmpDir: string,
): Promise<string> {
  if (!sourceMedia) {
    throw new Error(
      captureStepId
        ? `Capture step '${captureStepId}' has no media`
        : 'Passthrough mode requires captureStepId',
    )
  }

  logger.info('[ImageOutcome] Passthrough mode - using captured media', {
    mediaAssetId: sourceMedia.mediaAssetId,
    displayName: sourceMedia.displayName,
  })

  // Download captured media to temp directory
  const outputPath = `${tmpDir}/passthrough-output.jpg`
  const storagePath = getStoragePathFromMediaReference(sourceMedia)
  await downloadFromStorage(storagePath, outputPath)

  return outputPath
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get source media from session responses by capture step ID
 *
 * Finds the response for the specified capture step and extracts the first media reference.
 * Throws an error if the capture step is not found or has no media (fail-fast behavior).
 */
function getSourceMediaFromResponses(
  responses: SessionResponse[],
  captureStepId: string,
): MediaReference {
  const response = responses.find((r) => r.stepId === captureStepId)

  // RT-003: Capture step must exist
  if (!response) {
    throw new Error(`Capture step not found: ${captureStepId}`)
  }

  // RT-004: Capture step must have media data
  if (!Array.isArray(response.data) || response.data.length === 0) {
    throw new Error(`Capture step has no media: ${response.stepName}`)
  }

  // Return first media reference
  const firstMedia = response.data[0] as MediaReference
  if (!firstMedia?.mediaAssetId) {
    throw new Error(`Capture step has invalid media reference: ${response.stepName}`)
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
  // Get output stats
  const stats = await fs.stat(outputPath)

  // Upload output
  const storagePath = getOutputStoragePath(
    projectId,
    sessionId,
    'output',
    'jpg',
  )
  const url = await uploadToStorage(outputPath, storagePath)

  // Generate thumbnail
  const thumbPath = `${tmpDir}/thumb.jpg`
  await generateThumbnail(outputPath, thumbPath, 300)

  const thumbStoragePath = getOutputStoragePath(
    projectId,
    sessionId,
    'thumb',
    'jpg',
  )
  const thumbnailUrl = await uploadToStorage(thumbPath, thumbStoragePath)

  // Extract asset ID from session ID
  const assetId = `${sessionId}-output`

  logger.info('[ImageOutcome] Output uploaded', {
    url,
    storagePath,
    thumbnailUrl,
    sizeBytes: stats.size,
  })

  return {
    assetId,
    url,
    format: 'image',
    dimensions: {
      width: 1024, // TODO: Get actual dimensions from image
      height: 1024,
    },
    sizeBytes: stats.size,
    thumbnailUrl,
    processingTimeMs: Date.now() - startTime,
  }
}

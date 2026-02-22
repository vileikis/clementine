/**
 * AI Video Outcome Executor
 *
 * Handles AI video generation for animate, transform, and reimagine tasks.
 * Reads config from snapshot.outcome.aiVideo.
 *
 * Flow (animate):
 * 1. Read aiVideo config from snapshot
 * 2. Build GCS URI for subject photo (no download needed)
 * 3. Resolve video generation prompt
 * 4. Generate video via Veo (writes directly to session results folder)
 * 5. Generate + upload thumbnail from local copy
 *
 * @see specs/074-ai-video-backend
 */
import { logger } from 'firebase-functions/v2'
import type { JobOutput } from '@clementine/shared'
import type { OutcomeContext } from '../types'
import { getSourceMedia } from '../helpers/getSourceMedia'
import { resolvePromptMentions } from '../bindings/resolvePromptMentions'
import { aiGenerateVideo } from '../operations/aiGenerateVideo'
import { generateThumbnail } from '../../ffmpeg/images'
import {
  getStoragePathFromMediaReference,
  getOutputStoragePath,
  uploadToStorage,
} from '../../../infra/storage'
import { storage } from '../../../infra/firebase-admin'

/**
 * Execute AI video outcome
 */
export async function aiVideoOutcome(ctx: OutcomeContext): Promise<JobOutput> {
  const { job, snapshot, tmpDir, startTime } = ctx
  const { outcome, overlayChoice } = snapshot

  if (!outcome?.aiVideo) {
    throw new Error('AI Video outcome configuration is required')
  }

  const { task, captureStepId, aspectRatio, videoGeneration } = outcome.aiVideo

  logger.info('[AIVideoOutcome] Starting AI video outcome execution', {
    jobId: job.id,
    task,
    captureStepId,
    aspectRatio,
  })

  // Validate prompt
  if (!videoGeneration.prompt.trim()) {
    throw new Error('AI Video outcome has empty prompt')
  }

  // Build GCS URI for source photo (already in storage, no download needed)
  const sourceMedia = getSourceMedia(snapshot.sessionResponses, captureStepId)
  const bucket = storage.bucket()
  const sourceStoragePath = getStoragePathFromMediaReference(sourceMedia)
  const startFrameGcsUri = `gs://${bucket.name}/${sourceStoragePath}`

  // For animate task: start frame = subject photo, no end frame
  let endFrameGcsUri: string | undefined

  if (task === 'animate') {
    // Start frame is the subject photo, no end frame needed
  } else {
    throw new Error(`Unsupported ai.video task: ${task}`)
  }

  // Resolve video generation prompt
  const resolved = resolvePromptMentions(
    videoGeneration.prompt,
    snapshot.sessionResponses,
    [], // No refMedia for video generation prompt
  )

  logger.info('[AIVideoOutcome] Prompt resolved', {
    jobId: job.id,
    resolvedLength: resolved.text.length,
  })

  // Overlay: skip for video outcomes
  if (overlayChoice) {
    logger.warn(
      '[AIVideoOutcome] Overlay not supported for ai.video outcomes, skipping',
      {
        jobId: job.id,
        overlayDisplayName: overlayChoice.displayName,
      },
    )
  }

  // Generate video (writes directly to session results folder in GCS)
  const canonicalStoragePath = getOutputStoragePath(
    job.projectId,
    job.sessionId,
    'output',
    'mp4',
  )

  const generatedVideo = await aiGenerateVideo(
    {
      prompt: resolved.text,
      model: videoGeneration.model,
      aspectRatio: videoGeneration.aspectRatio ?? aspectRatio,
      duration: videoGeneration.duration,
      startFrameGcsUri,
      endFrameGcsUri,
    },
    {
      storagePath: canonicalStoragePath,
      tmpDir,
    },
  )

  // Generate and upload thumbnail from local copy
  const thumbLocalPath = `${tmpDir}/thumb.jpg`
  await generateThumbnail(generatedVideo.localPath, thumbLocalPath, 300)

  const thumbStoragePath = getOutputStoragePath(
    job.projectId,
    job.sessionId,
    'thumb',
    'jpg',
  )
  const thumbnailUrl = await uploadToStorage(thumbLocalPath, thumbStoragePath)

  const output: JobOutput = {
    assetId: `${job.sessionId}-output`,
    url: generatedVideo.url,
    filePath: generatedVideo.storagePath,
    format: 'video',
    dimensions: generatedVideo.dimensions,
    sizeBytes: generatedVideo.sizeBytes,
    thumbnailUrl,
    processingTimeMs: Date.now() - startTime,
  }

  logger.info('[AIVideoOutcome] AI video outcome completed', {
    jobId: job.id,
    task,
    assetId: output.assetId,
    processingTimeMs: output.processingTimeMs,
  })

  return output
}

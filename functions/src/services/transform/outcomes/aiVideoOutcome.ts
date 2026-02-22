/**
 * AI Video Outcome Executor
 *
 * Handles AI video generation for animate, transform, and reimagine tasks.
 * Reads config from snapshot.outcome.aiVideo.
 *
 * Flow (animate):
 * 1. Read aiVideo config from snapshot
 * 2. Get source media reference from capture step
 * 3. Resolve video generation prompt
 * 4. Generate video via Veo (operation handles all GCS plumbing)
 * 5. Generate + upload thumbnail from local copy
 *
 * @see specs/074-ai-video-backend
 */
import { logger } from 'firebase-functions/v2'
import type { JobOutput } from '@clementine/shared'
import type { OutcomeContext } from '../types'
import { getSourceMedia } from '../helpers/getSourceMedia'
import { resolvePromptMentions } from '../bindings/resolvePromptMentions'
import {
  aiGenerateVideo,
  type GenerateVideoRequest,
} from '../operations/aiGenerateVideo'
import { generateThumbnail } from '../../ffmpeg/images'
import { getOutputStoragePath, uploadToStorage } from '../../../infra/storage'

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

  // Get source media reference from capture step
  const sourceMedia = getSourceMedia(snapshot.sessionResponses, captureStepId)

  // Resolve video generation prompt (step mentions only — Veo referenceImages
  // don't support display-name labels, so @{ref:...} mentions are not useful)
  const resolved = resolvePromptMentions(
    videoGeneration.prompt,
    snapshot.sessionResponses,
    [],
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

  // Build GenerateVideoRequest based on task type
  const baseRequest: GenerateVideoRequest = {
    prompt: resolved.text,
    model: videoGeneration.model,
    aspectRatio: videoGeneration.aspectRatio ?? aspectRatio,
    duration: videoGeneration.duration,
    sourceMedia,
  }

  let generateVideoRequest: GenerateVideoRequest
  switch (task) {
    case 'image-to-video':
      // Animate: sourceMedia only (params.image path)
      generateVideoRequest = baseRequest
      break

    case 'ref-images-to-video':
      // Remix: ALL images go via referenceMedia (config.referenceImages path).
      // sourceMedia is included as a reference — not as params.image.
      generateVideoRequest = {
        ...baseRequest,
        referenceMedia: [sourceMedia, ...(videoGeneration.refMedia ?? [])],
      }
      break

    case 'transform':
    case 'reimagine':
      throw new Error(`Task "${task}" is not yet supported`)

    default:
      throw new Error(`Unknown AI video task: ${String(task)}`)
  }

  // Generate video (operation handles GCS URIs, output paths, download)
  const generatedVideo = await aiGenerateVideo(
    generateVideoRequest,
    {
      projectId: job.projectId,
      sessionId: job.sessionId,
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
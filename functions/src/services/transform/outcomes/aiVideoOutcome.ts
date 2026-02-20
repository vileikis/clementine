/**
 * AI Video Outcome Executor
 *
 * Handles AI video generation for animate, transform, and reimagine tasks.
 * Reads config from snapshot.outcome.aiVideo.
 *
 * Flow (animate):
 * 1. Read aiVideo config from snapshot
 * 2. Download subject photo from capture step
 * 3. Resolve video generation prompt
 * 4. Generate video via Veo (aiGenerateVideo)
 * 5. Upload output with thumbnail
 *
 * @see specs/074-ai-video-backend
 */
import { logger } from 'firebase-functions/v2'
import type { JobOutput } from '@clementine/shared'
import type { OutcomeContext } from '../types'
import { getSourceMedia } from '../helpers/getSourceMedia'
import { resolvePromptMentions } from '../bindings/resolvePromptMentions'
import { aiGenerateVideo } from '../operations/aiGenerateVideo'
import { uploadOutput } from '../operations/uploadOutput'
import {
  downloadFromStorage,
  getStoragePathFromMediaReference,
} from '../../../infra/storage'

/**
 * Execute AI video outcome
 */
export async function aiVideoOutcome(ctx: OutcomeContext): Promise<JobOutput> {
  const { job, snapshot, tmpDir, startTime, reportProgress } = ctx
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

  // Report starting progress
  await reportProgress?.({
    currentStep: 'starting',
    percentage: 10,
    message: 'Processing video...',
  })

  // Download subject photo
  const sourceMedia = getSourceMedia(snapshot.sessionResponses, captureStepId)
  const localSourcePath = `${tmpDir}/source.jpg`
  const storagePath = getStoragePathFromMediaReference(sourceMedia)
  await downloadFromStorage(storagePath, localSourcePath)

  // For animate task: start frame = subject photo, no end frame
  let startFrame = localSourcePath
  let endFrame: string | undefined

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

  // Report generating progress
  await reportProgress?.({
    currentStep: 'generating-video',
    percentage: 20,
    message: 'Generating video...',
  })

  // Generate video
  const generatedVideo = await aiGenerateVideo(
    {
      prompt: resolved.text,
      model: videoGeneration.model,
      aspectRatio: videoGeneration.aspectRatio ?? aspectRatio,
      duration: videoGeneration.duration,
      startFrame,
      endFrame,
    },
    tmpDir,
    job.id,
  )

  // Report uploading progress
  await reportProgress?.({
    currentStep: 'uploading',
    percentage: 80,
    message: 'Uploading result...',
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

  // Upload output
  const uploaded = await uploadOutput({
    outputPath: generatedVideo.outputPath,
    projectId: job.projectId,
    sessionId: job.sessionId,
    tmpDir,
    format: 'video',
    dimensions: generatedVideo.dimensions,
    extension: 'mp4',
  })

  const output: JobOutput = {
    ...uploaded,
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

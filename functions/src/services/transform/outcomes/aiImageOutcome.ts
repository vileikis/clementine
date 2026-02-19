/**
 * AI Image Outcome Executor
 *
 * Handles AI image generation for both text-to-image and image-to-image tasks.
 * Reads config from snapshot.outcome.aiImage.
 *
 * Flow:
 * 1. Read aiImage config from snapshot
 * 2. For i2i: get source media from session responses using captureStepId
 * 3. For t2i: sourceMedia = null
 * 4. Resolve prompt mentions
 * 5. Call aiGenerateImage
 * 6. Apply overlay if overlayChoice exists
 * 7. Upload output and generate thumbnail
 *
 * @see specs/072-outcome-schema-redesign — US2/US3
 */
import { logger } from 'firebase-functions/v2'
import type { JobOutput, MediaReference } from '@clementine/shared'
import type { OutcomeContext } from '../types'
import { getSourceMedia } from '../helpers/getSourceMedia'
import { resolvePromptMentions } from '../bindings/resolvePromptMentions'
import { aiGenerateImage } from '../operations/aiGenerateImage'
import { applyOverlay } from '../operations/applyOverlay'
import { uploadOutput } from '../operations/uploadOutput'

/**
 * Execute AI image outcome
 */
export async function aiImageOutcome(ctx: OutcomeContext): Promise<JobOutput> {
  const { job, snapshot, tmpDir, startTime } = ctx
  const { outcome, overlayChoice } = snapshot

  if (!outcome?.aiImage) {
    throw new Error('AI Image outcome configuration is required')
  }

  const { task, captureStepId, aspectRatio, imageGeneration } = outcome.aiImage

  logger.info('[AIImageOutcome] Starting AI image outcome execution', {
    jobId: job.id,
    task,
    captureStepId,
    aspectRatio,
    hasOverlayChoice: !!overlayChoice,
  })

  // Validate prompt is not empty
  if (!imageGeneration.prompt.trim()) {
    throw new Error('AI Image outcome has empty prompt')
  }

  // Get source media for image-to-image
  let sourceMedia: MediaReference | null = null
  if (task === 'image-to-image') {
    if (!captureStepId) {
      throw new Error(
        'Image-to-image task requires a capture step',
      )
    }
    sourceMedia = getSourceMedia(
      snapshot.sessionResponses,
      captureStepId,
    )
  }

  // Resolve prompt mentions
  const resolved = resolvePromptMentions(
    imageGeneration.prompt,
    snapshot.sessionResponses,
    imageGeneration.refMedia,
  )

  logger.info('[AIImageOutcome] Prompt resolved', {
    jobId: job.id,
    originalLength: imageGeneration.prompt.length,
    resolvedLength: resolved.text.length,
    mediaRefsCount: resolved.mediaRefs.length,
  })

  // Generate image — use generation-level AR if set, otherwise fall back to outcome-level AR
  const effectiveAspectRatio = imageGeneration.aspectRatio ?? aspectRatio

  const result = await aiGenerateImage(
    {
      prompt: resolved.text,
      model: imageGeneration.model,
      aspectRatio: effectiveAspectRatio,
      sourceMedia,
      referenceMedia: resolved.mediaRefs,
    },
    tmpDir,
  )

  let outputPath = result.outputPath

  // Apply overlay if resolved at job creation
  if (overlayChoice) {
    logger.info('[AIImageOutcome] Applying overlay', {
      jobId: job.id,
      aspectRatio: effectiveAspectRatio,
      overlayDisplayName: overlayChoice.displayName,
    })
    outputPath = await applyOverlay(outputPath, overlayChoice, tmpDir)
  }

  // Upload output and generate thumbnail
  const uploaded = await uploadOutput({
    outputPath,
    projectId: job.projectId,
    sessionId: job.sessionId,
    tmpDir,
  })

  const output: JobOutput = {
    ...uploaded,
    processingTimeMs: Date.now() - startTime,
  }

  logger.info('[AIImageOutcome] AI image outcome completed', {
    jobId: job.id,
    task,
    assetId: output.assetId,
    processingTimeMs: output.processingTimeMs,
  })

  return output
}

/**
 * AI Video Generation Operation
 *
 * Generates video using Google Veo via the @google/genai SDK.
 * Accepts domain-level MediaReference inputs and handles all GCS plumbing.
 *
 * Veo API patterns (inferred from media inputs):
 * 1. sourceMedia only → params.image (animate)
 * 2. sourceMedia + referenceMedia → config.referenceImages (animate-reference)
 * 3. sourceMedia + lastFrameMedia → params.image + config.lastFrame (transform/reimagine)
 *
 * Output is written directly to the session results folder in GCS,
 * copied to a canonical filename, and downloaded locally for thumbnail/overlay.
 *
 * @see specs/074-ai-video-backend/research.md R-001, R-006
 */
import {
  GenerateVideosParameters,
  GoogleGenAI,
  VideoGenerationReferenceType,
  type Image,
  type VideoGenerationReferenceImage,
} from '@google/genai'
import { logger } from 'firebase-functions/v2'
import * as fs from 'fs/promises'

import type {
  AIVideoModel,
  MediaReference,
  VideoAspectRatio,
} from '@clementine/shared'
import { storage } from '../../../infra/firebase-admin'
import {
  getOutputStoragePath,
  getStoragePathFromMediaReference,
} from '../../../infra/storage'
import { getMediaDimensions } from '../../ffmpeg/probe'
import { sleep } from '../helpers/sleep'

// Veo 3+ models are only available in us-central1 (not yet in EU regions)
const VEO_LOCATION = 'us-central1'

const GOOGLE_CLOUD_PROJECT =
  process.env['GCLOUD_PROJECT'] || process.env['GOOGLE_CLOUD_PROJECT']

// Polling configuration
const POLL_INTERVAL_MS = 15_000 // 15 seconds
const MAX_POLL_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

// =============================================================================
// Types
// =============================================================================

/**
 * Request for AI video generation
 *
 * The Veo API pattern is inferred from which media fields are provided:
 * - sourceMedia only → animate (params.image)
 * - sourceMedia + referenceMedia → animate-reference (config.referenceImages)
 * - sourceMedia + lastFrameMedia → transform/reimagine (params.image + config.lastFrame)
 */
export interface GenerateVideoRequest {
  /** Video generation prompt */
  prompt: string
  /** Veo model identifier */
  model: AIVideoModel
  /** Output aspect ratio */
  aspectRatio: VideoAspectRatio
  /** Duration in seconds (4–8) */
  duration: number
  /** Source image (subject photo) — always required */
  sourceMedia: MediaReference
  /** End frame image for transform/reimagine */
  lastFrameMedia?: MediaReference
  /** Asset reference images for animate-reference */
  referenceMedia?: MediaReference[]
}

/**
 * Output destination configuration
 */
export interface VideoOutputConfig {
  /** Project document ID */
  projectId: string
  /** Session document ID */
  sessionId: string
  /** Local temp directory for downloaded file */
  tmpDir: string
}

/**
 * Result of AI video generation
 */
export interface GeneratedVideo {
  /** Local file path (downloaded for thumbnail/overlay) */
  localPath: string
  /** Canonical GCS storage path */
  storagePath: string
  /** Public URL */
  url: string
  /** MIME type */
  mimeType: string
  /** File size in bytes */
  sizeBytes: number
  /** Duration in seconds */
  duration: number
  /** Video dimensions from ffprobe */
  dimensions: { width: number; height: number }
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Generate a video using Google Veo
 *
 * @param request - Video generation parameters with media references
 * @param output - Output destination configuration
 * @returns Generated video result with local path and GCS metadata
 */
export async function aiGenerateVideo(
  request: GenerateVideoRequest,
  output: VideoOutputConfig,
): Promise<GeneratedVideo> {
  const { prompt, model, aspectRatio, duration } = request

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Cannot generate video with empty prompt')
  }

  logger.info('[AIVideoGenerate] Starting video generation', {
    model,
    aspectRatio,
    duration,
    hasLastFrame: !!request.lastFrameMedia,
    hasReferenceMedia: !!request.referenceMedia?.length,
    promptLength: prompt.length,
  })

  const client = initVeoClient()
  const bucket = storage.bucket()

  // Compute output paths
  const canonicalPath = getOutputStoragePath(
    output.projectId,
    output.sessionId,
    'output',
    'mp4',
  )
  const outputFolder = canonicalPath.substring(
    0,
    canonicalPath.lastIndexOf('/') + 1,
  )
  const outputGcsUri = `gs://${bucket.name}/${outputFolder}`

  logger.info('[AIVideoGenerate] Calling Veo API', {
    model,
    outputGcsUri,
    location: VEO_LOCATION,
  })

  // Build and submit Veo request (pattern inferred from media inputs)
  const veoParams = buildVeoParams(request, bucket.name, outputGcsUri)
  const operation = await client.models.generateVideos(veoParams)

  // Poll until complete
  const completedOp = await pollOperation(client, operation)

  // Extract video URI from response
  const videoUri = extractVideoUri(completedOp)

  logger.info('[AIVideoGenerate] Video generated, copying to canonical path', {
    videoUri,
    canonicalPath,
  })

  // Copy Veo output to canonical path (keep original for dev visibility)
  const veoStoragePath = parseGcsUri(videoUri, bucket.name)
  await bucket.file(veoStoragePath).copy(bucket.file(canonicalPath))
  await bucket.file(canonicalPath).makePublic()

  const url = `https://storage.googleapis.com/${bucket.name}/${canonicalPath}`

  // Download locally for thumbnail generation (and future overlay)
  const localPath = `${output.tmpDir}/output.mp4`
  await bucket.file(canonicalPath).download({ destination: localPath })

  // Get file metadata via local file
  const stats = await fs.stat(localPath)
  const dimensions = await getMediaDimensions(localPath)

  logger.info('[AIVideoGenerate] Video generation completed', {
    storagePath: canonicalPath,
    sizeBytes: stats.size,
    dimensions,
    duration,
  })

  return {
    localPath,
    storagePath: canonicalPath,
    url,
    mimeType: 'video/mp4',
    sizeBytes: stats.size,
    duration,
    dimensions,
  }
}

// =============================================================================
// Veo Request Building
// =============================================================================

/**
 * Build Veo API parameters based on media inputs
 *
 * Infers the correct API pattern:
 * - sourceMedia only → params.image (animate)
 * - referenceMedia present → config.referenceImages (animate-reference)
 * - lastFrameMedia present → params.image + config.lastFrame (transform/reimagine)
 */
function buildVeoParams(
  request: GenerateVideoRequest,
  bucketName: string,
  outputGcsUri: string,
): GenerateVideosParameters {
  const { prompt, model, aspectRatio, duration, sourceMedia } = request
  const hasReferences = !!request.referenceMedia?.length

  const baseConfig = {
    aspectRatio,
    durationSeconds: duration,
    personGeneration: 'allow_adult' as const,
    numberOfVideos: 1,
    outputGcsUri,
  }

  // Pattern 2: animate-reference (config.referenceImages, no params.image)
  if (hasReferences) {
    return {
      model,
      prompt,
      config: {
        ...baseConfig,
        referenceImages: buildReferenceImages(request, bucketName),
      },
    }
  }

  // Pattern 3: transform/reimagine (params.image + config.lastFrame)
  if (request.lastFrameMedia) {
    return {
      model,
      prompt,
      image: mediaRefToGcsImage(sourceMedia, bucketName),
      config: {
        ...baseConfig,
        lastFrame: mediaRefToGcsImage(request.lastFrameMedia, bucketName),
      },
    }
  }

  // Pattern 1: animate (params.image only)
  return {
    model,
    prompt,
    image: mediaRefToGcsImage(sourceMedia, bucketName),
    config: baseConfig,
  }
}

/**
 * Build referenceImages array for animate-reference pattern
 *
 * sourceMedia → asset type, referenceMedia → asset type
 */
function buildReferenceImages(
  request: GenerateVideoRequest,
  bucketName: string,
): VideoGenerationReferenceImage[] {
  const refs: VideoGenerationReferenceImage[] = []

  // Source media as asset reference
  refs.push({
    image: mediaRefToGcsImage(request.sourceMedia, bucketName),
    referenceType: VideoGenerationReferenceType.ASSET,
  })

  // Additional asset references
  if (request.referenceMedia) {
    for (const ref of request.referenceMedia) {
      refs.push({
        image: mediaRefToGcsImage(ref, bucketName),
        referenceType: VideoGenerationReferenceType.ASSET,
      })
    }
  }

  return refs
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Initialize Google GenAI client for Vertex AI (Veo)
 *
 * Veo requires a regional endpoint (e.g., us-central1), NOT global.
 */
function initVeoClient(): GoogleGenAI {
  if (!GOOGLE_CLOUD_PROJECT) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required')
  }

  return new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: VEO_LOCATION,
  })
}

/**
 * Convert a MediaReference to a GCS Image for the Veo API
 */
function mediaRefToGcsImage(ref: MediaReference, bucketName: string): Image {
  const storagePath = getStoragePathFromMediaReference(ref)
  return {
    gcsUri: `gs://${bucketName}/${storagePath}`,
    mimeType: 'image/jpeg',
  }
}

/**
 * Poll a Veo operation until completion
 *
 * Polls every 15 seconds with a 5-minute timeout.
 */
async function pollOperation(
  client: GoogleGenAI,
  initialOperation: Awaited<
    ReturnType<GoogleGenAI['models']['generateVideos']>
  >,
) {
  let operation = initialOperation
  const pollStart = Date.now()

  while (!operation.done) {
    if (Date.now() - pollStart > MAX_POLL_TIMEOUT_MS) {
      throw new Error('Video generation timed out')
    }

    logger.info('[AIVideoGenerate] Polling operation', {
      name: operation.name,
      elapsedMs: Date.now() - pollStart,
    })

    await sleep(POLL_INTERVAL_MS)
    operation = await client.operations.getVideosOperation({ operation })
  }

  return operation
}

/**
 * Extract the video GCS URI from a completed operation
 *
 * Validates the operation completed successfully and was not filtered.
 */
function extractVideoUri(
  operation: Awaited<
    ReturnType<GoogleGenAI['operations']['getVideosOperation']>
  >,
): string {
  if (operation.error) {
    throw new Error(
      `Video generation failed: ${operation.error['message'] ?? 'Unknown error'}`,
    )
  }

  const response = operation.response
  if (!response?.generatedVideos || response.generatedVideos.length === 0) {
    throw new Error('Video was filtered by safety policy')
  }

  const videoUri = response.generatedVideos[0]?.video?.uri
  if (!videoUri) {
    throw new Error('No video URI in generation response')
  }

  return videoUri
}

/**
 * Parse a gs:// URI to extract the storage path (without bucket name)
 */
function parseGcsUri(uri: string, bucketName: string): string {
  const prefix = `gs://${bucketName}/`
  if (uri.startsWith(prefix)) {
    return uri.slice(prefix.length)
  }
  // Fallback: parse generic gs:// URI
  const parts = uri.replace('gs://', '').split('/')
  return parts.slice(1).join('/')
}

/**
 * AI Video Generation Operation
 *
 * Generates video using Google Veo via the @google/genai SDK.
 * Veo writes output directly to the session results folder in GCS.
 * The output is copied to a canonical filename, downloaded locally
 * for thumbnail generation, and the original Veo file is preserved.
 *
 * @see specs/074-ai-video-backend/research.md R-001, R-006
 */
import { defineString } from 'firebase-functions/params'
import { GoogleGenAI, type Image } from '@google/genai'
import { logger } from 'firebase-functions/v2'
import * as fs from 'fs/promises'

import type { AIVideoModel, VideoAspectRatio } from '@clementine/shared'
import { storage } from '../../../infra/firebase-admin'
import { getMediaDimensions } from '../../ffmpeg/probe'
import { sleep } from '../helpers/sleep'

// Environment configuration for Vertex AI
const VERTEX_AI_LOCATION = defineString('VERTEX_AI_LOCATION', {
  default: 'us-central1',
})

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
  /** GCS URI for start frame image */
  startFrameGcsUri: string
  /** GCS URI for end frame image (optional) */
  endFrameGcsUri?: string
}

/**
 * Output destination configuration
 */
export interface VideoOutputConfig {
  /** Canonical storage path for final output (e.g., projects/.../results/output.mp4) */
  storagePath: string
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
 * @param request - Video generation parameters
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
    hasEndFrame: !!request.endFrameGcsUri,
    promptLength: prompt.length,
  })

  const client = initVeoClient()
  const bucket = storage.bucket()

  // Derive the GCS output folder from the canonical storage path
  const outputFolder = output.storagePath.substring(
    0,
    output.storagePath.lastIndexOf('/') + 1,
  )
  const outputGcsUri = `gs://${bucket.name}/${outputFolder}`

  logger.info('[AIVideoGenerate] Calling Veo API', {
    model,
    outputGcsUri,
    location: VERTEX_AI_LOCATION.value(),
  })

  // Build and submit Veo request
  const operation = await submitVeoRequest(client, request, outputGcsUri)

  // Poll until complete
  const completedOp = await pollOperation(client, operation)

  // Extract video URI from response
  const videoUri = extractVideoUri(completedOp)

  logger.info('[AIVideoGenerate] Video generated, copying to canonical path', {
    videoUri,
    canonicalPath: output.storagePath,
  })

  // Copy Veo output to canonical path (keep original for dev visibility)
  const veoStoragePath = parseGcsUri(videoUri, bucket.name)
  await bucket.file(veoStoragePath).copy(bucket.file(output.storagePath))
  await bucket.file(output.storagePath).makePublic()

  const url = `https://storage.googleapis.com/${bucket.name}/${output.storagePath}`

  // Download locally for thumbnail generation (and future overlay)
  const localPath = `${output.tmpDir}/output.mp4`
  await bucket.file(output.storagePath).download({ destination: localPath })

  // Get file metadata via local file
  const stats = await fs.stat(localPath)
  const dimensions = await getMediaDimensions(localPath)

  logger.info('[AIVideoGenerate] Video generation completed', {
    storagePath: output.storagePath,
    sizeBytes: stats.size,
    dimensions,
    duration,
  })

  return {
    localPath,
    storagePath: output.storagePath,
    url,
    mimeType: 'video/mp4',
    sizeBytes: stats.size,
    duration,
    dimensions,
  }
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
    location: VERTEX_AI_LOCATION.value(),
  })
}

/**
 * Build an Image reference from a GCS URI for the Veo API
 */
function buildGcsImage(gcsUri: string): Image {
  return {
    gcsUri,
    mimeType: 'image/jpeg',
  }
}

/**
 * Submit a video generation request to Veo
 */
async function submitVeoRequest(
  client: GoogleGenAI,
  request: GenerateVideoRequest,
  outputGcsUri: string,
) {
  const { prompt, model, aspectRatio, duration, startFrameGcsUri, endFrameGcsUri } =
    request

  const startFrame = buildGcsImage(startFrameGcsUri)
  const lastFrame = endFrameGcsUri ? buildGcsImage(endFrameGcsUri) : undefined

  return client.models.generateVideos({
    model,
    prompt,
    image: startFrame,
    config: {
      aspectRatio,
      durationSeconds: duration,
      personGeneration: 'allow_adult',
      numberOfVideos: 1,
      outputGcsUri,
      ...(lastFrame ? { lastFrame } : {}),
    },
  })
}

/**
 * Poll a Veo operation until completion
 *
 * Polls every 15 seconds with a 5-minute timeout.
 */
async function pollOperation(
  client: GoogleGenAI,
  initialOperation: Awaited<ReturnType<GoogleGenAI['models']['generateVideos']>>,
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
  operation: Awaited<ReturnType<GoogleGenAI['operations']['getVideosOperation']>>,
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

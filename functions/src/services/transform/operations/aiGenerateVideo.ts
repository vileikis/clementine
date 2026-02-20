/**
 * AI Video Generation Operation
 *
 * Generates video using Google Veo via the @google/genai SDK.
 * Handles async polling, GCS output download, and cleanup.
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

// Environment configuration for Vertex AI
const VERTEX_AI_LOCATION = defineString('VERTEX_AI_LOCATION', {
  default: 'us-central1',
})

const GOOGLE_CLOUD_PROJECT =
  process.env['GCLOUD_PROJECT'] || process.env['GOOGLE_CLOUD_PROJECT']

// Polling configuration
const POLL_INTERVAL_MS = 15_000 // 15 seconds
const MAX_POLL_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

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
  /** Duration in seconds (4, 6, or 8) */
  duration: 4 | 6 | 8
  /** Local file path to start frame image */
  startFrame: string
  /** Optional local file path to end frame image */
  endFrame?: string
}

/**
 * Result of AI video generation
 */
export interface GeneratedVideo {
  /** Local file path to generated video */
  outputPath: string
  /** MIME type */
  mimeType: string
  /** File size in bytes */
  sizeBytes: number
  /** Actual duration in seconds */
  duration: number
  /** Video dimensions from ffprobe */
  dimensions: { width: number; height: number }
}

/**
 * Generate a video using Google Veo
 *
 * @param request - Video generation parameters
 * @param tmpDir - Temporary directory for output file
 * @param jobId - Job ID for GCS temp path namespacing
 * @returns Generated video result with output path
 */
export async function aiGenerateVideo(
  request: GenerateVideoRequest,
  tmpDir: string,
  jobId: string,
): Promise<GeneratedVideo> {
  const { prompt, model, aspectRatio, duration, startFrame, endFrame } = request

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Cannot generate video with empty prompt')
  }

  if (!GOOGLE_CLOUD_PROJECT) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required')
  }

  logger.info('[AIVideoGenerate] Starting video generation', {
    model,
    aspectRatio,
    duration,
    hasEndFrame: !!endFrame,
    promptLength: prompt.length,
  })

  // Initialize Vertex AI client (Veo requires regional endpoint, NOT global)
  const client = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: VERTEX_AI_LOCATION.value(),
  })

  // Read start frame as base64
  const startFrameImage = await readImageAsBase64(startFrame)

  // Read end frame as base64 if provided
  let lastFrame: Image | undefined
  if (endFrame) {
    lastFrame = await readImageAsBase64(endFrame)
  }

  // Set up GCS output URI for Veo
  const bucket = storage.bucket()
  const gcsPrefix = `tmp/veo-outputs/${jobId}`
  const outputGcsUri = `gs://${bucket.name}/${gcsPrefix}/`

  logger.info('[AIVideoGenerate] Calling Veo API', {
    model,
    outputGcsUri,
    location: VERTEX_AI_LOCATION.value(),
  })

  // Call Veo API
  let operation = await client.models.generateVideos({
    model,
    prompt,
    image: startFrameImage,
    config: {
      aspectRatio,
      durationSeconds: duration,
      personGeneration: 'allow_adult',
      numberOfVideos: 1,
      outputGcsUri,
      ...(lastFrame ? { lastFrame } : {}),
    },
  })

  // Poll until done
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

  // Check for errors
  if (operation.error) {
    throw new Error(
      `Video generation failed: ${operation.error['message'] ?? 'Unknown error'}`,
    )
  }

  // Check for RAI filtering
  const response = operation.response
  if (!response?.generatedVideos || response.generatedVideos.length === 0) {
    throw new Error('Video was filtered by safety policy')
  }

  const generatedVideo = response.generatedVideos[0]
  const videoUri = generatedVideo?.video?.uri

  if (!videoUri) {
    throw new Error('No video URI in generation response')
  }

  logger.info('[AIVideoGenerate] Video generated, downloading from GCS', {
    videoUri,
  })

  // Download video from GCS to local temp
  const outputPath = `${tmpDir}/veo-output-${Date.now()}.mp4`
  const storagePath = parseGcsUri(videoUri, bucket.name)
  await bucket.file(storagePath).download({ destination: outputPath })

  // Best-effort cleanup of temp GCS prefix
  cleanupGcsPrefix(bucket, gcsPrefix).catch((err) => {
    logger.warn('[AIVideoGenerate] Failed to clean up temp GCS files', {
      gcsPrefix,
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  })

  // Get file metadata
  const stats = await fs.stat(outputPath)
  const dimensions = await getMediaDimensions(outputPath)

  logger.info('[AIVideoGenerate] Video generation completed', {
    outputPath,
    sizeBytes: stats.size,
    dimensions,
    duration,
  })

  return {
    outputPath,
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
 * Read an image file and return as base64 Image object for Veo API
 */
async function readImageAsBase64(filePath: string): Promise<Image> {
  const buffer = await fs.readFile(filePath)
  const ext = filePath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg'
  return {
    imageBytes: buffer.toString('base64'),
    mimeType: `image/${ext}`,
  }
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

/**
 * Best-effort cleanup of temp GCS files under a prefix
 */
async function cleanupGcsPrefix(
  bucket: ReturnType<typeof storage.bucket>,
  prefix: string,
): Promise<void> {
  const [files] = await bucket.getFiles({ prefix })
  await Promise.all(files.map((file) => file.delete().catch(() => {})))
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

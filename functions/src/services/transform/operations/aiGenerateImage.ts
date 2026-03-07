/**
 * AI Image Generation Executor
 *
 * Atomic executor for AI image generation using Vertex AI (Gemini).
 * Accepts a GenerationRequest and returns a GeneratedImage.
 *
 * Refactored from the deprecated ai-image.ts node executor.
 */
import { defineString } from 'firebase-functions/params'
import {
  FinishReason,
  GenerateContentResponse,
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  Modality,
  PersonGeneration,
  type Candidate,
  type GenerateContentConfig,
  type Part,
} from '@google/genai'
import { logger } from 'firebase-functions/v2'
import * as fs from 'fs/promises'

import type { MediaReference } from '@clementine/shared'
import type { GenerationRequest, GeneratedImage } from '../types'
import { AiTransformError } from '../../ai/providers/types'
import { logMemoryUsage, retryWithBackoff } from '../helpers'
import { storage } from '../../../infra/firebase-admin'
import { getStoragePathFromMediaReference } from '../../../infra/storage'

// Environment configuration for Vertex AI
const VERTEX_AI_LOCATION = defineString('VERTEX_AI_LOCATION', {
  default: 'us-central1',
})

const GOOGLE_CLOUD_PROJECT =
  process.env['GCLOUD_PROJECT'] || process.env['GOOGLE_CLOUD_PROJECT']

/**
 * Generate an AI image using Vertex AI
 *
 * @param request - Generation request with prompt, model, and media references
 * @param tmpDir - Temporary directory for output file
 * @returns Generated image result with output path
 */
export async function aiGenerateImage(
  request: GenerationRequest,
  tmpDir: string,
  jobId: string,
): Promise<GeneratedImage> {
  const { prompt, model, aspectRatio, sourceMedia, referenceMedia } = request

  // Skip if prompt is empty
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Cannot generate image with empty prompt')
  }

  logger.info('[AIGenerate] Starting AI image generation', {
    model,
    aspectRatio,
    hasSourceMedia: !!sourceMedia,
    refMediaCount: referenceMedia.length,
    promptLength: prompt.length,
  })

  // Build content parts for Gemini API
  const contentParts = await buildContentParts(
    prompt,
    sourceMedia,
    referenceMedia,
  )

  // Initialize Vertex AI client
  const location = getLocationForModel(model)
  if (!GOOGLE_CLOUD_PROJECT) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required')
  }

  const client = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location,
  })

  // Build generation config
  const generationConfig: GenerateContentConfig = {
    maxOutputTokens: 32768,
    temperature: 1,
    topP: 0.95,
    responseModalities: [Modality.IMAGE],
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_IMAGE_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_IMAGE_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
    ],
    imageConfig: {
      aspectRatio,
      outputMimeType: 'image/jpeg',
      personGeneration: PersonGeneration.ALLOW_ALL,
    },
  }

  logger.info('[AIGenerate] Calling Gemini API', {
    model,
    location,
    project: GOOGLE_CLOUD_PROJECT,
  })

  logMemoryUsage('ai-generate-image-start', jobId)

  // Generate image (with retry for 429/503)
  const response = await retryWithBackoff(
    () =>
      client.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: contentParts,
          },
        ],
        config: generationConfig,
      }),
    'AIImageGenerate',
  )

  // Extract image from response
  const imageBuffer = extractImageFromResponse(response)

  // Generate unique output filename
  const outputId = `ai-output-${Date.now()}`
  const outputPath = `${tmpDir}/${outputId}.jpg`

  // Save to temp directory
  await fs.writeFile(outputPath, imageBuffer)

  // Get dimensions from aspect ratio
  const dimensions = getDimensionsFromAspectRatio(aspectRatio)

  logger.info('[AIGenerate] AI image generation completed', {
    outputPath,
    outputSize: imageBuffer.length,
    dimensions,
  })

  return {
    outputPath,
    mimeType: 'image/jpeg',
    sizeBytes: imageBuffer.length,
    dimensions,
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get Vertex AI location for model
 *
 * Some Gemini models require specific locations.
 * Models not listed use the VERTEX_AI_LOCATION env var.
 */
const MODEL_LOCATIONS: Record<string, string> = {
  'gemini-3.1-flash-image-preview': 'global',
}

function getLocationForModel(model: string): string {
  return MODEL_LOCATIONS[model] ?? VERTEX_AI_LOCATION.value()
}

/**
 * Build content parts for Gemini API
 *
 * Constructs the multimodal content array with:
 * 1. Source media (if provided) for image-to-image
 * 2. Reference media with ID labels (excluding sourceMedia to avoid duplicates)
 * 3. Prompt text at the end
 */
async function buildContentParts(
  prompt: string,
  sourceMedia: MediaReference | null,
  referenceMedia: MediaReference[],
): Promise<Part[]> {
  const parts: Part[] = []
  const bucket = storage.bucket()

  // Track added media to avoid duplicates
  const addedMediaIds = new Set<string>()

  // Add source media (for image-to-image transformation)
  if (sourceMedia) {
    parts.push({
      text: `Input Photo ID: <${sourceMedia.displayName}>`,
    })

    const storagePath = getStoragePathFromMediaReference(sourceMedia)
    parts.push({
      fileData: {
        mimeType: 'image/jpeg',
        fileUri: `gs://${bucket.name}/${storagePath}`,
      },
    })

    addedMediaIds.add(sourceMedia.mediaAssetId)
  }

  // Add reference media with ID labels (skip if already added as source)
  for (const ref of referenceMedia) {
    if (addedMediaIds.has(ref.mediaAssetId)) {
      continue
    }

    parts.push({
      text: `Image Reference ID: <${ref.displayName}>`,
    })

    const storagePath = getStoragePathFromMediaReference(ref)
    parts.push({
      fileData: {
        mimeType: 'image/jpeg',
        fileUri: `gs://${bucket.name}/${storagePath}`,
      },
    })

    addedMediaIds.add(ref.mediaAssetId)
  }

  // Add prompt text at the end
  parts.push({ text: prompt })

  return parts
}

/**
 * Extract image buffer from Gemini API response
 */
export function extractImageFromResponse(
  response: GenerateContentResponse,
): Buffer {
  checkPromptBlocked(response)

  const candidate = response.candidates?.[0]
  if (!candidate) {
    throw new Error('No candidates in Gemini API response')
  }

  const result = tryExtractImageBuffer(candidate)
  if (result) {
    return result
  }

  return throwNoImageError(candidate)
}

/**
 * Throw if the prompt was rejected at the request level
 */
export function checkPromptBlocked(response: GenerateContentResponse): void {
  const { blockReason, blockReasonMessage } = response.promptFeedback ?? {}
  if (!blockReason) return

  const message = `Image generation blocked: ${blockReason}${blockReasonMessage ? ` - ${blockReasonMessage}` : ''}`
  const error = new AiTransformError(message, 'SAFETY_FILTERED')
  error.metadata = {
    blockReason,
    ...(blockReasonMessage && { blockReasonMessage }),
  }
  throw error
}

/**
 * Try to extract an image buffer from candidate parts
 */
export function tryExtractImageBuffer(candidate: Candidate): Buffer | null {
  if (!candidate.content?.parts) return null

  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64')
    }
  }

  return null
}

/**
 * Diagnose why no image was returned and throw an appropriate error
 */
/** FinishReason values that indicate safety/policy blocking */
const SAFETY_FINISH_REASONS = new Set([
  FinishReason.SAFETY,
  FinishReason.RECITATION,
  FinishReason.BLOCKLIST,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.SPII,
  FinishReason.IMAGE_SAFETY,
  FinishReason.IMAGE_PROHIBITED_CONTENT,
  FinishReason.IMAGE_RECITATION,
])

export function throwNoImageError(candidate: Candidate): never {
  const { finishReason } = candidate
  if (finishReason && SAFETY_FINISH_REASONS.has(finishReason)) {
    const blockedRatings = candidate.safetyRatings?.filter((r) => r.blocked)
    const message = `Image generation blocked: finishReason=${finishReason}`
    const error = new AiTransformError(message, 'SAFETY_FILTERED')
    error.metadata = {
      finishReason,
      ...(blockedRatings?.length && { safetyRatings: blockedRatings }),
    }
    throw error
  }

  throw new Error('No image data in Gemini API response')
}

/**
 * Get output dimensions from aspect ratio
 *
 * Maps aspect ratios to actual pixel dimensions.
 * These are the default output dimensions for Gemini image generation.
 */
function getDimensionsFromAspectRatio(aspectRatio: string): {
  width: number
  height: number
} {
  const dimensionMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '3:2': { width: 1536, height: 1024 },
    '2:3': { width: 1024, height: 1536 },
    '16:9': { width: 1792, height: 1024 },
    '9:16': { width: 1024, height: 1792 },
  }

  return dimensionMap[aspectRatio] ?? { width: 1024, height: 1024 }
}

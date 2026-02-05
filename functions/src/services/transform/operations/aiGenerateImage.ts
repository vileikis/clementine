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
  GenerateContentResponse,
  GoogleGenAI,
  Modality,
  type GenerateContentConfig,
  type Part,
} from '@google/genai'
import { logger } from 'firebase-functions/v2'
import * as fs from 'fs/promises'

import type { MediaReference } from '@clementine/shared'
import type { GenerationRequest, GeneratedImage } from '../types'
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
    imageConfig: {
      aspectRatio,
      outputMimeType: 'image/jpeg',
    },
  }

  logger.info('[AIGenerate] Calling Gemini API', {
    model,
    location,
    project: GOOGLE_CLOUD_PROJECT,
  })

  // Generate image
  const response = await client.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: contentParts,
      },
    ],
    config: generationConfig,
  })

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
 * Some Gemini models require specific locations:
 * - gemini-2.5-flash-image: Uses VERTEX_AI_LOCATION env var
 * - gemini-3-pro-image-preview: Requires "global" location
 */
function getLocationForModel(model: string): string {
  if (model === 'gemini-3-pro-image-preview') {
    return 'global'
  }
  return VERTEX_AI_LOCATION.value()
}

/**
 * Build content parts for Gemini API
 *
 * Constructs the multimodal content array with:
 * 1. Source media (if provided) for image-to-image
 * 2. Reference media with ID labels
 * 3. Prompt text at the end
 */
async function buildContentParts(
  prompt: string,
  sourceMedia: MediaReference | null,
  referenceMedia: MediaReference[],
): Promise<Part[]> {
  const parts: Part[] = []
  const bucket = storage.bucket()

  // Add source media (for image-to-image transformation)
  if (sourceMedia) {
    parts.push({
      text: 'Image Reference ID: <source_image>',
    })

    const storagePath = getStoragePathFromMediaReference(sourceMedia)
    parts.push({
      fileData: {
        mimeType: 'image/jpeg',
        fileUri: `gs://${bucket.name}/${storagePath}`,
      },
    })
  }

  // Add reference media with ID labels
  for (const ref of referenceMedia) {
    parts.push({
      text: `Image Reference ID: <ref_${ref.displayName}>`,
    })

    const storagePath = getStoragePathFromMediaReference(ref)
    parts.push({
      fileData: {
        mimeType: 'image/jpeg',
        fileUri: `gs://${bucket.name}/${storagePath}`,
      },
    })
  }

  // Add prompt text at the end
  parts.push({ text: prompt })

  return parts
}

/**
 * Extract image buffer from Gemini API response
 */
function extractImageFromResponse(response: GenerateContentResponse): Buffer {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No candidates in Gemini API response')
  }

  const candidate = response.candidates[0]
  if (!candidate?.content?.parts) {
    throw new Error('No content parts in Gemini API response')
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64')
    }
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

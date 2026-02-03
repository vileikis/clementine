/**
 * AI Image Node Executor
 *
 * Executes ai.imageGeneration transform nodes using Vertex AI (Gemini).
 * Handles prompt resolution, media collection, and AI generation.
 */
import { defineString } from 'firebase-functions/params'
import {
  GoogleGenAI,
  Modality,
  type GenerateContentConfig,
  type Part,
} from '@google/genai'
import { logger } from 'firebase-functions/v2'
import * as fs from 'fs/promises'

import type {
  AIImageNode,
  CapturedMedia,
  MediaReference,
  Answer,
} from '@clementine/shared'
import type { PipelineContext, NodeResult } from '../types'
import { storage } from '../../../infra/firebase-admin'
import { getStoragePathFromMediaReference, parseStorageUrl } from '../../../infra/storage'

// Environment configuration for Vertex AI
const VERTEX_AI_LOCATION = defineString('VERTEX_AI_LOCATION', {
  default: 'us-central1',
})

const GOOGLE_CLOUD_PROJECT =
  process.env['GCLOUD_PROJECT'] || process.env['GOOGLE_CLOUD_PROJECT']

/**
 * Execute AI image generation node
 *
 * Transforms images using Google's Gemini models via Vertex AI.
 * Supports prompt templates with step placeholders and reference media.
 *
 * @param node - AI image node configuration
 * @param context - Pipeline execution context
 * @returns Node result with output path
 */
export async function executeAIImageNode(
  node: AIImageNode,
  context: PipelineContext
): Promise<NodeResult> {
  const { config } = node
  const { snapshot, tmpDir } = context

  // Skip if prompt is empty
  if (!config.prompt || config.prompt.trim().length === 0) {
    logger.info('[AIImage] Skipping node with empty prompt', { nodeId: node.id })
    throw new Error('AI image node has empty prompt')
  }

  logger.info('[AIImage] Starting AI image generation', {
    nodeId: node.id,
    model: config.model,
    aspectRatio: config.aspectRatio,
    refMediaCount: config.refMedia.length,
  })

  // Resolve prompt with step placeholders
  const resolvedPrompt = resolvePrompt(
    config.prompt,
    snapshot.sessionInputs.answers
  )

  // Build content parts for Gemini API
  const contentParts = await buildContentParts(
    resolvedPrompt,
    snapshot.sessionInputs.capturedMedia,
    config.refMedia
  )

  // Initialize Vertex AI client
  const location = getLocationForModel(config.model)

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
      aspectRatio: config.aspectRatio,
      outputMimeType: 'image/png',
    },
  }

  logger.info('[AIImage] Calling Gemini API', {
    model: config.model,
    location,
    project: GOOGLE_CLOUD_PROJECT,
  })

  // Generate image
  const response = await client.models.generateContent({
    model: config.model,
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

  // Save to temp directory
  const outputPath = `${tmpDir}/ai-output-${node.id}.png`
  await fs.writeFile(outputPath, imageBuffer)

  logger.info('[AIImage] AI image generation completed', {
    nodeId: node.id,
    outputPath,
    outputSize: imageBuffer.length,
  })

  return {
    outputPath,
    mimeType: 'image/png',
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

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
 * Resolve prompt template with step placeholders
 *
 * Replaces @{step:stepId} placeholders with actual answer values.
 */
function resolvePrompt(prompt: string, answers: Answer[]): string {
  const stepPattern = /@\{step:([^}]+)\}/g

  return prompt.replace(stepPattern, (match, stepId) => {
    const answer = answers.find((a) => a.stepId === stepId)
    if (!answer) {
      logger.warn('[AIImage] No answer found for step placeholder', {
        stepId,
        placeholder: match,
      })
      return match // Keep original if not found
    }

    // Convert answer value to string
    if (Array.isArray(answer.value)) {
      return answer.value.join(', ')
    }
    return String(answer.value)
  })
}

/**
 * Build content parts for Gemini API
 *
 * Constructs the multimodal content array with:
 * 1. Captured media with ID labels
 * 2. Reference media with ID labels
 * 3. Prompt text at the end
 */
async function buildContentParts(
  prompt: string,
  capturedMedia: CapturedMedia[],
  refMedia: MediaReference[]
): Promise<Part[]> {
  const parts: Part[] = []
  const bucket = storage.bucket()

  // Add captured media with ID labels
  for (const media of capturedMedia) {
    parts.push({
      text: `Image Reference ID: <captured_${media.stepId}>`,
    })

    const storagePath = parseStorageUrl(media.url)
    parts.push({
      fileData: {
        mimeType: 'image/jpeg',
        fileUri: `gs://${bucket.name}/${storagePath}`,
      },
    })
  }

  // Add reference media with ID labels
  for (const ref of refMedia) {
    parts.push({
      text: `Image Reference ID: <ref_${ref.mediaAssetId}>`,
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
function extractImageFromResponse(response: any): Buffer {
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

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
  type ContentListUnion,
  type Part,
} from '@google/genai'
import { logger } from 'firebase-functions/v2'
import * as fs from 'fs/promises'

import type {
  TransformNode,
  AIImageNode,
  CapturedMedia,
  MediaReference,
  Answer,
} from '@clementine/shared'
import { AI_IMAGE_NODE_TYPE } from '@clementine/shared'
import type { NodeExecutor, ExecutionContext, NodeExecutionResult } from '../node-executor'
import { storage } from '../../../infra/firebase-admin'
import { getStoragePathFromMediaReference, parseStorageUrl } from '../../../infra/storage'

// Environment configuration for Vertex AI
const VERTEX_AI_LOCATION = defineString('VERTEX_AI_LOCATION', {
  default: 'us-central1',
})

const GOOGLE_CLOUD_PROJECT =
  process.env['GCLOUD_PROJECT'] || process.env['GOOGLE_CLOUD_PROJECT']

/**
 * Model-specific location mapping
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
 * AI Image Node Executor
 *
 * Transforms images using Google's Gemini models via Vertex AI.
 * Supports prompt templates with step placeholders and reference media.
 */
export class AIImageExecutor implements NodeExecutor {
  canHandle(nodeType: string): boolean {
    return nodeType === AI_IMAGE_NODE_TYPE
  }

  async execute(
    inputPath: string,
    node: TransformNode,
    context: ExecutionContext,
    tmpDir: string
  ): Promise<NodeExecutionResult> {
    // Type guard - ensure we have an AI image node
    if (node.type !== AI_IMAGE_NODE_TYPE) {
      throw new Error(`AIImageExecutor cannot handle node type: ${node.type}`)
    }

    const aiNode = node as AIImageNode
    const { config } = aiNode
    const { snapshot } = context

    // Skip if prompt is empty
    if (!config.prompt || config.prompt.trim().length === 0) {
      logger.info('[AIImageExecutor] Skipping node with empty prompt', {
        nodeId: node.id,
      })
      // Return input as output (pass-through)
      return {
        outputPath: inputPath,
        mimeType: 'image/jpeg',
      }
    }

    logger.info('[AIImageExecutor] Starting AI image generation', {
      nodeId: node.id,
      model: config.model,
      aspectRatio: config.aspectRatio,
      refMediaCount: config.refMedia.length,
    })

    // Resolve prompt with step placeholders
    const resolvedPrompt = this.resolvePrompt(
      config.prompt,
      snapshot.sessionInputs.answers,
      snapshot.sessionInputs.capturedMedia
    )

    // Build content parts for Gemini API
    const contentParts = await this.buildContentParts(
      inputPath,
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

    logger.info('[AIImageExecutor] Calling Gemini API', {
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
    const imageBuffer = this.extractImageFromResponse(response)

    // Save to temp directory
    const outputPath = `${tmpDir}/ai-output-${node.id}.png`
    await fs.writeFile(outputPath, imageBuffer)

    logger.info('[AIImageExecutor] AI image generation completed', {
      nodeId: node.id,
      outputPath,
      outputSize: imageBuffer.length,
    })

    return {
      outputPath,
      mimeType: 'image/png',
    }
  }

  /**
   * Resolve prompt template with step placeholders
   *
   * Replaces @{step:stepId} placeholders with actual answer values.
   *
   * @param prompt - Prompt template with placeholders
   * @param answers - Session answers
   * @param capturedMedia - Session captured media
   * @returns Resolved prompt string
   */
  private resolvePrompt(
    prompt: string,
    answers: Answer[],
    capturedMedia: CapturedMedia[]
  ): string {
    let resolved = prompt

    // Replace @{step:stepId} with answer values
    const stepPattern = /@\{step:([^}]+)\}/g
    resolved = resolved.replace(stepPattern, (match, stepId) => {
      const answer = answers.find((a) => a.stepId === stepId)
      if (!answer) {
        logger.warn('[AIImageExecutor] No answer found for step placeholder', {
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

    return resolved
  }

  /**
   * Build content parts for Gemini API
   *
   * Constructs the multimodal content array with:
   * 1. Captured media with ID labels
   * 2. Reference media with ID labels
   * 3. Prompt text at the end
   *
   * @param inputPath - Path to primary input image
   * @param prompt - Resolved prompt text
   * @param capturedMedia - Session captured media
   * @param refMedia - Node reference media configuration
   * @returns Content parts array for Gemini API
   */
  private async buildContentParts(
    inputPath: string,
    prompt: string,
    capturedMedia: CapturedMedia[],
    refMedia: MediaReference[]
  ): Promise<Part[]> {
    const parts: Part[] = []
    const bucket = storage.bucket()

    // Add captured media with ID labels
    for (const media of capturedMedia) {
      // Add text label for the captured media
      parts.push({
        text: `Image Reference ID: <captured_${media.stepId}>`,
      })

      // Add the image using fileData (gs:// URL)
      // CapturedMedia only has url, not filePath, so we parse the URL
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
      // Add text label for the reference media
      parts.push({
        text: `Image Reference ID: <ref_${ref.mediaAssetId}>`,
      })

      // Get storage path from MediaReference (uses filePath if available)
      const storagePath = getStoragePathFromMediaReference(ref)
      parts.push({
        fileData: {
          mimeType: 'image/jpeg',
          fileUri: `gs://${bucket.name}/${storagePath}`,
        },
      })
    }

    // Add prompt text at the end
    parts.push({
      text: prompt,
    })

    return parts
  }

  /**
   * Extract image buffer from Gemini API response
   *
   * @param response - Gemini API response
   * @returns Image buffer
   * @throws Error if no valid image data found
   */
  private extractImageFromResponse(response: any): Buffer {
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
}

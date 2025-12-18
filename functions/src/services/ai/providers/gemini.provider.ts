/**
 * Google Gemini AI Provider
 *
 * Implementation of AiProvider interface using Google's Gemini API
 * for image-to-image transformation via the @google/genai SDK.
 */

import { GoogleGenAI } from '@google/genai';
import type { AiProvider, AiTransformConfig } from './types';
import { AiTransformError } from './types';
import { logger } from 'firebase-functions/v2';

/**
 * Google Gemini provider for AI image transformation
 *
 * Uses Gemini 2.0+ models with multimodal capabilities to transform
 * images based on text prompts and reference images.
 */
export class GoogleGeminiProvider implements AiProvider {
  private client: GoogleGenAI;

  /**
   * Initialize Gemini provider with API key
   *
   * @param apiKey - Google AI API key from Firebase Params
   */
  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new AiTransformError(
        'Google AI API key is required',
        'INVALID_CONFIG'
      );
    }

    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Transform an image using Google Gemini
   *
   * @param inputBuffer - Input image as buffer (JPEG/PNG)
   * @param config - AI transformation configuration
   * @param referenceImageBuffers - Reference images as buffers (for style transfer)
   * @returns Transformed image as buffer (JPEG)
   * @throws {AiTransformError} If transformation fails
   */
  async transformImage(
    inputBuffer: Buffer,
    config: AiTransformConfig,
    referenceImageBuffers?: Buffer[]
  ): Promise<Buffer> {
    const startTime = Date.now();

    try {
      // Validate inputs
      this.validateInputBuffer(inputBuffer);
      this.validateConfig(config);

      // Log transformation start
      logger.info('[Gemini] Starting image transformation', {
        model: config.model,
        inputSize: inputBuffer.length,
        referenceImageCount: referenceImageBuffers?.length || 0,
        aspectRatio: config.aspectRatio,
        imageSize: config.imageSize,
      });

      // Prepare request
      const contentParts = this.buildContentParts(inputBuffer, config, referenceImageBuffers);
      const generationConfig = this.buildGenerationConfig(config);

      console.log('[Gemini] Generation config:', JSON.stringify(generationConfig, null, 2));

      // Call Gemini API
      const response = await this.client.models.generateContent({
        model: config.model,
        contents: contentParts,
        config: generationConfig,
      });

      // Extract result
      const transformedBuffer = this.extractImageFromResponse(response);

      // Log transformation completion
      const duration = Date.now() - startTime;
      logger.info('[Gemini] Image transformation completed', {
        model: config.model,
        duration,
        outputSize: transformedBuffer.length,
      });

      return transformedBuffer;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Re-throw if already AiTransformError
      if (error instanceof AiTransformError) {
        logger.error('[Gemini] Transformation failed', {
          code: error.code,
          message: error.message,
          duration,
        });
        throw error;
      }

      // Wrap other errors as API_ERROR
      logger.error('[Gemini] API error during transformation', {
        error: error instanceof Error ? error.message : String(error),
        duration,
      });

      throw new AiTransformError(
        `Gemini API error: ${error instanceof Error ? error.message : String(error)}`,
        'API_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate input buffer
   *
   * @param inputBuffer - Input image buffer to validate
   * @throws {AiTransformError} If buffer is invalid
   */
  private validateInputBuffer(inputBuffer: Buffer): void {
    if (!inputBuffer || inputBuffer.length === 0) {
      throw new AiTransformError(
        'Input image buffer is empty',
        'INVALID_INPUT_IMAGE'
      );
    }
  }

  /**
   * Build content parts for Gemini API request
   *
   * Constructs the multimodal content array with reference images (if any),
   * input image, and prompt text in the correct order for optimal results.
   *
   * @param inputBuffer - Input image buffer
   * @param config - AI transformation configuration
   * @param referenceImageBuffers - Optional reference image buffers
   * @returns Array of content parts for Gemini API
   */
  private buildContentParts(
    inputBuffer: Buffer,
    config: AiTransformConfig,
    referenceImageBuffers?: Buffer[]
  ): Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> {
    const contentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    // Add reference images first (for style guidance)
    if (referenceImageBuffers && referenceImageBuffers.length > 0) {
      for (const refBuffer of referenceImageBuffers) {
        contentParts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: refBuffer.toString('base64'),
          },
        });
      }
    }

    // Add input image
    contentParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: inputBuffer.toString('base64'),
      },
    });

    // Add prompt text
    contentParts.push({
      text: config.prompt,
    });

    return contentParts;
  }

  /**
   * Build generation configuration for Gemini API
   *
   * Constructs the generation config including candidate count, temperature,
   * and image-specific settings (aspect ratio, image size).
   *
   * @param config - AI transformation configuration
   * @returns Generation config object for Gemini API
   */
  private buildGenerationConfig(config: AiTransformConfig): Record<string, any> {
    const generationConfig: Record<string, any> = {
      candidateCount: 1,
    };

    // Add temperature if specified
    if (config.temperature !== undefined) {
      generationConfig['temperature'] = config.temperature;
    }

    // Build image config
    const imageConfig: Record<string, string> = {};
    if (config.aspectRatio) {
      imageConfig['aspectRatio'] = config.aspectRatio;
    }
    if (config.imageSize) {
      imageConfig['imageSize'] = config.imageSize;
    }

    // Add imageConfig to generation config if not empty
    if (Object.keys(imageConfig).length > 0) {
      generationConfig['imageConfig'] = imageConfig;
    }

    return generationConfig;
  }

  /**
   * Extract image from Gemini API response
   *
   * Validates response structure and extracts the base64-encoded image data
   * from the response candidates.
   *
   * @param response - Gemini API response
   * @returns Transformed image as buffer
   * @throws {AiTransformError} If response is invalid or missing image data
   */
  private extractImageFromResponse(response: any): Buffer {
    // Validate response has candidates
    if (!response.candidates || response.candidates.length === 0) {
      throw new AiTransformError(
        'No candidates in Gemini API response',
        'API_ERROR'
      );
    }

    // Validate candidate structure
    const candidate = response.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      throw new AiTransformError(
        'No content parts in Gemini API response',
        'API_ERROR'
      );
    }

    // Find the image part in the response
    let imageData: string | undefined;
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        imageData = part.inlineData.data;
        break;
      }
    }

    if (!imageData) {
      throw new AiTransformError(
        'No image data in Gemini API response',
        'API_ERROR'
      );
    }

    // Convert base64 image data to buffer
    return Buffer.from(imageData, 'base64');
  }

  /**
   * Validate AI transformation config
   *
   * @param config - Config to validate
   * @throws {AiTransformError} If config is invalid
   */
  private validateConfig(config: AiTransformConfig): void {
    if (!config.model || config.model.trim().length === 0) {
      throw new AiTransformError(
        'Model name is required in AI config',
        'INVALID_CONFIG'
      );
    }

    if (!config.prompt || config.prompt.trim().length === 0) {
      throw new AiTransformError(
        'Prompt is required in AI config',
        'INVALID_CONFIG'
      );
    }

    if (!Array.isArray(config.referenceImages)) {
      throw new AiTransformError(
        'Reference images must be an array',
        'INVALID_CONFIG'
      );
    }
  }
}

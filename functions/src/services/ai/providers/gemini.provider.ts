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
   * @returns Transformed image as buffer (JPEG)
   * @throws {AiTransformError} If transformation fails
   */
  async transformImage(
    inputBuffer: Buffer,
    config: AiTransformConfig
  ): Promise<Buffer> {
    const startTime = Date.now();

    try {
      // Validate input buffer
      if (!inputBuffer || inputBuffer.length === 0) {
        throw new AiTransformError(
          'Input image buffer is empty',
          'INVALID_INPUT_IMAGE'
        );
      }

      // Validate config
      this.validateConfig(config);

      logger.info('[Gemini] Starting image transformation', {
        model: config.model,
        inputSize: inputBuffer.length,
        referenceImageCount: config.referenceImages.length,
      });

      // For mocked implementation, we'll return the input buffer as-is
      // In production, this will call the actual Gemini API:
      //
      // const model = this.client.models.generateContent({
      //   model: config.model,
      //   contents: [
      //     { inlineData: { data: inputBuffer.toString('base64'), mimeType: 'image/jpeg' } },
      //     { text: config.prompt },
      //     ...referenceImages as inline data
      //   ],
      //   generationConfig: {
      //     temperature: config.temperature,
      //     maxOutputTokens: config.maxOutputTokens,
      //   }
      // });
      //
      // const result = await model;
      // const transformedBuffer = Buffer.from(result.image, 'base64');

      // MOCKED RESPONSE: Return input buffer as placeholder
      // TODO: Replace with actual Gemini API call when ready for production
      const transformedBuffer = inputBuffer;

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

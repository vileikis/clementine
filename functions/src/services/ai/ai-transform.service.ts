/**
 * AI Transform Service
 *
 * Orchestrates AI image transformation workflow:
 * 1. Validates configuration
 * 2. Loads reference images from Firebase Storage
 * 3. Delegates to AI provider (Gemini)
 * 4. Handles errors and retries
 */

import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions/v2';
import { GoogleGeminiProvider } from './providers/gemini.provider';
import type { AiTransformConfig } from './providers/types';
import { AiTransformError } from './providers/types';

/**
 * Transform an image using AI provider with reference images
 *
 * This is the main orchestration function that:
 * - Validates AI configuration
 * - Loads reference images from Firebase Storage
 * - Calls the AI provider (currently Gemini)
 * - Returns transformed image buffer
 *
 * @param inputBuffer - Input image as buffer (JPEG/PNG)
 * @param config - AI transformation configuration
 * @param apiKey - Google AI API key from Firebase Params
 * @returns Transformed image as buffer (JPEG)
 * @throws {AiTransformError} If transformation fails
 */
export async function transformImage(
  inputBuffer: Buffer,
  config: AiTransformConfig,
  apiKey: string
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
    validateConfig(config);

    logger.info('[AI Transform] Starting transformation', {
      provider: config.provider,
      model: config.model,
      inputSize: inputBuffer.length,
      referenceImageCount: config.referenceImages.length,
    });

    // Load reference images from Firebase Storage
    const referenceImageBuffers = await loadReferenceImages(config.referenceImages);

    logger.info('[AI Transform] Reference images loaded', {
      count: referenceImageBuffers.length,
      totalSize: referenceImageBuffers.reduce((sum, buf) => sum + buf.length, 0),
    });

    // Instantiate AI provider
    const provider = createProvider(config.provider, apiKey);

    // Transform image (pass reference image buffers)
    const transformedBuffer = await provider.transformImage(
      inputBuffer,
      config,
      referenceImageBuffers
    );

    const duration = Date.now() - startTime;
    logger.info('[AI Transform] Transformation completed', {
      duration,
      outputSize: transformedBuffer.length,
    });

    return transformedBuffer;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Re-throw if already AiTransformError
    if (error instanceof AiTransformError) {
      logger.error('[AI Transform] Transformation failed', {
        code: error.code,
        message: error.message,
        duration,
      });
      throw error;
    }

    // Wrap other errors
    logger.error('[AI Transform] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    throw new AiTransformError(
      `AI transformation failed: ${error instanceof Error ? error.message : String(error)}`,
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
function validateConfig(config: AiTransformConfig): void {
  if (!config.provider) {
    throw new AiTransformError(
      'AI provider is required in config',
      'INVALID_CONFIG'
    );
  }

  if (!config.model || config.model.trim().length === 0) {
    throw new AiTransformError(
      'Model name is required in config',
      'INVALID_CONFIG'
    );
  }

  if (!config.prompt || config.prompt.trim().length === 0) {
    throw new AiTransformError(
      'Prompt is required in config',
      'INVALID_CONFIG'
    );
  }

  if (!Array.isArray(config.referenceImages)) {
    throw new AiTransformError(
      'Reference images must be an array',
      'INVALID_CONFIG'
    );
  }

  // Validate reference image paths
  for (const imagePath of config.referenceImages) {
    if (!imagePath || imagePath.trim().length === 0) {
      throw new AiTransformError(
        'Reference image path cannot be empty',
        'INVALID_CONFIG'
      );
    }

    // Basic path format validation (media/{companyId}/ai-reference/{filename})
    if (!imagePath.startsWith('media/') || !imagePath.includes('/ai-reference/')) {
      throw new AiTransformError(
        `Invalid reference image path format: ${imagePath}. Expected: media/{companyId}/ai-reference/{filename}`,
        'INVALID_CONFIG'
      );
    }
  }
}

/**
 * Load reference images from Firebase Storage
 *
 * @param paths - Array of Firebase Storage paths
 * @returns Array of image buffers
 * @throws {AiTransformError} If any image is not found
 */
async function loadReferenceImages(paths: string[]): Promise<Buffer[]> {
  const storage = getStorage();
  const bucket = storage.bucket();

  const buffers: Buffer[] = [];

  for (const path of paths) {
    try {
      const file = bucket.file(path);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new AiTransformError(
          `Reference image not found: ${path}`,
          'REFERENCE_IMAGE_NOT_FOUND'
        );
      }

      // Download file to buffer
      const [buffer] = await file.download();
      buffers.push(buffer);

      logger.debug('[AI Transform] Reference image loaded', {
        path,
        size: buffer.length,
      });
    } catch (error) {
      // Re-throw if already AiTransformError
      if (error instanceof AiTransformError) {
        throw error;
      }

      // Wrap other errors
      throw new AiTransformError(
        `Failed to load reference image ${path}: ${error instanceof Error ? error.message : String(error)}`,
        'REFERENCE_IMAGE_NOT_FOUND',
        error instanceof Error ? error : undefined
      );
    }
  }

  return buffers;
}

/**
 * Create AI provider instance
 *
 * @param provider - Provider name
 * @param apiKey - API key for the provider
 * @returns Provider instance
 * @throws {AiTransformError} If provider is not supported
 */
function createProvider(provider: string, apiKey: string): GoogleGeminiProvider {
  if (provider !== 'google') {
    throw new AiTransformError(
      `Unsupported AI provider: ${provider}. Only 'google' is currently supported.`,
      'INVALID_CONFIG'
    );
  }

  return new GoogleGeminiProvider(apiKey);
}

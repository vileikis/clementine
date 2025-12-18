import * as fs from 'fs/promises';
import { defineSecret } from 'firebase-functions/params';
import { transformImage } from '../ai';
import { AiTransformError } from '../ai/providers/types';
import type { AiTransformConfig } from '../ai/providers/types';

/**
 * AI Transform Step for Media Pipeline
 *
 * Handles AI-powered image transformation as a discrete pipeline step.
 * Encapsulates AI transform logic with error handling and buffer management.
 */

/**
 * Google AI API key secret (Firebase Params)
 * Exported so Cloud Function can declare dependency in config
 */
export const GOOGLE_AI_API_KEY_SECRET = defineSecret('GOOGLE_AI_API_KEY');

/**
 * Apply AI transformation to an input image
 *
 * @param inputPath - Path to input image file
 * @param tmpDir - Temporary directory for output file
 * @param config - AI transformation configuration (including aspectRatio, imageSize, etc.)
 * @returns Path to transformed image file
 * @throws {AiTransformError} If transformation fails
 */
export async function applyAiTransform(
  inputPath: string,
  tmpDir: string,
  config: AiTransformConfig
): Promise<string> {
  // Get API key from secret (defined at module level)
  const apiKey = GOOGLE_AI_API_KEY_SECRET.value();

  // Validate API key
  if (!apiKey || apiKey.trim().length === 0) {
    throw new AiTransformError(
      'GOOGLE_AI_API_KEY is required for AI transformation',
      'INVALID_CONFIG'
    );
  }

  // Read input image as buffer
  const inputBuffer = await fs.readFile(inputPath);

  // Transform image using AI service
  const transformedBuffer = await transformImage(
    inputBuffer,
    config,
    apiKey
  );

  // Write transformed buffer to new file
  const transformedPath = `${tmpDir}/transformed.jpg`;
  await fs.writeFile(transformedPath, transformedBuffer);

  return transformedPath;
}

/**
 * Map AI transformation errors to session error codes
 *
 * Pure function that maps AiTransformError codes to session error codes.
 * Session management should be done by the caller (pipeline).
 *
 * @param error - Error from AI transformation
 * @returns Object with errorCode and errorMessage for session management
 */
export function mapAiTransformError(error: unknown): {
  errorCode: string;
  errorMessage: string;
} {
  let errorCode = 'AI_TRANSFORM_FAILED';
  let errorMessage = 'AI transformation failed';

  if (error instanceof AiTransformError) {
    // Map specific AI error codes to session error codes
    switch (error.code) {
      case 'REFERENCE_IMAGE_NOT_FOUND':
        errorCode = 'REFERENCE_IMAGE_NOT_FOUND';
        errorMessage = `Reference image not found: ${error.message}`;
        break;
      case 'INVALID_CONFIG':
        errorCode = 'AI_CONFIG_INVALID';
        errorMessage = `Invalid AI config: ${error.message}`;
        break;
      case 'API_ERROR':
      case 'INVALID_INPUT_IMAGE':
      case 'TIMEOUT':
      default:
        errorCode = 'AI_TRANSFORM_FAILED';
        errorMessage = `AI transformation failed: ${error.message}`;
        break;
    }
  } else if (error instanceof Error) {
    errorMessage = `AI transformation failed: ${error.message}`;
  }

  return { errorCode, errorMessage };
}

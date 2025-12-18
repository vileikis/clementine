import * as fs from 'fs/promises';
import { defineSecret } from 'firebase-functions/params';
import { updateProcessingStep, markSessionFailed } from '../../lib/session';
import { transformImage, MOCKED_AI_CONFIG } from '../ai';
import { AiTransformError } from '../ai/providers/types';

/**
 * AI Transform Step for Media Pipeline
 *
 * Handles AI-powered image transformation as a discrete pipeline step.
 * Encapsulates all AI transform logic including state updates, error handling,
 * and buffer management.
 */

/**
 * Google AI API key secret (Firebase Params)
 * Exported so Cloud Function can declare dependency in config
 */
export const GOOGLE_AI_API_KEY_SECRET = defineSecret('GOOGLE_AI_API_KEY');

/**
 * Apply AI transformation to an input image
 *
 * @param sessionId - Session document ID for state tracking
 * @param inputPath - Path to input image file
 * @param tmpDir - Temporary directory for output file
 * @returns Path to transformed image file
 * @throws {AiTransformError} If transformation fails
 */
export async function applyAiTransform(
  sessionId: string,
  inputPath: string,
  tmpDir: string
): Promise<string> {
  // Update session state to 'ai-transform'
  await updateProcessingStep(sessionId, 'ai-transform');

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
    MOCKED_AI_CONFIG,
    apiKey
  );

  // Write transformed buffer to new file
  const transformedPath = `${tmpDir}/transformed.jpg`;
  await fs.writeFile(transformedPath, transformedBuffer);

  return transformedPath;
}

/**
 * Handle AI transformation errors with specific error code mapping
 *
 * Maps AiTransformError codes to session error codes and marks session as failed.
 * Re-throws error to trigger Cloud Tasks retry mechanism.
 *
 * @param error - Error from AI transformation
 * @param sessionId - Session document ID
 * @throws Always re-throws the error after marking session failed
 */
export async function handleAiTransformError(
  error: unknown,
  sessionId: string
): Promise<never> {
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

  // Mark session as failed
  await markSessionFailed(sessionId, errorCode, errorMessage);

  // Re-throw error to trigger Cloud Tasks retry
  throw error;
}

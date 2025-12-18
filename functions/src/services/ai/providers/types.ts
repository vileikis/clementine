/**
 * AI Transform Types
 *
 * Type definitions for AI image transformation services.
 * Supports multiple AI providers with a unified interface.
 */

/**
 * Configuration for AI image transformation
 */
export interface AiTransformConfig {
  /** AI provider identifier (currently only 'google' supported) */
  provider: 'google';

  /** Model name (e.g., 'gemini-3-pro-image-preview', 'gemini-2.5-flash') */
  model: string;

  /** Transformation prompt describing desired output */
  prompt: string;

  /** Firebase Storage paths to reference images (NOT URLs) */
  referenceImages: string[];

  /** Optional: Model temperature (0 = deterministic, 1 = creative) */
  temperature?: number;

  /** Optional: Max tokens for response */
  maxOutputTokens?: number;

  /** Optional: Aspect ratio for generated images (e.g., '1:1', '9:16', '16:9') */
  aspectRatio?: string;

  /** Optional: Size of generated images ('1K', '2K', '4K') */
  imageSize?: string;
}

/**
 * Contract for AI transformation service implementations
 */
export interface AiProvider {
  /**
   * Transform an image using AI
   *
   * @param inputBuffer - Input image as buffer (JPEG/PNG)
   * @param config - AI transformation configuration
   * @param referenceImageBuffers - Reference images as buffers (loaded from Storage)
   * @returns Transformed image as buffer (JPEG)
   * @throws {AiTransformError} If transformation fails
   */
  transformImage(
    inputBuffer: Buffer,
    config: AiTransformConfig,
    referenceImageBuffers?: Buffer[]
  ): Promise<Buffer>;
}

/**
 * Error codes for AI transformation failures
 */
export type AiTransformErrorCode =
  | 'API_ERROR'                 // Gemini API failure
  | 'INVALID_CONFIG'            // Config validation failed
  | 'REFERENCE_IMAGE_NOT_FOUND' // Reference image missing
  | 'INVALID_INPUT_IMAGE'       // Input buffer corrupt/invalid
  | 'TIMEOUT';                  // Transformation exceeded timeout

/**
 * Typed error for AI transformation failures
 */
export class AiTransformError extends Error {
  constructor(
    message: string,
    public code: AiTransformErrorCode,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AiTransformError';

    // Maintain proper stack trace (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AiTransformError);
    }
  }
}

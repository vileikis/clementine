/**
 * Contract: Step Playground Server Action
 *
 * This contract defines the interface for the generateStepPreview server action.
 * The actual implementation will be in web/src/features/steps/actions/step-playground.ts
 *
 * @feature 019-ai-transform-playground
 */

import { z } from 'zod';

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Input schema for step playground generation.
 * Validates the step ID and test image before processing.
 */
export const stepPlaygroundInputSchema = z.object({
  /**
   * The ID of the step to use for generation.
   * Must be an ai-transform step type.
   */
  stepId: z.string().min(1, 'Step ID is required'),

  /**
   * The test image as a base64 data URL.
   * Must be a valid image data URL (JPEG, PNG, or WebP).
   * Max size: 10MB (validated client-side before sending).
   */
  testImageBase64: z
    .string()
    .min(1, 'Test image is required')
    .refine(
      (val) => val.startsWith('data:image/'),
      'Test image must be a valid image data URL'
    ),
});

export type StepPlaygroundInput = z.infer<typeof stepPlaygroundInputSchema>;

// ============================================================================
// Output Schema
// ============================================================================

/**
 * Output schema for successful playground generation.
 */
export const stepPlaygroundOutputSchema = z.object({
  /**
   * The generated image as a base64 data URL.
   * Format: data:image/jpeg;base64,...
   */
  resultImageBase64: z.string(),

  /**
   * Time taken for generation in milliseconds.
   * Includes upload, AI processing, and response time.
   */
  generationTimeMs: z.number().optional(),
});

export type StepPlaygroundOutput = z.infer<typeof stepPlaygroundOutputSchema>;

// ============================================================================
// Action Response Type
// ============================================================================

/**
 * Standard action response type for the server action.
 * Matches the pattern used in steps/actions/types.ts
 */
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Error codes specific to playground generation.
 * Extended from steps/actions/types.ts ErrorCodes.
 */
export const PlaygroundErrorCodes = {
  /** User is not authenticated */
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  /** Step document not found in Firestore */
  STEP_NOT_FOUND: 'STEP_NOT_FOUND',

  /** Step is not of type ai-transform */
  INVALID_STEP_TYPE: 'INVALID_STEP_TYPE',

  /** Input validation failed (schema, image format, etc.) */
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  /** AI generation service failed */
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',

  /** Unknown/unexpected error */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type PlaygroundErrorCode =
  (typeof PlaygroundErrorCodes)[keyof typeof PlaygroundErrorCodes];

// ============================================================================
// Server Action Contract
// ============================================================================

/**
 * Generate a playground preview for an ai-transform step.
 *
 * @param input - Step ID and test image as base64
 * @returns Success with generated image or error with message
 *
 * @example
 * ```typescript
 * const result = await generateStepPreview({
 *   stepId: 'step-123',
 *   testImageBase64: 'data:image/jpeg;base64,...',
 * });
 *
 * if (result.success) {
 *   // Display result.data.resultImageBase64
 * } else {
 *   // Handle result.error.code and result.error.message
 * }
 * ```
 *
 * @remarks
 * - Requires authentication (returns PERMISSION_DENIED if not authenticated)
 * - Step must be of type 'ai-transform' (returns INVALID_STEP_TYPE otherwise)
 * - Step must have a prompt configured (returns VALIDATION_ERROR otherwise)
 * - Test image is uploaded to temporary storage and cleaned up automatically
 * - Variables and outputType from step config are ignored
 */
export type GenerateStepPreview = (
  input: StepPlaygroundInput
) => Promise<ActionResponse<StepPlaygroundOutput>>;

// ============================================================================
// Config Mapping (for documentation)
// ============================================================================

/**
 * Mapping from step config to AI TransformParams.
 * Documents how step configuration is used for generation.
 */
export const CONFIG_MAPPING = {
  /**
   * Step config field -> TransformParams field
   */
  mappings: {
    'config.model': { to: 'model', default: 'gemini-2.5-flash-image' },
    'config.prompt': { to: 'prompt', required: true },
    'config.aspectRatio': { to: 'aspectRatio', default: '1:1' },
    'config.referenceImageUrls': { to: 'referenceImageUrls', default: [] },
  },

  /**
   * Fields explicitly ignored in playground mode
   */
  ignored: ['config.variables', 'config.outputType'],
} as const;

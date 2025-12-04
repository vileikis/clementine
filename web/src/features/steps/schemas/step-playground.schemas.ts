/**
 * Zod schemas for Step Playground server action
 *
 * @feature 019-ai-transform-playground
 */

import { z } from "zod";

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
  stepId: z.string().min(1, "Step ID is required"),

  /**
   * The test image as a base64 data URL.
   * Must be a valid image data URL (JPEG, PNG, or WebP).
   * Max size: 10MB (validated client-side before sending).
   */
  testImageBase64: z
    .string()
    .min(1, "Test image is required")
    .refine(
      (val) => val.startsWith("data:image/"),
      "Test image must be a valid image data URL"
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

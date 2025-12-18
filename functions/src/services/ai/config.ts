/**
 * AI Transform Configuration
 *
 * Mocked configuration for AI image transformation.
 * In production, this will be fetched from Firestore based on
 * experience/event settings.
 */

import type { AiTransformConfig } from './providers/types';

/**
 * Mocked AI configuration for development and testing
 *
 * This configuration is used when aiTransform flag is enabled
 * in processMedia requests. It defines:
 * - AI provider and model
 * - Transformation prompt (hobbit theme)
 * - Reference images for style guidance
 *
 * Reference images are stored in Firebase Storage at:
 * media/company-test-001/ai-reference/
 */
export const MOCKED_AI_CONFIG: AiTransformConfig = {
  provider: 'google',
  model: 'gemini-2.5-flash-image', // Using Gemini 2.5 Flash Image model (~$0.039/transform)
  prompt: 'Transform this person into a hobbit from Lord of the Rings. Apply fantasy costume, hairy feet, and whimsical background. Maintain facial features and pose.',
  referenceImages: [
    'media/company-test-001/ai-reference/hobbit-costume.jpg',
    'media/company-test-001/ai-reference/black-magic-wand.jpg',
  ],
  temperature: 0.7,
  imageSize: '4K', // Default image size (balance of quality vs speed/cost)
  // aspectRatio will be added dynamically by pipeline based on request
};

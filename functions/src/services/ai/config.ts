/**
 * AI Transform Configuration
 *
 * Mocked configuration for AI image transformation.
 * In production, this will be fetched from Firestore based on
 * experience/event settings.
 */

import type { AiTransformConfig } from './providers/types';

const HOBBIT_PROMPT = `Transform the person into a hobbit, keeping the person’s facial likeness clearly recognizable, with slightly rounded facial features and subtle hobbit-like proportions. Keep original hair style and color.

Create a portrait-style composition showing only the upper body (head, shoulders, and chest). The hobbit is seated on a wooden bench, but only the top part of the bench is visible.

Dress the hobbit in the exact hobbit costume from Reference Image 1, matching colors, fabric textures, layers, and overall silhouette, adapted to hobbit proportions.

Place a hobbit barrow (earth-covered hill home with a round wooden door) softly blurred in the background for context, without overpowering the subject.

Give the hobbit a black magic wand inspired by Reference Image 2, matching its shape, material, and dark mystical aesthetic. The wand should be visible in-frame, held naturally near the chest or resting against the shoulder.

Render the image as cinematic fantasy portrait photography, with shallow depth of field, soft background blur, warm natural lighting, high detail skin and fabric textures, and a whimsical Tolkien-inspired atmosphere.

Ensure clean anatomy, realistic proportions, no extra limbs, and a cohesive, polished visual style.`

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
  // model: 'gemini-2.5-flash-image', // Using Gemini 2.5 Flash Image model (~$0.039/transform)
  model: 'gemini-3-pro-image-preview', // Using Gemini 3 Pro Image Preview model (~$0.40/transform)
  prompt: HOBBIT_PROMPT,
  referenceImages: [
    'media/company-test-001/ai-reference/hobbit-costume.jpg',
    'media/company-test-001/ai-reference/black-magic-wand.jpg',
  ],
  temperature: 0.7,
  imageSize: '2K', // Default image size (balance of quality vs speed/cost)
  // aspectRatio will be added dynamically by pipeline based on request
};

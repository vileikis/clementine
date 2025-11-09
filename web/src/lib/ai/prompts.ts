import type { TransformParams } from './types';

/**
 * Build effect-specific prompt from base params
 *
 * These templates are shared across all providers (Google AI, n8n, mock)
 */
export function buildPromptForEffect(params: TransformParams): string {
  const { effect, prompt, brandColor } = params;

  switch (effect) {
    case 'background_swap':
      return `Take the person/subject from the first image and place them in the background environment from the second image.

Instructions:
- Extract the main subject (person/people) from the first image
- If the first image is low quality, pixelated, or blurry, enhance it: improve sharpness, reduce noise, upscale resolution
- Use the background/environment from the second image
- Seamlessly blend the subject into the new background
- Maintain the subject's original appearance, lighting, and proportions while improving overall image quality
- Match lighting and color temperature between subject and new background
- Ensure professional photobooth quality with crisp, clear details
${brandColor ? `- Optionally incorporate brand color ${brandColor} into the background elements` : ''}

Output: Single merged image with subject in new background, photorealistic quality with enhanced clarity and sharpness.`;

// ${prompt ? `Additional context: ${prompt}` : ''}

    case 'deep_fake':
      return `Transform the person in the first image into a superhero. Make them look like a powerful superhero character with dramatic lighting and epic styling.

Output: A single superhero portrait image.`;

// ${prompt ? `Additional context: ${prompt}` : ''}

    default:
      return prompt;
  }
}

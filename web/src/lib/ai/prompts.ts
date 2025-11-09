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
      return `${prompt}\n\nStyle: Professional photobooth quality. Brand color: ${brandColor || '#0EA5E9'}. Maintain subject's appearance exactly.`;

    case 'deep_fake':
      return `${prompt}\n\nStyle: Realistic face swap. Brand color accent: ${brandColor || '#0EA5E9'}. High quality output.`;

    default:
      return prompt;
  }
}

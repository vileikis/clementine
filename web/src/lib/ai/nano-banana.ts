import { getAIClient } from './client';
import type { TransformParams } from './types';

/**
 * Transform an image using configured AI provider
 *
 * Automatically selects provider based on AI_PROVIDER env var:
 * - 'google-ai': Google GenAI SDK (gemini-2.5-flash-image)
 * - 'n8n': n8n webhook integration
 * - 'mock': Development mock (default)
 */
export async function transformWithNanoBanana(
  params: TransformParams
): Promise<Buffer> {
  const client = getAIClient();
  return client.generateImage(params);
}

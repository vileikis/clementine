import type { TransformParams } from './types';
import { GoogleAIProvider } from './providers/google-ai';
import { N8nWebhookProvider } from './providers/n8n-webhook';
import { MockProvider } from './providers/mock';

export interface AIClient {
  /**
   * Generate transformed image
   * @param params - Transform parameters
   * @returns Buffer containing transformed image
   */
  generateImage(params: TransformParams): Promise<Buffer>;
}

export type AIProvider = 'google-ai' | 'n8n' | 'mock';

export function getAIClient(): AIClient {
  const provider = (process.env.AI_PROVIDER || 'mock') as AIProvider;

  switch (provider) {
    case 'google-ai':
      if (!process.env.GOOGLE_AI_API_KEY) {
        console.warn('[AI] GOOGLE_AI_API_KEY not set, falling back to mock');
        return new MockProvider();
      }
      return new GoogleAIProvider(process.env.GOOGLE_AI_API_KEY);

    case 'n8n':
      if (!process.env.N8N_WEBHOOK_BASE_URL) {
        console.warn('[AI] N8N_WEBHOOK_BASE_URL not set, falling back to mock');
        return new MockProvider();
      }
      return new N8nWebhookProvider({
        baseUrl: process.env.N8N_WEBHOOK_BASE_URL,
        authToken: process.env.N8N_WEBHOOK_AUTH_TOKEN,
      });

    case 'mock':
    default:
      return new MockProvider();
  }
}

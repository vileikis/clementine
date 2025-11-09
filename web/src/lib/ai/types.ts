// Effect types - will be synced with firestore types when available
export type EffectType = 'background_swap' | 'deep_fake';

export interface TransformParams {
  effect: EffectType;
  prompt: string;
  inputImageUrl: string;
  referenceImageUrl?: string;
  brandColor?: string;
}

// AI provider configuration (read from env)
export interface AIServiceConfig {
  provider: 'google-ai' | 'n8n' | 'mock';
  googleAIKey?: string;
  n8nWebhookUrl?: string;
  n8nAuthToken?: string;
}

export function getAIConfig(): AIServiceConfig {
  const provider = (process.env.AI_PROVIDER || 'mock') as AIServiceConfig['provider'];

  return {
    provider,
    googleAIKey: process.env.GOOGLE_AI_API_KEY,
    n8nWebhookUrl: process.env.N8N_WEBHOOK_BASE_URL,
    n8nAuthToken: process.env.N8N_WEBHOOK_AUTH_TOKEN,
  };
}

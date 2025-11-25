export interface TransformParams {
  prompt: string;
  inputImageUrl: string;
  referenceImageUrl?: string;
  brandColor?: string;
  /** AI model to use for generation (e.g., 'gemini-2.5-flash-image', 'gemini-3-pro-image-preview') */
  model?: string;
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

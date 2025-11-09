import type { AIClient } from '../client';
import type { TransformParams } from '../types';
import { buildPromptForEffect } from '../prompts';

export interface N8nConfig {
  baseUrl: string;
  authToken?: string;
}

export class N8nWebhookProvider implements AIClient {
  constructor(private config: N8nConfig) {}

  async generateImage(params: TransformParams): Promise<Buffer> {
    console.log('[n8n] Starting transform:', {
      effect: params.effect,
      webhook: this.config.baseUrl,
    });

    const response = await fetch(`${this.config.baseUrl}/transform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.authToken && {
          Authorization: `Bearer ${this.config.authToken}`,
        }),
      },
      body: JSON.stringify({
        effect: params.effect,
        prompt: buildPromptForEffect(params),
        inputImageUrl: params.inputImageUrl,
        referenceImageUrl: params.referenceImageUrl,
        brandColor: params.brandColor,
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook error (${response.status}): ${await response.text()}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[n8n] Transform complete:', {
      effect: params.effect,
      imageSize: buffer.length,
    });

    return buffer;
  }
}

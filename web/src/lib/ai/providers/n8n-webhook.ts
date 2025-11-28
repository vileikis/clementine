import type { AIClient } from '../client';
import type { TransformParams } from '../types';

export interface N8nConfig {
  baseUrl: string;
  authToken?: string;
}

export class N8nWebhookProvider implements AIClient {
  constructor(private config: N8nConfig) {}

  async generateImage(params: TransformParams): Promise<Buffer> {
    console.log('[n8n] Starting transform:', {
      prompt: params.prompt.substring(0, 50),
      webhook: this.config.baseUrl,
      aspectRatio: params.aspectRatio,
      referenceImageCount: params.referenceImageUrls?.length || 0,
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
        prompt: params.prompt,
        inputImageUrl: params.inputImageUrl,
        referenceImageUrls: params.referenceImageUrls || [],
        brandColor: params.brandColor,
        model: params.model,
        aspectRatio: params.aspectRatio || "1:1",
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook error (${response.status}): ${await response.text()}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[n8n] Transform complete:', {
      promptLength: params.prompt.length,
      imageSize: buffer.length,
    });

    return buffer;
  }
}

import type { AIClient } from '../client';
import type { TransformParams } from '../types';

export class MockProvider implements AIClient {
  async generateImage(params: TransformParams): Promise<Buffer> {
    console.log('[Mock AI] Starting mock transform:', {
      prompt: params.prompt.substring(0, 50) + '...',
      model: params.model,
      aspectRatio: params.aspectRatio,
      referenceImageCount: params.referenceImageUrls?.length || 0,
    });

    // Simulate API processing time (3-5 seconds)
    const delayMs = 3000 + Math.random() * 2000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Fetch input image and return it as-is
    const response = await fetch(params.inputImageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch input image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Mock AI] Transform complete (${Math.round(delayMs)}ms):`, {
      imageSize: buffer.length,
      promptLength: params.prompt.length,
    });

    return buffer;
  }
}

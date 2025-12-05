import type { AIClient } from '../client';
import type { TransformParams } from '../types';

export class MockProvider implements AIClient {
  /**
   * Extract base64 data from a data URL and convert to Buffer
   */
  private dataUrlToBuffer(dataUrl: string): Buffer {
    const matches = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URL format');
    }
    return Buffer.from(matches[1], 'base64');
  }

  async generateImage(params: TransformParams): Promise<Buffer> {
    console.log('[Mock AI] Starting mock transform:', {
      prompt: params.prompt.substring(0, 50) + '...',
      model: params.model,
      aspectRatio: params.aspectRatio,
      referenceImageCount: params.referenceImageUrls?.length || 0,
      hasBase64Input: !!params.inputImageBase64,
      hasUrlInput: !!params.inputImageUrl,
    });

    // Simulate API processing time (3-5 seconds)
    const delayMs = 3000 + Math.random() * 2000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Get input image buffer - either from base64 or fetch from URL
    let buffer: Buffer;
    if (params.inputImageBase64) {
      // Extract buffer from base64 data URL
      buffer = this.dataUrlToBuffer(params.inputImageBase64);
    } else if (params.inputImageUrl) {
      // Fetch input image and return it as-is
      const response = await fetch(params.inputImageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch input image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      throw new Error('Either inputImageUrl or inputImageBase64 must be provided');
    }

    console.log(`[Mock AI] Transform complete (${Math.round(delayMs)}ms):`, {
      imageSize: buffer.length,
      promptLength: params.prompt.length,
    });

    return buffer;
  }
}

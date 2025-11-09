import { ContentListUnion, GoogleGenAI } from '@google/genai';
import type { AIClient } from '../client';
import type { TransformParams } from '../types';
import { buildPromptForEffect } from '../prompts';

export class GoogleAIProvider implements AIClient {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Fetch image from URL and convert to base64
   */
  private async fetchImageAsBase64(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }

  async generateImage(params: TransformParams): Promise<Buffer> {
    console.log('[GoogleAI] Starting transform:', {
      effect: params.effect,
      hasReference: !!params.referenceImageUrl,
    });

    console.log('[GoogleAI] Adding input image:', params.inputImageUrl);
    // Fetch and convert images to base64
    // Note: fileData.fileUri only works with Gemini File API URIs, not arbitrary HTTPS URLs
    const [inputImageData, referenceImageData] = await Promise.all([
      this.fetchImageAsBase64(params.inputImageUrl),
      params.referenceImageUrl ? this.fetchImageAsBase64(params.referenceImageUrl) : null,
    ]);

    // Build prompt parts
    const promptParts: ContentListUnion = [
      { text: buildPromptForEffect(params) },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: inputImageData,
        }
      }
    ];


    // Add reference image if provided (for background swap)
    console.log('[GoogleAI] Adding reference image:', params.referenceImageUrl);
    if (referenceImageData) {
      promptParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: referenceImageData,
        }
      });
    }

    // Call Google AI
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: promptParts,
    });

    // Extract image from response
    // Handle potential response structures
    const candidates = response.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          console.log('[GoogleAI] Transform complete:', {
            effect: params.effect,
            imageSize: buffer.length,
          });
          return buffer;
        }
      }
    }

    throw new Error('No image data in Google AI response');
  }
}

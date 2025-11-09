import { ContentListUnion, GoogleGenAI } from '@google/genai';
import type { AIClient } from '../client';
import type { TransformParams } from '../types';
import { buildPromptForEffect } from '../prompts';

export class GoogleAIProvider implements AIClient {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateImage(params: TransformParams): Promise<Buffer> {
    console.log('[GoogleAI] Starting transform:', {
      effect: params.effect,
      hasReference: !!params.referenceImageUrl,
    });

    // Fetch input image and convert to base64
    console.log('[GoogleAI] Adding input image:', params.inputImageUrl);
    const inputResponse = await fetch(params.inputImageUrl);
    const inputBuffer = await inputResponse.arrayBuffer();
    const inputBase64 = Buffer.from(inputBuffer).toString('base64');

    // Build prompt parts
    const promptParts: ContentListUnion = [
      { text: buildPromptForEffect(params) }
    ];

    // Add input image
    promptParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: inputBase64,
      }
    });

    // Add reference image if provided (for background swap)
    console.log('[GoogleAI] Adding reference image:', params.referenceImageUrl);
    if (params.referenceImageUrl) {
      const refResponse = await fetch(params.referenceImageUrl);
      const refBuffer = await refResponse.arrayBuffer();
      const refBase64 = Buffer.from(refBuffer).toString('base64');

      promptParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: refBase64,
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

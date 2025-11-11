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

    // console.log('[GoogleAI] Adding input image:', params.inputImageUrl);
    // Fetch and convert images to base64
    // Note: fileData.fileUri only works with Gemini File API URIs, not arbitrary HTTPS URLs
    const [inputImageData, referenceImageData] = await Promise.all([
      this.fetchImageAsBase64(params.inputImageUrl),
      params.referenceImageUrl ? this.fetchImageAsBase64(params.referenceImageUrl) : null,
    ]);

    // Build prompt parts
    const promptText = buildPromptForEffect(params);
    console.log('[GoogleAI] Prompt text:', promptText);

    const promptParts: ContentListUnion = [
      { text: promptText },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: inputImageData,
        }
      }
    ];


    // Add reference image if provided (for background swap)
    // console.log('[GoogleAI] Adding reference image:', params.referenceImageUrl);
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
    console.log('[GoogleAI] Response structure:', {
      hasCandidates: !!response.candidates,
      candidatesCount: response.candidates?.length || 0,
    });

    const candidates = response.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      console.log('[GoogleAI] Candidate parts:', {
        partsCount: parts.length,
        partTypes: parts.map(p => Object.keys(p)),
      });

      for (const part of parts) {
        if (part.inlineData?.data) {
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          console.log('[GoogleAI] Transform complete:', {
            effect: params.effect,
            imageSize: buffer.length,
          });
          return buffer;
        }

        // Log what we got instead
        // if (part.text) {
        //   console.log('[GoogleAI] Got text instead of image:', part.text.substring(0, 200));
        // }
      }
    }

    throw new Error('No image data in Google AI response');
  }
}

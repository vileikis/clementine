import { ContentListUnion, GoogleGenAI } from '@google/genai';
import type { AIClient } from '../client';
import type { TransformParams } from '../types';

/**
 * Valid aspect ratios supported by Google AI image generation models.
 * Our schema uses a subset: "1:1", "3:4", "4:5", "9:16", "16:9"
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */
const GOOGLE_AI_ASPECT_RATIOS = [
  "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"
] as const;

/**
 * Validate and normalize aspect ratio for Google AI.
 * Falls back to "1:1" if invalid or undefined.
 *
 * @param aspectRatio - Requested aspect ratio
 * @returns Valid Google AI aspect ratio
 */
function validateAspectRatio(aspectRatio?: string): string {
  if (!aspectRatio) return "1:1";

  if (GOOGLE_AI_ASPECT_RATIOS.includes(aspectRatio as typeof GOOGLE_AI_ASPECT_RATIOS[number])) {
    return aspectRatio;
  }

  console.warn(`[GoogleAI] Invalid aspect ratio: ${aspectRatio}, defaulting to 1:1`);
  return "1:1";
}

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

  /**
   * Extract base64 data from a data URL
   */
  private extractBase64FromDataUrl(dataUrl: string): string {
    const matches = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URL format');
    }
    return matches[1];
  }

  async generateImage(params: TransformParams): Promise<Buffer> {
    const model = params.model || 'gemini-2.5-flash-image';

    console.log('[GoogleAI] Starting transform:', {
      model,
      prompt: params.prompt.substring(0, 50),
      referenceImageCount: params.referenceImageUrls?.length || 0,
      hasBase64Input: !!params.inputImageBase64,
      hasUrlInput: !!params.inputImageUrl,
    });

    // Get input image as base64 - either from provided base64 or fetch from URL
    let inputImageData: string;
    if (params.inputImageBase64) {
      // Extract base64 data from data URL
      inputImageData = this.extractBase64FromDataUrl(params.inputImageBase64);
    } else if (params.inputImageUrl) {
      // Fetch and convert to base64
      inputImageData = await this.fetchImageAsBase64(params.inputImageUrl);
    } else {
      throw new Error('Either inputImageUrl or inputImageBase64 must be provided');
    }

    // Fetch all reference images (if any)
    const referenceImageDataList: string[] = [];
    if (params.referenceImageUrls && params.referenceImageUrls.length > 0) {
      const referencePromises = params.referenceImageUrls.map(url =>
        this.fetchImageAsBase64(url)
      );
      const results = await Promise.all(referencePromises);
      referenceImageDataList.push(...results);
    }

    // Use AI prompt from experience configuration
    const promptText = params.prompt;
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

    // Add all reference images if provided
    if (referenceImageDataList.length > 0) {
      for (const referenceData of referenceImageDataList) {
        promptParts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: referenceData,
          }
        });
      }
    }

    // Validate and prepare aspect ratio
    const aspectRatio = validateAspectRatio(params.aspectRatio);

    console.log('[GoogleAI] Generation config:', {
      model,
      aspectRatio,
      promptLength: params.prompt.length,
      referenceImageCount: referenceImageDataList.length,
    });

    // Call Google AI with imageConfig
    const response = await this.ai.models.generateContent({
      model,
      contents: promptParts,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
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
            promptLength: params.prompt.length,
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

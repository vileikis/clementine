/**
 * AI Transform Types and Configuration
 *
 * Defines types and configuration for AI image transformation services.
 */

import type { EffectType } from "@/lib/types/firestore";

/**
 * Parameters for AI image transformation
 */
export interface TransformParams {
  effect: EffectType;
  prompt: string;
  inputImageUrl: string;
  referenceImageUrl?: string;
  brandColor?: string;
}

/**
 * AI service endpoint configuration
 */
export interface AIServiceConfig {
  apiKey: string;
  backgroundSwapEndpoint?: string;
  deepFakeEndpoint?: string;
}

/**
 * Get AI service configuration from environment variables
 */
export function getAIConfig(): AIServiceConfig {
  return {
    apiKey: process.env.NANO_BANANA_API_KEY || "",
    backgroundSwapEndpoint: process.env.NANO_BANANA_BG_SWAP_ENDPOINT,
    deepFakeEndpoint: process.env.NANO_BANANA_DEEPFAKE_ENDPOINT,
  };
}

/**
 * Get endpoint URL for a specific effect type
 */
export function getEndpointForEffect(effect: EffectType): string | undefined {
  const config = getAIConfig();

  switch (effect) {
    case "background_swap":
      return config.backgroundSwapEndpoint;
    case "deep_fake":
      return config.deepFakeEndpoint;
    default:
      return undefined;
  }
}

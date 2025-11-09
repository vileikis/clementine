/**
 * Nano Banana API Integration
 *
 * Handles communication with the Nano Banana AI transformation service.
 */

import { mockTransform } from "./mock";
import { getAIConfig, getEndpointForEffect, type TransformParams } from "./types";

/**
 * Transform an image using the Nano Banana API
 *
 * Calls the appropriate Nano Banana endpoint based on the effect type.
 * Falls back to mock transform if endpoints are not configured.
 *
 * @param params - Transform parameters
 * @returns Buffer containing the transformed image
 * @throws Error if the API call fails
 */
export async function transformWithNanoBanana(
  params: TransformParams
): Promise<Buffer> {
  const config = getAIConfig();
  const endpoint = getEndpointForEffect(params.effect);

  // Fallback to mock if endpoint not configured
  if (!endpoint || !config.apiKey) {
    console.log(
      "[Nano Banana] API not configured, using mock transform. Set NANO_BANANA_API_KEY and endpoint env vars to use real API."
    );
    return mockTransform(params);
  }

  console.log("[Nano Banana] Starting transform:", {
    effect: params.effect,
    endpoint,
    prompt: params.prompt.substring(0, 50) + "...",
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        input_image: params.inputImageUrl,
        reference_image: params.referenceImageUrl,
        prompt: params.prompt,
        brand_color: params.brandColor,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Nano Banana API error (${response.status}): ${errorText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("[Nano Banana] Transform complete:", {
      effect: params.effect,
      imageSize: buffer.length,
    });

    return buffer;
  } catch (error) {
    console.error("[Nano Banana] Transform failed:", error);

    // If it's a network error or timeout, provide helpful message
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Failed to connect to Nano Banana API. Check your network connection and endpoint configuration."
      );
    }

    throw error instanceof Error
      ? error
      : new Error("Nano Banana API transform failed");
  }
}

/**
 * Mock AI Transform Implementation
 *
 * Simulates AI image transformation for development/testing.
 * Fetches the input image and returns it with a simulated processing delay.
 */

import type { TransformParams } from "./types";

/**
 * Mock transform implementation that simulates AI processing
 *
 * In a real implementation, this would apply overlays, tints, or other
 * effects using canvas or sharp. For the POC, we simply return the input
 * image after a simulated delay to mimic API latency.
 *
 * @param params - Transform parameters
 * @returns Buffer containing the "transformed" image
 */
export async function mockTransform(params: TransformParams): Promise<Buffer> {
  console.log("[Mock AI] Starting mock transform:", {
    effect: params.effect,
    prompt: params.prompt.substring(0, 50) + "...",
    brandColor: params.brandColor,
    hasReference: !!params.referenceImageUrl,
  });

  // Simulate API processing time (3-5 seconds)
  const delayMs = 3000 + Math.random() * 2000;
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  try {
    // Fetch the input image
    const response = await fetch(params.inputImageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch input image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Mock AI] Transform complete (${Math.round(delayMs)}ms):`, {
      imageSize: buffer.length,
      effect: params.effect,
    });

    // TODO: In a future enhancement, use canvas or sharp to:
    // - Apply a colored tint based on brandColor
    // - Add text overlay with the prompt
    // - Composite with reference image (for background_swap)
    // - Apply filters or effects

    return buffer;
  } catch (error) {
    console.error("[Mock AI] Transform failed:", error);
    throw new Error(
      `Mock transform failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

"use server";

/**
 * Server Action: Generate Playground Preview
 *
 * Generates an AI-transformed preview image for the playground.
 * Uses the experience's AI configuration (model, prompt) to transform
 * a test image uploaded by the user.
 *
 * Flow:
 * 1. Validate input and authentication
 * 2. Fetch experience configuration from Firestore
 * 3. Upload test image to temporary Firebase Storage location
 * 4. Call AI client with experience config
 * 5. Return transformed image as base64 data URL
 *
 * Note: Both input and output images are temporary and not persisted
 * to the experience record. This is for testing only.
 */

import { z } from "zod";
import {
  playgroundGenerateInputSchema,
  photoExperienceSchema,
  type PlaygroundGenerateOutput,
} from "../schemas";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import {
  checkAuth,
  getExperienceDocument,
  createSuccessResponse,
  createErrorResponse,
} from "./utils";
import { storage } from "@/lib/firebase/admin";
import { getAIClient } from "@/lib/ai/client";

/**
 * Convert a base64 data URL to a Buffer
 */
function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid data URL format");
  }
  return {
    mimeType: matches[1],
    buffer: Buffer.from(matches[2], "base64"),
  };
}

/**
 * Upload a buffer to Firebase Storage and return a signed URL
 * Files are stored in a temporary playground folder with auto-cleanup
 */
async function uploadToTempStorage(
  buffer: Buffer,
  mimeType: string,
  prefix: string
): Promise<string> {
  const extension = mimeType.split("/")[1] || "jpg";
  const filename = `playground-temp/${prefix}-${Date.now()}.${extension}`;

  const file = storage.file(filename);

  await file.save(buffer, {
    contentType: mimeType,
    metadata: {
      // Mark as temporary for cleanup
      temporary: "true",
      createdAt: new Date().toISOString(),
    },
  });

  // Generate a signed URL valid for 15 minutes (enough for AI processing)
  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  return signedUrl;
}

/**
 * Generate a playground preview using AI transformation.
 *
 * @param input - Experience ID and test image as base64 data URL
 * @returns ActionResponse with transformed image as base64 or error
 */
export async function generatePlaygroundPreview(
  input: z.infer<typeof playgroundGenerateInputSchema>
): Promise<ActionResponse<PlaygroundGenerateOutput>> {
  const startTime = Date.now();

  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate input with Zod schema
    const validated = playgroundGenerateInputSchema.parse(input);

    // Get experience document
    const result = await getExperienceDocument(validated.experienceId);
    if ("error" in result) return result.error;

    const experienceDoc = result.doc;
    const experienceData = experienceDoc.data();

    // Validate experience type is photo (for now)
    if (experienceData?.type !== "photo") {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "Playground preview is only available for photo experiences"
      );
    }

    // Parse experience with schema validation
    const experience = photoExperienceSchema.parse({
      id: experienceDoc.id,
      ...experienceData,
    });

    // Check if AI is enabled and has a prompt
    if (!experience.aiPhotoConfig.enabled) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "AI transformation is disabled for this experience"
      );
    }

    const prompt = experience.aiPhotoConfig.prompt;
    if (!prompt) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "No AI prompt configured for this experience"
      );
    }

    // Convert base64 data URL to buffer and upload to temp storage
    const { buffer: testImageBuffer, mimeType } = dataUrlToBuffer(
      validated.testImageBase64
    );

    const testImageUrl = await uploadToTempStorage(
      testImageBuffer,
      mimeType,
      "input"
    );

    // Get first reference image URL if available
    const referenceImageUrl = experience.aiPhotoConfig.referenceImageUrls?.[0];

    // Call AI client
    const aiClient = getAIClient();
    const resultBuffer = await aiClient.generateImage({
      prompt,
      inputImageUrl: testImageUrl,
      referenceImageUrl,
    });

    // Convert result buffer to base64 data URL
    const resultBase64 = `data:image/jpeg;base64,${resultBuffer.toString("base64")}`;

    const generationTimeMs = Date.now() - startTime;

    return createSuccessResponse({
      resultImageBase64: resultBase64,
      generationTimeMs,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      );
    }

    // Handle unknown errors
    console.error("[PlaygroundGenerate] Error:", error);
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Failed to generate preview"
    );
  }
}

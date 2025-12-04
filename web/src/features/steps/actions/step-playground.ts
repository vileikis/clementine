"use server";

/**
 * Server Action: Generate Step Playground Preview
 *
 * Generates an AI-transformed preview image for testing an ai-transform step.
 * Uses the step's AI configuration (model, prompt, aspectRatio, referenceImageUrls)
 * to transform a test image uploaded by the user.
 *
 * Flow:
 * 1. Validate input and authentication
 * 2. Fetch step configuration from Firestore
 * 3. Validate step type is ai-transform and has prompt configured
 * 4. Upload test image to temporary Firebase Storage location
 * 5. Call AI client with step config
 * 6. Return transformed image as base64 data URL
 *
 * Note: Both input and output images are temporary and not persisted.
 * This is for testing AI prompts before going live.
 *
 * @feature 019-ai-transform-playground
 */

import { z } from "zod";
import {
  stepPlaygroundInputSchema,
  type StepPlaygroundOutput,
} from "../schemas";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { verifyAdminSecret } from "@/lib/auth";
import { db, storage } from "@/lib/firebase/admin";
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
 * Create an error response
 */
function createErrorResponse(
  code: string,
  message: string
): ActionResponse<never> {
  return {
    success: false,
    error: { code, message },
  };
}

/**
 * Create a success response
 */
function createSuccessResponse<T>(data: T): ActionResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Generate a playground preview using AI transformation for an ai-transform step.
 *
 * @param input - Step ID and test image as base64 data URL
 * @returns ActionResponse with transformed image as base64 or error
 */
export async function generateStepPreview(
  input: z.infer<typeof stepPlaygroundInputSchema>
): Promise<ActionResponse<StepPlaygroundOutput>> {
  const startTime = Date.now();

  try {
    // Check authentication
    const auth = await verifyAdminSecret();
    if (!auth.authorized) {
      return createErrorResponse(ErrorCodes.PERMISSION_DENIED, auth.error);
    }

    // Validate input with Zod schema
    const validated = stepPlaygroundInputSchema.parse(input);

    // Fetch step document - steps are nested under experiences
    // First we need to find the step across all experiences
    // Steps are stored at /experiences/{experienceId}/steps/{stepId}
    // We'll query all experiences to find the step
    const experiencesSnapshot = await db.collection("experiences").get();

    let stepDoc: FirebaseFirestore.DocumentSnapshot | null = null;

    for (const expDoc of experiencesSnapshot.docs) {
      const stepsRef = db
        .collection("experiences")
        .doc(expDoc.id)
        .collection("steps")
        .doc(validated.stepId);
      const doc = await stepsRef.get();
      if (doc.exists) {
        stepDoc = doc;
        break;
      }
    }

    if (!stepDoc || !stepDoc.exists) {
      return createErrorResponse(
        ErrorCodes.STEP_NOT_FOUND,
        `Step with ID ${validated.stepId} not found`
      );
    }

    const stepData = stepDoc.data();

    // Validate step type is ai-transform
    if (stepData?.type !== "ai-transform") {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "Playground preview is only available for ai-transform steps"
      );
    }

    // Validate prompt is configured
    const config = stepData.config;
    if (!config?.prompt) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "No AI prompt configured for this step"
      );
    }

    // Convert base64 data URL to buffer and upload to temp storage
    const { buffer: testImageBuffer, mimeType } = dataUrlToBuffer(
      validated.testImageBase64
    );

    const testImageUrl = await uploadToTempStorage(
      testImageBuffer,
      mimeType,
      `step-${validated.stepId}-input`
    );

    // Extract config with defaults (per research.md CONFIG_MAPPING)
    const model = config.model || "gemini-2.5-flash-image";
    const aspectRatio = config.aspectRatio || "1:1";
    const referenceImageUrls = config.referenceImageUrls || [];

    // Call AI client
    const aiClient = getAIClient();
    const resultBuffer = await aiClient.generateImage({
      prompt: config.prompt,
      inputImageUrl: testImageUrl,
      referenceImageUrls,
      model,
      aspectRatio,
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

    // Handle AI generation errors
    console.error("[StepPlayground] Error:", error);
    return createErrorResponse(
      ErrorCodes.AI_GENERATION_FAILED,
      error instanceof Error ? error.message : "Failed to generate preview"
    );
  }
}

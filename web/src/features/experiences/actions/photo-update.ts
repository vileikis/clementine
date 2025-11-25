"use server";

/**
 * Server Action: Update Photo Experience
 *
 * Updates an existing photo experience in the root /experiences collection.
 * Refactored for normalized Firestore design (data-model-v4).
 *
 * This action:
 * - Validates input using updatePhotoExperienceSchema
 * - Fetches existing experience document with schema validation
 * - Merges partial updates with existing captureConfig and aiPhotoConfig
 * - Writes to Firestore using Admin SDK
 * - Revalidates the experience page
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  updatePhotoExperienceSchema,
  photoExperienceSchema,
  type PhotoExperience,
  type PhotoCaptureConfig,
  type AiPhotoConfig
} from "../schemas";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, getExperienceDocument, createSuccessResponse, createErrorResponse } from "./utils";

/**
 * Type for partial update input
 */
type UpdatePhotoExperienceInput = {
  name?: string;
  enabled?: boolean;
  previewMediaUrl?: string | null;
  previewType?: "image" | "gif" | "video" | null;
  captureConfig?: Partial<PhotoCaptureConfig>;
  aiPhotoConfig?: Partial<AiPhotoConfig>;
};

/**
 * Updates an existing photo experience.
 *
 * @param experienceId - Experience ID
 * @param input - Partial update data
 * @returns ActionResponse with updated PhotoExperience or error
 */
export async function updatePhotoExperience(
  experienceId: string,
  input: UpdatePhotoExperienceInput
): Promise<ActionResponse<PhotoExperience>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate input with Zod schema
    const validated = updatePhotoExperienceSchema.parse(input);

    // Get experience document (validates existence and returns doc in one read)
    const result = await getExperienceDocument(experienceId);
    if ("error" in result) return result.error;

    const experienceDoc = result.doc;
    const existingData = experienceDoc.data();

    // Get reference for later update
    const experienceRef = experienceDoc.ref;

    // Parse existing data with schema validation
    const currentExperience = photoExperienceSchema.parse({
      id: experienceDoc.id,
      ...existingData,
    });

    // Merge partial updates with existing data
    const updatedExperience: PhotoExperience = {
      ...currentExperience,
      // Update basic fields if provided
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.enabled !== undefined && { enabled: validated.enabled }),
      ...(validated.previewMediaUrl !== undefined && {
        previewMediaUrl: validated.previewMediaUrl,
      }),
      ...(validated.previewType !== undefined && {
        previewType: validated.previewType,
      }),
      // Deep merge captureConfig object
      captureConfig: {
        ...currentExperience.captureConfig,
        ...(validated.captureConfig !== undefined && validated.captureConfig),
      },
      // Deep merge aiPhotoConfig object
      aiPhotoConfig: {
        ...currentExperience.aiPhotoConfig,
        ...(validated.aiPhotoConfig !== undefined && validated.aiPhotoConfig),
      },
      // Update timestamp
      updatedAt: Date.now(),
    };

    // Validate merged result against schema
    const validatedExperience = photoExperienceSchema.parse(updatedExperience);

    // Write to Firestore
    await experienceRef.set(validatedExperience);

    // Revalidate pages for all attached events
    for (const eventId of currentExperience.eventIds) {
      revalidatePath(`/events/${eventId}/experiences/${experienceId}`);
      revalidatePath(`/events/${eventId}`);
    }

    return createSuccessResponse(validatedExperience);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      );
    }

    // Handle unknown errors
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}

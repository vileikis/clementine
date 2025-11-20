"use server";

/**
 * Server Action: Update Photo Experience
 *
 * Updates an existing photo experience with the new discriminated union schema.
 * Part of 001-experience-type-fix implementation.
 *
 * This action:
 * - Validates input using updatePhotoExperienceSchema
 * - Fetches existing experience document with schema validation
 * - Merges partial updates with existing config and aiConfig
 * - Writes to Firestore using Admin SDK
 * - Revalidates the experience page
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  updatePhotoExperienceSchema,
  photoExperienceSchema,
  type PhotoExperience,
  type PhotoConfig,
  type AiConfig
} from "../lib/schemas";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, getExperienceDocument, createSuccessResponse, createErrorResponse } from "./utils";

/**
 * Type for partial update input
 */
type UpdatePhotoExperienceInput = {
  label?: string;
  enabled?: boolean;
  hidden?: boolean;
  previewPath?: string | null;
  previewType?: "image" | "gif" | "video" | null;
  config?: Partial<PhotoConfig>;
  aiConfig?: Partial<AiConfig>;
};

/**
 * Updates an existing photo experience for an event.
 *
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @param input - Partial update data
 * @returns ActionResponse with updated PhotoExperience or error
 */
export async function updatePhotoExperience(
  eventId: string,
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
    const result = await getExperienceDocument(eventId, experienceId);
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
      ...(validated.label !== undefined && { label: validated.label }),
      ...(validated.enabled !== undefined && { enabled: validated.enabled }),
      ...(validated.hidden !== undefined && { hidden: validated.hidden }),
      ...(validated.previewPath !== undefined && {
        previewPath: validated.previewPath,
      }),
      ...(validated.previewType !== undefined && {
        previewType: validated.previewType,
      }),
      // Deep merge config object
      config: {
        ...currentExperience.config,
        ...(validated.config !== undefined && validated.config),
      },
      // Deep merge aiConfig object
      aiConfig: {
        ...currentExperience.aiConfig,
        ...(validated.aiConfig !== undefined && validated.aiConfig),
      },
      // Update timestamp
      updatedAt: Date.now(),
    };

    // Validate merged result against schema
    const validatedExperience = photoExperienceSchema.parse(updatedExperience);

    // Write to Firestore
    await experienceRef.set(validatedExperience);

    // Revalidate the experience page
    revalidatePath(`/events/${eventId}/experiences/${experienceId}`);
    // Also revalidate the event page (list view)
    revalidatePath(`/events/${eventId}`);

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

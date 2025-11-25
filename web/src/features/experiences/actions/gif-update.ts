"use server";

/**
 * Server Action: Update GIF Experience
 *
 * Updates an existing GIF experience with the discriminated union schema.
 * Part of 004-multi-experience-editor implementation (User Story 2).
 *
 * This action:
 * - Validates input using updateGifExperienceSchema
 * - Fetches existing experience document with schema validation
 * - Merges partial updates with existing config and aiConfig
 * - Writes to Firestore using Admin SDK
 * - Revalidates the experience page
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  updateGifExperienceSchema,
  gifExperienceSchema,
  type GifExperience,
  type GifConfig,
  type AiConfig
} from "../schemas";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, getExperienceDocument, createSuccessResponse, createErrorResponse } from "./utils";

/**
 * Type for partial update input
 */
type UpdateGifExperienceInput = {
  label?: string;
  enabled?: boolean;
  hidden?: boolean;
  previewPath?: string | null;
  previewType?: "image" | "gif" | "video" | null;
  config?: Partial<GifConfig>;
  aiConfig?: Partial<AiConfig>;
};

/**
 * Updates an existing GIF experience for an event.
 *
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @param input - Partial update data
 * @returns ActionResponse with updated GifExperience or error
 */
export async function updateGifExperience(
  eventId: string,
  experienceId: string,
  input: UpdateGifExperienceInput
): Promise<ActionResponse<GifExperience>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate input with Zod schema
    const validated = updateGifExperienceSchema.parse(input);

    // Get experience document (validates existence and returns doc in one read)
    const result = await getExperienceDocument(eventId, experienceId);
    if ("error" in result) return result.error;

    const experienceDoc = result.doc;
    const existingData = experienceDoc.data();

    // Get reference for later update
    const experienceRef = experienceDoc.ref;

    // Parse existing data with schema validation
    const currentExperience = gifExperienceSchema.parse({
      id: experienceDoc.id,
      ...existingData,
    });

    // Merge partial updates with existing data
    const updatedExperience: GifExperience = {
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
    const validatedExperience = gifExperienceSchema.parse(updatedExperience);

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

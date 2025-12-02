"use server";

/**
 * Server Action: Create Photo Experience
 *
 * Creates a new photo experience in the root /experiences collection.
 * Refactored for normalized Firestore design (data-model-v4).
 *
 * This action:
 * - Validates input using createPhotoExperienceSchema
 * - Validates companyId access (user must have access to the company)
 * - Writes to root /experiences collection using Admin SDK
 * - Auto-attaches current event ID to eventIds array
 * - Revalidates the event page
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createPhotoExperienceSchema,
  type PhotoExperience
} from "../schemas";
import {
  createPhotoAiPreset as createPhotoAiPresetInDb
} from "../repositories/ai-presets.repository";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, validateCompanyAccess, createSuccessResponse, createErrorResponse } from "./utils";

/**
 * Creates a new photo experience for a company, optionally attached to an event.
 *
 * @param input - Creation data (companyId, name, type, eventIds)
 * @param eventId - Optional event ID to auto-attach the experience to
 * @returns ActionResponse with created PhotoExperience or error
 */
export async function createPhotoExperience(
  eventId: string | null,
  input: { companyId: string; name: string; type: "photo"; eventIds?: string[] }
): Promise<ActionResponse<PhotoExperience>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate input with Zod schema
    const validated = createPhotoExperienceSchema.parse(input);

    // Validate company access
    const companyError = await validateCompanyAccess(validated.companyId);
    if (companyError) return companyError;

    // Determine eventIds - use provided array or auto-attach to current event
    const eventIds = validated.eventIds?.length
      ? validated.eventIds
      : eventId
        ? [eventId]
        : [];

    // Create experience in root /aiPresets collection
    const photoExperience = await createPhotoAiPresetInDb({
      companyId: validated.companyId,
      eventIds,
      name: validated.name,
    });

    // Revalidate the event page to show new experience
    if (eventId) {
      revalidatePath(`/events/${eventId}`);
    }

    return createSuccessResponse(photoExperience);
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

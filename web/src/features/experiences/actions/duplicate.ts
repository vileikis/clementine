"use server";

/**
 * Server Action: Duplicate Experience
 *
 * Creates a copy of an existing experience with all settings preserved.
 * The new experience gets:
 * - New unique ID
 * - Name with " (Copy)" suffix
 * - New timestamps
 * - Same eventIds, companyId, and all configuration
 */

import { revalidatePath } from "next/cache";
import type { Experience } from "../schemas";
import {
  getExperience,
  duplicateExperience as duplicateExperienceInDb,
} from "../repositories/experiences.repository";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, createSuccessResponse, createErrorResponse } from "./utils";

/**
 * Duplicates an existing experience.
 *
 * @param experienceId - ID of the experience to duplicate
 * @param eventId - Optional event ID for path revalidation
 * @returns ActionResponse with the duplicated Experience or error
 */
export async function duplicateExperience(
  experienceId: string,
  eventId?: string
): Promise<ActionResponse<Experience>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Get the source experience
    const sourceExperience = await getExperience(experienceId);
    if (!sourceExperience) {
      return createErrorResponse(
        ErrorCodes.EXPERIENCE_NOT_FOUND,
        `Experience with ID ${experienceId} not found`
      );
    }

    // Generate new name with (Copy) suffix
    const newName = `${sourceExperience.name} (Copy)`;

    // Duplicate the experience
    const duplicated = await duplicateExperienceInDb(sourceExperience, newName);

    // Revalidate paths
    if (eventId) {
      revalidatePath(`/events/${eventId}`);
      revalidatePath(`/events/${eventId}/experiences`);
    }

    return createSuccessResponse(duplicated);
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Failed to duplicate experience"
    );
  }
}

"use server";

/**
 * Server Action: List Experiences
 *
 * Fetches experiences for an event using the repository.
 */

import { getExperiencesByEventId } from "../repositories/experiences.repository";
import type { Experience } from "../types";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, createSuccessResponse, createErrorResponse } from "./utils";

/**
 * Lists all experiences for an event.
 * Returns experiences that have this eventId in their eventIds array.
 */
export async function listExperiencesByEventAction(
  eventId: string
): Promise<ActionResponse<Experience[]>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    if (!eventId) {
      return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Event ID is required");
    }

    const experiences = await getExperiencesByEventId(eventId);
    return createSuccessResponse(experiences);
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Failed to list experiences"
    );
  }
}

"use server";

/**
 * Server Action: Update Survey Experience
 *
 * Updates an existing survey experience with partial data.
 * Part of 001-survey-experience implementation.
 *
 * This action:
 * - Validates input using updateSurveyExperienceSchema
 * - Updates only provided fields (partial update)
 * - Updates parent event's updatedAt timestamp
 * - Revalidates the event page
 */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase/admin";
import { z } from "zod";
import { updateSurveyExperienceSchema } from "../lib/schemas";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import {
  checkAuth,
  validateEventExists,
  validateExperienceExists,
  createSuccessResponse,
  createErrorResponse,
} from "./utils";

/**
 * Updates a survey experience with partial data.
 *
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @param updates - Partial survey experience data to update
 * @returns ActionResponse with void or error
 */
export async function updateSurveyExperience(
  eventId: string,
  experienceId: string,
  updates: Record<string, unknown>
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate input with Zod schema
    const validated = updateSurveyExperienceSchema.parse(updates);

    // Check if event exists
    const eventError = await validateEventExists(eventId);
    if (eventError) return eventError;

    // Check if experience exists
    const expError = await validateExperienceExists(eventId, experienceId);
    if (expError) return expError;

    const eventRef = db.collection("events").doc(eventId);
    const experienceRef = eventRef.collection("experiences").doc(experienceId);
    const timestamp = Date.now();

    // Update experience with validated data + updatedAt timestamp
    await experienceRef.update({
      ...validated,
      updatedAt: timestamp,
    });

    // Update parent event's updatedAt
    await eventRef.update({ updatedAt: timestamp });

    // Revalidate event page
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse(undefined);
  } catch (error) {
    console.error("Error updating survey experience:", error);

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

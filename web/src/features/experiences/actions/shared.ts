"use server";

/**
 * Server Actions: Shared Experience Operations
 *
 * Refactored for normalized Firestore design (data-model-v4).
 *
 * This module contains type-agnostic experience operations that work
 * across all experience types (photo, video, gif).
 */

import { db } from "@/lib/firebase/admin";
import type { ActionResponse } from "./types";
import { checkAuth, validateExperienceExists, createSuccessResponse } from "./utils";

/**
 * Deletes an experience from the root /experiences collection.
 *
 * This action is type-agnostic and works for all experience types.
 *
 * @param experienceId - Experience ID
 * @returns Success/error response
 */
export async function deleteExperience(
  experienceId: string
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Check if experience exists
    const experienceError = await validateExperienceExists(experienceId);
    if (experienceError) return experienceError;

    // Delete experience from root collection
    await db.collection("experiences").doc(experienceId).delete();

    return createSuccessResponse(undefined);
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    };
  }
}

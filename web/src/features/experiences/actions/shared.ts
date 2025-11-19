"use server";

/**
 * Server Actions: Shared Experience Operations
 *
 * Part of 003-experience-schema implementation (Phase 6 - Action File Reorganization).
 *
 * This module contains type-agnostic experience operations that work
 * across all experience types (photo, video, gif, wheel, survey).
 */

import { db } from "@/lib/firebase/admin";
import type { ActionResponse } from "./types";
import { checkAuth, validateEventExists, validateExperienceExists, createSuccessResponse } from "./utils";

/**
 * Deletes an experience from an event.
 *
 * This action is type-agnostic and works for all experience types.
 * It also decrements the event's experiencesCount.
 *
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @returns Success/error response
 */
export async function deleteExperience(
  eventId: string,
  experienceId: string
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Check if event exists
    const eventError = await validateEventExists(eventId);
    if (eventError) return eventError;

    // Check if experience exists
    const experienceError = await validateExperienceExists(eventId, experienceId);
    if (experienceError) return experienceError;

    // Get references
    const eventRef = db.collection("events").doc(eventId);
    const experienceRef = eventRef.collection("experiences").doc(experienceId);

    // Get event data to safely decrement counter
    const eventDoc = await eventRef.get();
    const currentCount = eventDoc.data()?.experiencesCount || 0;

    // Delete experience and update event counter in a batch
    const batch = db.batch();
    const timestamp = Date.now();

    batch.delete(experienceRef);
    batch.update(eventRef, {
      experiencesCount: Math.max(0, currentCount - 1),
      updatedAt: timestamp,
    });

    // Note: We're not deleting experienceItems here as they're out of scope for this phase
    // In a future phase, you would also delete all related experienceItems

    await batch.commit();

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

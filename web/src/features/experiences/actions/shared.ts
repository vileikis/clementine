"use server";

/**
 * Server Actions: Shared Experience Operations
 *
 * Refactored for normalized Firestore design (data-model-v4).
 *
 * This module contains type-agnostic experience operations that work
 * across all experience types (photo, video, gif).
 */

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, validateExperienceExists, createSuccessResponse, createErrorResponse } from "./utils";

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

/**
 * Attaches an experience to an event by adding the eventId to the experience's eventIds array.
 *
 * This action is idempotent - if the eventId is already in the array, no changes are made.
 *
 * @param experienceId - Experience ID to attach
 * @param eventId - Event ID to attach to
 * @returns Success/error response
 */
export async function attachExperienceToEvent(
  experienceId: string,
  eventId: string
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Check if experience exists
    const experienceError = await validateExperienceExists(experienceId);
    if (experienceError) return experienceError;

    // Add eventId to experience's eventIds array (arrayUnion is idempotent)
    await db.collection("experiences").doc(experienceId).update({
      eventIds: FieldValue.arrayUnion(eventId),
      updatedAt: Date.now(),
    });

    // Revalidate the event page to reflect changes
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse(undefined);
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Failed to attach experience to event"
    );
  }
}

/**
 * Detaches an experience from an event by removing the eventId from the experience's eventIds array.
 *
 * This action is idempotent - if the eventId is not in the array, no changes are made.
 *
 * @param experienceId - Experience ID to detach
 * @param eventId - Event ID to detach from
 * @returns Success/error response
 */
export async function detachExperienceFromEvent(
  experienceId: string,
  eventId: string
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Check if experience exists
    const experienceError = await validateExperienceExists(experienceId);
    if (experienceError) return experienceError;

    // Remove eventId from experience's eventIds array (arrayRemove is idempotent)
    await db.collection("experiences").doc(experienceId).update({
      eventIds: FieldValue.arrayRemove(eventId),
      updatedAt: Date.now(),
    });

    // Revalidate the event page to reflect changes
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse(undefined);
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Failed to detach experience from event"
    );
  }
}

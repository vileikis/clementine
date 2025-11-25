"use server";

/**
 * Server Action: Create Photo Experience
 *
 * Creates a new photo experience with the new discriminated union schema.
 * Part of 003-experience-schema implementation (User Story 1).
 *
 * This action:
 * - Validates input using createPhotoExperienceSchema
 * - Initializes default values for config and aiConfig
 * - Writes to Firestore using Admin SDK
 * - Updates parent event's experiencesCount
 * - Revalidates the event page
 */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import {
  createPhotoExperienceSchema,
  type PhotoExperience
} from "../schemas";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, validateEventExists, createSuccessResponse, createErrorResponse } from "./utils";

/**
 * Creates a new photo experience for an event.
 *
 * @param eventId - Event ID
 * @param input - Creation data (label, type)
 * @returns ActionResponse with created PhotoExperience or error
 */
export async function createPhotoExperience(
  eventId: string,
  input: { label: string; type: "photo" }
): Promise<ActionResponse<PhotoExperience>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate input with Zod schema
    const validated = createPhotoExperienceSchema.parse(input);

    // Check if event exists
    const eventError = await validateEventExists(eventId);
    if (eventError) return eventError;

    const eventRef = db.collection("events").doc(eventId);

    // Create experience document reference
    const experienceRef = eventRef.collection("experiences").doc();
    const timestamp = Date.now();

    // Initialize PhotoExperience with new schema structure
    const photoExperience: PhotoExperience = {
      // Identity
      id: experienceRef.id,
      eventId,

      // Core configuration
      label: validated.label,
      type: "photo",
      enabled: true, // Enabled by default
      hidden: false, // Visible by default

      // Type-specific config (photo)
      config: {
        countdown: 0, // No countdown by default
        overlayFramePath: null, // No overlay by default
      },

      // Shared AI config
      aiConfig: {
        enabled: false, // AI disabled by default
        model: null, // No model by default
        prompt: null, // No prompt by default
        referenceImagePaths: null, // No references by default
        aspectRatio: "1:1", // Square format (most common)
      },

      // Audit
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Write experience and update event counter in a batch
    const batch = db.batch();
    batch.set(experienceRef, photoExperience);
    batch.update(eventRef, {
      experiencesCount: FieldValue.increment(1),
      updatedAt: timestamp,
    });

    await batch.commit();

    // Revalidate the event page to show new experience
    revalidatePath(`/events/${eventId}`);

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

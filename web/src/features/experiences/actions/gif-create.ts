"use server";

/**
 * Server Action: Create GIF Experience
 *
 * Creates a new GIF experience with the discriminated union schema.
 * Part of 004-multi-experience-editor implementation (User Story 2).
 *
 * This action:
 * - Validates input using createGifExperienceSchema
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
  createGifExperienceSchema,
  type GifExperience
} from "../lib/schemas";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, validateEventExists, createSuccessResponse, createErrorResponse } from "./utils";

/**
 * Creates a new GIF experience for an event.
 *
 * @param eventId - Event ID
 * @param input - Creation data (label, type)
 * @returns ActionResponse with created GifExperience or error
 */
export async function createGifExperience(
  eventId: string,
  input: { label: string; type: "gif" }
): Promise<ActionResponse<GifExperience>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate input with Zod schema
    const validated = createGifExperienceSchema.parse(input);

    // Check if event exists
    const eventError = await validateEventExists(eventId);
    if (eventError) return eventError;

    const eventRef = db.collection("events").doc(eventId);

    // Create experience document reference
    const experienceRef = eventRef.collection("experiences").doc();
    const timestamp = Date.now();

    // Initialize GifExperience with default configuration
    const gifExperience: GifExperience = {
      // Identity
      id: experienceRef.id,
      eventId,

      // Core configuration
      label: validated.label,
      type: "gif",
      enabled: true, // Enabled by default
      hidden: false, // Visible by default

      // Type-specific config (GIF)
      config: {
        frameCount: 5, // Default 5 frames
        intervalMs: 500, // Default 500ms between frames
        loopCount: 0, // Infinite loop by default
        countdown: 3, // Default 3 second countdown
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
    batch.set(experienceRef, gifExperience);
    batch.update(eventRef, {
      experiencesCount: FieldValue.increment(1),
      updatedAt: timestamp,
    });

    await batch.commit();

    // Revalidate the event page to show new experience
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse(gifExperience);
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

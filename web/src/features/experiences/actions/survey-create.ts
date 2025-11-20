"use server";

/**
 * Server Action: Create Survey Experience
 *
 * Creates a new survey experience with default configuration.
 * Part of 001-survey-experience implementation.
 *
 * This action:
 * - Validates input using createSurveyExperienceSchema
 * - Initializes empty stepsOrder array
 * - Writes to Firestore using Admin SDK
 * - Updates parent event's experiencesCount
 * - Revalidates the event page
 */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import {
  createSurveyExperienceSchema,
  type SurveyExperience
} from "../lib/schemas";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, validateEventExists, createSuccessResponse, createErrorResponse } from "./utils";

/**
 * Creates a new survey experience for an event.
 *
 * @param eventId - Event ID
 * @param input - Creation data (label, type)
 * @returns ActionResponse with created SurveyExperience or error
 */
export async function createSurveyExperience(
  eventId: string,
  input: { label: string; type: "survey" }
): Promise<ActionResponse<SurveyExperience>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate input with Zod schema
    const validated = createSurveyExperienceSchema.parse(input);

    // Check if event exists
    const eventError = await validateEventExists(eventId);
    if (eventError) return eventError;

    const eventRef = db.collection("events").doc(eventId);

    // Create experience document reference
    const experienceRef = eventRef.collection("experiences").doc();
    const timestamp = Date.now();

    // Initialize SurveyExperience with new schema structure
    // Note: Omit optional fields instead of setting to undefined (Firestore doesn't accept undefined)
    const surveyExperience: Omit<SurveyExperience, 'previewPath' | 'previewType'> & {
      previewPath?: string;
      previewType?: 'image' | 'gif' | 'video';
    } = {
      // Identity
      id: experienceRef.id,
      eventId,

      // Core configuration
      label: validated.label,
      type: "survey",
      enabled: true, // Enabled by default
      hidden: false, // Visible by default

      // Type-specific config (survey)
      config: {
        stepsOrder: [], // Empty steps initially
        required: false, // Survey is optional by default
        showProgressBar: true, // Show progress by default
      },

      // Audit timestamps
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Transaction: create experience + increment count
    await db.runTransaction(async (transaction) => {
      // Write experience document
      transaction.set(experienceRef, surveyExperience);

      // Increment parent event's experiencesCount
      transaction.update(eventRef, {
        experiencesCount: FieldValue.increment(1),
        updatedAt: timestamp,
      });
    });

    // Revalidate event page to show new experience
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse(surveyExperience);
  } catch (error) {
    console.error("Error creating survey experience:", error);

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

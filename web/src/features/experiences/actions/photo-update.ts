"use server";

/**
 * Server Action: Update Photo Experience
 *
 * Updates an existing photo experience with the new discriminated union schema.
 * Part of 003-experience-schema implementation (User Story 2).
 *
 * This action:
 * - Validates input using updatePhotoExperienceSchema
 * - Fetches existing experience document
 * - Migrates legacy schema if needed (User Story 3)
 * - Merges partial updates with existing config and aiConfig
 * - Writes to Firestore using Admin SDK
 * - Revalidates the experience page
 */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase/admin";
import { z } from "zod";
import {
  updatePhotoExperienceSchema,
  photoExperienceSchema,
  type PhotoExperience,
  type PhotoConfig,
  type AiConfig
} from "../lib/schemas";
import { migratePhotoExperience, stripLegacyFields } from "../lib/migration";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, validateExperienceExists, createSuccessResponse, createErrorResponse } from "./utils";

/**
 * Type for partial update input
 */
type UpdatePhotoExperienceInput = {
  label?: string;
  enabled?: boolean;
  hidden?: boolean;
  previewPath?: string;
  previewType?: "image" | "gif" | "video";
  config?: Partial<PhotoConfig>;
  aiConfig?: Partial<AiConfig>;
};

/**
 * Updates an existing photo experience for an event.
 *
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @param input - Partial update data
 * @returns ActionResponse with updated PhotoExperience or error
 */
export async function updatePhotoExperience(
  eventId: string,
  experienceId: string,
  input: UpdatePhotoExperienceInput
): Promise<ActionResponse<PhotoExperience>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate input with Zod schema
    const validated = updatePhotoExperienceSchema.parse(input);

    // Check if experience exists
    const experienceError = await validateExperienceExists(eventId, experienceId);
    if (experienceError) return experienceError;

    // Fetch existing experience document
    const experienceRef = db
      .collection("events")
      .doc(eventId)
      .collection("experiences")
      .doc(experienceId);

    const experienceDoc = await experienceRef.get();

    const existingData = experienceDoc.data();

    // Migrate legacy data if needed (User Story 3)
    let currentExperience: PhotoExperience;
    try {
      currentExperience = migratePhotoExperience(existingData);
    } catch (migrationError) {
      return createErrorResponse(
        ErrorCodes.MIGRATION_ERROR,
        migrationError instanceof Error
          ? migrationError.message
          : "Failed to migrate legacy experience"
      );
    }

    // Merge partial updates with existing data
    const updatedExperience: PhotoExperience = {
      ...currentExperience,
      // Update basic fields if provided
      ...(validated.label !== undefined && { label: validated.label }),
      ...(validated.enabled !== undefined && { enabled: validated.enabled }),
      ...(validated.hidden !== undefined && { hidden: validated.hidden }),
      ...(validated.previewPath !== undefined && {
        previewPath: validated.previewPath,
      }),
      ...(validated.previewType !== undefined && {
        previewType: validated.previewType,
      }),
      // Deep merge config object
      config: {
        ...currentExperience.config,
        ...(validated.config !== undefined && validated.config),
      },
      // Deep merge aiConfig object
      aiConfig: {
        ...currentExperience.aiConfig,
        ...(validated.aiConfig !== undefined && validated.aiConfig),
      },
      // Update timestamp
      updatedAt: Date.now(),
    };

    // Validate merged result against schema
    const validatedExperience = photoExperienceSchema.parse(updatedExperience);

    // Strip legacy fields before writing to Firestore
    const cleanExperience = stripLegacyFields(
      validatedExperience as PhotoExperience & Record<string, unknown>
    );

    // Write to Firestore
    await experienceRef.set(cleanExperience);

    // Revalidate the experience page
    revalidatePath(`/events/${eventId}/experiences/${experienceId}`);
    // Also revalidate the event page (list view)
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse(cleanExperience);
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

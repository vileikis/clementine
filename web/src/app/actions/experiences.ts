"use server";

/**
 * Server Actions for experience CRUD operations
 * Part of Phase 2 (Foundational) - Core routing structure
 * Used by Phase 4 (User Story 2) - Create New Experience Inline
 * Updated to use Admin SDK for proper permissions
 */

import {
  createExperience,
  updateExperience,
  deleteExperience,
} from "@/lib/repositories/experiences";
import { verifyAdminSecret } from "@/lib/auth";
import { createExperienceSchema, updateExperienceSchema } from "@/lib/schemas/firestore";
import type { ActionResult } from "@/lib/types/actions";

/**
 * Creates a new experience for an event
 * Server-side validation with Zod (Constitution Principle III)
 *
 * @param eventId - Event ID
 * @param data - Experience creation data (validated against createExperienceSchema)
 * @returns ActionResult with experience ID on success, or error message on failure
 */
export async function createExperienceAction(
  eventId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    // Verify admin authentication
    const auth = await verifyAdminSecret();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    // Validate input with Zod
    const validated = createExperienceSchema.safeParse(data);

    if (!validated.success) {
      const errors = validated.error.format();
      const firstError =
        errors.label?._errors[0] ||
        errors.type?._errors[0] ||
        "Invalid input";
      return { success: false, error: firstError };
    }

    // Create experience using repository
    const experienceId = await createExperience(eventId, validated.data);

    return { success: true, data: { id: experienceId } };
  } catch (error) {
    console.error("Error creating experience:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create experience",
    };
  }
}

/**
 * Updates an existing experience
 * Server-side validation with Zod (Constitution Principle III)
 *
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @param data - Partial experience data to update (validated against updateExperienceSchema)
 * @returns ActionResult with success status
 */
export async function updateExperienceAction(
  eventId: string,
  experienceId: string,
  data: unknown
): Promise<ActionResult<void>> {
  try {
    // Verify admin authentication
    const auth = await verifyAdminSecret();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    // Validate input with Zod
    const validated = updateExperienceSchema.safeParse(data);

    if (!validated.success) {
      const errors = validated.error.format();
      const firstError = Object.values(errors)
        .filter((e) => e && typeof e === "object" && "_errors" in e)
        .map((e) => (e as { _errors: string[] })._errors[0])
        .filter(Boolean)[0] || "Invalid input";
      return { success: false, error: firstError };
    }

    // Update experience using repository
    await updateExperience(eventId, experienceId, validated.data);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating experience:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update experience",
    };
  }
}

/**
 * Deletes an experience
 *
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @returns ActionResult with success status
 */
export async function deleteExperienceAction(
  eventId: string,
  experienceId: string
): Promise<ActionResult<void>> {
  try {
    // Verify admin authentication
    const auth = await verifyAdminSecret();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    // Delete experience using repository
    await deleteExperience(eventId, experienceId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting experience:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete experience",
    };
  }
}

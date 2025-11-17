"use server";

/**
 * Server Actions for experience CRUD operations
 * Part of Phase 2 (Foundational) - Core routing structure
 * Used by Phase 4 (User Story 2) - Create New Experience Inline
 */

import { addDoc, collection, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createExperienceSchema } from "@/lib/schemas/firestore";
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
    // Validate input with Zod
    const validated = createExperienceSchema.safeParse(data);

    if (!validated.success) {
      const errors = validated.error.flatten();
      const firstError =
        errors.fieldErrors.label?.[0] ||
        errors.fieldErrors.type?.[0] ||
        "Invalid input";
      return { success: false, error: firstError };
    }

    // Create experience document in Firestore
    const experiencesRef = collection(db, "events", eventId, "experiences");
    const timestamp = Date.now();

    const experienceData = {
      eventId,
      label: validated.data.label, // Already trimmed by Zod
      type: validated.data.type,
      enabled: validated.data.enabled,

      // Default capture settings
      allowCamera: true,
      allowLibrary: true,

      // AI settings
      aiEnabled: validated.data.aiEnabled,

      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const docRef = await addDoc(experiencesRef, experienceData);

    // Increment experiencesCount on parent event
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      experiencesCount: increment(1),
      updatedAt: timestamp,
    });

    return { success: true, data: { id: docRef.id } };
  } catch (error) {
    console.error("Error creating experience:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create experience",
    };
  }
}

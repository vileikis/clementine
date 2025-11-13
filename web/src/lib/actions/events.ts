"use server";

import { db } from "@/lib/firebase/admin";
import { updateEventWelcomeSchema, updateEventEndingSchema } from "@/lib/schemas/firestore";

/**
 * Server Actions for event-level mutations.
 * Phase 2 implementation: Stub actions with type signatures only.
 * Full implementation will be added in later phases.
 */

// Action response types
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Updates welcome screen configuration for an event.
 * @param eventId - Event ID
 * @param data - Partial welcome screen fields to update
 * @returns Success/error response
 */
export async function updateEventWelcome(
  eventId: string,
  data: {
    welcomeTitle?: string;
    welcomeDescription?: string;
    welcomeCtaLabel?: string;
    welcomeBackgroundImagePath?: string;
    welcomeBackgroundColorHex?: string;
  }
): Promise<ActionResponse<void>> {
  try {
    // Validate input with Zod
    const validatedData = updateEventWelcomeSchema.parse(data);

    // Check if event exists
    const eventRef = db.collection("events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Update only provided fields
    await eventRef.update({
      ...validatedData,
      updatedAt: Date.now(),
    });

    return { success: true, data: undefined };
  } catch (error) {
    // Handle Zod validation errors
    if (error && typeof error === "object" && "issues" in error) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
        },
      };
    }

    // Handle other errors
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Updates ending screen and share configuration for an event.
 * @param eventId - Event ID
 * @param data - Partial ending screen and share fields to update
 * @returns Success/error response
 */
export async function updateEventEnding(
  eventId: string,
  data: {
    endHeadline?: string;
    endBody?: string;
    endCtaLabel?: string;
    endCtaUrl?: string;
    shareAllowDownload?: boolean;
    shareAllowSystemShare?: boolean;
    shareAllowEmail?: boolean;
    shareSocials?: Array<
      "instagram" | "tiktok" | "facebook" | "x" | "snapchat" | "whatsapp" | "custom"
    >;
  }
): Promise<ActionResponse<void>> {
  try {
    // Validate input with Zod
    const validatedData = updateEventEndingSchema.parse(data);

    // Check if event exists
    const eventRef = db.collection("events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Update only provided fields
    await eventRef.update({
      ...validatedData,
      updatedAt: Date.now(),
    });

    return { success: true, data: undefined };
  } catch (error) {
    // Handle Zod validation errors
    if (error && typeof error === "object" && "issues" in error) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
        },
      };
    }

    // Handle other errors
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Updates survey configuration for an event.
 * @param eventId - Event ID
 * @param data - Partial survey configuration fields to update
 * @returns Success/error response
 */
export async function updateEventSurveyConfig(
  eventId: string,
  data: {
    surveyEnabled?: boolean;
    surveyRequired?: boolean;
    surveyStepsOrder?: string[];
  }
): Promise<ActionResponse<void>> {
  // TODO: Implement in Phase 7 (User Story 4)
  throw new Error("Not implemented");
}

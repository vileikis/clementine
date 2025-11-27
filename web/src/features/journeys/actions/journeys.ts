"use server";

/**
 * Server Actions for journey operations.
 */

import { db } from "@/lib/firebase/admin";
import {
  createJourney,
  listJourneys,
  getJourney,
  deleteJourney,
} from "../repositories/journeys.repository";
import { getEvent } from "@/features/events/repositories/events";
import { createJourneyInput } from "../schemas";
import { verifyAdminSecret } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResponse } from "./types";
import type { Journey } from "../types";

// ============================================================================
// List Journeys
// ============================================================================

/**
 * Lists all non-deleted journeys for an event.
 * Returns empty array if no journeys exist (not an error).
 * Sorted by createdAt descending (newest first).
 */
export async function listJourneysAction(
  eventId: string
): Promise<ActionResponse<Journey[]>> {
  try {
    const journeys = await listJourneys(eventId);
    return { success: true, data: journeys };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch journeys",
      },
    };
  }
}

// ============================================================================
// Get Journey
// ============================================================================

/**
 * Retrieves a single journey by ID.
 * Returns error if journey does not exist or is deleted.
 */
export async function getJourneyAction(
  eventId: string,
  journeyId: string
): Promise<ActionResponse<Journey>> {
  try {
    const journey = await getJourney(eventId, journeyId);
    if (!journey) {
      return {
        success: false,
        error: {
          code: "JOURNEY_NOT_FOUND",
          message: "Journey not found",
        },
      };
    }
    return { success: true, data: journey };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch journey",
      },
    };
  }
}

// ============================================================================
// Create Journey
// ============================================================================

/**
 * Creates a new journey for an event.
 * Validates event exists and is not archived.
 */
export async function createJourneyAction(
  input: z.infer<typeof createJourneyInput>
): Promise<ActionResponse<{ journeyId: string }>> {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: auth.error,
      },
    };
  }

  try {
    // Validate input
    const validated = createJourneyInput.parse(input);

    // Validate event exists
    const event = await getEvent(validated.eventId);
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Validate event is not archived
    if (event.status === "archived") {
      return {
        success: false,
        error: {
          code: "EVENT_ARCHIVED",
          message: "Cannot create journey for archived event",
        },
      };
    }

    // Create journey
    const journeyId = await createJourney({
      eventId: validated.eventId,
      name: validated.name,
    });

    // Revalidate cache
    revalidatePath(`/events/${validated.eventId}/journeys`);

    return { success: true, data: { journeyId } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to create journey",
      },
    };
  }
}

// ============================================================================
// Delete Journey
// ============================================================================

/**
 * Soft deletes a journey.
 * If journey is the event's activeJourneyId, clears it.
 */
export async function deleteJourneyAction(
  eventId: string,
  journeyId: string
): Promise<ActionResponse<void>> {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: auth.error,
      },
    };
  }

  try {
    // Get journey to verify it exists
    const journey = await getJourney(eventId, journeyId);
    if (!journey) {
      return {
        success: false,
        error: {
          code: "JOURNEY_NOT_FOUND",
          message: "Journey not found",
        },
      };
    }

    // Get event to check if this is the active journey
    const event = await getEvent(eventId);

    // Soft delete the journey
    await deleteJourney(eventId, journeyId);

    // If this was the active journey, clear it from the event
    if (event && event.activeJourneyId === journeyId) {
      await db.collection("events").doc(eventId).update({
        activeJourneyId: null,
        updatedAt: Date.now(),
      });
    }

    // Revalidate cache
    revalidatePath(`/events/${eventId}/journeys`);

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to delete journey",
      },
    };
  }
}

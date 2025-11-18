"use server";

/**
 * Server Actions for event-level operations.
 * Consolidated from app/actions and lib/actions for single source of truth.
 */

import { db } from "@/lib/firebase/admin";
import {
  createEvent,
  getEvent,
  listEvents,
  updateEventBranding,
  updateEventStatus,
  updateEventTitle,
  getCurrentScene,
} from "../repositories/events";
import { getCompany } from "@/features/companies/lib/repository";
import { updateEventWelcomeSchema, updateEventEndingSchema } from "../lib/validation";
import { verifyAdminSecret } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// ============================================================================
// Event CRUD Operations (Repository-based)
// ============================================================================

const createEventInput = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  showTitleOverlay: z.boolean(),
  companyId: z.string().min(1, "Company is required"),
});

export async function createEventAction(
  input: z.infer<typeof createEventInput>
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const validated = createEventInput.parse(input);

    // Validate company exists
    const company = await getCompany(validated.companyId);
    if (!company) {
      return { success: false, error: "Company not found" };
    }
    if (company.status !== "active") {
      return { success: false, error: "Company is not active" };
    }

    const eventId = await createEvent(validated);
    revalidatePath("/events");
    return { success: true, eventId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    };
  }
}

export async function getEventAction(eventId: string) {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    return { success: true, event };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch event",
    };
  }
}

export async function listEventsAction(filters?: {
  companyId?: string | null;
}) {
  try {
    const events = await listEvents(filters);
    return { success: true, events };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch events",
    };
  }
}

export async function updateEventBrandingAction(
  eventId: string,
  branding: { brandColor?: string; showTitleOverlay?: boolean }
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    await updateEventBranding(eventId, branding);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update branding",
    };
  }
}

export async function getCurrentSceneAction(eventId: string) {
  try {
    const scene = await getCurrentScene(eventId);
    if (!scene) {
      throw new Error("Scene not found");
    }
    return { success: true, scene };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch scene",
    };
  }
}

export async function updateEventStatusAction(
  eventId: string,
  status: "draft" | "live" | "archived"
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    await updateEventStatus(eventId, status);
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

const updateEventTitleInput = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
});

export async function updateEventTitleAction(
  eventId: string,
  title: string
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const validated = updateEventTitleInput.parse({ title });
    await updateEventTitle(eventId, validated.title);
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update title",
    };
  }
}

// ============================================================================
// Event Configuration Updates (Direct Firebase)
// ============================================================================

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
    // Check authentication
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
    // Check authentication
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
  _eventId: string,
  _data: {
    surveyEnabled?: boolean;
    surveyRequired?: boolean;
    surveyStepsOrder?: string[];
  }
): Promise<ActionResponse<void>> {
  // TODO: Implement in Phase 7 (User Story 4)
  throw new Error("Not implemented");
}

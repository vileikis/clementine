"use server";

/**
 * Server Actions for event-level operations.
 * Uses Firebase Admin SDK for all write operations.
 */

import { db } from "@/lib/firebase/admin";
import {
  createEvent,
  getEvent,
  listEvents,
  updateEvent,
  updateEventTheme,
  softDeleteEvent,
} from "../repositories/events.repository";
import { getProject } from "@/features/projects/repositories/projects.repository";
import {
  createEventInputSchema,
  updateEventInputSchema,
  updateEventThemeInputSchema,
} from "../schemas";
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
// Event CRUD Operations
// ============================================================================

/**
 * Create a new event under a project
 */
export async function createEventAction(input: {
  projectId: string;
  name: string;
}): Promise<ActionResponse<{ eventId: string }>> {
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
    const validated = createEventInputSchema.parse(input);

    // Fetch parent project to verify it exists and get companyId
    const project = await getProject(validated.projectId);
    if (!project) {
      return {
        success: false,
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Parent project not found",
        },
      };
    }

    if (!project.companyId) {
      return {
        success: false,
        error: {
          code: "PROJECT_NO_COMPANY",
          message: "Project must belong to a company",
        },
      };
    }

    // Create the event
    const eventId = await createEvent({
      projectId: validated.projectId,
      companyId: project.companyId,
      name: validated.name,
    });

    revalidatePath(`/[companySlug]/${validated.projectId}/events`);

    return { success: true, data: { eventId } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(", "),
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to create event",
      },
    };
  }
}

/**
 * Get a single event by ID
 */
export async function getEventAction(
  projectId: string,
  eventId: string
): Promise<ActionResponse<{ event: NonNullable<Awaited<ReturnType<typeof getEvent>>> }>> {
  try {
    const event = await getEvent(projectId, eventId);

    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found or has been deleted",
        },
      };
    }

    return { success: true, data: { event } };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch event",
      },
    };
  }
}

/**
 * List all non-deleted events for a project
 */
export async function listEventsAction(
  projectId: string
): Promise<ActionResponse<{ events: Awaited<ReturnType<typeof listEvents>> }>> {
  try {
    const events = await listEvents(projectId);
    return { success: true, data: { events } };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch events",
      },
    };
  }
}

/**
 * Update event details (name, scheduling)
 */
export async function updateEventAction(
  projectId: string,
  eventId: string,
  data: {
    name?: string;
    publishStartAt?: number | null;
    publishEndAt?: number | null;
  }
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
    // Validate input
    const validated = updateEventInputSchema.parse(data);

    // Verify event exists
    const event = await getEvent(projectId, eventId);
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Update the event
    await updateEvent(projectId, eventId, validated);

    revalidatePath(`/[companySlug]/${projectId}/events`);
    revalidatePath(`/[companySlug]/${projectId}/${eventId}`);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(", "),
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update event",
      },
    };
  }
}

/**
 * Update event theme configuration (partial updates supported)
 */
export async function updateEventThemeAction(
  projectId: string,
  eventId: string,
  data: {
    logoUrl?: string | null;
    fontFamily?: string | null;
    primaryColor?: string;
    text?: {
      color?: string;
      alignment?: "left" | "center" | "right";
    };
    button?: {
      backgroundColor?: string | null;
      textColor?: string;
      radius?: "none" | "sm" | "md" | "full";
    };
    background?: {
      color?: string;
      image?: string | null;
      overlayOpacity?: number;
    };
  }
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
    // Validate input
    const validated = updateEventThemeInputSchema.parse(data);

    // Verify event exists
    const event = await getEvent(projectId, eventId);
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Update the theme
    await updateEventTheme(projectId, eventId, validated);

    revalidatePath(`/[companySlug]/${projectId}/${eventId}/theme`);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(", "),
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update theme",
      },
    };
  }
}

/**
 * Soft-delete an event
 * If the event is active, clears Project.activeEventId
 */
export async function deleteEventAction(
  projectId: string,
  eventId: string
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
    // Verify event exists
    const event = await getEvent(projectId, eventId);
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Check if this event is the active event for the project
    const project = await getProject(projectId);
    if (project && project.activeEventId === eventId) {
      // Clear the active event
      await db.collection("projects").doc(projectId).update({
        activeEventId: null,
        updatedAt: Date.now(),
      });
    }

    // Soft delete the event
    await softDeleteEvent(projectId, eventId);

    revalidatePath(`/[companySlug]/${projectId}/events`);

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to delete event",
      },
    };
  }
}

/**
 * Set an event as the active event for its parent project
 * (Switchboard pattern)
 */
export async function setActiveEventAction(
  projectId: string,
  eventId: string
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
    // Verify project exists
    const project = await getProject(projectId);
    if (!project) {
      return {
        success: false,
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      };
    }

    // Verify event exists and belongs to project
    const event = await getEvent(projectId, eventId);
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Update project's active event
    await db.collection("projects").doc(projectId).update({
      activeEventId: eventId,
      updatedAt: Date.now(),
    });

    revalidatePath(`/[companySlug]/${projectId}/events`);

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to set active event",
      },
    };
  }
}

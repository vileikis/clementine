"use server";

/**
 * Server Actions for event-level operations.
 * Uses Firebase Admin SDK for all write operations.
 */

import {
  createEvent,
  getEvent,
  listEvents,
  updateEvent,
  updateEventTheme,
  softDeleteEvent,
  addEventExperience,
  updateEventExperience,
  removeEventExperience,
  setEventExtra,
  updateEventExtra,
  removeEventExtra,
  updateEventWelcome,
  updateEventOverlay,
} from "../repositories/events.repository";
import {
  getProject,
  updateProject,
} from "@/features/projects/repositories/projects.repository";
import {
  createEventInputSchema,
  updateEventInputSchema,
  updateEventThemeInputSchema,
  addEventExperienceInputSchema,
  updateEventExperienceInputSchema,
  removeEventExperienceInputSchema,
  setEventExtraInputSchema,
  updateEventExtraInputSchema,
  removeEventExtraInputSchema,
  updateEventWelcomeSchema,
  updateEventOverlayInputSchema,
} from "../schemas";
import type {
  AddEventExperienceInput,
  UpdateEventExperienceInput,
  RemoveEventExperienceInput,
  SetEventExtraInput,
  UpdateEventExtraInput,
  RemoveEventExtraInput,
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

    revalidatePath(`/[companySlug]/${validated.projectId}/events`, "page");

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

    revalidatePath(`/[companySlug]/${projectId}/events`, "page");
    revalidatePath(`/[companySlug]/${projectId}/${eventId}`, "page");

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

    revalidatePath(`/[companySlug]/${projectId}/${eventId}/theme`, "page");

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
      await updateProject(projectId, { activeEventId: null });
    }

    // Soft delete the event
    await softDeleteEvent(projectId, eventId);

    revalidatePath(`/[companySlug]/${projectId}/events`, "page");

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
    await updateProject(projectId, { activeEventId: eventId });

    revalidatePath(`/[companySlug]/${projectId}/events`, "page");

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

// ============================================================================
// Experience Management Actions
// ============================================================================

/**
 * Add an experience to an event's experiences array
 */
export async function addEventExperienceAction(
  input: AddEventExperienceInput
): Promise<ActionResponse<{ eventId: string }>> {
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
    const validated = addEventExperienceInputSchema.parse(input);

    // Verify event exists
    const event = await getEvent(validated.projectId, validated.eventId);
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Add the experience
    await addEventExperience(validated.projectId, validated.eventId, {
      experienceId: validated.experienceId,
      label: validated.label ?? null,
      enabled: true,
      frequency: null,
    });

    revalidatePath(`/[companySlug]/${validated.projectId}/${validated.eventId}`, "page");

    return { success: true, data: { eventId: validated.eventId } };
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
    if (error instanceof Error && error.message.includes("already attached")) {
      return {
        success: false,
        error: {
          code: "DUPLICATE_EXPERIENCE",
          message: error.message,
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to add experience",
      },
    };
  }
}

/**
 * Update an attached experience's configuration
 */
export async function updateEventExperienceAction(
  input: UpdateEventExperienceInput
): Promise<ActionResponse<{ eventId: string }>> {
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
    const validated = updateEventExperienceInputSchema.parse(input);

    // Verify event exists
    const event = await getEvent(validated.projectId, validated.eventId);
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Build updates object
    const updates: { label?: string | null; enabled?: boolean } = {};
    if (validated.label !== undefined) {
      updates.label = validated.label;
    }
    if (validated.enabled !== undefined) {
      updates.enabled = validated.enabled;
    }

    // Update the experience
    await updateEventExperience(
      validated.projectId,
      validated.eventId,
      validated.experienceId,
      updates
    );

    revalidatePath(`/[companySlug]/${validated.projectId}/${validated.eventId}`, "page");

    return { success: true, data: { eventId: validated.eventId } };
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
    if (error instanceof Error && error.message.includes("not found in event")) {
      return {
        success: false,
        error: {
          code: "EXPERIENCE_NOT_FOUND",
          message: error.message,
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update experience",
      },
    };
  }
}

/**
 * Remove an experience from an event's experiences array
 */
export async function removeEventExperienceAction(
  input: RemoveEventExperienceInput
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
    const validated = removeEventExperienceInputSchema.parse(input);

    // Verify event exists
    const event = await getEvent(validated.projectId, validated.eventId);
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Remove the experience
    await removeEventExperience(
      validated.projectId,
      validated.eventId,
      validated.experienceId
    );

    revalidatePath(`/[companySlug]/${validated.projectId}/${validated.eventId}`, "page");

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
        message: error instanceof Error ? error.message : "Failed to remove experience",
      },
    };
  }
}

// ============================================================================
// Extras Management Actions
// ============================================================================

/**
 * Set an extra slot (create or replace)
 */
export async function setEventExtraAction(
  input: SetEventExtraInput
): Promise<ActionResponse<{ eventId: string }>> {
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
    const validated = setEventExtraInputSchema.parse(input);

    // Verify event exists
    const event = await getEvent(validated.projectId, validated.eventId);
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Set the extra slot
    await setEventExtra(validated.projectId, validated.eventId, validated.slot, {
      experienceId: validated.experienceId,
      label: validated.label ?? null,
      enabled: validated.enabled,
      frequency: validated.frequency,
    });

    revalidatePath(`/[companySlug]/${validated.projectId}/${validated.eventId}`, "page");

    return { success: true, data: { eventId: validated.eventId } };
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
        message: error instanceof Error ? error.message : "Failed to set extra",
      },
    };
  }
}

/**
 * Update an extra slot's configuration
 */
export async function updateEventExtraAction(
  input: UpdateEventExtraInput
): Promise<ActionResponse<{ eventId: string }>> {
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
    const validated = updateEventExtraInputSchema.parse(input);

    // Verify event exists
    const event = await getEvent(validated.projectId, validated.eventId);
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Build updates object
    const updates: {
      label?: string | null;
      enabled?: boolean;
      frequency?: "always" | "once_per_session";
    } = {};
    if (validated.label !== undefined) {
      updates.label = validated.label;
    }
    if (validated.enabled !== undefined) {
      updates.enabled = validated.enabled;
    }
    if (validated.frequency !== undefined) {
      updates.frequency = validated.frequency;
    }

    // Update the extra slot
    await updateEventExtra(
      validated.projectId,
      validated.eventId,
      validated.slot,
      updates
    );

    revalidatePath(`/[companySlug]/${validated.projectId}/${validated.eventId}`, "page");

    return { success: true, data: { eventId: validated.eventId } };
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
    if (error instanceof Error && error.message.includes("is empty")) {
      return {
        success: false,
        error: {
          code: "EXTRA_SLOT_EMPTY",
          message: error.message,
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update extra",
      },
    };
  }
}

/**
 * Remove an extra from a slot (set to null)
 */
export async function removeEventExtraAction(
  input: RemoveEventExtraInput
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
    const validated = removeEventExtraInputSchema.parse(input);

    // Verify event exists
    const event = await getEvent(validated.projectId, validated.eventId);
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }

    // Remove the extra
    await removeEventExtra(validated.projectId, validated.eventId, validated.slot);

    revalidatePath(`/[companySlug]/${validated.projectId}/${validated.eventId}`, "page");

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
        message: error instanceof Error ? error.message : "Failed to remove extra",
      },
    };
  }
}

// ============================================================================
// Welcome Screen Actions
// ============================================================================

/**
 * Update event welcome screen configuration (partial updates supported)
 */
export async function updateEventWelcomeAction(
  projectId: string,
  eventId: string,
  data: unknown
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
    const validated = updateEventWelcomeSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validated.error.issues[0]?.message ?? "Invalid input",
        },
      };
    }

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

    // Update the welcome screen configuration
    await updateEventWelcome(projectId, eventId, validated.data);

    revalidatePath(`/[companySlug]/${projectId}/${eventId}`, "page");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("updateEventWelcomeAction error:", error);
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update welcome screen",
      },
    };
  }
}

// ============================================================================
// Overlay Configuration Actions
// ============================================================================

/**
 * Update event overlay configuration (partial updates supported)
 */
export async function updateEventOverlayAction(
  projectId: string,
  eventId: string,
  data: unknown
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
    const validated = updateEventOverlayInputSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validated.error.issues[0]?.message ?? "Invalid input",
        },
      };
    }

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

    // Update the overlay configuration
    await updateEventOverlay(projectId, eventId, validated.data);

    revalidatePath(`/[companySlug]/${projectId}/${eventId}/overlays`, "page");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("updateEventOverlayAction error:", error);
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update overlay configuration",
      },
    };
  }
}

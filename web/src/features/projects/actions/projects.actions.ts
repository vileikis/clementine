"use server";

/**
 * Server Actions for project-level operations.
 * Consolidated from app/actions and lib/actions for single source of truth.
 */

import { db } from "@/lib/firebase/admin";
import {
  createProject,
  getProject,
  listProjects,
  updateProjectBranding,
  updateProjectStatus,
  updateProjectName,
  deleteProject,
} from "../repositories/projects.repository";
import { getCompany } from "@/features/companies/repositories/companies.repository";
import {
  updateEventThemeSchema,
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
// Event CRUD Operations (Repository-based)
// ============================================================================

const createEventInput = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  ownerId: z.string().min(1, "Owner is required"),
});

export async function createEventAction(
  input: z.infer<typeof createEventInput>
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: auth.error
      }
    };
  }

  try {
    const validated = createEventInput.parse(input);

    // Validate owner (company) exists and is active
    const company = await getCompany(validated.ownerId);
    if (!company) {
      return {
        success: false,
        error: {
          code: "OWNER_NOT_FOUND",
          message: "Owner (company) not found"
        }
      };
    }
    if (company.status !== "active") {
      return {
        success: false,
        error: {
          code: "OWNER_INACTIVE",
          message: "Owner (company) is not active"
        }
      };
    }

    const eventId = await createEvent({
      name: validated.name,
      ownerId: validated.ownerId,
      primaryColor: validated.primaryColor,
    });
    revalidatePath("/events");
    return { success: true, eventId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
        }
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to create event"
      },
    };
  }
}

export async function getEventAction(eventId: string) {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found"
        }
      };
    }
    return { success: true, event };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch event"
      }
    };
  }
}

export async function listEventsAction(filters?: {
  ownerId?: string | null;
}) {
  try {
    const events = await listEvents(filters);
    return { success: true, events };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch events"
      }
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
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: auth.error
      }
    };
  }

  try {
    await updateEventBranding(eventId, branding);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update branding"
      }
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
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: auth.error
      }
    };
  }

  try {
    await updateEventStatus(eventId, status);
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update status"
      }
    };
  }
}

const updateEventNameInput = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
});

export async function updateEventNameAction(
  eventId: string,
  name: string
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: auth.error
      }
    };
  }

  try {
    const validated = updateEventNameInput.parse({ name });
    await updateEventName(eventId, validated.name);
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
        }
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update name"
      }
    };
  }
}

// ============================================================================
// Event Configuration Updates (Direct Firebase)
// ============================================================================

/**
 * Updates theme configuration for an event.
 * Uses nested object structure (event.theme.*)
 * @param eventId - Event ID
 * @param data - Partial theme configuration fields to update
 * @returns Success/error response
 */
export async function updateEventTheme(
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
    const validatedData = updateEventThemeSchema.parse(data);

    // Build update object with dot notation for nested fields
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    // Dynamic field mapping using Object.entries
    // Top-level theme fields
    if (validatedData.logoUrl !== undefined) {
      updateData["theme.logoUrl"] = validatedData.logoUrl;
    }
    if (validatedData.fontFamily !== undefined) {
      updateData["theme.fontFamily"] = validatedData.fontFamily;
    }
    if (validatedData.primaryColor !== undefined) {
      updateData["theme.primaryColor"] = validatedData.primaryColor;
    }

    // Nested text fields
    if (validatedData.text) {
      Object.entries(validatedData.text).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[`theme.text.${key}`] = value;
        }
      });
    }

    // Nested button fields
    if (validatedData.button) {
      Object.entries(validatedData.button).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[`theme.button.${key}`] = value;
        }
      });
    }

    // Nested background fields
    if (validatedData.background) {
      Object.entries(validatedData.background).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[`theme.background.${key}`] = value;
        }
      });
    }

    // Update only provided fields - trust Firebase, catch NOT_FOUND error
    const eventRef = db.collection("events").doc(eventId);
    try {
      await eventRef.update(updateData);
    } catch (updateError: unknown) {
      // Firestore throws code 5 for NOT_FOUND
      if (updateError && typeof updateError === "object" && "code" in updateError && updateError.code === 5) {
        return {
          success: false,
          error: {
            code: "EVENT_NOT_FOUND",
            message: "Event not found",
          },
        };
      }
      throw updateError;
    }

    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);

    return { success: true, data: undefined };
  } catch (error) {
    // Handle Zod validation errors with detailed field paths
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
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
 * Updates the active journey for an event (Switchboard pattern).
 * Controls which journey is currently live for all connected guests.
 * @param eventId - Event ID
 * @param activeJourneyId - Journey ID to activate, or null to deactivate
 * @returns Success/error response
 */
export async function updateEventSwitchboardAction(
  eventId: string,
  activeJourneyId: string | null
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
    const validatedData = z
      .object({
        activeJourneyId: z.string().nullable(),
      })
      .parse({ activeJourneyId });

    // Update event - trust Firebase, catch NOT_FOUND error
    const eventRef = db.collection("events").doc(eventId);
    try {
      await eventRef.update({
        activeJourneyId: validatedData.activeJourneyId,
        updatedAt: Date.now(),
      });
    } catch (updateError: unknown) {
      // Firestore throws code 5 for NOT_FOUND
      if (updateError && typeof updateError === "object" && "code" in updateError && updateError.code === 5) {
        return {
          success: false,
          error: {
            code: "EVENT_NOT_FOUND",
            message: "Event not found",
          },
        };
      }
      throw updateError;
    }

    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);

    return { success: true, data: undefined };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
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

// ============================================================================
// Event Delete Operation
// ============================================================================

/**
 * Soft delete an event (mark as deleted, hide from UI)
 */
export async function deleteEventAction(eventId: string) {
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
    await deleteEvent(eventId);
    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Event not found") {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to delete event",
      },
    };
  }
}

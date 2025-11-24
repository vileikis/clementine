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
} from "../repositories/events";
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
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  buttonColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  companyId: z.string().min(1, "Company is required"),
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

    // Validate company exists
    const company = await getCompany(validated.companyId);
    if (!company) {
      return {
        success: false,
        error: {
          code: "COMPANY_NOT_FOUND",
          message: "Company not found"
        }
      };
    }
    if (company.status !== "active") {
      return {
        success: false,
        error: {
          code: "COMPANY_INACTIVE",
          message: "Company is not active"
        }
      };
    }

    const eventId = await createEvent({
      title: validated.title,
      companyId: validated.companyId,
      buttonColor: validated.buttonColor,
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
  companyId?: string | null;
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
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: auth.error
      }
    };
  }

  try {
    const validated = updateEventTitleInput.parse({ title });
    await updateEventTitle(eventId, validated.title);
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
        message: error instanceof Error ? error.message : "Failed to update title"
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
    buttonColor?: string;
    buttonTextColor?: string;
    backgroundColor?: string;
    backgroundImage?: string;
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
    const fieldMappings: Record<string, string> = {
      buttonColor: "theme.buttonColor",
      buttonTextColor: "theme.buttonTextColor",
      backgroundColor: "theme.backgroundColor",
      backgroundImage: "theme.backgroundImage",
    };

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined && fieldMappings[key]) {
        updateData[fieldMappings[key]] = value;
      }
    });

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

"use server";

/**
 * Server Actions for experience CRUD operations.
 * Phase 6 implementation: Full CRUD operations for photo experiences.
 */

import { db } from "@/lib/firebase/admin";
import { z } from "zod";
import { verifyAdminSecret } from "@/lib/auth";
import type { ExperienceType, PreviewType } from "@/lib/types/firestore";

// Action response types
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Create experience schema
const createExperienceSchema = z.object({
  label: z.string().min(1).max(50),
  type: z.enum(["photo", "video", "gif", "wheel"]),
  enabled: z.boolean().default(true),
  aiEnabled: z.boolean().default(false),
});

/**
 * Creates a new experience for an event.
 * @param eventId - Event ID
 * @param data - Experience creation data
 * @returns Success response with experience ID, or error
 */
export async function createExperience(
  eventId: string,
  data: {
    label: string;
    type: ExperienceType;
    enabled?: boolean;
    aiEnabled?: boolean;
  }
): Promise<ActionResponse<{ id: string }>> {
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

    // Validate input
    const parsed = createExperienceSchema.parse(data);

    // Check if event exists
    const eventRef = db.collection("events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: `Event with ID ${eventId} not found`,
        },
      };
    }

    // Create experience document
    const experienceRef = eventRef.collection("experiences").doc();
    const timestamp = Date.now();

    const experienceData = {
      id: experienceRef.id,
      eventId,
      label: parsed.label,
      type: parsed.type,
      enabled: parsed.enabled,

      // Default capture settings
      allowCamera: true,
      allowLibrary: true,

      // AI settings
      aiEnabled: parsed.aiEnabled,

      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Write experience document and update event counter in a batch
    const batch = db.batch();
    batch.set(experienceRef, experienceData);
    batch.update(eventRef, {
      experiencesCount: (eventDoc.data()?.experiencesCount || 0) + 1,
      updatedAt: timestamp,
    });

    await batch.commit();

    return {
      success: true,
      data: { id: experienceRef.id },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map((e) => e.message).join(", "),
        },
      };
    }

    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    };
  }
}

// Update experience schema
const updateExperienceSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),
  previewPath: z.string().optional(),
  previewType: z.enum(["image", "gif", "video"]).optional(),
  allowCamera: z.boolean().optional(),
  allowLibrary: z.boolean().optional(),
  maxDurationMs: z.number().int().positive().max(60000).optional(),
  frameCount: z.number().int().min(2).max(20).optional(),
  captureIntervalMs: z.number().int().positive().optional(),
  overlayFramePath: z.string().optional(),
  overlayLogoPath: z.string().optional(),
  aiEnabled: z.boolean().optional(),
  aiModel: z.enum(["nanobanana"]).optional(),
  aiPrompt: z.string().max(600).optional(),
  aiReferenceImagePaths: z.array(z.string()).optional(),
});

/**
 * Updates an existing experience.
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @param data - Partial experience fields to update
 * @returns Success/error response
 */
export async function updateExperience(
  eventId: string,
  experienceId: string,
  data: {
    label?: string;
    enabled?: boolean;
    previewPath?: string;
    previewType?: PreviewType;
    allowCamera?: boolean;
    allowLibrary?: boolean;
    maxDurationMs?: number;
    frameCount?: number;
    captureIntervalMs?: number;
    overlayFramePath?: string;
    overlayLogoPath?: string;
    aiEnabled?: boolean;
    aiModel?: string;
    aiPrompt?: string;
    aiReferenceImagePaths?: string[];
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

    // Validate input
    const parsed = updateExperienceSchema.parse(data);

    // Check if event exists
    const eventRef = db.collection("events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: `Event with ID ${eventId} not found`,
        },
      };
    }

    // Check if experience exists
    const experienceRef = eventRef.collection("experiences").doc(experienceId);
    const experienceDoc = await experienceRef.get();

    if (!experienceDoc.exists) {
      return {
        success: false,
        error: {
          code: "EXPERIENCE_NOT_FOUND",
          message: `Experience with ID ${experienceId} not found`,
        },
      };
    }

    // Update experience - explicitly handle clearing fields
    const updateData: Record<string, unknown> = {
      ...parsed,
      updatedAt: Date.now(),
    };

    // Handle clearing optional fields when explicitly set to undefined
    if (data.overlayFramePath === undefined || data.overlayFramePath === "") {
      updateData.overlayFramePath = null;
    }
    if (data.overlayLogoPath === undefined || data.overlayLogoPath === "") {
      updateData.overlayLogoPath = null;
    }
    if (data.aiModel === undefined || data.aiModel === "") {
      updateData.aiModel = null;
    }
    if (data.aiPrompt === undefined || data.aiPrompt === "") {
      updateData.aiPrompt = null;
    }
    if (data.aiReferenceImagePaths === undefined || data.aiReferenceImagePaths?.length === 0) {
      updateData.aiReferenceImagePaths = null;
    }

    await experienceRef.update(updateData);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map((e) => e.message).join(", "),
        },
      };
    }

    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    };
  }
}

/**
 * Deletes an experience from an event.
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @returns Success/error response
 */
export async function deleteExperience(
  eventId: string,
  experienceId: string
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

    // Check if event exists
    const eventRef = db.collection("events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: `Event with ID ${eventId} not found`,
        },
      };
    }

    // Check if experience exists
    const experienceRef = eventRef.collection("experiences").doc(experienceId);
    const experienceDoc = await experienceRef.get();

    if (!experienceDoc.exists) {
      return {
        success: false,
        error: {
          code: "EXPERIENCE_NOT_FOUND",
          message: `Experience with ID ${experienceId} not found`,
        },
      };
    }

    // Delete experience and update event counter in a batch
    const batch = db.batch();
    const timestamp = Date.now();

    batch.delete(experienceRef);
    const currentCount = eventDoc.data()?.experiencesCount || 0;
    batch.update(eventRef, {
      experiencesCount: Math.max(0, currentCount - 1),
      updatedAt: timestamp,
    });

    // Note: We're not deleting experienceItems here as they're out of scope for this phase
    // In a future phase, you would also delete all related experienceItems

    await batch.commit();

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    };
  }
}

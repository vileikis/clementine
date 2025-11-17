"use server";

/**
 * Server Actions for experience CRUD operations.
 * Phase 6 implementation: Full CRUD operations for photo experiences.
 */

import { db, storage as bucket } from "@/lib/firebase/admin";
import { z } from "zod";
import { verifyAdminSecret } from "@/lib/auth";
import type { ExperienceType, PreviewType, AspectRatio } from "@/lib/types/firestore";

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

// Update experience schema (aligned with 001-photo-experience-tweaks)
const updateExperienceSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),
  previewPath: z.string().optional(),
  previewType: z.enum(["image", "gif", "video"]).optional(),
  countdownEnabled: z.boolean().optional(),
  countdownSeconds: z.number().int().min(0).max(10).optional(),
  overlayFramePath: z.string().optional(),
  aiEnabled: z.boolean().optional(),
  aiModel: z.enum(["nanobanana"]).optional(),
  aiPrompt: z.string().max(600).optional(),
  aiReferenceImagePaths: z.array(z.string()).optional(),
  aiAspectRatio: z.enum(["1:1", "3:4", "4:5", "9:16", "16:9"]).optional(),
});

/**
 * Updates an existing experience.
 * Updated in 001-photo-experience-tweaks to support new fields.
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
    countdownEnabled?: boolean;
    countdownSeconds?: number;
    overlayFramePath?: string;
    aiEnabled?: boolean;
    aiModel?: string;
    aiPrompt?: string;
    aiReferenceImagePaths?: string[];
    aiAspectRatio?: AspectRatio;
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
    if (data.previewPath === undefined || data.previewPath === "") {
      updateData.previewPath = null;
      updateData.previewType = null;
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

// ============================================================================
// Media Upload Operations (001-photo-experience-tweaks)
// ============================================================================

/**
 * Helper function to detect file type from MIME type
 */
function detectFileType(file: File): "image" | "gif" | "video" {
  if (file.type === "image/gif") return "gif";
  if (file.type.startsWith("video/")) return "video";
  return "image";
}

/**
 * Helper function to extract storage path from public URL
 * Handles both formats:
 * - storage.googleapis.com/{bucket}/{path}
 * - firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}
 */
function extractStoragePath(publicUrl: string): string {
  try {
    const url = new URL(publicUrl);

    // Format: storage.googleapis.com/{bucket}/{path}
    if (url.hostname === "storage.googleapis.com") {
      // Path is everything after the bucket name (first segment)
      const pathSegments = url.pathname.split("/").filter(Boolean);
      if (pathSegments.length >= 2) {
        // Skip bucket name (first segment), return rest of path
        return pathSegments.slice(1).join("/");
      }
    }

    // Format: firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}
    if (url.hostname === "firebasestorage.googleapis.com") {
      const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);
      if (pathMatch) {
        return decodeURIComponent(pathMatch[1]);
      }
    }

    throw new Error("Could not extract storage path from URL");
  } catch (error) {
    throw new Error(`Invalid storage URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Upload Preview Media
 *
 * Uploads preview media (image/GIF/video) to Firebase Storage and returns public URL.
 * If experience already has preview media, deletes old file before uploading new one.
 *
 * @param eventId - Event ID containing the experience
 * @param experienceId - Experience ID to update
 * @param file - File object from form input
 * @returns Object with publicUrl, fileType, and sizeBytes
 */
export async function uploadPreviewMedia(
  eventId: string,
  experienceId: string,
  file: File
): Promise<ActionResponse<{ publicUrl: string; fileType: PreviewType; sizeBytes: number }>> {
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

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
        },
      };
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "File too large. Maximum size: 10MB",
        },
      };
    }

    // Check if experience exists
    const eventRef = db.collection("events").doc(eventId);
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

    // Delete old preview media if exists
    const experienceData = experienceDoc.data();
    if (experienceData?.previewPath) {
      try {
        const oldPath = extractStoragePath(experienceData.previewPath);
        await bucket.file(oldPath).delete();
      } catch (error) {
        console.error("Failed to delete old preview media:", error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new file
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const storagePath = `events/${eventId}/experiences/${experienceId}/preview/${filename}`;
    const fileRef = bucket.file(storagePath);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
      public: true,
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    const fileType = detectFileType(file);

    return {
      success: true,
      data: {
        publicUrl,
        fileType,
        sizeBytes: file.size,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: error instanceof Error ? error.message : "Failed to upload preview media",
      },
    };
  }
}

/**
 * Delete Preview Media
 *
 * Deletes preview media file from Firebase Storage AND clears fields from Firestore.
 * This is an immediate, complete deletion to prevent deadlock scenarios where
 * the file is deleted but Firestore still references it.
 *
 * @param eventId - Event ID containing the experience
 * @param experienceId - Experience ID
 * @param previewPath - Public URL of preview media to delete
 * @returns Success/error response
 */
export async function deletePreviewMedia(
  eventId: string,
  experienceId: string,
  previewPath: string
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

    // Check if experience exists
    const eventRef = db.collection("events").doc(eventId);
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

    // Delete file from Storage
    try {
      const storagePath = extractStoragePath(previewPath);
      await bucket.file(storagePath).delete();
    } catch (error) {
      console.error("Failed to delete preview media from storage:", error);
      // Continue to clear Firestore fields even if storage deletion fails
      // (file might already be deleted)
    }

    // Clear preview fields from Firestore immediately
    await experienceRef.update({
      previewPath: null,
      previewType: null,
      updatedAt: Date.now(),
    });

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

/**
 * Upload Frame Overlay
 *
 * Uploads frame overlay image (PNG recommended) to Firebase Storage and returns public URL.
 * If experience already has a frame overlay, deletes old file before uploading new one.
 * Added in 001-photo-experience-tweaks (User Story 4 - Priority P2).
 *
 * @param eventId - Event ID containing the experience
 * @param experienceId - Experience ID to update
 * @param file - File object from form input (PNG recommended)
 * @returns Object with publicUrl and sizeBytes
 */
export async function uploadFrameOverlay(
  eventId: string,
  experienceId: string,
  file: File
): Promise<ActionResponse<{ publicUrl: string; sizeBytes: number }>> {
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

    // Validate file type (PNG recommended for transparency)
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid file type. Allowed: ${allowedTypes.join(", ")}. PNG recommended for transparency.`,
        },
      };
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "File too large. Maximum size: 10MB",
        },
      };
    }

    // Check if experience exists
    const eventRef = db.collection("events").doc(eventId);
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

    // Delete old frame overlay if exists
    const experienceData = experienceDoc.data();
    if (experienceData?.overlayFramePath) {
      try {
        const oldPath = extractStoragePath(experienceData.overlayFramePath);
        await bucket.file(oldPath).delete();
      } catch (error) {
        console.error("Failed to delete old frame overlay:", error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new file
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const storagePath = `events/${eventId}/experiences/${experienceId}/overlay/${filename}`;
    const fileRef = bucket.file(storagePath);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
      public: true,
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    return {
      success: true,
      data: {
        publicUrl,
        sizeBytes: file.size,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: error instanceof Error ? error.message : "Failed to upload frame overlay",
      },
    };
  }
}

/**
 * Delete Frame Overlay
 *
 * Deletes frame overlay file from Firebase Storage AND clears field from Firestore.
 * Added in 001-photo-experience-tweaks (User Story 4 - Priority P2).
 *
 * @param eventId - Event ID containing the experience
 * @param experienceId - Experience ID
 * @param overlayFramePath - Public URL of frame overlay to delete
 * @returns Success/error response
 */
export async function deleteFrameOverlay(
  eventId: string,
  experienceId: string,
  overlayFramePath: string
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

    // Check if experience exists
    const eventRef = db.collection("events").doc(eventId);
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

    // Delete file from Storage
    try {
      const storagePath = extractStoragePath(overlayFramePath);
      await bucket.file(storagePath).delete();
    } catch (error) {
      console.error("Failed to delete frame overlay from storage:", error);
      // Continue to clear Firestore field even if storage deletion fails
    }

    // Clear overlay field from Firestore
    await experienceRef.update({
      overlayFramePath: null,
      updatedAt: Date.now(),
    });

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

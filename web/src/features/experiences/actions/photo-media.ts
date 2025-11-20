"use server";

/**
 * Server Actions: Photo Experience Media Upload/Delete
 *
 * Part of 003-experience-schema implementation (Phase 6 - Action File Reorganization).
 *
 * This module handles:
 * - Preview media (image/GIF/video) upload and deletion
 * - Frame overlay (image) upload and deletion
 * - Firebase Storage operations
 */

import { storage as bucket } from "@/lib/firebase/admin";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, getExperienceDocument, createErrorResponse, createSuccessResponse } from "./utils";
import type { PreviewType } from "../lib/schemas";

/**
 * Helper function to detect file type from MIME type
 */
function detectFileType(file: File): PreviewType {
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
    throw new Error(
      `Invalid storage URL: ${error instanceof Error ? error.message : "Unknown error"}`
    );
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
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid file type. Allowed: ${allowedTypes.join(", ")}`
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "File too large. Maximum size: 10MB"
      );
    }

    // Get experience document (validates existence and returns doc in one read)
    const result = await getExperienceDocument(eventId, experienceId);
    if ("error" in result) return result.error;

    const experienceDoc = result.doc;
    const experienceData = experienceDoc.data();
    const experienceRef = experienceDoc.ref;

    // Delete old preview media if exists
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

    return createSuccessResponse({
      publicUrl,
      fileType,
      sizeBytes: file.size,
    });
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.UPLOAD_ERROR,
      error instanceof Error ? error.message : "Failed to upload preview media"
    );
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
    const authError = await checkAuth();
    if (authError) return authError;

    // Get experience document (validates existence and returns doc in one read)
    const result = await getExperienceDocument(eventId, experienceId);
    if ("error" in result) return result.error;

    const experienceRef = result.doc.ref;

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

    return createSuccessResponse(undefined);
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.DELETE_ERROR,
      error instanceof Error ? error.message : "Failed to delete preview media"
    );
  }
}

/**
 * Upload Frame Overlay
 *
 * Uploads frame overlay image (PNG recommended) to Firebase Storage and returns public URL.
 * If experience already has a frame overlay, deletes old file before uploading new one.
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
    const authError = await checkAuth();
    if (authError) return authError;

    // Validate file type (PNG recommended for transparency)
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid file type. Allowed: ${allowedTypes.join(", ")}. PNG recommended for transparency.`
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "File too large. Maximum size: 10MB"
      );
    }

    // Get experience document (validates existence and returns doc in one read)
    const result = await getExperienceDocument(eventId, experienceId);
    if ("error" in result) return result.error;

    const experienceDoc = result.doc;
    const experienceData = experienceDoc.data();
    const experienceRef = experienceDoc.ref;

    // Delete old frame overlay if exists
    if (experienceData?.overlayFramePath || experienceData?.config?.overlayFramePath) {
      try {
        const oldPath = extractStoragePath(
          experienceData.config?.overlayFramePath || experienceData.overlayFramePath
        );
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

    return createSuccessResponse({
      publicUrl,
      sizeBytes: file.size,
    });
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.UPLOAD_ERROR,
      error instanceof Error ? error.message : "Failed to upload frame overlay"
    );
  }
}

/**
 * Delete Frame Overlay
 *
 * Deletes frame overlay file from Firebase Storage AND clears field from Firestore.
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
    const authError = await checkAuth();
    if (authError) return authError;

    // Get experience document (validates existence and returns doc in one read)
    const result = await getExperienceDocument(eventId, experienceId);
    if ("error" in result) return result.error;

    const experienceDoc = result.doc;
    const experienceData = experienceDoc.data();
    const experienceRef = experienceDoc.ref;

    // Delete file from Storage
    try {
      const storagePath = extractStoragePath(overlayFramePath);
      await bucket.file(storagePath).delete();
    } catch (error) {
      console.error("Failed to delete frame overlay from storage:", error);
      // Continue to clear Firestore field even if storage deletion fails
    }

    // Clear overlay field from Firestore (handle both new and legacy schemas)

    if (experienceData?.config) {
      // New schema: clear config.overlayFramePath
      await experienceRef.update({
        "config.overlayFramePath": null,
        updatedAt: Date.now(),
      });
    } else {
      // Legacy schema: clear overlayFramePath
      await experienceRef.update({
        overlayFramePath: null,
        updatedAt: Date.now(),
      });
    }

    return createSuccessResponse(undefined);
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.DELETE_ERROR,
      error instanceof Error ? error.message : "Failed to delete frame overlay"
    );
  }
}

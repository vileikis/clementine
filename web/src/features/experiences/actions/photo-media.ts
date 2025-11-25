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
import type { PreviewType } from "../schemas";

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
 * @param experienceId - Experience ID to update
 * @param file - File object from form input
 * @returns Object with publicUrl, fileType, and sizeBytes
 */
export async function uploadPreviewMedia(
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
    const result = await getExperienceDocument(experienceId);
    if ("error" in result) return result.error;

    const experienceDoc = result.doc;
    const experienceData = experienceDoc.data();

    // Delete old preview media if exists
    if (experienceData?.previewMediaUrl) {
      try {
        const oldPath = extractStoragePath(experienceData.previewMediaUrl);
        await bucket.file(oldPath).delete();
      } catch (error) {
        console.error("Failed to delete old preview media:", error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new file
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const storagePath = `experiences/${experienceId}/preview/${filename}`;
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
 * @param experienceId - Experience ID
 * @param previewMediaUrl - Public URL of preview media to delete
 * @returns Success/error response
 */
export async function deletePreviewMedia(
  experienceId: string,
  previewMediaUrl: string
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Get experience document (validates existence and returns doc in one read)
    const result = await getExperienceDocument(experienceId);
    if ("error" in result) return result.error;

    const experienceRef = result.doc.ref;

    // Delete file from Storage
    try {
      const storagePath = extractStoragePath(previewMediaUrl);
      await bucket.file(storagePath).delete();
    } catch (error) {
      console.error("Failed to delete preview media from storage:", error);
      // Continue to clear Firestore fields even if storage deletion fails
      // (file might already be deleted)
    }

    // Clear preview fields from Firestore immediately using FieldValue.delete()
    const { FieldValue } = await import("firebase-admin/firestore");
    await experienceRef.update({
      previewMediaUrl: FieldValue.delete(),
      previewMediaType: FieldValue.delete(),
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
 * @param experienceId - Experience ID to update
 * @param file - File object from form input (PNG recommended)
 * @returns Object with publicUrl and sizeBytes
 */
export async function uploadFrameOverlay(
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
    const result = await getExperienceDocument(experienceId);
    if ("error" in result) return result.error;

    const experienceDoc = result.doc;
    const experienceData = experienceDoc.data();

    // Delete old frame overlay if exists
    if (experienceData?.captureConfig?.overlayUrl) {
      try {
        const oldPath = extractStoragePath(experienceData.captureConfig.overlayUrl);
        await bucket.file(oldPath).delete();
      } catch (error) {
        console.error("Failed to delete old frame overlay:", error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new file
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const storagePath = `experiences/${experienceId}/overlay/${filename}`;
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
 * @param experienceId - Experience ID
 * @param overlayUrl - Public URL of frame overlay to delete
 * @returns Success/error response
 */
export async function deleteFrameOverlay(
  experienceId: string,
  overlayUrl: string
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Get experience document (validates existence and returns doc in one read)
    const result = await getExperienceDocument(experienceId);
    if ("error" in result) return result.error;

    const experienceRef = result.doc.ref;

    // Delete file from Storage
    try {
      const storagePath = extractStoragePath(overlayUrl);
      await bucket.file(storagePath).delete();
    } catch (error) {
      console.error("Failed to delete frame overlay from storage:", error);
      // Continue to clear Firestore field even if storage deletion fails
    }

    // Clear overlay field from Firestore using FieldValue.delete()
    const { FieldValue } = await import("firebase-admin/firestore");
    await experienceRef.update({
      "captureConfig.overlayUrl": FieldValue.delete(),
      updatedAt: Date.now(),
    });

    return createSuccessResponse(undefined);
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.DELETE_ERROR,
      error instanceof Error ? error.message : "Failed to delete frame overlay"
    );
  }
}

"use server";

/**
 * Server Actions: Shared Experience Operations
 *
 * Refactored for normalized Firestore design (data-model-v4).
 *
 * This module contains type-agnostic experience operations that work
 * across all experience types (photo, video, gif).
 */

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { db, storage as bucket } from "@/lib/firebase/admin";
import type { ActionResponse } from "./types";
import { ErrorCodes } from "./types";
import { checkAuth, getExperienceDocument, validateExperienceExists, createSuccessResponse, createErrorResponse } from "./utils";

/**
 * Helper function to extract storage path from public URL
 * Handles both formats:
 * - storage.googleapis.com/{bucket}/{path}
 * - firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}
 */
function extractStoragePath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);

    // Format: storage.googleapis.com/{bucket}/{path}
    if (url.hostname === "storage.googleapis.com") {
      const pathSegments = url.pathname.split("/").filter(Boolean);
      if (pathSegments.length >= 2) {
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

    return null;
  } catch {
    return null;
  }
}

/**
 * Helper function to delete a file from Firebase Storage
 * Silently ignores errors (file may already be deleted)
 */
async function deleteStorageFile(publicUrl: string): Promise<void> {
  const storagePath = extractStoragePath(publicUrl);
  if (!storagePath) return;

  try {
    await bucket.file(storagePath).delete();
  } catch (error) {
    // Silently ignore - file may already be deleted
    console.warn(`Failed to delete storage file: ${storagePath}`, error);
  }
}

/**
 * Deletes an experience from the root /experiences collection.
 *
 * This action is type-agnostic and works for all experience types.
 * It also cleans up associated storage assets:
 * - previewMediaUrl
 * - aiPhotoConfig.referenceImageUrls (for photo/gif types)
 * - aiVideoConfig.referenceImageUrls (for video type)
 * - captureConfig.overlayUrl (for photo type)
 *
 * @param experienceId - Experience ID
 * @returns Success/error response
 */
export async function deleteExperience(
  experienceId: string
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Get experience document (validates existence and returns doc in one read)
    const result = await getExperienceDocument(experienceId);
    if ("error" in result) return result.error;

    const experienceDoc = result.doc;
    const experienceData = experienceDoc.data();

    // Clean up storage assets before deleting document
    const deletePromises: Promise<void>[] = [];

    // Delete preview media if present
    if (experienceData?.previewMediaUrl) {
      deletePromises.push(deleteStorageFile(experienceData.previewMediaUrl));
    }

    // Delete overlay URL if present (photo type)
    if (experienceData?.captureConfig?.overlayUrl) {
      deletePromises.push(deleteStorageFile(experienceData.captureConfig.overlayUrl));
    }

    // Delete AI photo reference images if present (photo/gif types)
    if (experienceData?.aiPhotoConfig?.referenceImageUrls) {
      for (const url of experienceData.aiPhotoConfig.referenceImageUrls) {
        deletePromises.push(deleteStorageFile(url));
      }
    }

    // Delete AI video reference images if present (video type)
    if (experienceData?.aiVideoConfig?.referenceImageUrls) {
      for (const url of experienceData.aiVideoConfig.referenceImageUrls) {
        deletePromises.push(deleteStorageFile(url));
      }
    }

    // Wait for all storage deletions (don't fail if some fail)
    await Promise.allSettled(deletePromises);

    // Delete experience document from Firestore
    await experienceDoc.ref.delete();

    // Revalidate pages for all previously attached events
    if (experienceData?.eventIds) {
      for (const eventId of experienceData.eventIds) {
        revalidatePath(`/events/${eventId}`);
      }
    }

    return createSuccessResponse(undefined);
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}

/**
 * Attaches an experience to an event by adding the eventId to the experience's eventIds array.
 *
 * This action is idempotent - if the eventId is already in the array, no changes are made.
 *
 * @param experienceId - Experience ID to attach
 * @param eventId - Event ID to attach to
 * @returns Success/error response
 */
export async function attachExperienceToEvent(
  experienceId: string,
  eventId: string
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Check if experience exists
    const experienceError = await validateExperienceExists(experienceId);
    if (experienceError) return experienceError;

    // Add eventId to experience's eventIds array (arrayUnion is idempotent)
    await db.collection("experiences").doc(experienceId).update({
      eventIds: FieldValue.arrayUnion(eventId),
      updatedAt: Date.now(),
    });

    // Revalidate the event page to reflect changes
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse(undefined);
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Failed to attach experience to event"
    );
  }
}

/**
 * Detaches an experience from an event by removing the eventId from the experience's eventIds array.
 *
 * This action is idempotent - if the eventId is not in the array, no changes are made.
 *
 * @param experienceId - Experience ID to detach
 * @param eventId - Event ID to detach from
 * @returns Success/error response
 */
export async function detachExperienceFromEvent(
  experienceId: string,
  eventId: string
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
    const authError = await checkAuth();
    if (authError) return authError;

    // Check if experience exists
    const experienceError = await validateExperienceExists(experienceId);
    if (experienceError) return experienceError;

    // Remove eventId from experience's eventIds array (arrayRemove is idempotent)
    await db.collection("experiences").doc(experienceId).update({
      eventIds: FieldValue.arrayRemove(eventId),
      updatedAt: Date.now(),
    });

    // Revalidate the event page to reflect changes
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse(undefined);
  } catch (error) {
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Failed to detach experience from event"
    );
  }
}

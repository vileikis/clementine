/**
 * Shared utility functions for experience Server Actions
 *
 * Part of 003-experience-schema implementation (Phase 6 - Action File Reorganization).
 *
 * This module provides reusable helpers for:
 * - Authentication checks
 * - Event and experience validation
 * - Common error responses
 */

import { db } from "@/lib/firebase/admin";
import { verifyAdminSecret } from "@/lib/auth";
import type { ActionResponse, ErrorCode } from "./types";
import { ErrorCodes } from "./types";

/**
 * Check if the user is authenticated.
 * Returns an error response if not authorized, otherwise null.
 */
export async function checkAuth<T = never>(): Promise<ActionResponse<T> | null> {
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return {
      success: false,
      error: {
        code: ErrorCodes.PERMISSION_DENIED,
        message: auth.error,
      },
    } as ActionResponse<T>;
  }
  return null; // null means success, no error
}

/**
 * Validate that an event exists.
 * Returns an error response if the event doesn't exist, otherwise null.
 */
export async function validateEventExists<T = never>(
  eventId: string
): Promise<ActionResponse<T> | null> {
  const eventRef = db.collection("events").doc(eventId);
  const eventDoc = await eventRef.get();

  if (!eventDoc.exists) {
    return {
      success: false,
      error: {
        code: ErrorCodes.EVENT_NOT_FOUND,
        message: `Event with ID ${eventId} not found`,
      },
    } as ActionResponse<T>;
  }

  return null; // null means success, no error
}

/**
 * Validate that an experience exists.
 * Returns an error response if the experience doesn't exist, otherwise null.
 *
 * @deprecated Use getExperienceDocument instead to avoid duplicate reads
 */
export async function validateExperienceExists<T = never>(
  eventId: string,
  experienceId: string
): Promise<ActionResponse<T> | null> {
  const experienceRef = db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId);

  const experienceDoc = await experienceRef.get();

  if (!experienceDoc.exists) {
    return {
      success: false,
      error: {
        code: ErrorCodes.EXPERIENCE_NOT_FOUND,
        message: `Experience with ID ${experienceId} not found`,
      },
    } as ActionResponse<T>;
  }

  return null; // null means success, no error
}

/**
 * Get experience document and validate it exists.
 * Returns either an error response or the document snapshot.
 * This avoids duplicate reads when you need both validation and the document data.
 *
 * @returns Error response if not found, or object with the document snapshot
 */
export async function getExperienceDocument(
  eventId: string,
  experienceId: string
): Promise<
  | { error: ActionResponse<never> }
  | { doc: FirebaseFirestore.DocumentSnapshot }
> {
  const experienceRef = db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId);

  const experienceDoc = await experienceRef.get();

  if (!experienceDoc.exists) {
    return {
      error: {
        success: false,
        error: {
          code: ErrorCodes.EXPERIENCE_NOT_FOUND,
          message: `Experience with ID ${experienceId} not found`,
        },
      },
    };
  }

  return { doc: experienceDoc };
}

/**
 * Create an error response.
 * Helper for consistent error formatting.
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string
): ActionResponse<never> {
  return {
    success: false,
    error: { code, message },
  };
}

/**
 * Create a success response.
 * Helper for consistent success formatting.
 */
export function createSuccessResponse<T>(data: T): ActionResponse<T> {
  return {
    success: true,
    data,
  };
}

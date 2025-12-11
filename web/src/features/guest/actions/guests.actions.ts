"use server"

/**
 * Server Actions for guest-facing operations.
 * Uses Firebase Admin SDK for all write operations.
 * Note: These actions are called from client components after anonymous auth.
 */

import { z } from "zod"
import {
  getGuest,
  createGuest,
  updateGuestLastSeen,
  getSession,
  createSession,
} from "../repositories"
import { createGuestSchema, createSessionSchema } from "../schemas"
import { getProject } from "@/features/projects/repositories/projects.repository"
import { getEvent } from "@/features/events/repositories/events.repository"
import type { Guest, Session } from "../types"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

// ============================================================================
// Guest Actions
// ============================================================================

/**
 * Create or retrieve a guest record for an authenticated user.
 * If guest already exists, updates lastSeenAt and returns existing record.
 */
export async function createGuestAction(
  projectId: string,
  authUid: string
): Promise<ActionResponse<Guest>> {
  try {
    // Validate input
    const validated = createGuestSchema.parse({ projectId, authUid })

    // Verify project exists and is live
    const project = await getProject(validated.projectId)
    if (!project) {
      return {
        success: false,
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project does not exist",
        },
      }
    }

    if (project.status !== "live") {
      return {
        success: false,
        error: {
          code: "PROJECT_NOT_LIVE",
          message: "Project is not currently active",
        },
      }
    }

    // Check if guest already exists
    const existing = await getGuest(validated.projectId, validated.authUid)
    if (existing) {
      // Update lastSeenAt and return existing guest
      await updateGuestLastSeen(validated.projectId, validated.authUid)
      return {
        success: true,
        data: { ...existing, lastSeenAt: Date.now() },
      }
    }

    // Create new guest
    const guest = await createGuest(validated.projectId, validated)
    return { success: true, data: guest }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map((i) => i.message).join(", "),
        },
      }
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to create guest",
      },
    }
  }
}

// ============================================================================
// Session Actions
// ============================================================================

/**
 * Create a new session for a guest starting an experience.
 */
export async function createSessionAction(
  input: {
    projectId: string
    guestId: string
    experienceId: string
    eventId: string
  }
): Promise<ActionResponse<Session>> {
  try {
    // Validate input
    const validated = createSessionSchema.parse(input)

    // Verify guest exists
    const guest = await getGuest(validated.projectId, validated.guestId)
    if (!guest) {
      return {
        success: false,
        error: {
          code: "GUEST_NOT_FOUND",
          message: "Guest does not exist in this project",
        },
      }
    }

    // Verify event exists and has the experience enabled
    const event = await getEvent(validated.projectId, validated.eventId)
    if (!event) {
      return {
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event does not exist",
        },
      }
    }

    // Check if experience is enabled in event
    const experienceLink = event.experiences.find(
      (exp) => exp.experienceId === validated.experienceId && exp.enabled
    )
    if (!experienceLink) {
      return {
        success: false,
        error: {
          code: "EXPERIENCE_NOT_FOUND",
          message: "Experience is not available for this event",
        },
      }
    }

    // Create the session
    const session = await createSession(validated.projectId, validated)

    // Update guest's lastSeenAt
    await updateGuestLastSeen(validated.projectId, validated.guestId)

    return { success: true, data: session }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map((i) => i.message).join(", "),
        },
      }
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to create session",
      },
    }
  }
}

/**
 * Get a session by ID.
 */
export async function getSessionAction(
  projectId: string,
  sessionId: string
): Promise<ActionResponse<Session | null>> {
  try {
    if (!projectId || !sessionId) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Project ID and Session ID are required",
        },
      }
    }

    const session = await getSession(projectId, sessionId)
    return { success: true, data: session }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to get session",
      },
    }
  }
}

/**
 * Validate that a session belongs to the current guest.
 * Used when resuming a session from URL params.
 */
export async function validateSessionOwnershipAction(
  projectId: string,
  sessionId: string,
  guestId: string
): Promise<ActionResponse<{ valid: boolean; session: Session | null }>> {
  try {
    if (!projectId || !sessionId || !guestId) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Project ID, Session ID, and Guest ID are required",
        },
      }
    }

    const session = await getSession(projectId, sessionId)

    // Session not found
    if (!session) {
      return {
        success: true,
        data: { valid: false, session: null },
      }
    }

    // Check ownership
    if (session.guestId !== guestId) {
      return {
        success: true,
        data: { valid: false, session: null },
      }
    }

    // Valid - session belongs to this guest
    return {
      success: true,
      data: { valid: true, session },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to validate session",
      },
    }
  }
}

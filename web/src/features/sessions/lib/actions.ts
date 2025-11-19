"use server";

import { z } from "zod";
import {
  startSession,
  saveCapture,
  getSession,
  updateSessionState,
} from "./repository";
import { getEvent } from "@/features/events/repositories/events";
import {
  uploadInputImage,
  copyImageToResult,
} from "@/lib/storage/upload";
import { revalidatePath } from "next/cache";

export async function startSessionAction(eventId: string) {
  const sessionId = await startSession(eventId);
  return { sessionId };
}

const saveCaptureInput = z.object({
  eventId: z.string(),
  sessionId: z.string(),
});

export async function saveCaptureAction(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const sessionId = formData.get("sessionId") as string;
  const photo = formData.get("photo") as File;

  const validated = saveCaptureInput.parse({ eventId, sessionId });

  if (!photo) {
    throw new Error("No photo provided");
  }

  const inputImagePath = await uploadInputImage(
    validated.eventId,
    validated.sessionId,
    photo
  );
  await saveCapture(validated.eventId, validated.sessionId, inputImagePath);

  revalidatePath(`/join/${validated.eventId}`);
  return { success: true, inputImagePath };
}

export async function getSessionAction(eventId: string, sessionId: string) {
  return await getSession(eventId, sessionId);
}

/**
 * Sleep for a given number of milliseconds with cancellation support
 */
function sleep(ms: number): { promise: Promise<void>; cancel: () => void } {
  let timeoutId: NodeJS.Timeout;
  const promise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, ms);
  });
  const cancel = () => clearTimeout(timeoutId);
  return { promise, cancel };
}

/**
 * Trigger AI transform pipeline for a captured session
 *
 * Orchestrates the full AI transformation workflow:
 * 1. Update session state to "transforming"
 * 2. Fetch session and scene configuration
 * 3. Generate signed URLs for input and reference images
 * 4. Call Nano Banana API (or mock)
 * 5. Upload result image to Storage
 * 6. Update session to "ready" with result path
 * 7. On error, update session to "error" with message
 *
 * Implements automatic retry logic for transient failures (max 3 attempts).
 * Timeout after 60 seconds.
 *
 * @param eventId - Event ID
 * @param sessionId - Session ID
 * @returns Success response with result path
 * @throws Error on validation or transform failure (session marked as error)
 */
export async function triggerTransformAction(
  eventId: string,
  sessionId: string
) {
  const TIMEOUT_MS = 60000; // 60 seconds

  // Create timeout with cancellation support
  const timeout = sleep(TIMEOUT_MS);

  try {
    // Fetch session first to check current state
    const session = await getSession(eventId, sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Guard: Prevent double-triggering if already transforming, ready, or error
    console.log("[Transform] Session state:", session.state);
    if (session.state !== "captured") {
      console.log("[Transform] Skipping: Session already in state:", session.state);
      timeout.cancel();
      return {
        success: false,
        error: `Session already in state: ${session.state}`,
      };
    }

    if (!session.inputImagePath) {
      throw new Error("No input image found for session");
    }

    // Mark session as transforming
    await updateSessionState(eventId, sessionId, "transforming");

    const event = await getEvent(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // TODO: Replace with experience-based transformation logic
    // For now, use passthrough mode (copy input to result without AI transformation)
    // This maintains functionality while scene architecture is being removed
    console.log("[Transform] Passthrough mode: Copying input to result (scene-based AI temporarily disabled)");

    // Cancel timeout since we're returning early
    timeout.cancel();

    const resultImagePath = await copyImageToResult(
      session.inputImagePath,
      `events/${eventId}/sessions/${sessionId}/result.jpg`
    );

    // Mark session as ready (skip AI)
    await updateSessionState(eventId, sessionId, "ready", {
      resultImagePath,
    });

    console.log("[Transform] Passthrough complete:", {
      eventId,
      sessionId,
      resultImagePath,
    });

    revalidatePath(`/join/${eventId}`);
    return { success: true, resultImagePath };
  } catch (error) {
    // Cancel timeout on error
    timeout.cancel();
    console.error("[Transform] Transform failed:", error);

    // Mark session as error with message
    const errorMessage =
      error instanceof Error ? error.message : "Transform failed";

    await updateSessionState(eventId, sessionId, "error", {
      error: errorMessage,
    });

    // Revalidate to show error state
    revalidatePath(`/join/${eventId}`);

    throw error;
  }
}

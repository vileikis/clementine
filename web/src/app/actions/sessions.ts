"use server";

import { z } from "zod";
import {
  startSession,
  saveCapture,
  getSession,
  updateSessionState,
} from "@/lib/repositories/sessions";
import { getEvent, getCurrentScene } from "@/lib/repositories/events";
import {
  uploadInputImage,
  uploadResultImage,
  getSignedUrl,
  copyImageToResult,
} from "@/lib/storage/upload";
import { transformWithNanoBanana } from "@/lib/ai/nano-banana";
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
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000; // Start with 2 seconds
  const TIMEOUT_MS = 60000; // 60 seconds

  // Wrap transform in timeout
  const timeoutPromise = sleep(TIMEOUT_MS).then(() => {
    throw new Error("Transform timeout: Operation took longer than 60 seconds");
  });

  try {
    // Mark session as transforming
    await updateSessionState(eventId, sessionId, "transforming");

    // Fetch session and scene configuration
    const session = await getSession(eventId, sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.inputImagePath) {
      throw new Error("No input image found for session");
    }

    const scene = await getCurrentScene(eventId);
    if (!scene) {
      throw new Error("No active scene found for event");
    }

    const event = await getEvent(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // PASSTHROUGH MODE: Empty or null prompt
    if (!scene.prompt || scene.prompt.trim() === "") {
      console.log("[Transform] Passthrough mode: Copying input to result (no AI transformation)");

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
    }

    // AI TRANSFORMATION MODE: Non-empty prompt
    // Generate signed URLs for AI service
    const inputUrl = await getSignedUrl(session.inputImagePath, 3600);
    const referenceUrl = scene.referenceImagePath
      ? await getSignedUrl(scene.referenceImagePath, 3600)
      : undefined;

    console.log("[Transform] Starting AI transform:", {
      eventId,
      sessionId,
      prompt: scene.prompt.substring(0, 50),
      hasReference: !!referenceUrl,
    });

    // Retry logic for AI transformation
    let lastError: Error | null = null;
    let resultBuffer: Buffer | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Race between transform and timeout
        resultBuffer = await Promise.race([
          transformWithNanoBanana({
            prompt: scene.prompt,
            inputImageUrl: inputUrl,
            referenceImageUrl: referenceUrl,
            brandColor: event.brandColor,
          }),
          timeoutPromise,
        ]) as Buffer;

        // Success! Break out of retry loop
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Transform failed");
        console.warn(
          `[Transform] Attempt ${attempt}/${MAX_RETRIES} failed:`,
          lastError.message
        );

        // Don't retry on timeout or validation errors
        if (
          lastError.message.includes("timeout") ||
          lastError.message.includes("not found") ||
          lastError.message.includes("No input image")
        ) {
          throw lastError;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < MAX_RETRIES) {
          const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`[Transform] Retrying in ${delayMs}ms...`);
          await sleep(delayMs);
        }
      }
    }

    if (!resultBuffer) {
      throw lastError || new Error("Transform failed after all retries");
    }

    // Upload result image
    const resultImagePath = await uploadResultImage(
      eventId,
      sessionId,
      resultBuffer
    );

    // Mark session as ready
    await updateSessionState(eventId, sessionId, "ready", {
      resultImagePath,
    });

    console.log("[Transform] Transform complete:", {
      eventId,
      sessionId,
      resultImagePath,
    });

    // Revalidate guest flow page to show updated session
    revalidatePath(`/join/${eventId}`);

    return { success: true, resultImagePath };
  } catch (error) {
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

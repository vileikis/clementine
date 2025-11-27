"use server";

import { z } from "zod";
import {
  startSession,
  saveCapture,
  getSession,
  updateSessionState,
  startJourneySession,
  updateStepIndex,
  saveStepData,
} from "../repositories";
import { getEvent } from "@/features/events/repositories/events";
import { getJourney } from "@/features/journeys/repositories/journeys.repository";
import { listSteps } from "@/features/steps/repositories/steps.repository";
import {
  getExperience,
  getExperiencesByEventId,
} from "@/features/experiences/repositories/experiences.repository";
import {
  uploadInputImage,
  uploadResultImage,
  copyImageToResult,
  getSignedUrl,
} from "@/lib/storage/upload";
import { getAIClient } from "@/lib/ai/client";
import type { TransformParams } from "@/lib/ai/types";
import { revalidatePath } from "next/cache";
import type { Journey } from "@/features/journeys";
import type { Step } from "@/features/steps";
import type { Experience } from "@/features/experiences";

// ============================================================================
// Existing actions (preserved)
// ============================================================================

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
 * 2. Fetch session and experience configuration
 * 3. Generate signed URLs for input and reference images
 * 4. Call AI provider (Google AI, n8n, or mock based on config)
 * 5. Upload result image to Storage
 * 6. Update session to "ready" with public result URL (per Firebase standards)
 * 7. On error, update session to "error" with message
 *
 * Timeout after 60 seconds.
 *
 * @param eventId - Event ID
 * @param sessionId - Session ID
 * @returns Success response with public result URL
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

    // Get experience config for AI transformation
    const experienceId = session.data?.selected_experience_id as string | undefined;
    const experience = experienceId ? await getExperience(experienceId) : null;

    // Check if AI is enabled for this experience
    // Only photo and gif experiences have aiPhotoConfig
    const aiConfig =
      experience && (experience.type === "photo" || experience.type === "gif")
        ? experience.aiPhotoConfig
        : null;
    const aiEnabled = aiConfig?.enabled && aiConfig?.prompt;

    if (!aiEnabled) {
      // Passthrough mode: copy input to result without AI transformation
      console.log("[Transform] Passthrough mode: AI not enabled or no prompt configured");
      timeout.cancel();

      const resultImagePath = await copyImageToResult(
        session.inputImagePath,
        `events/${eventId}/sessions/${sessionId}/result.jpg`
      );

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

    // AI transformation mode
    console.log("[Transform] AI mode: Using experience config", {
      experienceId,
      model: aiConfig.model,
      prompt: aiConfig.prompt?.substring(0, 50) + "...",
    });

    // Generate signed URL for input image
    const inputImageUrl = await getSignedUrl(session.inputImagePath, 3600);

    // Build transform params from experience config
    // aiConfig.prompt is guaranteed to be truthy since aiEnabled checked it
    const transformParams: TransformParams = {
      prompt: aiConfig.prompt!,
      inputImageUrl,
      model: aiConfig.model ?? undefined,
      brandColor: event.theme?.primaryColor,
    };

    // Add reference image if available
    if (aiConfig.referenceImageUrls && aiConfig.referenceImageUrls.length > 0) {
      transformParams.referenceImageUrl = aiConfig.referenceImageUrls[0];
    }

    // Call AI provider
    const aiClient = getAIClient();
    const resultBuffer = await aiClient.generateImage(transformParams);

    // Cancel timeout since transform completed
    timeout.cancel();

    // Upload result to Storage
    const resultImagePath = await uploadResultImage(eventId, sessionId, resultBuffer);

    // Mark session as ready with result
    await updateSessionState(eventId, sessionId, "ready", {
      resultImagePath,
    });

    console.log("[Transform] AI transform complete:", {
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

// ============================================================================
// New actions for journey support
// ============================================================================

export async function startJourneySessionAction(
  eventId: string,
  journeyId: string
) {
  const sessionId = await startJourneySession(eventId, journeyId);
  return { sessionId };
}

export async function advanceStepAction(
  eventId: string,
  sessionId: string,
  nextIndex: number
) {
  if (nextIndex < 0) {
    return { success: false, error: "Invalid step index" };
  }
  await updateStepIndex(eventId, sessionId, nextIndex);
  revalidatePath(`/join/${eventId}`);
  return { success: true };
}

/**
 * Moves the session back to the previous step.
 */
export async function goBackStepAction(
  eventId: string,
  sessionId: string
): Promise<{ success: true; newIndex: number } | { success: false; error: string }> {
  const session = await getSession(eventId, sessionId);
  if (!session) {
    return { success: false, error: "Session not found" };
  }

  const currentIndex = session.currentStepIndex ?? 0;
  if (currentIndex === 0) {
    return { success: false, error: "Cannot go back from first step" };
  }

  const newIndex = currentIndex - 1;
  await updateStepIndex(eventId, sessionId, newIndex);
  revalidatePath(`/join/${eventId}`);
  return { success: true, newIndex };
}

export async function saveStepDataAction(
  eventId: string,
  sessionId: string,
  key: string,
  value: unknown
) {
  await saveStepData(eventId, sessionId, key, value);
  return { success: true };
}

/**
 * Saves the selected experience from an experience-picker step.
 */
export async function selectExperienceAction(
  eventId: string,
  sessionId: string,
  experienceId: string
): Promise<{ success: true } | { success: false; error: string }> {
  // Validate experience exists and is enabled
  const experience = await getExperience(experienceId);
  if (!experience) {
    return { success: false, error: "Experience not found" };
  }

  if (!experience.enabled) {
    return { success: false, error: "Experience is not enabled" };
  }

  // Validate experience is linked to this event
  if (!experience.eventIds.includes(eventId)) {
    return { success: false, error: "Experience not linked to this event" };
  }

  // Save to session data
  await saveStepData(eventId, sessionId, "selected_experience_id", experienceId);
  return { success: true };
}

/**
 * Loads journey definition and steps for guest display.
 */
export async function getJourneyForGuestAction(
  eventId: string,
  journeyId: string
): Promise<
  | { success: true; journey: Journey; steps: Step[] }
  | { success: false; error: string }
> {
  const journey = await getJourney(eventId, journeyId);
  if (!journey) {
    return { success: false, error: "Journey not found" };
  }

  const steps = await listSteps(eventId, journeyId);
  return { success: true, journey, steps };
}

/**
 * Loads experiences available for selection (for experience-picker steps).
 * Only returns enabled experiences linked to the event.
 */
export async function getExperiencesForGuestAction(
  eventId: string
): Promise<
  | { success: true; experiences: Experience[] }
  | { success: false; error: string }
> {
  // Verify event exists
  const event = await getEvent(eventId);
  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // Get all experiences for this event
  const allExperiences = await getExperiencesByEventId(eventId);

  // Filter to only enabled experiences
  const enabledExperiences = allExperiences.filter((exp) => exp.enabled);

  return { success: true, experiences: enabledExperiences };
}

/**
 * Retries a failed AI transformation.
 * Only works if session is in 'error' state.
 */
export async function retryTransformAction(
  eventId: string,
  sessionId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession(eventId, sessionId);
  if (!session) {
    return { success: false, error: "Session not found" };
  }

  if (session.state !== "error") {
    return { success: false, error: "Session not in error state" };
  }

  if (!session.inputImagePath) {
    return { success: false, error: "No input image found" };
  }

  // Clear error and reset to captured state for retry
  await updateSessionState(eventId, sessionId, "captured", {
    error: undefined,
  });

  // Trigger the transform again
  // Note: triggerTransformAction will handle state transitions
  try {
    await triggerTransformAction(eventId, sessionId);
    return { success: true };
  } catch {
    // Error already handled by triggerTransformAction
    return { success: false, error: "Transform retry failed" };
  }
}

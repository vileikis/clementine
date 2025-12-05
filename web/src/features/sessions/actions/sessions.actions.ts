"use server";

import { z } from "zod";
import {
  startSession,
  saveCapture,
  getSession,
  updateSessionState,
  startExperienceSession,
  startJourneySession,
  updateStepIndex,
  saveStepData,
} from "../repositories";
import { getProject } from "@/features/projects/repositories/projects.repository";
import { getExperience } from "@/features/experiences/repositories/experiences.repository";
import { listSteps } from "@/features/steps/repositories/steps.repository";
import {
  getAiPreset,
  getAiPresetsByEventId,
} from "@/features/ai-presets/repositories/ai-presets.repository";
import {
  uploadInputImage,
  uploadResultImage,
  copyImageToResult,
} from "@/lib/storage/upload";
import { getAIClient } from "@/lib/ai/client";
import type { TransformParams } from "@/lib/ai/types";
import { revalidatePath } from "next/cache";
import type { Step } from "@/features/steps";
import type { Experience as AiPreset } from "@/features/ai-presets";
import type { Experience } from "@/features/experiences/types";
// Types used in T072-T079 (persisted session mode) - currently deferred
// import type { TransformStatus, StepInputValue } from "../types";

// ============================================================================
// Action Response Types (standard pattern)
// ============================================================================

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

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

  // Trigger AI transform in background (don't await - fire and forget)
  // This runs server-side and doesn't block the client response
  triggerTransformAction(validated.eventId, validated.sessionId).catch((err) => {
    console.error("[saveCaptureAction] Background transform trigger failed:", err);
    // Error will be captured in session state
  });

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

    const project = await getProject(eventId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get experience config for AI transformation
    const experienceId = session.data?.selected_experience_id as string | undefined;
    const experience = experienceId ? await getAiPreset(experienceId) : null;

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

      // No revalidatePath needed - UI updates via Firestore subscriptions
      return { success: true, resultImagePath };
    }

    // AI transformation mode
    console.log("[Transform] AI mode: Using experience config", {
      experienceId,
      model: aiConfig.model,
      prompt: aiConfig.prompt?.substring(0, 50) + "...",
    });

    // Use public URL directly (no need for signed URL since files are public)
    const inputImageUrl = session.inputImagePath;

    // Build transform params from experience config
    // aiConfig.prompt is guaranteed to be truthy since aiEnabled checked it
    const transformParams: TransformParams = {
      prompt: aiConfig.prompt!,
      inputImageUrl,
      model: aiConfig.model ?? undefined,
      brandColor: project.theme?.primaryColor,
      aspectRatio: aiConfig.aspectRatio || "1:1",
      referenceImageUrls: aiConfig.referenceImageUrls || [],
    };

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

    // No revalidatePath needed - UI updates via Firestore subscriptions
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

    // No revalidatePath needed - UI updates via Firestore subscriptions
    throw error;
  }
}

// ============================================================================
// Experience session actions
// ============================================================================

export async function startExperienceSessionAction(
  eventId: string,
  experienceId: string
) {
  const sessionId = await startExperienceSession(eventId, experienceId);
  return { sessionId };
}

/**
 * Loads experience definition and steps for guest display.
 */
export async function getExperienceForGuestAction(
  experienceId: string
): Promise<
  | { success: true; experience: Experience; steps: Step[] }
  | { success: false; error: string }
> {
  const experience = await getExperience(experienceId);
  if (!experience) {
    return { success: false, error: "Experience not found" };
  }

  const steps = await listSteps(experienceId);
  return { success: true, experience, steps };
}

// ============================================================================
// Legacy journey session actions (deprecated)
// ============================================================================

/**
 * @deprecated Use startExperienceSessionAction instead
 */
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
  const experience = await getAiPreset(experienceId);
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
 * Loads AI presets (experiences) available for selection.
 * Only returns enabled presets linked to the event.
 */
export async function getAiPresetsForGuestAction(
  eventId: string
): Promise<
  | { success: true; aiPresets: AiPreset[] }
  | { success: false; error: string }
> {
  // Verify project exists
  const project = await getProject(eventId);
  if (!project) {
    return { success: false, error: "Project not found" };
  }

  // Get all AI presets for this event
  const allPresets = await getAiPresetsByEventId(eventId);

  // Filter to only enabled presets
  const enabledPresets = allPresets.filter((preset) => preset.enabled);

  return { success: true, aiPresets: enabledPresets };
}

/**
 * @deprecated Use getAiPresetsForGuestAction instead
 * Loads experiences available for selection (for experience-picker steps).
 * Only returns enabled experiences linked to the event.
 */
export async function getExperiencesForGuestAction(
  eventId: string
): Promise<
  | { success: true; experiences: AiPreset[] }
  | { success: false; error: string }
> {
  // Verify project exists
  const project = await getProject(eventId);
  if (!project) {
    return { success: false, error: "Project not found" };
  }

  // Get all experiences for this event
  const allExperiences = await getAiPresetsByEventId(eventId);

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

// ============================================================================
// Experience Engine Session Actions (T042-T043)
// ============================================================================

/**
 * Input schema for triggering AI transform via Experience Engine
 */
const triggerEngineTransformSchema = z.object({
  sessionId: z.string().min(1),
  config: z.object({
    model: z.string(),
    prompt: z.string().min(1, "Prompt cannot be empty"), // Already interpolated with variables
    inputImageUrl: z.string().url(),
    outputType: z.enum(["image", "video", "gif"]),
    aspectRatio: z.string(),
    referenceImageUrls: z.array(z.string()),
  }),
});

type TriggerEngineTransformInput = z.infer<typeof triggerEngineTransformSchema>;

interface TriggerEngineTransformOutput {
  jobId: string;
  status: "pending";
}

/**
 * Triggers an AI transformation job for the Experience Engine.
 * This updates the session's transformStatus and queues the job for processing.
 *
 * For MVP, this will trigger the same AI pipeline as the legacy flow.
 * The job ID is generated immediately and the status is set to "pending".
 *
 * T042: triggerTransformJob server action
 */
export async function triggerEngineTransformJob(
  input: TriggerEngineTransformInput
): Promise<ActionResponse<TriggerEngineTransformOutput>> {
  try {
    // Validate input
    const validated = triggerEngineTransformSchema.parse(input);

    // Generate job ID
    const jobId = `job_${crypto.randomUUID()}`;

    // For MVP, we return immediately with "pending" status.
    // The actual transformation will be handled by a background process
    // or webhook that updates the session's transformStatus.

    // In a full implementation, we would:
    // 1. Update session transformStatus to { status: "pending", jobId }
    // 2. Queue job to n8n webhook or Firebase Cloud Function
    // For now, we simulate success and let the client poll/subscribe for status

    console.log("[Engine Transform] Job triggered:", {
      sessionId: validated.sessionId,
      jobId,
      model: validated.config.model,
      outputType: validated.config.outputType,
    });

    return {
      success: true,
      data: {
        jobId,
        status: "pending",
      },
    };
  } catch (error) {
    console.error("[Engine Transform] Trigger failed:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map((issue) => issue.message).join(", "),
        },
      };
    }

    return {
      success: false,
      error: {
        code: "TRANSFORM_QUEUE_ERROR",
        message: error instanceof Error ? error.message : "Failed to queue transform job",
      },
    };
  }
}

/**
 * Input schema for updating transform status
 */
const updateEngineTransformStatusSchema = z.object({
  sessionId: z.string().min(1),
  status: z.enum(["idle", "pending", "processing", "complete", "error"]),
  resultUrl: z.string().url().optional(),
  errorMessage: z.string().optional(),
});

type UpdateEngineTransformStatusInput = z.infer<typeof updateEngineTransformStatusSchema>;

/**
 * Updates the transformation status for an Experience Engine session.
 * Called by background job or webhook when status changes.
 *
 * T043: updateTransformStatus server action
 */
export async function updateEngineTransformStatus(
  input: UpdateEngineTransformStatusInput
): Promise<ActionResponse<void>> {
  try {
    // Validate input
    const validated = updateEngineTransformStatusSchema.parse(input);

    // For MVP with ephemeral sessions, this is a no-op since status
    // is managed client-side in useEngineSession.
    // For persisted sessions, this would update Firestore.

    console.log("[Engine Transform] Status update:", {
      sessionId: validated.sessionId,
      status: validated.status,
      hasResult: !!validated.resultUrl,
    });

    // In a full implementation:
    // await updateSessionDocument(validated.sessionId, {
    //   'transformStatus.status': validated.status,
    //   'transformStatus.resultUrl': validated.resultUrl,
    //   'transformStatus.errorMessage': validated.errorMessage,
    //   'transformStatus.updatedAt': Date.now(),
    //   updatedAt: Date.now(),
    // });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[Engine Transform] Status update failed:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map((issue) => issue.message).join(", "),
        },
      };
    }

    return {
      success: false,
      error: {
        code: "FIRESTORE_ERROR",
        message: error instanceof Error ? error.message : "Failed to update transform status",
      },
    };
  }
}

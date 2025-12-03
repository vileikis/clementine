"use server";

/**
 * Server Actions for step operations.
 */

import { verifyAdminSecret } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createStep,
  deleteStep,
  duplicateStep,
  getStep,
  listSteps,
  reorderSteps,
  updateStep,
} from "../repositories";
import { createStepInputSchema, updateStepInputSchema } from "../schemas";
import { STEP_CONSTANTS } from "../constants";
import { getJourney } from "@/features/journeys/repositories";
import type { Step } from "../types";
import type { ActionResponse } from "./types";

// ============================================================================
// List Steps
// ============================================================================

/**
 * Lists all steps for a journey in order.
 */
export async function listStepsAction(
  eventId: string,
  journeyId: string
): Promise<ActionResponse<Step[]>> {
  try {
    const steps = await listSteps(eventId, journeyId);
    return { success: true, data: steps };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch steps",
      },
    };
  }
}

// ============================================================================
// Get Step
// ============================================================================

/**
 * Retrieves a single step by ID.
 */
export async function getStepAction(
  eventId: string,
  stepId: string
): Promise<ActionResponse<Step>> {
  try {
    const step = await getStep(eventId, stepId);
    if (!step) {
      return {
        success: false,
        error: {
          code: "STEP_NOT_FOUND",
          message: "Step not found",
        },
      };
    }
    return { success: true, data: step };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch step",
      },
    };
  }
}

// ============================================================================
// Create Step
// ============================================================================

/**
 * Creates a new step for a journey.
 */
export async function createStepAction(
  input: z.infer<typeof createStepInputSchema>
): Promise<ActionResponse<{ stepId: string }>> {
  // Verify admin authentication
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

  try {
    // Validate input
    const validated = createStepInputSchema.parse(input);

    // Validate journey exists
    const journey = await getJourney(validated.eventId, validated.journeyId);
    if (!journey) {
      return {
        success: false,
        error: {
          code: "JOURNEY_NOT_FOUND",
          message: "Journey not found",
        },
      };
    }

    // Check max steps limit
    if (journey.stepOrder.length >= STEP_CONSTANTS.MAX_STEPS_PER_JOURNEY) {
      return {
        success: false,
        error: {
          code: "MAX_STEPS_EXCEEDED",
          message: `Cannot exceed ${STEP_CONSTANTS.MAX_STEPS_PER_JOURNEY} steps per journey`,
        },
      };
    }

    // Create step
    const stepId = await createStep({
      eventId: validated.eventId,
      journeyId: validated.journeyId,
      type: validated.type,
      title: validated.title,
      description: validated.description,
      mediaUrl: validated.mediaUrl,
      ctaLabel: validated.ctaLabel,
      config: validated.config,
    });

    // Revalidate cache
    revalidatePath(
      `/events/${validated.eventId}/journeys/${validated.journeyId}`
    );

    return { success: true, data: { stepId } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(", "),
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to create step",
      },
    };
  }
}

// ============================================================================
// Update Step
// ============================================================================

/**
 * Updates an existing step.
 */
export async function updateStepAction(
  eventId: string,
  stepId: string,
  input: z.infer<typeof updateStepInputSchema>
): Promise<ActionResponse<void>> {
  // Verify admin authentication
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

  try {
    // Validate input
    const validated = updateStepInputSchema.parse(input);

    // Verify step exists
    const existingStep = await getStep(eventId, stepId);
    if (!existingStep) {
      return {
        success: false,
        error: {
          code: "STEP_NOT_FOUND",
          message: "Step not found",
        },
      };
    }

    // Update step
    await updateStep(eventId, stepId, {
      title: validated.title,
      description: validated.description,
      mediaUrl: validated.mediaUrl,
      ctaLabel: validated.ctaLabel,
      config: validated.config,
    });

    // Revalidate cache
    revalidatePath(
      `/events/${eventId}/journeys/${existingStep.journeyId}`
    );

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(", "),
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update step",
      },
    };
  }
}

// ============================================================================
// Delete Step
// ============================================================================

/**
 * Deletes a step from a journey.
 */
export async function deleteStepAction(
  eventId: string,
  stepId: string
): Promise<ActionResponse<void>> {
  // Verify admin authentication
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

  try {
    // Verify step exists
    const existingStep = await getStep(eventId, stepId);
    if (!existingStep) {
      return {
        success: false,
        error: {
          code: "STEP_NOT_FOUND",
          message: "Step not found",
        },
      };
    }

    // Delete step
    await deleteStep(eventId, stepId, existingStep.journeyId);

    // Revalidate cache
    revalidatePath(
      `/events/${eventId}/journeys/${existingStep.journeyId}`
    );

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to delete step",
      },
    };
  }
}

// ============================================================================
// Reorder Steps
// ============================================================================

/**
 * Reorders steps within a journey.
 */
export async function reorderStepsAction(
  eventId: string,
  journeyId: string,
  newOrder: string[]
): Promise<ActionResponse<void>> {
  // Verify admin authentication
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

  try {
    // Validate journey exists
    const journey = await getJourney(eventId, journeyId);
    if (!journey) {
      return {
        success: false,
        error: {
          code: "JOURNEY_NOT_FOUND",
          message: "Journey not found",
        },
      };
    }

    // Validate newOrder contains same step IDs as current order
    const currentSet = new Set(journey.stepOrder);
    const newSet = new Set(newOrder);

    if (currentSet.size !== newSet.size) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "New order must contain the same steps",
        },
      };
    }

    for (const id of newOrder) {
      if (!currentSet.has(id)) {
        return {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `Step ${id} not found in journey`,
          },
        };
      }
    }

    // Update order
    await reorderSteps(eventId, journeyId, newOrder);

    // Revalidate cache
    revalidatePath(`/events/${eventId}/journeys/${journeyId}`);

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to reorder steps",
      },
    };
  }
}

// ============================================================================
// Duplicate Step
// ============================================================================

/**
 * Duplicates a step within the same journey.
 */
export async function duplicateStepAction(
  eventId: string,
  stepId: string
): Promise<ActionResponse<{ stepId: string }>> {
  // Verify admin authentication
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

  try {
    // Verify step exists
    const existingStep = await getStep(eventId, stepId);
    if (!existingStep) {
      return {
        success: false,
        error: {
          code: "STEP_NOT_FOUND",
          message: "Step not found",
        },
      };
    }

    // Check max steps limit
    const journey = await getJourney(eventId, existingStep.journeyId);
    if (
      journey &&
      journey.stepOrder.length >= STEP_CONSTANTS.MAX_STEPS_PER_JOURNEY
    ) {
      return {
        success: false,
        error: {
          code: "MAX_STEPS_EXCEEDED",
          message: `Cannot exceed ${STEP_CONSTANTS.MAX_STEPS_PER_JOURNEY} steps per journey`,
        },
      };
    }

    // Duplicate step
    const newStepId = await duplicateStep(eventId, stepId);

    // Revalidate cache
    revalidatePath(
      `/events/${eventId}/journeys/${existingStep.journeyId}`
    );

    return { success: true, data: { stepId: newStepId } };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to duplicate step",
      },
    };
  }
}

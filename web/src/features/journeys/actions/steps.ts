"use server";

/**
 * @deprecated Use @/features/steps/actions instead
 * Legacy Server Actions for step operations in journeys.
 * These actions use the old eventId/journeyId pattern.
 */

import { verifyAdminSecret } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createStepLegacy,
  deleteStepLegacy,
  duplicateStepLegacy,
  getStepLegacy,
  reorderStepsLegacy,
  updateStepLegacy,
} from "@/features/steps/repositories/steps.repository";
import { stepTypeSchema, updateStepInputSchema } from "@/features/steps/schemas";
import { STEP_CONSTANTS } from "@/features/steps/constants";
import { getJourney } from "../repositories";
import type { ActionResponse } from "./types";

// ============================================================================
// Input Schemas
// ============================================================================

const createStepInputSchema = z.object({
  eventId: z.string().min(1),
  journeyId: z.string().min(1),
  type: stepTypeSchema,
  title: z.string().max(STEP_CONSTANTS.MAX_TITLE_LENGTH).nullish(),
  description: z.string().max(STEP_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullish(),
  mediaUrl: z.string().url().nullish(),
  ctaLabel: z.string().max(STEP_CONSTANTS.MAX_CTA_LABEL_LENGTH).nullish(),
  config: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// Create Step
// ============================================================================

/**
 * @deprecated Use createStepAction from @/features/steps/actions
 * Creates a new step for a journey.
 */
export async function createStepAction(
  input: z.infer<typeof createStepInputSchema>
): Promise<ActionResponse<{ stepId: string }>> {
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
    const validated = createStepInputSchema.parse(input);

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

    if (journey.stepOrder.length >= STEP_CONSTANTS.MAX_STEPS_PER_JOURNEY) {
      return {
        success: false,
        error: {
          code: "MAX_STEPS_EXCEEDED",
          message: `Cannot exceed ${STEP_CONSTANTS.MAX_STEPS_PER_JOURNEY} steps per journey`,
        },
      };
    }

    const stepId = await createStepLegacy({
      eventId: validated.eventId,
      journeyId: validated.journeyId,
      type: validated.type,
      title: validated.title,
      description: validated.description,
      mediaUrl: validated.mediaUrl,
      ctaLabel: validated.ctaLabel,
      config: validated.config,
    });

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
 * @deprecated Use updateStepAction from @/features/steps/actions
 * Updates an existing step.
 */
export async function updateStepAction(
  eventId: string,
  stepId: string,
  input: z.infer<typeof updateStepInputSchema>
): Promise<ActionResponse<void>> {
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
    const validated = updateStepInputSchema.parse(input);

    const existingStep = await getStepLegacy(eventId, stepId);
    if (!existingStep) {
      return {
        success: false,
        error: {
          code: "STEP_NOT_FOUND",
          message: "Step not found",
        },
      };
    }

    await updateStepLegacy(eventId, stepId, {
      title: validated.title,
      description: validated.description,
      mediaUrl: validated.mediaUrl,
      mediaType: validated.mediaType,
      ctaLabel: validated.ctaLabel,
      config: validated.config,
    });

    revalidatePath(
      `/events/${eventId}/journeys/${existingStep.journeyId!}`
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
 * @deprecated Use deleteStepAction from @/features/steps/actions
 * Deletes a step from a journey.
 */
export async function deleteStepAction(
  eventId: string,
  stepId: string
): Promise<ActionResponse<void>> {
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
    const existingStep = await getStepLegacy(eventId, stepId);
    if (!existingStep) {
      return {
        success: false,
        error: {
          code: "STEP_NOT_FOUND",
          message: "Step not found",
        },
      };
    }

    await deleteStepLegacy(eventId, stepId, existingStep.journeyId!);

    revalidatePath(
      `/events/${eventId}/journeys/${existingStep.journeyId!}`
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
 * @deprecated Use reorderStepsAction from @/features/steps/actions
 * Reorders steps within a journey.
 */
export async function reorderStepsAction(
  eventId: string,
  journeyId: string,
  newOrder: string[]
): Promise<ActionResponse<void>> {
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

    await reorderStepsLegacy(eventId, journeyId, newOrder);

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
 * @deprecated Use duplicateStepAction from @/features/steps/actions
 * Duplicates a step within the same journey.
 */
export async function duplicateStepAction(
  eventId: string,
  stepId: string
): Promise<ActionResponse<{ stepId: string }>> {
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
    const existingStep = await getStepLegacy(eventId, stepId);
    if (!existingStep) {
      return {
        success: false,
        error: {
          code: "STEP_NOT_FOUND",
          message: "Step not found",
        },
      };
    }

    const journey = await getJourney(eventId, existingStep.journeyId!);
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

    const newStepId = await duplicateStepLegacy(eventId, stepId);

    revalidatePath(
      `/events/${eventId}/journeys/${existingStep.journeyId!}`
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

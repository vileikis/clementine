"use server";

/**
 * Server Actions for step operations within experiences.
 * Collection path: /experiences/{experienceId}/steps/{stepId}
 */

import { db } from "@/lib/firebase/admin";
import { verifyAdminSecret } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getExperience } from "../repositories/experiences.repository";
import { getCompany } from "@/features/companies/repositories";
import { STEP_DEFAULTS, STEP_CONSTANTS } from "@/features/steps/constants";
import { stepSchema } from "@/features/steps/schemas";
import type { Step } from "@/features/steps/types";
import type { ActionResponse } from "./types";
import { EXPERIENCE_CONSTRAINTS } from "../constants";

// ============================================================================
// Helpers
// ============================================================================

function getStepsCollection(experienceId: string) {
  return db.collection("experiences").doc(experienceId).collection("steps");
}

function getExperiencesCollection() {
  return db.collection("experiences");
}

// ============================================================================
// Input Schemas
// ============================================================================

const stepTypeSchema = z.enum([
  "info",
  "experience-picker",
  "capture",
  "short_text",
  "long_text",
  "multiple_choice",
  "yes_no",
  "opinion_scale",
  "email",
  "processing",
  "reward",
]);

const createStepInputSchema = z.object({
  experienceId: z.string().min(1),
  type: stepTypeSchema,
  title: z.string().max(STEP_CONSTANTS.MAX_TITLE_LENGTH).nullish(),
  description: z.string().max(STEP_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullish(),
  mediaUrl: z.string().url().nullish(),
  ctaLabel: z.string().max(STEP_CONSTANTS.MAX_CTA_LABEL_LENGTH).nullish(),
  config: z.record(z.string(), z.unknown()).optional(),
});

const updateStepInputSchema = z.object({
  title: z.string().max(STEP_CONSTANTS.MAX_TITLE_LENGTH).nullish(),
  description: z.string().max(STEP_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullish(),
  mediaUrl: z.string().url().nullish(),
  ctaLabel: z.string().max(STEP_CONSTANTS.MAX_CTA_LABEL_LENGTH).nullish(),
  config: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// List Steps
// ============================================================================

/**
 * Lists all steps for an experience, ordered by stepsOrder array
 */
export async function listStepsAction(
  experienceId: string
): Promise<ActionResponse<Step[]>> {
  try {
    const experience = await getExperience(experienceId);
    if (!experience) {
      return {
        success: false,
        error: {
          code: "EXPERIENCE_NOT_FOUND",
          message: "Experience not found",
        },
      };
    }

    const stepsOrder = experience.stepsOrder || [];
    if (stepsOrder.length === 0) {
      return { success: true, data: [] };
    }

    // Get all steps for this experience
    const stepsSnapshot = await getStepsCollection(experienceId).get();

    const stepsMap = new Map<string, Step>();
    stepsSnapshot.docs.forEach((doc) => {
      const parsed = stepSchema.safeParse({ id: doc.id, ...doc.data() });
      if (parsed.success) {
        stepsMap.set(doc.id, parsed.data as Step);
      }
    });

    // Return steps in stepsOrder order
    const orderedSteps = stepsOrder
      .map((id) => stepsMap.get(id))
      .filter((step): step is Step => step !== undefined);

    return { success: true, data: orderedSteps };
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
// Create Step
// ============================================================================

/**
 * Creates a new step for an experience
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

    // Validate experience exists
    const experience = await getExperience(validated.experienceId);
    if (!experience) {
      return {
        success: false,
        error: {
          code: "EXPERIENCE_NOT_FOUND",
          message: "Experience not found",
        },
      };
    }

    // Check max steps limit
    if (experience.stepsOrder.length >= EXPERIENCE_CONSTRAINTS.MAX_STEPS) {
      return {
        success: false,
        error: {
          code: "MAX_STEPS_EXCEEDED",
          message: `Cannot exceed ${EXPERIENCE_CONSTRAINTS.MAX_STEPS} steps per experience`,
        },
      };
    }

    // Create step
    const stepRef = getStepsCollection(validated.experienceId).doc();
    const defaults = STEP_DEFAULTS[validated.type];
    const now = Date.now();

    const step: Record<string, unknown> = {
      id: stepRef.id,
      experienceId: validated.experienceId,
      type: validated.type,
      title: validated.title ?? defaults.title,
      description: validated.description ?? null,
      mediaUrl: validated.mediaUrl ?? null,
      ctaLabel: validated.ctaLabel ?? defaults.ctaLabel,
      createdAt: now,
      updatedAt: now,
    };

    // Add config if the step type has one
    if (defaults.config) {
      step.config = validated.config ?? defaults.config;
    }

    // Use batch write for atomic operation
    const batch = db.batch();
    const experienceRef = getExperiencesCollection().doc(validated.experienceId);
    const newOrder = [...experience.stepsOrder, stepRef.id];

    batch.set(stepRef, step);
    batch.update(experienceRef, {
      stepsOrder: newOrder,
      updatedAt: now,
    });

    await batch.commit();

    // Revalidate cache
    const company = await getCompany(experience.companyId);
    if (company) {
      revalidatePath(`/${company.slug}/exps/${validated.experienceId}`);
    }

    return { success: true, data: { stepId: stepRef.id } };
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
 * Updates an existing step
 */
export async function updateStepAction(
  experienceId: string,
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

    // Verify experience exists
    const experience = await getExperience(experienceId);
    if (!experience) {
      return {
        success: false,
        error: {
          code: "EXPERIENCE_NOT_FOUND",
          message: "Experience not found",
        },
      };
    }

    // Verify step exists
    const stepDoc = await getStepsCollection(experienceId).doc(stepId).get();
    if (!stepDoc.exists) {
      return {
        success: false,
        error: {
          code: "STEP_NOT_FOUND",
          message: "Step not found",
        },
      };
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.mediaUrl !== undefined) updateData.mediaUrl = validated.mediaUrl;
    if (validated.ctaLabel !== undefined) updateData.ctaLabel = validated.ctaLabel;
    if (validated.config !== undefined) updateData.config = validated.config;

    await getStepsCollection(experienceId).doc(stepId).update(updateData);

    // Revalidate cache
    const company = await getCompany(experience.companyId);
    if (company) {
      revalidatePath(`/${company.slug}/exps/${experienceId}`);
    }

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
 * Deletes a step from an experience
 */
export async function deleteStepAction(
  experienceId: string,
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
    // Verify experience exists
    const experience = await getExperience(experienceId);
    if (!experience) {
      return {
        success: false,
        error: {
          code: "EXPERIENCE_NOT_FOUND",
          message: "Experience not found",
        },
      };
    }

    // Verify step exists
    const stepDoc = await getStepsCollection(experienceId).doc(stepId).get();
    if (!stepDoc.exists) {
      return {
        success: false,
        error: {
          code: "STEP_NOT_FOUND",
          message: "Step not found",
        },
      };
    }

    const now = Date.now();

    // Use batch write for atomic operation
    const batch = db.batch();
    const stepRef = getStepsCollection(experienceId).doc(stepId);
    const experienceRef = getExperiencesCollection().doc(experienceId);
    const newOrder = experience.stepsOrder.filter((id) => id !== stepId);

    batch.delete(stepRef);
    batch.update(experienceRef, {
      stepsOrder: newOrder,
      updatedAt: now,
    });

    await batch.commit();

    // Revalidate cache
    const company = await getCompany(experience.companyId);
    if (company) {
      revalidatePath(`/${company.slug}/exps/${experienceId}`);
    }

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
 * Reorders steps within an experience
 */
export async function reorderStepsAction(
  experienceId: string,
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
    // Validate experience exists
    const experience = await getExperience(experienceId);
    if (!experience) {
      return {
        success: false,
        error: {
          code: "EXPERIENCE_NOT_FOUND",
          message: "Experience not found",
        },
      };
    }

    // Validate newOrder contains same step IDs as current order
    const currentSet = new Set(experience.stepsOrder);
    const newSet = new Set(newOrder);

    if (currentSet.size !== newSet.size) {
      return {
        success: false,
        error: {
          code: "INVALID_STEP_ORDER",
          message: "New order must contain the same steps",
        },
      };
    }

    for (const id of newOrder) {
      if (!currentSet.has(id)) {
        return {
          success: false,
          error: {
            code: "INVALID_STEP_ORDER",
            message: `Step ${id} not found in experience`,
          },
        };
      }
    }

    // Update order
    await getExperiencesCollection().doc(experienceId).update({
      stepsOrder: newOrder,
      updatedAt: Date.now(),
    });

    // Revalidate cache
    const company = await getCompany(experience.companyId);
    if (company) {
      revalidatePath(`/${company.slug}/exps/${experienceId}`);
    }

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
 * Duplicates a step within the same experience
 */
export async function duplicateStepAction(
  experienceId: string,
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
    // Verify experience exists
    const experience = await getExperience(experienceId);
    if (!experience) {
      return {
        success: false,
        error: {
          code: "EXPERIENCE_NOT_FOUND",
          message: "Experience not found",
        },
      };
    }

    // Check max steps limit
    if (experience.stepsOrder.length >= EXPERIENCE_CONSTRAINTS.MAX_STEPS) {
      return {
        success: false,
        error: {
          code: "MAX_STEPS_EXCEEDED",
          message: `Cannot exceed ${EXPERIENCE_CONSTRAINTS.MAX_STEPS} steps per experience`,
        },
      };
    }

    // Get the original step
    const originalDoc = await getStepsCollection(experienceId).doc(stepId).get();
    if (!originalDoc.exists) {
      return {
        success: false,
        error: {
          code: "STEP_NOT_FOUND",
          message: "Step not found",
        },
      };
    }

    const originalData = originalDoc.data();
    if (!originalData) {
      return {
        success: false,
        error: {
          code: "STEP_NOT_FOUND",
          message: "Step data not found",
        },
      };
    }

    // Create new step with copied data
    const newStepRef = getStepsCollection(experienceId).doc();
    const now = Date.now();

    const newStep = {
      ...originalData,
      id: newStepRef.id,
      title: `${originalData.title || "Step"} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    // Insert after original in stepsOrder
    const originalIndex = experience.stepsOrder.indexOf(stepId);
    const newOrder = [...experience.stepsOrder];
    newOrder.splice(originalIndex + 1, 0, newStepRef.id);

    // Use batch write for atomic operation
    const batch = db.batch();
    const experienceRef = getExperiencesCollection().doc(experienceId);

    batch.set(newStepRef, newStep);
    batch.update(experienceRef, {
      stepsOrder: newOrder,
      updatedAt: now,
    });

    await batch.commit();

    // Revalidate cache
    const company = await getCompany(experience.companyId);
    if (company) {
      revalidatePath(`/${company.slug}/exps/${experienceId}`);
    }

    return { success: true, data: { stepId: newStepRef.id } };
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

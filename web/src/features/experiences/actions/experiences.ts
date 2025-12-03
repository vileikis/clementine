"use server";

/**
 * Server Actions for experience operations.
 *
 * Note: These actions rely on workspace route resolution for company validation
 * and real-time hooks (useExperiences, useExperience) for UI updates.
 */

import {
  createExperience,
  listExperiences,
  getExperience,
  updateExperience,
  deleteExperience,
} from "../repositories/experiences.repository";
import {
  createExperienceInputSchema,
  updateExperienceInputSchema,
  updateExperienceSettingsInputSchema,
} from "../schemas";
import { verifyAdminSecret } from "@/lib/auth";
import { z } from "zod";
import type { ActionResponse } from "./types";
import type { Experience } from "../types";

// ============================================================================
// List Experiences
// ============================================================================

/**
 * Lists all non-deleted experiences for a company.
 * Returns empty array if no experiences exist (not an error).
 * Sorted by createdAt descending (newest first).
 */
export async function listExperiencesAction(
  companyId: string
): Promise<ActionResponse<Experience[]>> {
  try {
    const experiences = await listExperiences(companyId);
    return { success: true, data: experiences };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to fetch experiences",
      },
    };
  }
}

// ============================================================================
// Get Experience
// ============================================================================

/**
 * Retrieves a single experience by ID.
 * Returns error if experience does not exist or is deleted.
 */
export async function getExperienceAction(
  experienceId: string
): Promise<ActionResponse<Experience>> {
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
    return { success: true, data: experience };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to fetch experience",
      },
    };
  }
}

// ============================================================================
// Create Experience
// ============================================================================

/**
 * Creates a new experience for a company.
 */
export async function createExperienceAction(
  input: z.infer<typeof createExperienceInputSchema>
): Promise<ActionResponse<{ experienceId: string }>> {
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
    const validated = createExperienceInputSchema.parse(input);

    const experienceId = await createExperience({
      companyId: validated.companyId,
      name: validated.name,
    });

    return { success: true, data: { experienceId } };
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
        message:
          error instanceof Error ? error.message : "Failed to create experience",
      },
    };
  }
}

// ============================================================================
// Update Experience
// ============================================================================

/**
 * Updates an experience's name or description.
 */
export async function updateExperienceAction(
  experienceId: string,
  input: z.infer<typeof updateExperienceInputSchema>
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
    const validated = updateExperienceInputSchema.parse(input);

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

    await updateExperience(experienceId, {
      name: validated.name,
      description: validated.description,
    });

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
        message:
          error instanceof Error ? error.message : "Failed to update experience",
      },
    };
  }
}

// ============================================================================
// Delete Experience
// ============================================================================

/**
 * Soft deletes an experience.
 */
export async function deleteExperienceAction(
  experienceId: string
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

    await deleteExperience(experienceId);

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to delete experience",
      },
    };
  }
}

// ============================================================================
// Update Experience Settings
// ============================================================================

/**
 * Updates an experience's settings (name, description, preview media).
 * Used by the Settings form in the experience editor.
 */
export async function updateExperienceSettingsAction(
  experienceId: string,
  input: z.infer<typeof updateExperienceSettingsInputSchema>
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
    const validated = updateExperienceSettingsInputSchema.parse(input);

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

    await updateExperience(experienceId, {
      name: validated.name,
      description: validated.description,
      previewMediaUrl: validated.previewMediaUrl,
      previewType: validated.previewType,
    });

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
        message:
          error instanceof Error ? error.message : "Failed to update experience settings",
      },
    };
  }
}

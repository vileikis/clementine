"use server";

/**
 * Server Actions for experience operations.
 */

import {
  createExperience,
  listExperiences,
  getExperience,
  updateExperience,
  deleteExperience,
} from "../repositories/experiences.repository";
import { getCompany } from "@/features/companies/repositories";
import {
  createExperienceInputSchema,
  updateExperienceInputSchema,
} from "../schemas";
import { verifyAdminSecret } from "@/lib/auth";
import { revalidatePath } from "next/cache";
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
    // Validate company exists
    const company = await getCompany(companyId);
    if (!company) {
      return {
        success: false,
        error: {
          code: "COMPANY_NOT_FOUND",
          message: "Company not found",
        },
      };
    }

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
 * Validates company exists.
 */
export async function createExperienceAction(
  input: z.infer<typeof createExperienceInputSchema>
): Promise<ActionResponse<{ experienceId: string }>> {
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
    const validated = createExperienceInputSchema.parse(input);

    // Validate company exists
    const company = await getCompany(validated.companyId);
    if (!company) {
      return {
        success: false,
        error: {
          code: "COMPANY_NOT_FOUND",
          message: "Company not found",
        },
      };
    }

    // Create experience
    const experienceId = await createExperience({
      companyId: validated.companyId,
      name: validated.name,
    });

    // Revalidate cache
    revalidatePath(`/${company.slug}/exps`);

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
    const validated = updateExperienceInputSchema.parse(input);

    // Get experience to verify it exists
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

    // Update experience
    await updateExperience(experienceId, {
      name: validated.name,
      description: validated.description,
    });

    // Get company for path revalidation
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
    // Get experience to verify it exists
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

    // Soft delete the experience
    await deleteExperience(experienceId);

    // Get company for path revalidation
    const company = await getCompany(experience.companyId);
    if (company) {
      revalidatePath(`/${company.slug}/exps`);
    }

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

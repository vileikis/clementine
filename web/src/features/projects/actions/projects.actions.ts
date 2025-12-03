"use server";

/**
 * Server Actions for project-level operations.
 * Consolidated from app/actions and lib/actions for single source of truth.
 */

import { db } from "@/lib/firebase/admin";
import {
  createProject,
  getProject,
  listProjects,
  updateProjectStatus,
  updateProjectName,
  deleteProject,
} from "../repositories/projects.repository";
import { getCompany } from "@/features/companies/repositories/companies.repository";
import {
  updateProjectThemeSchema,
} from "../schemas";
import { verifyAdminSecret } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// ============================================================================
// Project CRUD Operations (Repository-based)
// ============================================================================

const createProjectInput = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  companyId: z.string().min(1, "Company is required"),
});

export async function createProjectAction(
  input: z.infer<typeof createProjectInput>
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: auth.error
      }
    };
  }

  try {
    const validated = createProjectInput.parse(input);

    // Validate company exists and is active
    const company = await getCompany(validated.companyId);
    if (!company) {
      return {
        success: false,
        error: {
          code: "COMPANY_NOT_FOUND",
          message: "Company not found"
        }
      };
    }
    if (company.status !== "active") {
      return {
        success: false,
        error: {
          code: "COMPANY_INACTIVE",
          message: "Company is not active"
        }
      };
    }

    const projectId = await createProject({
      name: validated.name,
      companyId: validated.companyId,
      primaryColor: validated.primaryColor,
    });
    revalidatePath("/projects");
    return { success: true, projectId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
        }
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to create project"
      },
    };
  }
}

export async function getProjectAction(projectId: string) {
  try {
    const project = await getProject(projectId);
    if (!project) {
      return {
        success: false,
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found"
        }
      };
    }
    return { success: true, project };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch project"
      }
    };
  }
}

export async function listProjectsAction(filters?: {
  companyId?: string | null;
}) {
  try {
    const projects = await listProjects(filters);
    return { success: true, projects };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch projects"
      }
    };
  }
}

export async function updateProjectStatusAction(
  projectId: string,
  status: "draft" | "live" | "archived"
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: auth.error
      }
    };
  }

  try {
    await updateProjectStatus(projectId, status);
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update status"
      }
    };
  }
}

const updateProjectNameInput = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
});

export async function updateProjectNameAction(
  projectId: string,
  name: string
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: auth.error
      }
    };
  }

  try {
    const validated = updateProjectNameInput.parse({ name });
    await updateProjectName(projectId, validated.name);
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
        }
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update name"
      }
    };
  }
}

// ============================================================================
// Project Configuration Updates (Direct Firebase)
// ============================================================================

/**
 * Updates theme configuration for a project.
 * Uses nested object structure (project.theme.*)
 * @param projectId - Project ID
 * @param data - Partial theme configuration fields to update
 * @returns Success/error response
 */
export async function updateProjectTheme(
  projectId: string,
  data: {
    logoUrl?: string | null;
    fontFamily?: string | null;
    primaryColor?: string;
    text?: {
      color?: string;
      alignment?: "left" | "center" | "right";
    };
    button?: {
      backgroundColor?: string | null;
      textColor?: string;
      radius?: "none" | "sm" | "md" | "full";
    };
    background?: {
      color?: string;
      image?: string | null;
      overlayOpacity?: number;
    };
  }
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
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

    // Validate input with Zod
    const validatedData = updateProjectThemeSchema.parse(data);

    // Build update object with dot notation for nested fields
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    // Dynamic field mapping using Object.entries
    // Top-level theme fields
    if (validatedData.logoUrl !== undefined) {
      updateData["theme.logoUrl"] = validatedData.logoUrl;
    }
    if (validatedData.fontFamily !== undefined) {
      updateData["theme.fontFamily"] = validatedData.fontFamily;
    }
    if (validatedData.primaryColor !== undefined) {
      updateData["theme.primaryColor"] = validatedData.primaryColor;
    }

    // Nested text fields
    if (validatedData.text) {
      Object.entries(validatedData.text).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[`theme.text.${key}`] = value;
        }
      });
    }

    // Nested button fields
    if (validatedData.button) {
      Object.entries(validatedData.button).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[`theme.button.${key}`] = value;
        }
      });
    }

    // Nested background fields
    if (validatedData.background) {
      Object.entries(validatedData.background).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[`theme.background.${key}`] = value;
        }
      });
    }

    // Update only provided fields - trust Firebase, catch NOT_FOUND error
    const projectRef = db.collection("projects").doc(projectId);
    try {
      await projectRef.update(updateData);
    } catch (updateError: unknown) {
      // Firestore throws code 5 for NOT_FOUND
      if (updateError && typeof updateError === "object" && "code" in updateError && updateError.code === 5) {
        return {
          success: false,
          error: {
            code: "PROJECT_NOT_FOUND",
            message: "Project not found",
          },
        };
      }
      throw updateError;
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);

    return { success: true, data: undefined };
  } catch (error) {
    // Handle Zod validation errors with detailed field paths
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        },
      };
    }

    // Handle other errors
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Updates the active event for a project (Switchboard pattern).
 * Controls which event/experience is currently live for all connected guests.
 * @param projectId - Project ID
 * @param activeEventId - Event/Experience ID to activate, or null to deactivate
 * @returns Success/error response
 */
export async function updateProjectSwitchboardAction(
  projectId: string,
  activeEventId: string | null
): Promise<ActionResponse<void>> {
  try {
    // Check authentication
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

    // Validate input with Zod
    const validatedData = z
      .object({
        activeEventId: z.string().nullable(),
      })
      .parse({ activeEventId });

    // Update project - trust Firebase, catch NOT_FOUND error
    const projectRef = db.collection("projects").doc(projectId);
    try {
      await projectRef.update({
        activeEventId: validatedData.activeEventId,
        updatedAt: Date.now(),
      });
    } catch (updateError: unknown) {
      // Firestore throws code 5 for NOT_FOUND
      if (updateError && typeof updateError === "object" && "code" in updateError && updateError.code === 5) {
        return {
          success: false,
          error: {
            code: "PROJECT_NOT_FOUND",
            message: "Project not found",
          },
        };
      }
      throw updateError;
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);

    return { success: true, data: undefined };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        },
      };
    }

    // Handle other errors
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

// ============================================================================
// Project Delete Operation
// ============================================================================

/**
 * Soft delete a project (mark as deleted, hide from UI)
 */
export async function deleteProjectAction(projectId: string) {
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
    await deleteProject(projectId);
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found") {
      return {
        success: false,
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to delete project",
      },
    };
  }
}

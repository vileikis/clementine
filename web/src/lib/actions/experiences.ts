"use server";

/**
 * Server Actions for experience CRUD operations.
 * Phase 2 implementation: Stub actions with type signatures only.
 * Full implementation will be added in later phases.
 */

import type { ExperienceType, PreviewType } from "@/lib/types/firestore";

// Action response types
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Creates a new experience for an event.
 * @param eventId - Event ID
 * @param data - Experience creation data
 * @returns Success response with experience ID, or error
 */
export async function createExperience(
  eventId: string,
  data: {
    label: string;
    type: ExperienceType;
    enabled?: boolean;
    aiEnabled?: boolean;
  }
): Promise<ActionResponse<{ id: string }>> {
  // TODO: Implement in Phase 6 (User Story 3)
  throw new Error("Not implemented");
}

/**
 * Updates an existing experience.
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @param data - Partial experience fields to update
 * @returns Success/error response
 */
export async function updateExperience(
  eventId: string,
  experienceId: string,
  data: {
    label?: string;
    enabled?: boolean;
    previewPath?: string;
    previewType?: PreviewType;
    allowCamera?: boolean;
    allowLibrary?: boolean;
    maxDurationMs?: number;
    frameCount?: number;
    captureIntervalMs?: number;
    overlayFramePath?: string;
    overlayLogoPath?: string;
    aiEnabled?: boolean;
    aiModel?: string;
    aiPrompt?: string;
    aiReferenceImagePaths?: string[];
  }
): Promise<ActionResponse<void>> {
  // TODO: Implement in Phase 6 (User Story 3)
  throw new Error("Not implemented");
}

/**
 * Deletes an experience from an event.
 * @param eventId - Event ID
 * @param experienceId - Experience ID
 * @returns Success/error response
 */
export async function deleteExperience(
  eventId: string,
  experienceId: string
): Promise<ActionResponse<void>> {
  // TODO: Implement in Phase 6 (User Story 3)
  throw new Error("Not implemented");
}

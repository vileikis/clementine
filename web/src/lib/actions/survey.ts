"use server";

/**
 * Server Actions for survey step CRUD operations.
 * Phase 2 implementation: Stub actions with type signatures only.
 * Full implementation will be added in later phases.
 */

import type { StepType } from "@/features/experiences";

// Action response types
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Creates a new survey step for an event.
 * @param eventId - Event ID
 * @param data - Survey step creation data
 * @returns Success response with step ID, or error
 */
export async function createSurveyStep(
  eventId: string,
  data: {
    type: StepType;
    title?: string;
    description?: string;
    placeholder?: string;
    options?: string[];
    allowMultiple?: boolean;
    scaleMin?: number;
    scaleMax?: number;
    required?: boolean;
  }
): Promise<ActionResponse<{ id: string }>> {
  // TODO: Implement in Phase 7 (User Story 4)
  throw new Error("Not implemented");
}

/**
 * Updates an existing survey step.
 * @param eventId - Event ID
 * @param stepId - Survey step ID
 * @param data - Partial survey step fields to update
 * @returns Success/error response
 */
export async function updateSurveyStep(
  eventId: string,
  stepId: string,
  data: {
    title?: string;
    description?: string;
    placeholder?: string;
    options?: string[];
    allowMultiple?: boolean;
    scaleMin?: number;
    scaleMax?: number;
    required?: boolean;
  }
): Promise<ActionResponse<void>> {
  // TODO: Implement in Phase 7 (User Story 4)
  throw new Error("Not implemented");
}

/**
 * Deletes a survey step from an event.
 * @param eventId - Event ID
 * @param stepId - Survey step ID
 * @returns Success/error response
 */
export async function deleteSurveyStep(
  eventId: string,
  stepId: string
): Promise<ActionResponse<void>> {
  // TODO: Implement in Phase 7 (User Story 4)
  throw new Error("Not implemented");
}
